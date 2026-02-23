import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { getFirestoreDb, getCurrentUserId } from '@/lib/firebase';
import { getFollowingIds } from './users';
import type { Post, PostMedia, User } from '@/types/post';

const POSTS = 'posts';
const POST_LIKES = 'postLikes';
const POST_SAVES = 'postSaves';

function toAuthor(data: Record<string, unknown>): User {
  return {
    id: (data.id as string) || '',
    name: (data.name as string) || 'User',
    handle: (data.handle as string) || '@user',
    avatar: (data.avatar as string) ?? null,
    label: data.label as string | undefined,
    country: data.country as string | undefined,
  };
}

function toPost(id: string, data: Record<string, unknown>, isLiked?: boolean, isSaved?: boolean): Post {
  const author = (data.author as Record<string, unknown>) || {};
  const createdAt = data.createdAt;
  const createdAtStr =
    typeof createdAt === 'string'
      ? createdAt
      : (createdAt as { toDate?: () => Date })?.toDate?.()?.toISOString?.() ?? new Date().toISOString();
  return {
    id,
    author: toAuthor(author),
    content: data.content as string | undefined,
    title: data.title as string | undefined,
    createdAt: createdAtStr,
    likes: (data.likes as number) || 0,
    saves: (data.saves as number) || 0,
    comments: (data.comments as number) ?? 0,
    views: (data.views as number) ?? 0,
    media: data.media as PostMedia[] | undefined,
    isLiked: isLiked ?? false,
    isSaved: isSaved ?? false,
    poll: data.poll as any,
    contentWarning: data.contentWarning as string | null | undefined,
    hashtags: data.hashtags as string[] | undefined,
    ownerUid: data.ownerUid as string | undefined,
    mediaId: data.mediaId as string | undefined,
    visibility: data.visibility as 'public' | 'private' | undefined,
    status: (data.status as 'draft' | 'processing' | 'published' | 'rejected') || 'published',
  };
}

export async function createPostFirestore(
  author: User,
  data: {
    content?: string;
    title?: string;
    media?: PostMedia[];
    poll?: any;
    contentWarning?: string | null;
    hashtags?: string[];
    /** When set, post is created as processing/private until media is approved. */
    mediaId?: string;
  }
): Promise<Post> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured');
  const id = `post-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const hasMediaPending = !!data.mediaId;
  const postData = {
    id,
    authorId: author.id,
    ownerUid: author.id,
    author: {
      id: author.id,
      name: author.name,
      handle: author.handle,
      avatar: author.avatar ?? null,
      label: author.label,
      country: author.country,
    },
    content: data.content || '',
    title: data.title || undefined,
    media: data.media || [],
    createdAt: new Date().toISOString(),
    likes: 0,
    saves: 0,
    comments: 0,
    views: 0,
    poll: data.poll || null,
    contentWarning: data.contentWarning || null,
    hashtags: data.hashtags || [],
    updatedAt: serverTimestamp(),
    visibility: hasMediaPending ? 'private' : 'public',
    status: hasMediaPending ? 'processing' : 'published',
    ...(data.mediaId ? { mediaId: data.mediaId } : {}),
  };
  await setDoc(doc(db, POSTS, id), postData);
  return toPost(id, postData as Record<string, unknown>);
}

export async function getFeedPostsFirestore(
  tab: string,
  page: number,
  pageSize: number,
  uid: string
): Promise<{ data: Post[]; hasMore: boolean }> {
  const db = getFirestoreDb();
  if (!db) return { data: [], hasMore: false };
  const followingIds = tab === 'following' ? await getFollowingIds(uid) : null;
  const q = query(
    collection(db, POSTS),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  const snap = await getDocs(q);
  let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>));
  // Only show published posts (omit processing, needs_review, rejected)
  docs = docs.filter((d) => (d.status as string | undefined) !== 'processing' && (d.status as string | undefined) !== 'rejected');
  if (followingIds && followingIds.length > 0) {
    const set = new Set([uid, ...followingIds]);
    docs = docs.filter((d) => set.has((d.authorId as string) || ''));
  } else if (tab === 'following') {
    return { data: [], hasMore: false };
  }
  const start = (page - 1) * pageSize;
  const pageDocs = docs.slice(start, start + pageSize);
  const postIds = pageDocs.map((d) => d.id as string);
  const currentUid = getCurrentUserId();
  const liked = new Set<string>();
  const saved = new Set<string>();
  if (currentUid) {
    await Promise.all(
      postIds.map(async (postId) => {
        const [likeSnap, saveSnap] = await Promise.all([
          getDoc(doc(db, POST_LIKES, `${postId}_${currentUid}`)),
          getDoc(doc(db, POST_SAVES, `${postId}_${currentUid}`)),
        ]);
        if (likeSnap.exists()) liked.add(postId);
        if (saveSnap.exists()) saved.add(postId);
      })
    );
  }
  const posts = pageDocs.map((d) => toPost(d.id as string, d, liked.has(d.id as string), saved.has(d.id as string)));
  return { data: posts, hasMore: docs.length > start + pageSize };
}

export async function getPostByIdFirestore(id: string): Promise<Post | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, POSTS, id));
  if (!snap.exists()) return null;
  const d = { id: snap.id, ...snap.data() } as Record<string, unknown>;
  const uid = getCurrentUserId();
  let isLiked = false;
  let isSaved = false;
  if (uid) {
    const [likeSnap, saveSnap] = await Promise.all([
      getDoc(doc(db, POST_LIKES, `${id}_${uid}`)),
      getDoc(doc(db, POST_SAVES, `${id}_${uid}`)),
    ]);
    isLiked = likeSnap.exists();
    isSaved = saveSnap.exists();
  }
  return toPost(snap.id, d, isLiked, isSaved);
}

export async function likePostFirestore(postId: string, userId: string): Promise<number> {
  const db = getFirestoreDb();
  if (!db) return 0;
  const ref = doc(db, POSTS, postId);
  const likeRef = doc(db, POST_LIKES, `${postId}_${userId}`);
  const snap = await getDoc(likeRef);
  const batch = writeBatch(db);
  if (snap.exists()) {
    batch.delete(likeRef);
    batch.update(ref, { likes: increment(-1) });
  } else {
    batch.set(likeRef, { userId, postId, createdAt: serverTimestamp() });
    batch.update(ref, { likes: increment(1) });
  }
  await batch.commit();
  const postSnap = await getDoc(ref);
  return (postSnap.data()?.likes as number) ?? 0;
}

export async function savePostFirestore(postId: string, userId: string): Promise<number> {
  const db = getFirestoreDb();
  if (!db) return 0;
  const ref = doc(db, POSTS, postId);
  const saveRef = doc(db, POST_SAVES, `${postId}_${userId}`);
  const snap = await getDoc(saveRef);
  const batch = writeBatch(db);
  if (snap.exists()) {
    batch.delete(saveRef);
    batch.update(ref, { saves: increment(-1) });
  } else {
    batch.set(saveRef, { userId, postId, createdAt: serverTimestamp() });
    batch.update(ref, { saves: increment(1) });
  }
  await batch.commit();
  const postSnap = await getDoc(ref);
  return (postSnap.data()?.saves as number) ?? 0;
}
