import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { getFirestoreUser } from './users';
import type { Story, User, StoryOverlay, StoryViewer } from '@/types/post';

const STORIES = 'stories';

function toUser(data: Record<string, unknown>): User {
  return {
    id: (data.id as string) || '',
    name: (data.name as string) || 'User',
    handle: (data.handle as string) || '@user',
    avatar: (data.avatar as string) ?? null,
    label: data.label as string | undefined,
  };
}

function toStory(id: string, d: Record<string, unknown>, isOwn: boolean): Story {
  const author = (d.author as Record<string, unknown>) || {};
  return {
    id,
    author: toUser(author),
    media: d.media as Story['media'],
    mediaUrl: (d.media as { url?: string })?.url,
    mediaType: (d.media as { type?: string })?.type as 'image' | 'video' | undefined,
    overlays: d.overlays as StoryOverlay[] | undefined,
    createdAt: (d.createdAt as string) || new Date().toISOString(),
    expiresAt: (d.expiresAt as string) || new Date().toISOString(),
    views: (d.views as number) ?? 0,
    viewers: d.viewers as StoryViewer[] | undefined,
    isOwn,
  };
}

export async function getStoriesFirestore(uid: string): Promise<Story[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const now = new Date().toISOString();
  const q = query(
    collection(db, STORIES),
    where('expiresAt', '>', now),
    orderBy('expiresAt', 'desc'),
    limit(200)
  );
  const snap = await getDocs(q);
  const byAuthor = new Map<string, Story[]>();
  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    const authorId = data.authorId as string;
    const isOwn = authorId === uid;
    const story = toStory(d.id, data, isOwn);
    if (!byAuthor.has(authorId)) byAuthor.set(authorId, []);
    byAuthor.get(authorId)!.push(story);
  }
  const result: Story[] = [];
  byAuthor.forEach((stories) => {
    stories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    result.push(...stories);
  });
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return result;
}

export async function getStoryByIdFirestore(storyId: string, uid: string): Promise<Story | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = doc(db, STORIES, storyId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  const isOwn = (data.authorId as string) === uid;
  return toStory(snap.id, data, isOwn);
}

export async function createStoryFirestore(
  authorId: string,
  data: {
    media: { uri: string; type: string };
    expirationHours: number;
    overlays?: StoryOverlay[];
  }
): Promise<Story> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured');
  const author = await getFirestoreUser(authorId);
  if (!author) throw new Error('User not found');
  const id = `story-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const mediaUrl = data.media.uri;
  const mediaType = data.media.type === 'video' ? 'video' : 'image';
  const expiresAt = new Date(Date.now() + data.expirationHours * 60 * 60 * 1000).toISOString();
  const storyData = {
    authorId,
    author: {
      id: author.id,
      name: author.name,
      handle: author.handle,
      avatar: author.avatar,
      label: author.label,
    },
    media: { id: `m-${id}`, type: mediaType, url: mediaUrl },
    overlays: data.overlays || [],
    createdAt: new Date().toISOString(),
    expiresAt,
    views: 0,
  };
  await setDoc(doc(db, STORIES, id), storyData);
  return toStory(id, storyData as Record<string, unknown>, true);
}

export async function deleteStoryFirestore(storyId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const ref = doc(db, STORIES, storyId);
  await deleteDoc(ref);
}
