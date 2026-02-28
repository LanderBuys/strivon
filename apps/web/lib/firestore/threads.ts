import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  writeBatch,
} from "firebase/firestore";
import { getFirestoreDb, getCurrentUserId } from "@/lib/firebase";
import type { ThreadMessage, User } from "@/types/post";

const THREAD_MESSAGES = "threadMessages";
const POSTS = "posts";

function toUser(data: Record<string, unknown>): User {
  return {
    id: (data.id as string) || "",
    name: (data.name as string) || "User",
    handle: (data.handle as string) || "@user",
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
    content: (data.content as string) || "",
    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : (data.createdAt as { toDate?: () => Date })?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    editedAt: data.editedAt as string | undefined,
    reactions: (data.reactions as ThreadMessage["reactions"]) || [],
    replyTo: data.replyTo as string | undefined,
    media: data.media as unknown[] | undefined,
    status: data.status as ThreadMessage["status"],
    pinned: data.pinned as boolean | undefined,
    mentions: data.mentions as string[] | undefined,
  };
}

// Firestore: composite index on threadMessages (postId Ascending, createdAt Ascending)
export async function getThreadMessagesFirestore(postId: string): Promise<ThreadMessage[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const q = query(
    collection(db, THREAD_MESSAGES),
    where("postId", "==", postId),
    orderBy("createdAt", "asc"),
    limit(500)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toThreadMessage(d.id, d.data() as Record<string, unknown>));
}

export async function sendThreadMessageFirestore(
  postId: string,
  author: User,
  content: string,
  options?: { replyTo?: string }
): Promise<ThreadMessage> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore not configured");
  const uid = getCurrentUserId();
  if (!uid) throw new Error("Must be signed in to comment");
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
    media: [],
  };
  const batch = writeBatch(db);
  const msgRef = doc(db, THREAD_MESSAGES, id);
  const postRef = doc(db, POSTS, postId);
  batch.set(msgRef, messageData);
  batch.update(postRef, { comments: increment(1) });
  await batch.commit();
  return toThreadMessage(id, { ...messageData, id });
}
