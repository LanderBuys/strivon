import AsyncStorage from '@react-native-async-storage/async-storage';
import { Story, StoryOverlay, StoryViewer } from '@/types/post';
import { mockStories } from '@/lib/mocks/stories';
import { mockUsers } from '@/lib/mocks/users';
import { getCurrentUserIdOrFallback } from '@/lib/api/users';
import { getUserById } from './users';
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
    const firestoreStories = await getStoriesFirestore(uid);
    if (firestoreStories.length > 0) return firestoreStories;
  }
  await new Promise((resolve) => setTimeout(resolve, 300));
  try {
    const stored = await AsyncStorage.getItem(USER_STORIES_KEY);
    if (stored) {
      const userStories: Story[] = JSON.parse(stored);
      const otherUsers = mockUsers.filter((u) => u.id !== getCurrentUserIdOrFallback());
      const now = Date.now();
      const withViewers = userStories.map((s, i) => {
        if (s.views != null && s.views > 0 && s.viewers && s.viewers.length > 0) return s;
        const count = Math.min(2 + (i % 3), otherUsers.length);
        const viewers: StoryViewer[] = otherUsers.slice(0, count).map((u, j) => ({
          id: u.id,
          name: u.name,
          handle: u.handle,
          avatar: u.avatar ?? null,
          viewedAt: new Date(now - (j + 1) * 60 * 1000 * (5 + j * 3)).toISOString(),
        }));
        return { ...s, views: viewers.length, viewers };
      });
      return [...withViewers, ...mockStories];
    }
  } catch (error) {
    console.error('Error loading user stories:', error);
  }
  return mockStories;
}

export async function getStoryById(id: string): Promise<Story | null> {
  const db = getFirestoreDb();
  if (db) {
    const uid = getCurrentUserIdOrFallback();
    const story = await getStoryByIdFirestore(id, uid);
    if (story) return story;
  }
  await new Promise((resolve) => setTimeout(resolve, 200));
  try {
    const stored = await AsyncStorage.getItem(USER_STORIES_KEY);
    if (stored) {
      const userStories: Story[] = JSON.parse(stored);
      const userStory = userStories.find((s) => s.id === id);
      if (userStory) return userStory;
    }
  } catch (error) {
    console.error('Error loading user story:', error);
  }
  return mockStories.find((s) => s.id === id) || null;
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
  const uid = getCurrentUserIdOrFallback();
  if (db) return createStoryFirestore(uid, data);
  await resetDailyCounterIfNeeded();
  const today = await getStoriesToday();
  await AsyncStorage.setItem(STORIES_TODAY_KEY, (today + 1).toString());
  const user = await getUserById(uid);
  if (!user) throw new Error('User not found');
  const mediaUrl = data.media.uri;
  const mediaType = data.media.type === 'video' ? 'video' : 'image';
  const newStory: Story = {
    id: `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    author: {
      id: user.id,
      name: user.name,
      handle: user.handle,
      avatar: user.avatar || null,
      label: user.label,
    },
    media: { id: `media-${Date.now()}`, type: mediaType, url: mediaUrl },
    mediaUrl,
    mediaType,
    overlays: data.overlays && data.overlays.length > 0 ? data.overlays : undefined,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + data.expirationHours * 60 * 60 * 1000).toISOString(),
    views: 0,
    isViewed: false,
    isOwn: true,
  };
  try {
    const stored = await AsyncStorage.getItem(USER_STORIES_KEY);
    const userStories: Story[] = stored ? JSON.parse(stored) : [];
    userStories.unshift(newStory);
    if (userStories.length > 100) userStories.splice(100);
    await AsyncStorage.setItem(USER_STORIES_KEY, JSON.stringify(userStories));
  } catch (error) {
    console.error('Error saving story:', error);
  }
  return newStory;
}

export async function deleteStory(storyId: string): Promise<void> {
  if (getFirestoreDb()) {
    await deleteStoryFirestore(storyId);
    return;
  }
  try {
    const stored = await AsyncStorage.getItem(USER_STORIES_KEY);
    if (!stored) return;
    const userStories: Story[] = JSON.parse(stored);
    const filtered = userStories.filter((s) => s.id !== storyId);
    await AsyncStorage.setItem(USER_STORIES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting story:', error);
    throw error;
  }
}
