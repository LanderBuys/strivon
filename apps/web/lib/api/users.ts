import { getFirestoreDb, getCurrentUserId } from "@/lib/firebase";
import {
  getFirestoreUser,
  updateFirestoreUser,
  followFirestore,
  unfollowFirestore,
  isFollowingFirestore,
  type FirestoreUser,
} from "@/lib/firestore/users";
import type { User } from "@/types/post";
import { getMockUserById } from "@/lib/mocks/users";

function firestoreToUser(u: FirestoreUser): User {
  return {
    id: u.id,
    name: u.name,
    handle: u.handle,
    avatar: u.avatar,
    label: u.label,
    bio: u.bio,
    banner: u.banner,
    occupation: u.occupation,
    country: u.country,
    joinDate: u.joinDate,
  };
}

export function getCurrentUserIdOrFallback(): string {
  return getCurrentUserId() ?? "1";
}

export async function getUserById(id: string): Promise<User | null> {
  const db = getFirestoreDb();
  if (db) {
    const u = await getFirestoreUser(id);
    if (u) return firestoreToUser(u);
  }
  const mock = getMockUserById(id);
  return mock ? { ...mock } : null;
}

export async function followUser(userId: string, targetUserId: string): Promise<void> {
  const db = getFirestoreDb();
  if (db) await followFirestore(userId, targetUserId);
}

export async function unfollowUser(userId: string, targetUserId: string): Promise<void> {
  const db = getFirestoreDb();
  if (db) await unfollowFirestore(userId, targetUserId);
}

export async function isFollowing(userId: string, targetUserId: string): Promise<boolean> {
  const db = getFirestoreDb();
  if (db) return isFollowingFirestore(userId, targetUserId);
  return false;
}
