import { ThreadMessage } from '@/types/post';
import { getFirestoreDb } from '@/lib/firebase';
import { getCurrentUserIdOrFallback } from '@/lib/api/users';
import { getUserById } from '@/lib/api/users';
import {
  getThreadMessagesFirestore,
  sendThreadMessageFirestore,
  reactToMessageFirestore,
} from '@/lib/firestore/threads';

export async function getThreadMessages(postId: string): Promise<ThreadMessage[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  return getThreadMessagesFirestore(postId);
}

export async function sendThreadMessage(
  postId: string,
  content: string,
  media?: any[],
  replyTo?: string
): Promise<ThreadMessage> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured. Sign in and try again.');
  const uid = getCurrentUserIdOrFallback();
  const author = await getUserById(uid);
  if (!author) throw new Error('User not found');
  const user = { id: author.id, name: author.name, handle: author.handle, avatar: author.avatar ?? null, label: author.label, country: author.country };
  return sendThreadMessageFirestore(postId, user, content, { replyTo, media });
}

export async function reactToMessage(messageId: string, emoji: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const uid = getCurrentUserIdOrFallback();
  await reactToMessageFirestore(messageId, emoji, uid);
}
