import { mockPosts } from '@/lib/mocks/posts';
import { getBadgePerks, applyVisibilityBoost } from '@/lib/services/badgePerksService';
import { getUserBadges } from '@/lib/services/badgeService';
import { Post, PostMedia, SharedPostPayload } from '@/types/post';
import { getUserById, getFollowing, getCurrentUserIdOrFallback } from './users';
import { getUserMetrics } from '@/lib/services/userMetricsService';
import { getSubscriptionTier } from '@/lib/services/subscriptionService';
import { isPostBoosted } from '@/lib/services/boostService';
import { isPostPremiumBoosted } from '@/lib/services/premiumBoostService';
import { getFirestoreDb } from '@/lib/firebase';
import { getFeedPostsFirestore, getPostByIdFirestore, createPostFirestore, likePostFirestore, savePostFirestore } from '@/lib/firestore/posts';

export async function getFeedPosts(
  tab: string, 
  page: number, 
  limit: number,
  sort?: 'newest' | 'popular' | 'trending',
  filter?: 'all' | 'media' | 'text' | 'links'
) {
  const db = getFirestoreDb();
  if (db) {
    const uid = getCurrentUserIdOrFallback();
    const result = await getFeedPostsFirestore(tab, page, limit, uid);
    if (filter && filter !== 'all') {
      result.data = result.data.filter(post => {
        if (filter === 'media' && post.media && post.media.length > 0) return true;
        if (filter === 'text' && (!post.media || post.media.length === 0)) return true;
        if (filter === 'links' && post.content && post.content.includes('http')) return true;
        return false;
      });
    }
    return result;
  }
  await new Promise(resolve => setTimeout(resolve, 500));
  let filteredPosts = [...mockPosts];
  
  // "Following" tab: only posts from people the current user follows
  if (tab === 'following') {
    const followingUsers = await getFollowing(getCurrentUserIdOrFallback());
    const followingIds = new Set(followingUsers.map(u => u.id).filter(Boolean));
    if (followingIds.size > 0) {
      filteredPosts = filteredPosts.filter(p => p.author?.id && followingIds.has(p.author.id));
    }
    // If not following anyone, show empty (or could show discovery prompt - keeping empty for clarity)
  }
  
  // Apply content filter
  if (filter && filter !== 'all') {
    filteredPosts = filteredPosts.filter(post => {
      if (filter === 'media' && post.media && post.media.length > 0) return true;
      if (filter === 'text' && (!post.media || post.media.length === 0)) return true;
      if (filter === 'links' && post.content && post.content.includes('http')) return true;
      return false;
    });
  }
  
  // Apply visibility boost from badges and priority placement for Pro+
  const postsWithBoost = await Promise.all(filteredPosts.map(async (post) => {
    try {
      const userBadges = await getUserBadges(post.author);
      const perks = getBadgePerks(userBadges.badges.map(b => b.badge));
      const baseScore = post.likes + (post.comments || 0);
      let boostedScore = applyVisibilityBoost(baseScore, perks.visibilityBoost);
      
      // Check if post author has Pro+ and post is boosted (priority placement)
      try {
        const authorMetrics = await getUserMetrics();
        // Check if this is the author's post and they have Pro+
        if (post.author?.id && authorMetrics.subscriptionTier === 'pro-plus') {
          // Check if post is boosted with premium boost
          const isPremiumBoosted = await isPostPremiumBoosted(post.id);
          if (isPremiumBoosted) {
            // Apply 1.5x priority placement boost for Pro+ boosted posts
            boostedScore = boostedScore * 1.5;
          }
        }
      } catch (error) {
        // Ignore errors in subscription check
      }
      
      return { ...post, _boostedScore: boostedScore };
    } catch (error) {
      return { ...post, _boostedScore: post.likes + (post.comments || 0) };
    }
  }));
  
  // Apply sort (default: newest)
  const effectiveSort = sort || 'newest';
  const now = Date.now();

  if (effectiveSort === 'popular') {
    // Pure engagement: highest likes + comments first; tie-break by newest
    postsWithBoost.sort((a, b) => {
      const scoreDiff = (b._boostedScore || 0) - (a._boostedScore || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } else if (effectiveSort === 'trending') {
    // Trending = engagement weighted by recency (newer + high engagement ranks higher)
    // recencyWeight: 2^(-hours/24) so half-life 24h
    const getTrendingScore = (post: typeof postsWithBoost[0]) => {
      const engagement = post._boostedScore || 0;
      const hoursSince = (now - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
      const recencyWeight = Math.pow(2, -hoursSince / 24);
      return engagement * recencyWeight;
    };
    postsWithBoost.sort((a, b) => {
      const scoreDiff = getTrendingScore(b) - getTrendingScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } else {
    // newest (default): chronological, with boost as tie-breaker within same hour
    postsWithBoost.sort((a, b) => {
      const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (Math.abs(timeDiff) >= 3600000) return timeDiff;
      return (b._boostedScore || 0) - (a._boostedScore || 0) || timeDiff;
    });
  }

  // Remove temporary boost score
  const finalPosts = postsWithBoost.map(({ _boostedScore, ...post }) => post);

  // Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    data: finalPosts.slice(startIndex, endIndex),
    hasMore: endIndex < finalPosts.length,
  };
}

export async function getPostById(id: string) {
  const db = getFirestoreDb();
  if (db) return getPostByIdFirestore(id);
  await new Promise(resolve => setTimeout(resolve, 300));
  const post = mockPosts.find(p => p.id === id);
  return post || null;
}

export async function createPost(data: any): Promise<Post> {
  const db = getFirestoreDb();
  const currentUser = await getUserById(getCurrentUserIdOrFallback());
  if (!currentUser) throw new Error('User not found');
  const media: PostMedia[] = (data.media || []).map((item: any, index: number) => ({
    id: `m${Date.now()}-${index}`,
    type: item.type || 'image',
    url: item.uri,
    thumbnail: item.type === 'video' ? item.thumbnail : undefined,
    width: item.width,
    height: item.height,
    duration: item.duration,
  }));
  if (db) {
    const author = {
      id: currentUser.id,
      name: currentUser.name,
      handle: currentUser.handle,
      avatar: currentUser.avatar ?? null,
      label: currentUser.label,
      country: currentUser.country,
    };
    return createPostFirestore(author, {
      content: data.content || '',
      title: data.title,
      media: media.length > 0 ? media : undefined,
      poll: data.poll,
      contentWarning: data.contentWarning || null,
      hashtags: Array.isArray(data.tags) ? data.tags : undefined,
    });
  }
  await new Promise(resolve => setTimeout(resolve, 500));
  const newId = `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newPost: Post = {
    id: newId,
    author: { id: currentUser.id, name: currentUser.name, handle: currentUser.handle, avatar: currentUser.avatar || null, label: currentUser.label },
    content: data.content || '',
    title: data.title,
    createdAt: new Date().toISOString(),
    likes: 0,
    saves: 0,
    comments: 0,
    views: 0,
    isLiked: false,
    isSaved: false,
    media: media.length > 0 ? media : undefined,
    poll: data.poll ? { question: data.poll.question, options: data.poll.options, totalVotes: 0, userVote: undefined } : undefined,
    contentWarning: data.contentWarning || null,
    hashtags: Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : undefined,
  };
  mockPosts.unshift(newPost);
  return newPost;
}

// Track voting in progress to prevent race conditions
const votingInProgress = new Map<string, boolean>();

export async function votePoll(postId: string, optionId: string) {
  // Check if a vote is already in progress for this post
  if (votingInProgress.get(postId)) {
    // Wait a bit and check the current state
    await new Promise(resolve => setTimeout(resolve, 100));
    const post = mockPosts.find(p => p.id === postId);
    if (post && post.poll) {
      return {
        ...post.poll,
        options: post.poll.options.map((opt: any) => ({ ...opt })),
      };
    }
  }
  
  // Mark voting as in progress
  votingInProgress.set(postId, true);
  
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Find the post in mockPosts
    const post = mockPosts.find(p => p.id === postId);
    if (!post || !post.poll) {
      throw new Error('Post or poll not found');
    }
    
    // Store the current user vote BEFORE any processing (atomic check)
    const currentUserVote = post.poll.userVote;
    
    // If optionId is empty, remove the vote
    if (!optionId) {
      if (currentUserVote) {
        const previousOption = post.poll.options.find((opt: any) => opt.id === currentUserVote);
        if (previousOption) {
          previousOption.votes = Math.max(0, (previousOption.votes || 0) - 1);
        }
        post.poll.userVote = undefined;
        // Recalculate totalVotes from options to ensure accuracy
        post.poll.totalVotes = post.poll.options.reduce((sum: number, opt: any) => sum + (opt.votes || 0), 0);
      }
      // Return a deep copy
      return {
        ...post.poll,
        options: post.poll.options.map((opt: any) => ({ ...opt })),
      };
    }
    
    // If user is trying to vote on the same option they already voted on, do nothing
    if (currentUserVote === optionId) {
      // Return a deep copy of current state
      return {
        ...post.poll,
        options: post.poll.options.map((opt: any) => ({ ...opt })),
      };
    }
    
    // Check if user already voted on a different option
    if (currentUserVote) {
      // Remove previous vote
      const previousOption = post.poll.options.find((opt: any) => opt.id === currentUserVote);
      if (previousOption) {
        previousOption.votes = Math.max(0, (previousOption.votes || 0) - 1);
      }
    }
    
    // Add new vote
    const selectedOption = post.poll.options.find((opt: any) => opt.id === optionId);
    if (selectedOption) {
      selectedOption.votes = (selectedOption.votes || 0) + 1;
      post.poll.userVote = optionId;
    }
    
    // Recalculate totalVotes from options to ensure accuracy (one user = one vote)
    post.poll.totalVotes = post.poll.options.reduce((sum: number, opt: any) => sum + (opt.votes || 0), 0);
    
    // Return a deep copy to avoid mutations
    return {
      ...post.poll,
      options: post.poll.options.map((opt: any) => ({ ...opt })),
    };
  } finally {
    // Always clear the voting in progress flag
    votingInProgress.delete(postId);
  }
}

/** Persist like toggle so it survives refresh and is consistent across app. */
export async function likePost(postId: string): Promise<{ isLiked: boolean; likes: number }> {
  const db = getFirestoreDb();
  const uid = getCurrentUserIdOrFallback();
  if (db) {
    const post = await getPostById(postId);
    if (!post) throw new Error('Post not found');
    const newLikes = await likePostFirestore(postId, uid);
    return { isLiked: !post.isLiked, likes: newLikes };
  }
  await new Promise(resolve => setTimeout(resolve, 150));
  const post = mockPosts.find(p => p.id === postId);
  if (!post) throw new Error('Post not found');
  post.isLiked = !post.isLiked;
  post.likes = Math.max(0, post.likes + (post.isLiked ? 1 : -1));
  return { isLiked: post.isLiked, likes: post.likes };
}

/** Persist save toggle so it survives refresh. */
export async function savePost(postId: string): Promise<{ isSaved: boolean; saves: number }> {
  const db = getFirestoreDb();
  const uid = getCurrentUserIdOrFallback();
  if (db) {
    const post = await getPostById(postId);
    if (!post) throw new Error('Post not found');
    const newSaves = await savePostFirestore(postId, uid);
    return { isSaved: !post.isSaved, saves: newSaves };
  }
  await new Promise(resolve => setTimeout(resolve, 150));
  const post = mockPosts.find(p => p.id === postId);
  if (!post) throw new Error('Post not found');
  post.isSaved = !post.isSaved;
  post.saves = Math.max(0, post.saves + (post.isSaved ? 1 : -1));
  return { isSaved: post.isSaved, saves: post.saves };
}

/** Increment post comment count when a user adds a comment (keeps feed in sync). */
export async function incrementPostCommentCount(postId: string): Promise<number> {
  const post = mockPosts.find(p => p.id === postId);
  if (!post) return 0;
  post.comments = (post.comments ?? 0) + 1;
  return post.comments;
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

  const uid = getCurrentUserIdOrFallback();
  const followingUsers = await getFollowing(uid);
  const followingIds = new Set(followingUsers.map(u => u.id).filter(Boolean));

  const followingTargets: ShareTarget[] = followingUsers
    .filter(user => user && user.id && user.name)
    .map(user => ({
      id: user.id,
      name: user.name,
      type: 'user' as const,
      avatar: user.avatar || undefined,
      isFollowing: true,
    }));

  const { mockUsers } = await import('@/lib/mocks/users');
  const otherUsers: ShareTarget[] = mockUsers
    .filter(user => user && user.id && user.name && user.id !== uid && !followingIds.has(user.id))
    .map(user => ({
      id: user.id,
      name: user.name,
      type: 'user' as const,
      avatar: user.avatar || undefined,
      isFollowing: false,
    }));

  return [...followingTargets, ...otherUsers];
}

export async function sharePost(postId: string, targetIds: string[]): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Get the post
  const post = mockPosts.find(p => p.id === postId);
  if (!post) {
    throw new Error('Post not found');
  }
  
  // Import chat API to send messages
  const { sendChatMessage } = await import('./chat');

  const sharedPostPayload: SharedPostPayload = {
    postId: post.id,
    author: post.author,
    title: post.title,
    content: post.content,
    media: post.media,
  };

  const { getConversationIdForUser } = await import('./chat');

  for (const targetId of targetIds) {
    try {
      const conversationId = getConversationIdForUser(targetId);
      if (!conversationId) {
        console.warn(`No conversation found for user ${targetId}, skipping`);
        continue;
      }
      await sendChatMessage(
        conversationId,
        '📎 Shared a post',
        undefined, // no raw media; card uses sharedPost.media
        undefined, // replyToId
        undefined, // poll
        sharedPostPayload
      );
    } catch (error) {
      console.error(`Error sharing post to ${targetId}:`, error);
      throw error; // Surface so UI can show failure
    }
  }
  
  // Update share count (if we track it)
  // In a real app, you'd update this on the backend
  console.log(`Shared post ${postId} to ${targetIds.length} recipient(s)`);
}


