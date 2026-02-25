import { Post, Space, User } from '@/types/post';
import { mockPosts } from '@/lib/mocks/posts';
import { mockUsers } from '@/lib/mocks/users';
import { mockSpaces } from '@/lib/mocks/spaces';

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/^[@#]/, '');
}

function getQueryWords(q: string): string[] {
  return normalizeQuery(q).split(/\s+/).filter(w => w.length > 0);
}

/** Split text into words (letters/numbers only, no substrings). */
function getWords(text: string): string[] {
  return text.toLowerCase().split(/[\s\-_.,!?;:'"()]+/).filter(w => w.length > 0);
}

/** True if text contains query as a whole word or as the start of a word (word-boundary match). */
function textMatchesWordOrPrefix(text: string, query: string): boolean {
  if (!query || !text) return false;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  if (lower === q) return true;
  const words = getWords(lower);
  return words.some(word => word === q || word.startsWith(q));
}

/** True if text contains every query word as word or word-prefix. */
function textMatchesAllWords(text: string, queryWords: string[]): boolean {
  if (!queryWords.length) return false;
  const lower = text.toLowerCase();
  return queryWords.every(q => textMatchesWordOrPrefix(lower, q));
}

/** Score user by how well the query matches (higher = better). Uses word-boundary matching. */
function scoreUser(user: User, lowerQuery: string, queryWords: string[]): number {
  const nameLower = user.name.toLowerCase();
  const handleLower = (user.handle || '').toLowerCase().replace('@', '');
  const bioLower = (user.bio || '').toLowerCase();
  const labelLower = (user.label || '').toLowerCase();

  if (lowerQuery.length === 0) return 0;

  // Exact match on name or handle
  if (nameLower === lowerQuery || handleLower === lowerQuery) return 100;
  if (nameLower.startsWith(lowerQuery) || handleLower.startsWith(lowerQuery)) return 85;

  // Word or word-prefix in name/handle (e.g. "de" matches "David" only if David starts with "de" - it doesn't; "dav" matches "David")
  if (textMatchesWordOrPrefix(user.name, lowerQuery) || textMatchesWordOrPrefix(handleLower, lowerQuery)) return 75;
  if (textMatchesWordOrPrefix(bioLower, lowerQuery) || textMatchesWordOrPrefix(labelLower, lowerQuery)) return 65;

  // Multi-word: all words must match as word/prefix in searchable text
  const searchable = `${nameLower} ${handleLower} ${bioLower} ${labelLower}`;
  if (queryWords.length > 0 && textMatchesAllWords(searchable, queryWords)) {
    const starts = queryWords.filter(w => nameLower.startsWith(w) || handleLower.startsWith(w)).length;
    return 50 + starts * 10;
  }
  return 0;
}

/** Score post by relevance. Uses word-boundary matching so "de" doesn't match every "developer". */
function scorePost(post: Post, lowerQuery: string, queryWords: string[], queryWithoutHash: string): number {
  const content = (post.content || '').toLowerCase();
  const title = (post.title || '').toLowerCase();
  const authorName = (post.author?.name || '').toLowerCase();
  const authorHandle = (post.author?.handle || '').toLowerCase().replace('@', '');

  if (lowerQuery.length < 2) return 0;

  // Exact phrase in content or title
  if (content === lowerQuery || title === lowerQuery) return 100;
  if (content.includes(lowerQuery)) return 85;
  if (title.includes(lowerQuery)) return 82;
  if (post.hashtags?.some(tag => tag.toLowerCase().includes(queryWithoutHash))) return 80;

  // Author: word or prefix in name/handle
  if (textMatchesWordOrPrefix(authorName, lowerQuery) || textMatchesWordOrPrefix(authorHandle, lowerQuery)) return 65;

  // Word or word-prefix in content/title (e.g. "de" only matches words starting with "de" like "design", not "made")
  const fullText = `${content} ${title}`;
  if (textMatchesWordOrPrefix(fullText, lowerQuery)) return 60;
  if (queryWords.length > 0 && textMatchesAllWords(fullText, queryWords)) return 55;
  const wordMatches = queryWords.filter(w => textMatchesWordOrPrefix(fullText, w)).length;
  if (wordMatches > 0) return 30 + wordMatches * 5;

  return 0;
}

/** Score space by relevance. Uses word-boundary matching. */
function scoreSpace(space: Space, lowerQuery: string, queryWords: string[]): number {
  const nameLower = space.name.toLowerCase();
  const descLower = space.description.toLowerCase();

  if (lowerQuery.length === 0) return 0;
  if (nameLower === lowerQuery) return 100;
  if (nameLower.startsWith(lowerQuery)) return 85;
  if (textMatchesWordOrPrefix(nameLower, lowerQuery)) return 75;
  if (textMatchesWordOrPrefix(descLower, lowerQuery)) return 60;
  if (queryWords.length > 0 && textMatchesAllWords(`${nameLower} ${descLower}`, queryWords)) return 50;
  return 0;
}

export async function searchAll(query: string): Promise<{ users: User[]; posts: Post[]; spaces: Space[] }> {
  await new Promise(resolve => setTimeout(resolve, 150));
  const q = normalizeQuery(query);
  const words = getQueryWords(query);

  const users = mockUsers
    .map(u => ({ user: u, score: scoreUser(u, q, words) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.user);

  const posts = query.trim().length >= 2
    ? mockPosts
        .map(p => ({ post: p, score: scorePost(p, q, words, q.replace(/^#/, '')) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(x => x.post)
    : [];

  const spaces = mockSpaces
    .map(s => ({ space: s, score: scoreSpace(s, q, words) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.space);

  return { users, posts, spaces };
}

export async function searchUsers(query: string): Promise<User[]> {
  const { users } = await searchAll(query);
  return users;
}

function searchPostsInMemory(query: string): Post[] {
  if (!query || query.trim().length < 2) return [];
  const q = normalizeQuery(query);
  const words = getQueryWords(query);
  const queryWithoutHash = q.replace(/^#/, '');
  return mockPosts
    .map(p => ({ post: p, score: scorePost(p, q, words, queryWithoutHash) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.post);
}

export async function searchPosts(query: string): Promise<Post[]> {
  await new Promise(resolve => setTimeout(resolve, 150));
  return searchPostsInMemory(query);
}

export async function searchSpaces(query: string): Promise<Space[]> {
  const { spaces } = await searchAll(query);
  return spaces;
}
