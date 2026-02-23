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
import { getFirestoreDb, getCurrentUserId } from '@/lib/firebase';
import { getFirestoreUser } from './users';
import type { ThreadMessage, User } from '@/types/post';

const MESSAGES = 'messages';

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

export async function getMessagesFirestore(
  conversationId: string,
  options?: { olderThanMessageId?: string; limit?: number }
): Promise<ThreadMessage[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const pageSize = options?.limit ?? 50;
  let q = query(
    collection(db, MESSAGES),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );
  if (options?.olderThanMessageId) {
    const ref = doc(db, MESSAGES, options.olderThanMessageId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];
    const createdAt = snap.data().createdAt as string;
    q = query(
      collection(db, MESSAGES),
      where('conversationId', '==', conversationId),
      where('createdAt', '<', createdAt),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
  }
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => toThreadMessage(d.id, d.data() as Record<string, unknown>));
  list.reverse();
  return list;
}

export async function sendMessageFirestore(
  conversationId: string,
  author: User,
  content: string,
  options?: {
    replyToId?: string;
    media?: any[];
    poll?: any;
    sharedPost?: any;
    sharedArticle?: any;
  }
): Promise<ThreadMessage> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured');
  const uid = getCurrentUserId();
  if (!uid) throw new Error('Must be signed in to send messages');
  const id = `msg-${conversationId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const messageData = {
    conversationId,
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
    replyTo: options?.replyToId || null,
    media: options?.media || [],
    poll: options?.poll || null,
    sharedPost: options?.sharedPost || null,
    sharedArticle: options?.sharedArticle || null,
  };
  const ref = doc(db, MESSAGES, id);
  await setDoc(ref, messageData);
  const { updateConversationLastMessageFirestore } = await import('./conversations');
  await updateConversationLastMessageFirestore(conversationId, content.trim() || '📎 Media', author.id);
  return toThreadMessage(id, { ...messageData, id });
}

export async function deleteMessageFirestore(conversationId: string, messageId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const ref = doc(db, MESSAGES, messageId);
  await deleteDoc(ref);
}
