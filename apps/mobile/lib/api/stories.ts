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

export async function getStories(): Promise<Story[]> {
  const db = getFirestoreDb();
  if (db) {
    const uid = getCurrentUserIdOrFallback();
    return getStoriesFirestore(uid);
  }
  return [];
}

export async function getStoryById(id: string): Promise<Story | null> {
  const db = getFirestoreDb();
  if (db) {
    const uid = getCurrentUserIdOrFallback();
    return getStoryByIdFirestore(id, uid);
  }
  return null;
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
