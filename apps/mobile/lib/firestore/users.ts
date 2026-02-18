import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirestoreDb, getCurrentUserId } from '@/lib/firebase';

const USERS = 'users';
const FOLLOWS = 'follows';

export interface FirestoreUser {
  id: string;
  name: string;
  handle: string;
  avatar: string | null;
  label?: string;
  bio?: string;
  banner?: string | null;
  occupation?: string;
  country?: string;
  joinDate: string;
  email?: string;
}

function toUser(docId: string, d: Record<string, unknown>): FirestoreUser {
  const data = d;
  return {
    id: docId,
    name: (data.name as string) || 'User',
    handle: (data.handle as string) || `@user${docId}`,
    avatar: (data.avatar as string) || null,
    label: data.label as string | undefined,
    bio: data.bio as string | undefined,
    banner: (data.banner as string) ?? null,
    occupation: data.occupation as string | undefined,
    country: data.country as string | undefined,
    joinDate: (data.joinDate as string) || new Date().toISOString(),
    email: data.email as string | undefined,
  };
}

export async function getFirestoreUser(id: string): Promise<FirestoreUser | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = doc(db, USERS, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toUser(snap.id, (snap.data() as Record<string, unknown>) || {});
}

export async function setFirestoreUser(id: string, data: Partial<FirestoreUser>): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const ref = doc(db, USERS, id);
  await setDoc(ref, { ...data, id, updatedAt: serverTimestamp() }, { merge: true });
}

export async function updateFirestoreUser(id: string, updates: Record<string, unknown>): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const ref = doc(db, USERS, id);
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
}

export async function getFollowingIds(userId: string): Promise<string[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const q = query(collection(db, FOLLOWS), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => (d.data().targetId as string) || '').filter(Boolean);
}

export async function followFirestore(userId: string, targetUserId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const followId = `${userId}_${targetUserId}`;
  await setDoc(doc(db, FOLLOWS, followId), {
    userId,
    targetId: targetUserId,
    createdAt: serverTimestamp(),
  });
}

export async function unfollowFirestore(userId: string, targetUserId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const followId = `${userId}_${targetUserId}`;
  const ref = doc(db, FOLLOWS, followId);
  const snap = await getDoc(ref);
  if (snap.exists()) await deleteDoc(ref);
}

export async function isFollowingFirestore(userId: string, targetUserId: string): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) return false;
  const ref = doc(db, FOLLOWS, `${userId}_${targetUserId}`);
  const snap = await getDoc(ref);
  return snap.exists();
}

export async function getFollowerIds(targetUserId: string): Promise<string[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const q = query(collection(db, FOLLOWS), where('targetId', '==', targetUserId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => (d.data().userId as string) || '').filter(Boolean);
}

/** Create user doc if it doesn't exist (call after sign-up or first sign-in). */
export async function ensureFirestoreUser(
  uid: string,
  email?: string | null,
  displayName?: string | null,
  photoURL?: string | null
): Promise<void> {
  const existing = await getFirestoreUser(uid);
  if (existing) return;
  const handle = `@user${uid.slice(0, 8)}`;
  await setFirestoreUser(uid, {
    id: uid,
    name: displayName || email?.split('@')[0] || 'User',
    handle,
    avatar: photoURL || null,
    joinDate: new Date().toISOString(),
    email: email || undefined,
  });
}
