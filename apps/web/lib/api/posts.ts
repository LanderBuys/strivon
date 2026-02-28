import { getFirestoreDb, getCurrentUserId, isFirebaseConfigured } from "@/lib/firebase";
import {
  getFeedPostsFirestore,
  getPostByIdFirestore,
  createPostFirestore,
  likePostFirestore,
  savePostFirestore,
} from "@/lib/firestore/posts";
import { getUserById } from "./users";
import type { Post, User } from "@/types/post";
import { mockPosts } from "@/lib/mocks/posts";

function getCurrentUserIdOrFallback(): string {
  return getCurrentUserId() ?? "1";
}

export async function getPostById(postId: string): Promise<Post | null> {
  const db = getFirestoreDb();
  if (db) {
    const post = await getPostByIdFirestore(postId);
    if (post) return post;
  }
  const mock = mockPosts.find((p) => p.id === postId);
  return mock ?? null;
}

export async function getFeedPosts(
  tab: string,
  page: number,
  limitNum: number
): Promise<{ data: Post[]; hasMore: boolean }> {
  const db = getFirestoreDb();
  const uid = getCurrentUserIdOrFallback();
  if (db) {
    const result = await getFeedPostsFirestore(tab, page, limitNum, uid);
    if (result.data.length > 0) return result;
  }
  const start = (page - 1) * limitNum;
  const data = mockPosts.slice(start, start + limitNum);
  return { data, hasMore: start + data.length < mockPosts.length };
}

export async function createPost(data: { content?: string; title?: string }): Promise<Post> {
  const db = getFirestoreDb();
  if (!db) {
    if (!isFirebaseConfigured()) {
      throw new Error("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* env vars (see .env.example) to create posts.");
    }
    throw new Error("Sign in to create posts.");
  }
  const uid = getCurrentUserIdOrFallback();
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
  return createPostFirestore(user, { content: data.content, title: data.title });
}

export async function likePost(postId: string): Promise<number> {
  const uid = getCurrentUserId();
  if (!uid) return 0;
  const db = getFirestoreDb();
  if (!db) return 0;
  return likePostFirestore(postId, uid);
}

export async function savePost(postId: string): Promise<number> {
  const uid = getCurrentUserId();
  if (!uid) return 0;
  const db = getFirestoreDb();
  if (!db) return 0;
  return savePostFirestore(postId, uid);
}
