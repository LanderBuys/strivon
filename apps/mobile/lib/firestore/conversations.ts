import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import type { User } from '@/types/post';

const CONVERSATIONS = 'conversations';

export interface ConversationRecord {
  id: string;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageSenderId?: string;
  unreadCount?: Record<string, number>; // userId -> count
  isGroup: boolean;
  groupName?: string;
  memberIds: string[];
  pinned?: Record<string, boolean>; // userId -> pinned
  muted?: Record<string, boolean>;
  createdAt: string;
}

/** Build a deterministic 1:1 conversation id from two user ids */
export function get1To1ConversationId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_');
}

/** List conversations for the current user (where they are a member), sorted by lastMessageTime desc */
export async function getConversationsFirestore(uid: string): Promise<ConversationRecord[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const q = query(
    collection(db, CONVERSATIONS),
    where('memberIds', 'array-contains', uid),
    limit(100)
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ConversationRecord));
  list.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
  return list;
}

/** Get or create a 1:1 conversation between current user and target user */
export async function getOrCreate1To1ConversationFirestore(
  currentUserId: string,
  targetUserId: string
): Promise<string> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured');
  const id = get1To1ConversationId(currentUserId, targetUserId);
  const ref = doc(db, CONVERSATIONS, id);
  const snap = await getDoc(ref);
  if (snap.exists()) return id;
  await setDoc(ref, {
    memberIds: [currentUserId, targetUserId],
    isGroup: false,
    lastMessage: '',
    lastMessageTime: new Date(0).toISOString(),
    createdAt: new Date().toISOString(),
  });
  return id;
}

/** Create a group conversation */
export async function createGroupConversationFirestore(
  creatorId: string,
  memberIds: string[],
  groupName: string
): Promise<string> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured');
  const id = `gc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const ref = doc(db, CONVERSATIONS, id);
  await setDoc(ref, {
    memberIds: [creatorId, ...memberIds],
    isGroup: true,
    groupName,
    lastMessage: 'Group created',
    lastMessageTime: new Date().toISOString(),
    lastMessageSenderId: creatorId,
    createdAt: new Date().toISOString(),
  });
  return id;
}

/** Update conversation last message preview and time */
export async function updateConversationLastMessageFirestore(
  conversationId: string,
  lastMessage: string,
  senderId: string
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const ref = doc(db, CONVERSATIONS, conversationId);
  await setDoc(ref, { lastMessage, lastMessageTime: new Date().toISOString(), lastMessageSenderId: senderId }, { merge: true });
}

/** Get conversation by id */
export async function getConversationByIdFirestore(conversationId: string): Promise<ConversationRecord | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, CONVERSATIONS, conversationId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ConversationRecord;
}

/** Resolve conversation id for a 1:1 with target user */
export async function getConversationIdForUserFirestore(currentUserId: string, targetUserId: string): Promise<string | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const id = get1To1ConversationId(currentUserId, targetUserId);
  const snap = await getDoc(doc(db, CONVERSATIONS, id));
  return snap.exists() ? id : null;
}

export async function updateConversationPinFirestore(conversationId: string, userId: string, pinned: boolean): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const ref = doc(db, CONVERSATIONS, conversationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const pinnedMap = { ...(data.pinned as Record<string, boolean> || {}), [userId]: pinned };
  await setDoc(ref, { pinned: pinnedMap }, { merge: true });
}

export async function updateConversationMuteFirestore(conversationId: string, userId: string, muted: boolean): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const ref = doc(db, CONVERSATIONS, conversationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const mutedMap = { ...(data.muted as Record<string, boolean> || {}), [userId]: muted };
  await setDoc(ref, { muted: mutedMap }, { merge: true });
}

export async function deleteConversationFirestore(conversationId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await deleteDoc(doc(db, CONVERSATIONS, conversationId));
}
