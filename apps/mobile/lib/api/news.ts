import { NewsArticle, NewsCategory, StockVote, NewsComment } from '@/types/news';
import { mockNewsArticles } from '@/lib/mocks/news';
import { mockUsers } from '@/lib/mocks/users';
import { getCurrentUserIdOrFallback } from '@/lib/api/users';
import { getFollowing } from './users';
import { sendChatMessage, getConversationIdForUser } from './chat';
import Constants from 'expo-constants';
import { User, SharedArticlePayload } from '@/types/post';

// Get API key from environment variable or expo config
const NEWS_API_KEY = process.env.EXPO_PUBLIC_NEWS_API_KEY || Constants.expoConfig?.extra?.newsApiKey;

// Debug logging (remove in production)
if (__DEV__) {
  console.log('NewsAPI Key Status:', NEWS_API_KEY ? 'Found' : 'Not found');
  if (!NEWS_API_KEY) {
    console.warn('⚠️ NewsAPI key not found. Set EXPO_PUBLIC_NEWS_API_KEY environment variable to fetch real news.');
  }
}

const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

interface NewsAPIArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
}

// Map our categories to NewsAPI queries
const getQueryForCategory = (category: NewsCategory): { q?: string; category?: string; useTopHeadlines?: boolean } => {
  switch (category) {
    case 'investing':
      return { q: 'investing OR investment OR portfolio OR ETF OR mutual fund', useTopHeadlines: false };
    case 'trading':
      return { q: 'stock trading OR day trading OR forex OR commodities', useTopHeadlines: false };
    case 'startups':
      return { q: 'startup OR startups OR venture capital OR seed funding', useTopHeadlines: false };
    case 'tech':
      return { q: 'technology OR tech OR software OR AI OR semiconductor', useTopHeadlines: false };
    case 'finance':
      return { q: 'banking OR financial OR economy OR Fed OR interest rates', useTopHeadlines: false };
    case 'markets':
      return { q: 'stock market OR S&P 500 OR Nasdaq OR Dow Jones OR market close', useTopHeadlines: false };
    case 'all':
    default:
      return { q: 'business OR stocks OR economy OR technology OR finance', useTopHeadlines: false };
  }
};

// Detect the article's actual category from its content (for correct badges)
type DisplayCategory = Exclude<NewsCategory, 'all'>;
const detectArticleCategory = (title: string, description: string | null, content: string | null): DisplayCategory => {
  const text = `${title} ${description || ''} ${content || ''}`.toLowerCase();
  const scores: Record<DisplayCategory, number> = {
    investing: 0,
    trading: 0,
    startups: 0,
    tech: 0,
    finance: 0,
    markets: 0,
  };
  const keywords: Record<DisplayCategory, string[]> = {
    investing: ['investing', 'investment', 'investor', 'portfolio', 'etf', 'mutual fund', 'dividend', 'asset allocation', 'retirement savings', '401k', 'index fund'],
    trading: ['trading', 'trader', 'day trading', 'forex', 'commodities', 'options', 'futures', 'short selling', 'bullish', 'bearish', 'intraday'],
    startups: ['startup', 'startups', 'venture capital', 'vc funding', 'seed round', 'series a', 'series b', 'unicorn', 'founder', 'angel investor'],
    tech: ['technology', 'software', 'ai ', 'artificial intelligence', 'semiconductor', 'chip', 'apple', 'microsoft', 'google', 'amazon', 'meta', 'cybersecurity', 'saas'],
    finance: ['bank', 'banking', 'fed ', 'federal reserve', 'interest rate', 'inflation', 'gdp', 'recession', 'central bank', 'mortgage', 'loan', 'earnings report'],
    markets: ['stock market', 's&p 500', 'nasdaq', 'dow jones', 'market close', 'market cap', 'stock price', 'equity market', 'market rally', 'market sell-off', 'index'],
  };
  for (const [cat, terms] of Object.entries(keywords)) {
    for (const term of terms) {
      if (text.includes(term)) scores[cat as DisplayCategory]++;
    }
  }
  let best: DisplayCategory = 'markets';
  let bestScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = cat as DisplayCategory;
    }
  }
  return best;
};

// Detect if article is stock-related
const isStockRelated = (title: string, description: string | null, content: string | null): boolean => {
  const text = `${title} ${description || ''} ${content || ''}`.toLowerCase();
  const stockKeywords = [
    'stock', 'stocks', 'share', 'shares', 'trading', 'trader', 'market', 'nasdaq', 'nyse',
    'dow jones', 's&p', 'sp500', 'index', 'equity', 'equities', 'bull', 'bear', 'bullish',
    'bearish', 'long', 'short', 'short selling', 'dividend', 'earnings', 'eps', 'pe ratio',
    'price target', 'analyst', 'upgrade', 'downgrade', 'buy', 'sell', 'hold', 'ticker',
    'ipo', 'public offering', 'market cap', 'valuation', 'stock price', 'share price',
  ];
  return stockKeywords.some(keyword => text.includes(keyword));
};

// Convert NewsAPI article to our NewsArticle format
const mapNewsAPIArticle = (apiArticle: NewsAPIArticle, _filterCategory: NewsCategory, index: number): NewsArticle => {
  // Detect the article's actual category from content (so badges are correct, not the filter)
  const category = detectArticleCategory(
    apiArticle.title,
    apiArticle.description,
    apiArticle.content
  );

  // Extract tags from title and description
  const text = `${apiArticle.title} ${apiArticle.description || ''}`.toLowerCase();
  const tags: string[] = [];
  
  const tagKeywords: Record<string, string[]> = {
    'AI': ['ai', 'artificial intelligence', 'machine learning'],
    'Crypto': ['crypto', 'cryptocurrency', 'bitcoin', 'blockchain'],
    'IPO': ['ipo', 'initial public offering'],
    'VC': ['venture capital', 'vc', 'funding'],
    'Startup': ['startup', 'startups'],
    'Stock Market': ['stock market', 'stocks', 'trading'],
    'Finance': ['finance', 'financial'],
  };
  
  Object.entries(tagKeywords).forEach(([tag, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      tags.push(tag);
    }
  });
  
  // Detect if stock-related
  const stockRelated = isStockRelated(
    apiArticle.title,
    apiArticle.description,
    apiArticle.content
  );
  
  // Clean content - remove truncation markers and get full content
  let fullContent = apiArticle.content || apiArticle.description || apiArticle.title;
  
  // Remove common truncation patterns and markers
  fullContent = fullContent
    .replace(/\[Removed\]/g, '')
    .replace(/\[.*?\]/g, '') // Remove [bracketed] content
    .replace(/…\s*$/, '') // Remove trailing ellipsis
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Remove truncation artifacts like "1800 car" at the end (character count artifacts)
  const truncationPattern = /\s+\d+\s+\w+\s*$/;
  if (truncationPattern.test(fullContent)) {
    const words = fullContent.split(/\s+/);
    if (words.length > 3) {
      const lastWords = words.slice(-2).join(' ');
      if (/\d+\s+\w+/.test(lastWords)) {
        fullContent = words.slice(0, -2).join(' ');
      }
    }
  }
  
  // If content seems truncated (ends with incomplete sentence), 
  // try to get more from description
  if (fullContent.length < 200 && apiArticle.description && apiArticle.description.length > fullContent.length) {
    fullContent = apiArticle.description;
  }
  
  // Combine description and content if both exist and content is short
  if (apiArticle.description && apiArticle.content && 
      apiArticle.content.length < 500 && 
      !apiArticle.content.includes(apiArticle.description)) {
    // Combine them, but clean both first
    const cleanDescription = apiArticle.description
      .replace(/\[Removed\]/g, '')
      .replace(/\[.*?\]/g, '')
      .trim();
    const cleanContent = apiArticle.content
      .replace(/\[Removed\]/g, '')
      .replace(/\[.*?\]/g, '')
      .trim();
    
    if (cleanDescription && cleanContent && cleanDescription !== cleanContent) {
      fullContent = `${cleanDescription}\n\n${cleanContent}`;
    } else {
      fullContent = cleanContent || cleanDescription;
    }
  }
  
  // Final cleanup - remove any remaining truncation artifacts
  fullContent = fullContent.trim();

  return {
    id: `news-${apiArticle.url}-${index}`,
    title: apiArticle.title,
    description: apiArticle.description || apiArticle.title,
    content: fullContent,
    source: apiArticle.source.name,
    sourceUrl: apiArticle.url,
    author: apiArticle.author || undefined,
    imageUrl: apiArticle.urlToImage || undefined,
    category,
    publishedAt: apiArticle.publishedAt,
    tags: tags.length > 0 ? tags : undefined,
    views: Math.floor(Math.random() * 50000) + 1000, // Random views for demo
    shares: Math.floor(Math.random() * 1000) + 10, // Random shares for demo
    isSaved: false,
    isShared: false,
    // Stock voting - initialize with random votes for demo
    isStockRelated: stockRelated,
    longVotes: stockRelated ? Math.floor(Math.random() * 500) + 10 : 0,
    shortVotes: stockRelated ? Math.floor(Math.random() * 500) + 10 : 0,
    userVote: null,
  };
};

// Cache for storing articles (in-memory, resets on app restart)
let articleCache: Map<string, NewsArticle> = new Map();

export type NewsSortOption = 'newest' | 'popular' | 'relevance';

export async function getNewsArticles(
  category: NewsCategory = 'all',
  page: number = 1,
  limit: number = 20,
  searchQuery?: string,
  sortBy: NewsSortOption = 'newest'
): Promise<{ data: NewsArticle[]; hasMore: boolean }> {
  // If no API key, fall back to mock data
  if (!NEWS_API_KEY) {
    console.warn('NewsAPI key not found. Using mock data. Set EXPO_PUBLIC_NEWS_API_KEY to use real news.');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredArticles = [...mockNewsArticles];
    if (category !== 'all') {
      filteredArticles = filteredArticles.filter(article => article.category === category);
    }
    filteredArticles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedArticles = filteredArticles.slice(startIndex, endIndex);
    const hasMore = endIndex < filteredArticles.length;
    
    return {
      data: paginatedArticles,
      hasMore,
    };
  }

  try {
    const queryConfig = getQueryForCategory(category);
    const useTopHeadlines = (queryConfig.useTopHeadlines ?? false) && !searchQuery;
    
    // If there's a search query, always use everything endpoint
    const finalQuery = searchQuery || queryConfig.q;
    
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: limit.toString(),
      language: 'en',
      apiKey: NEWS_API_KEY!,
    });

    // Add search query or category query
    if (finalQuery) {
      params.append('q', finalQuery);
    }
    
    // Add category only if not searching and using top-headlines
    if (queryConfig.category && useTopHeadlines && !searchQuery) {
      params.append('category', queryConfig.category);
    }
    
    // For top-headlines, add country (US as default)
    if (useTopHeadlines && !searchQuery) {
      params.append('country', 'us');
    } else {
      // For everything endpoint, add sortBy
      const sortMap: Record<NewsSortOption, string> = {
        newest: 'publishedAt',
        popular: 'popularity',
        relevance: 'relevancy',
      };
      params.append('sortBy', sortMap[sortBy] || 'publishedAt');
    }

    const endpoint = useTopHeadlines
      ? `${NEWS_API_BASE_URL}/top-headlines`
      : `${NEWS_API_BASE_URL}/everything`;

    const url = `${endpoint}?${params.toString()}`;
    
    if (__DEV__) {
      console.log('📰 Fetching news from:', endpoint);
      console.log('📰 Category:', category);
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('NewsAPI HTTP Error:', response.status, response.statusText);
      console.error('Response:', errorText);
      throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`);
    }

    const data: NewsAPIResponse = await response.json();
    
    if (data.status !== 'ok') {
      console.error('NewsAPI Error Status:', data);
      throw new Error(`NewsAPI returned error status: ${data.status}`);
    }

    if (__DEV__) {
      console.log('✅ NewsAPI Success:', data.totalResults, 'articles found');
    }

    const articles = data.articles
      .filter(article => article.title && article.title !== '[Removed]')
      .map((article, index) => {
        const mapped = mapNewsAPIArticle(article, category, (page - 1) * limit + index);
        // Cache the article
        articleCache.set(mapped.id, mapped);
        return mapped;
      });

    // Calculate if there are more pages
    const totalResults = data.totalResults;
    const currentPageResults = articles.length;
    const hasMore = (page * limit) < totalResults && currentPageResults === limit;

    return {
      data: articles,
      hasMore,
    };
  } catch (error: any) {
    console.error('❌ Error fetching news from NewsAPI:', error);
    console.error('Error details:', error.message || error);
    
    // Fallback to mock data on error
    console.warn('⚠️ Falling back to mock data due to API error');
    let filteredArticles = [...mockNewsArticles];
    if (category !== 'all') {
      filteredArticles = filteredArticles.filter(article => article.category === category);
    }
    filteredArticles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedArticles = filteredArticles.slice(startIndex, endIndex);
    const hasMore = endIndex < filteredArticles.length;
    
    return {
      data: paginatedArticles,
      hasMore,
    };
  }
}

export async function getNewsArticleById(id: string): Promise<NewsArticle | null> {
  // Check cache first
  if (articleCache.has(id)) {
    const cached = articleCache.get(id)!;
    // If content seems truncated, try to improve it
    if (cached.content && cached.content.length < 300) {
      // Use description if it's longer
      if (cached.description && cached.description.length > cached.content.length) {
        cached.content = cached.description;
      }
    }
    return cached;
  }

  // If not in cache, try to find in mock data
  const mockArticle = mockNewsArticles.find(a => a.id === id);
  if (mockArticle) {
    return mockArticle;
  }

  // If it's a real article ID but not in cache, we can't fetch individual articles
  // from NewsAPI without the URL. Return null and let the UI handle it.
  console.warn(`Article ${id} not found in cache or mock data`);
  return null;
}

export async function saveNewsArticle(id: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const article = mockNewsArticles.find(a => a.id === id);
  if (article) {
    article.isSaved = true;
  }
}

export async function unsaveNewsArticle(id: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const article = mockNewsArticles.find(a => a.id === id);
  if (article) {
    article.isSaved = false;
  }
}

export async function incrementNewsViews(id: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const article = mockNewsArticles.find(a => a.id === id);
  if (article) {
    article.views += 1;
  }
}

export async function incrementNewsShares(id: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const article = mockNewsArticles.find(a => a.id === id);
  if (article) {
    article.shares += 1;
    article.isShared = true;
  }
}

// Stock voting functions
const voteCache = new Map<string, { longVotes: number; shortVotes: number; userVote: StockVote }>();

export async function voteOnNewsArticle(id: string, vote: StockVote): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Get current state from cache or article
  let currentState = voteCache.get(id);
  
  if (!currentState) {
    // Initialize from article if exists
    const article = articleCache.get(id) || mockNewsArticles.find(a => a.id === id);
    if (article) {
      currentState = {
        longVotes: article.longVotes || 0,
        shortVotes: article.shortVotes || 0,
        userVote: article.userVote || null,
      };
    } else {
      currentState = {
        longVotes: 0,
        shortVotes: 0,
        userVote: null,
      };
    }
  }
  
  // Update votes based on previous vote
  const previousVote = currentState.userVote;
  
  // Remove previous vote
  if (previousVote === 'long') {
    currentState.longVotes = Math.max(0, currentState.longVotes - 1);
  } else if (previousVote === 'short') {
    currentState.shortVotes = Math.max(0, currentState.shortVotes - 1);
  }
  
  // Add new vote
  if (vote === 'long') {
    currentState.longVotes += 1;
  } else if (vote === 'short') {
    currentState.shortVotes += 1;
  }
  
  currentState.userVote = vote;
  
  // Update cache
  voteCache.set(id, currentState);
  
  // Update article in cache if exists
  const cachedArticle = articleCache.get(id);
  if (cachedArticle) {
    cachedArticle.longVotes = currentState.longVotes;
    cachedArticle.shortVotes = currentState.shortVotes;
    cachedArticle.userVote = currentState.userVote;
  }
  
  // Update mock article if exists
  const mockArticle = mockNewsArticles.find(a => a.id === id);
  if (mockArticle) {
    mockArticle.longVotes = currentState.longVotes;
    mockArticle.shortVotes = currentState.shortVotes;
    mockArticle.userVote = currentState.userVote;
  }
}

// Comments cache
const commentsCache = new Map<string, NewsComment[]>();

// Mock current user
const CURRENT_USER: User = {
  id: 'current-user',
  name: 'You',
  handle: '@you',
  avatar: undefined,
  bio: '',
};

// News comments functions
export async function getNewsComments(articleId: string): Promise<NewsComment[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (commentsCache.has(articleId)) {
    return commentsCache.get(articleId)!;
  }
  
  // Return empty array for new articles
  return [];
}

export async function addNewsComment(articleId: string, content: string, replyTo?: string, media?: any[], poll?: any): Promise<NewsComment> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const newComment: NewsComment = {
    id: `comment-${articleId}-${Date.now()}`,
    author: CURRENT_USER,
    content,
    createdAt: new Date().toISOString(),
    likes: 0,
    isLiked: false,
    replyTo,
    replies: [],
    media: media && media.length > 0 ? media.map(m => ({
      id: m.id,
      type: m.type,
      url: m.url,
      thumbnail: m.thumbnail,
      width: m.width,
      height: m.height,
      duration: m.duration,
      name: m.name,
      mimeType: m.mimeType,
      size: m.size,
    })) : undefined,
    poll: poll,
  };
  
  const comments = commentsCache.get(articleId) || [];
  
  if (replyTo) {
    // Find parent comment and add as reply
    const parentIndex = comments.findIndex(c => c.id === replyTo);
    if (parentIndex !== -1) {
      if (!comments[parentIndex].replies) {
        comments[parentIndex].replies = [];
      }
      comments[parentIndex].replies!.push(newComment);
    } else {
      // If parent not found, add as top-level comment
      comments.push(newComment);
    }
  } else {
    comments.push(newComment);
  }
  
  commentsCache.set(articleId, comments);
  
  // Update comment count
  const article = articleCache.get(articleId) || mockNewsArticles.find(a => a.id === articleId);
  if (article) {
    article.comments = (article.comments || 0) + 1;
  }
  
  return newComment;
}

export async function likeNewsComment(articleId: string, commentId: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const comments = commentsCache.get(articleId) || [];
  
  const updateComment = (comment: NewsComment): NewsComment => {
    if (comment.id === commentId) {
      return {
        ...comment,
        isLiked: !comment.isLiked,
        likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
      };
    }
    if (comment.replies) {
      return {
        ...comment,
        replies: comment.replies.map(updateComment),
      };
    }
    return comment;
  };
  
  const updated = comments.map(updateComment);
  commentsCache.set(articleId, updated);
}

// In-app sharing functions
export interface ShareTarget {
  id: string;
  name: string;
  type: 'user' | 'space';
  avatar?: string;
  /** True when this user is in the current user's following list */
  isFollowing?: boolean;
}

export async function getShareTargets(): Promise<ShareTarget[]> {
  await new Promise(resolve => setTimeout(resolve, 300));

  // Fallback: all users except current (so list is never empty)
  const fallbackTargets: ShareTarget[] = mockUsers
    .filter((u: { id: string; name: string; avatar?: string }) => u && u.id && u.name && u.id !== getCurrentUserIdOrFallback())
    .map((u: { id: string; name: string; avatar?: string }) => ({
      id: u.id,
      name: u.name,
      type: 'user' as const,
      avatar: u.avatar || undefined,
      isFollowing: false,
    }));

  // Known following IDs for current user (matches users.ts mockFollowing['1']) so "People You Follow" is never empty
  const defaultFollowingIds = ['2', '3', '4'];

  try {
    let followingUsers = await getFollowing(getCurrentUserIdOrFallback());
    if (!followingUsers || followingUsers.length === 0) {
      followingUsers = mockUsers
        .filter((u: { id: string }) => defaultFollowingIds.includes(u.id))
        .map((u: { id: string; name: string; avatar?: string }) => ({ id: u.id, name: u.name, avatar: u.avatar }));
    }
    const followingIds = new Set(followingUsers.filter(u => u && u.id).map(u => u.id));

    const followingTargets: ShareTarget[] = followingUsers
      .filter(user => user && user.id && user.name)
      .map(user => ({
        id: user.id,
        name: user.name,
        type: 'user' as const,
        avatar: (user as { avatar?: string }).avatar || undefined,
        isFollowing: true,
      }));

    const otherUsers: ShareTarget[] = mockUsers
      .filter((u: { id: string; name: string; avatar?: string }) => u && u.id && u.name && u.id !== getCurrentUserIdOrFallback() && !followingIds.has(u.id))
      .map((u: { id: string; name: string; avatar?: string }) => ({
        id: u.id,
        name: u.name,
        type: 'user' as const,
        avatar: u.avatar || undefined,
        isFollowing: false,
      }));

    const result = [...followingTargets, ...otherUsers];
    return result.length > 0 ? result : fallbackTargets;
  } catch (error) {
    console.error('getShareTargets failed, using fallback:', error);
    const followingFromMock: ShareTarget[] = mockUsers
      .filter((u: { id: string; name: string; avatar?: string }) => u && u.id && u.name && defaultFollowingIds.includes(u.id))
      .map((u: { id: string; name: string; avatar?: string }) => ({
        id: u.id,
        name: u.name,
        type: 'user' as const,
        avatar: u.avatar || undefined,
        isFollowing: true,
      }));
    const otherFromMock: ShareTarget[] = mockUsers
      .filter((u: { id: string; name: string; avatar?: string }) => u && u.id && u.name && u.id !== getCurrentUserIdOrFallback() && !defaultFollowingIds.includes(u.id))
      .map((u: { id: string; name: string; avatar?: string }) => ({
        id: u.id,
        name: u.name,
        type: 'user' as const,
        avatar: u.avatar || undefined,
        isFollowing: false,
      }));
    return [...followingFromMock, ...otherFromMock].length > 0 ? [...followingFromMock, ...otherFromMock] : fallbackTargets;
  }
}

export async function shareNewsArticle(
  articleId: string,
  targetIds: string[],
  articleOverride?: NewsArticle
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500));

  const article =
    articleOverride ||
    articleCache.get(articleId) ||
    mockNewsArticles.find(a => a.id === articleId);
  if (!article) {
    throw new Error('Article not found');
  }

  const sharedArticlePayload: SharedArticlePayload = {
    articleId: article.id,
    title: article.title,
    description: article.description || article.content?.slice(0, 500),
    source: article.source,
    sourceUrl: article.sourceUrl,
    imageUrl: article.imageUrl,
  };

  let sentCount = 0;
  for (const targetId of targetIds) {
    const conversationId = getConversationIdForUser(targetId);
    if (!conversationId) {
      console.warn(`No conversation found for user ${targetId}, skipping`);
      continue;
    }
    try {
      await sendChatMessage(
        conversationId,
        '📰 Shared an article',
        undefined,
        undefined,
        undefined,
        undefined, // sharedPost
        sharedArticlePayload
      );
      sentCount += 1;
    } catch (error) {
      console.error(`Error sharing article to ${targetId}:`, error);
      throw error;
    }
  }

  if (targetIds.length > 0 && sentCount === 0) {
    throw new Error('No conversations found for the selected people. Try selecting someone you have a chat with.');
  }

  article.shares = (article.shares || 0) + sentCount;
}
