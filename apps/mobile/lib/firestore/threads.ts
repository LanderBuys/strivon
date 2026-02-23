import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { getFirestoreDb, getCurrentUserId } from '@/lib/firebase';
import type { ThreadMessage, User } from '@/types/post';

const THREAD_MESSAGES = 'threadMessages';
const POSTS = 'posts';

function toUser(data: Record<string, unknown>): User {
  return {
    id: (data.id as string) || '',
    name: (data.name as string) || 'User',
    handle: (data.handle as string) || '@user',
    avatar: (data.avatar as string) ?? null,
    label: data.label as string | undefined,
    country: data.country as string | undefined,
  };
}

function toThreadMessage(id: string, data: Record<string, unknown>): ThreadMessage {
  const author = (data.author as Record<string, unknown>) || {};
  return {
    id,
    author: toUser(author),
    content: (data.content as string) || '',
    createdAt: (data.createdAt as string) || new Date().toISOString(),
    editedAt: data.editedAt as string | undefined,
    reactions: (data.reactions as ThreadMessage['reactions']) || [],
    replyTo: data.replyTo as string | undefined,
    media: data.media as any[] | undefined,
    poll: data.poll as any,
    status: data.status as ThreadMessage['status'],
    pinned: data.pinned as boolean | undefined,
    mentions: data.mentions as string[] | undefined,
    sharedPost: data.sharedPost as any,
    sharedArticle: data.sharedArticle as any,
  };
}

// Firestore composite index required: collection threadMessages, fields postId (Ascending), createdAt (Ascending)
export async function getThreadMessagesFirestore(postId: string): Promise<ThreadMessage[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const q = query(
    collection(db, THREAD_MESSAGES),
    where('postId', '==', postId),
    orderBy('createdAt', 'asc'),
    limit(500)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toThreadMessage(d.id, d.data() as Record<string, unknown>));
}

export async function sendThreadMessageFirestore(
  postId: string,
  author: User,
  content: string,
  options?: { replyTo?: string; media?: any[] }
): Promise<ThreadMessage> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured');
  const uid = getCurrentUserId();
  if (!uid) throw new Error('Must be signed in to comment');
  const id = `thread-${postId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const messageData = {
    postId,
    authorId: author.id,
    author: {
      id: author.id,
      name: author.name,
      handle: author.handle,
      avatar: author.avatar ?? null,
      label: author.label,
      country: author.country,
    },
    content: content.trim(),
    createdAt: new Date().toISOString(),
    reactions: [],
    replyTo: options?.replyTo || null,
    media: options?.media || [],
  };
  const batch = writeBatch(db);
  const msgRef = doc(db, THREAD_MESSAGES, id);
  const postRef = doc(db, POSTS, postId);
  batch.set(msgRef, messageData);
  batch.update(postRef, { comments: increment(1) });
  await batch.commit();
  return toThreadMessage(id, { ...messageData, id });
}

export async function reactToMessageFirestore(
  messageId: string,
  emoji: string,
  userId: string
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const ref = doc(db, THREAD_MESSAGES, messageId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const reactions = (data.reactions as Array<{ emoji: string; count: number; userIds?: string[] }>) || [];
  const existing = reactions.find((r) => r.emoji === emoji);
  const newReactions = [...reactions];
  if (existing) {
    const userIds = (existing as any).userIds || [];
    if (userIds.includes(userId)) {
      (existing as any).count = Math.max(0, (existing.count || 1) - 1);
      (existing as any).userIds = userIds.filter((id: string) => id !== userId);
    } else {
      (existing as any).count = (existing.count || 0) + 1;
      (existing as any).userIds = [...userIds, userId];
    }
  } else {
    newReactions.push({ emoji, count: 1, userIds: [userId] } as any);
  }
  await setDoc(ref, { ...data, reactions: newReactions }, { merge: true });
}
