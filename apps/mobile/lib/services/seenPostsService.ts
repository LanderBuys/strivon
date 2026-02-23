import AsyncStorage from '@react-native-async-storage/async-storage';

const SEEN_POSTS_KEY = '@strivon/seen_post_ids';
const MAX_SEEN_IDS = 500;
const DEBOUNCE_MS = 2000;

let cachedIds: Set<string> | null = null;
let persistTimeout: ReturnType<typeof setTimeout> | null = null;

async function loadFromStorage(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(SEEN_POSTS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

async function persist(ids: Set<string>): Promise<void> {
  const arr = Array.from(ids);
  try {
    await AsyncStorage.setItem(SEEN_POSTS_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn('seenPostsService: persist failed', e);
  }
}

function schedulePersist(ids: Set<string>): void {
  if (persistTimeout) clearTimeout(persistTimeout);
  persistTimeout = setTimeout(() => {
    persistTimeout = null;
    persist(ids);
  }, DEBOUNCE_MS);
}

/**
 * Returns the set of post IDs the user has already seen (opened or viewed in feed).
 * Use this to sort feed: show unseen first, then seen when no other content available.
 */
export async function getSeenPostIds(): Promise<Set<string>> {
  if (cachedIds) return cachedIds;
  cachedIds = await loadFromStorage();
  return cachedIds;
}

/**
 * Call when the user opens a post (thread) or has viewed it in feed for long enough.
 * Persists with debounce and caps at MAX_SEEN_IDS (FIFO).
 */
export function addSeenPost(postId: string): void {
  if (!cachedIds) {
    loadFromStorage().then((ids) => {
      cachedIds = ids;
      addSeenPost(postId);
    });
    return;
  }
  if (cachedIds.has(postId)) return;
  cachedIds.add(postId);
  if (cachedIds.size > MAX_SEEN_IDS) {
    const arr = Array.from(cachedIds);
    arr.splice(0, arr.length - MAX_SEEN_IDS);
    cachedIds = new Set(arr);
  }
  schedulePersist(cachedIds);
}

/**
 * Sync in-memory cache with storage (e.g. on app focus). Returns current set.
 */
export async function refreshSeenPostIds(): Promise<Set<string>> {
  cachedIds = await loadFromStorage();
  return cachedIds;
}

/**
 * For tests or "clear read state" – use sparingly.
 */
export async function clearSeenPostIds(): Promise<void> {
  cachedIds = new Set();
  try {
    await AsyncStorage.removeItem(SEEN_POSTS_KEY);
  } catch {
    // ignore
  }
}
