import AsyncStorage from '@react-native-async-storage/async-storage';
import { Story, StoryOverlay } from '@/types/post';
import { getCurrentUserIdOrFallback } from '@/lib/api/users';
import { getFirestoreDb } from '@/lib/firebase';
import {
  getStoriesFirestore,
  getStoryByIdFirestore,
  createStoryFirestore,
  deleteStoryFirestore,
} from '@/lib/firestore/stories';
import { getFollowingIds, getFollowerIds } from '@/lib/firestore/users';
import { getViewedOrInteractedAuthorIds } from '@/lib/services/viewedOrInteractedProfilesService';
import { mockStories } from '@/lib/mocks/stories';

const POPULAR_AUTHORS_LIMIT = 25;

const STORIES_TODAY_KEY = '@strivon_stories_today';
const STORIES_DATE_KEY = '@strivon_stories_date';
const USER_STORIES_KEY = '@strivon_user_stories';

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

async function resetDailyCounterIfNeeded(): Promise<void> {
  const lastDate = await AsyncStorage.getItem(STORIES_DATE_KEY);
  const today = getTodayDateString();
  
  if (lastDate !== today) {
    await AsyncStorage.setItem(STORIES_DATE_KEY, today);
    await AsyncStorage.setItem(STORIES_TODAY_KEY, '0');
  }
}

/**
 * Order stories: 1) own, 2) following, 3) profiles you viewed or interacted with, 4) popular (by follower count).
 * When you don't follow anyone or no one you follow has stories, shows viewed/interacted then popular.
 */
export async function getStories(): Promise<Story[]> {
  const db = getFirestoreDb();
  if (!db) return mockStories;

  const uid = getCurrentUserIdOrFallback();
  const fromDb = await getStoriesFirestore(uid);
  if (fromDb.length === 0) return mockStories;

  const byAuthor = new Map<string, Story[]>();
  for (const s of fromDb) {
    const authorId = s.author?.id ?? '';
    if (!authorId) continue;
    if (!byAuthor.has(authorId)) byAuthor.set(authorId, []);
    byAuthor.get(authorId)!.push(s);
  }
  for (const arr of byAuthor.values()) {
    arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const followingIds = await getFollowingIds(uid);
  const viewedOrInteracted = await getViewedOrInteractedAuthorIds();
  const authorIds = Array.from(byAuthor.keys());

  const hasFollowingStories = followingIds.some((id) => byAuthor.has(id));
  const selfHasStories = byAuthor.has(uid);

  let orderedAuthorIds: string[];

  if (selfHasStories || hasFollowingStories) {
    orderedAuthorIds = [uid, ...followingIds.filter((id) => byAuthor.has(id))];
    const rest = authorIds.filter((id) => id !== uid && !followingIds.includes(id));
    const viewedRest = rest.filter((id) => viewedOrInteracted.includes(id));
    const otherRest = rest.filter((id) => !viewedOrInteracted.includes(id));
    const withFollowerCounts = await Promise.all(
      otherRest.slice(0, POPULAR_AUTHORS_LIMIT).map(async (id) => {
        const count = (await getFollowerIds(id)).length;
        return { id, count };
      })
    );
    withFollowerCounts.sort((a, b) => b.count - a.count);
    orderedAuthorIds.push(...viewedRest);
    orderedAuthorIds.push(...withFollowerCounts.map((x) => x.id));
    orderedAuthorIds.push(...otherRest.slice(POPULAR_AUTHORS_LIMIT));
  } else {
    const viewedWithStories = viewedOrInteracted.filter((id) => byAuthor.has(id));
    const rest = authorIds.filter((id) => !viewedWithStories.includes(id));
    const withFollowerCounts = await Promise.all(
      rest.slice(0, POPULAR_AUTHORS_LIMIT).map(async (id) => {
        const count = (await getFollowerIds(id)).length;
        return { id, count };
      })
    );
    withFollowerCounts.sort((a, b) => b.count - a.count);
    orderedAuthorIds = [
      ...(byAuthor.has(uid) ? [uid] : []),
      ...viewedWithStories,
      ...withFollowerCounts.map((x) => x.id),
      ...rest.slice(POPULAR_AUTHORS_LIMIT),
    ];
  }

  const seen = new Set<string>();
  const result: Story[] = [];
  for (const authorId of orderedAuthorIds) {
    if (seen.has(authorId)) continue;
    seen.add(authorId);
    const list = byAuthor.get(authorId);
    if (list) result.push(...list);
  }
  return result.length > 0 ? result : fromDb;
}

export async function getStoryById(id: string): Promise<Story | null> {
  const db = getFirestoreDb();
  if (db) {
    const uid = getCurrentUserIdOrFallback();
    const fromDb = await getStoryByIdFirestore(id, uid);
    if (fromDb) return fromDb;
  }
  return mockStories.find(s => s.id === id) ?? null;
}

export async function getStoriesToday(): Promise<number> {
  await resetDailyCounterIfNeeded();
  const count = await AsyncStorage.getItem(STORIES_TODAY_KEY);
  return count ? parseInt(count, 10) : 0;
}

export async function createStory(data: {
  media: { uri: string; type: string };
  expirationHours: number;
  overlays?: StoryOverlay[];
}): Promise<Story> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured. Sign in and try again.');
  const uid = getCurrentUserIdOrFallback();
  return createStoryFirestore(uid, data);
}

export async function deleteStory(storyId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured');
  await deleteStoryFirestore(storyId);
}
