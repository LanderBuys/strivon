import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { getFirestoreDb, getCurrentUserId } from '@/lib/firebase';
import type { MediaDocument, MediaStatus, MediaType } from '@/types/media';

const MEDIA = 'media';
const MODERATION_QUEUE = 'moderationQueue';
const UPLOAD_COUNTS = 'uploadCounts';

const MAX_UPLOADS_PER_DAY = 50;

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Returns current upload count for the given user for today. */
export async function getUploadCountToday(uid: string): Promise<number> {
  const db = getFirestoreDb();
  if (!db) return 0;
  const ref = doc(db, UPLOAD_COUNTS, `${uid}_${todayKey()}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return 0;
  return (snap.data()?.count as number) ?? 0;
}

/** Call after creating a media doc to increment daily upload count. */
export async function incrementUploadCountToday(uid: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const ref = doc(db, UPLOAD_COUNTS, `${uid}_${todayKey()}`);
  const snap = await getDoc(ref);
  const data = snap.data();
  const current = (data?.count as number) ?? 0;
  await setDoc(ref, { uid, count: current + 1, date: todayKey() }, { merge: true });
}

export { MAX_UPLOADS_PER_DAY };

export type MediaDocWithId = MediaDocument & { id: string };

function toMediaDoc(id: string, data: Record<string, unknown>): MediaDocWithId {
  const storage = (data.storage as Record<string, unknown>) || {};
  return {
    id,
    ownerUid: (data.ownerUid as string) || '',
    type: (data.type as MediaType) || 'image',
    status: (data.status as MediaStatus) || 'processing',
    createdAt: (data.createdAt as { toDate?: () => Date })?.toDate?.()?.toISOString?.() ?? (data.createdAt as string) ?? '',
    storage: {
      originalPath: (storage.originalPath as string) || '',
      publicPath: storage.publicPath as string | undefined,
      thumbsPath: storage.thumbsPath as string | undefined,
    },
    moderation: data.moderation as MediaDocument['moderation'],
  };
}

/**
 * Create a media document when user starts upload (status = processing).
 * Call after uploading file to quarantine/{uid}/{mediaId}/original.ext
 */
export async function createMediaDoc(
  mediaId: string,
  params: {
    ownerUid: string;
    type: MediaType;
    originalPath: string;
  }
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured');
  await setDoc(doc(db, MEDIA, mediaId), {
    ownerUid: params.ownerUid,
    type: params.type,
    status: 'processing',
    createdAt: serverTimestamp(),
    storage: {
      originalPath: params.originalPath,
    },
  });
}

export async function getMediaById(mediaId: string): Promise<MediaDocWithId | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, MEDIA, mediaId));
  if (!snap.exists()) return null;
  return toMediaDoc(snap.id, snap.data() as Record<string, unknown>);
}

export async function getMediaByOwner(ownerUid: string, limitCount = 50): Promise<MediaDocWithId[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const q = query(
    collection(db, MEDIA),
    where('ownerUid', '==', ownerUid),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toMediaDoc(d.id, d.data() as Record<string, unknown>));
}

/** Add to moderation queue (called by Cloud Function when status becomes needs_review). */
export async function addToModerationQueue(mediaId: string, priority: number): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await setDoc(doc(db, MODERATION_QUEUE, mediaId), {
    mediaId,
    createdAt: serverTimestamp(),
    priority,
  });
}

/** Remove from queue (e.g. when approved or rejected). */
export async function removeFromModerationQueue(mediaId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await deleteDoc(doc(db, MODERATION_QUEUE, mediaId));
}
