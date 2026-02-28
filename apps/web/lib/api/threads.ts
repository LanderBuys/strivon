import { getFirestoreDb, getCurrentUserId, isFirebaseConfigured } from "@/lib/firebase";
import { getThreadMessagesFirestore, sendThreadMessageFirestore } from "@/lib/firestore/threads";
import { getUserById } from "./users";
import type { ThreadMessage, User } from "@/types/post";

function getCurrentUserIdOrThrow(): string {
  const uid = getCurrentUserId();
  if (!uid) throw new Error("Must be signed in");
  return uid;
}

export async function getThreadMessages(postId: string): Promise<ThreadMessage[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  return getThreadMessagesFirestore(postId);
}

export async function sendThreadMessage(postId: string, content: string, options?: { replyTo?: string }): Promise<ThreadMessage> {
  const db = getFirestoreDb();
  if (!db) {
    if (!isFirebaseConfigured()) throw new Error("Firebase is not configured. Add env vars to comment.");
    throw new Error("Sign in to comment.");
  }
  const uid = getCurrentUserIdOrThrow();
  const author = await getUserById(uid);
  if (!author) throw new Error("User not found");
  const user: User = {
    id: author.id,
    name: author.name,
    handle: author.handle,
    avatar: author.avatar ?? null,
    label: author.label,
    country: author.country,
  };
  return sendThreadMessageFirestore(postId, user, content, options);
}
