import { API_BASE_URL, api, ApiError } from '@/lib/api/client';
import type { ApiUser, ApiUserProfileUpdate } from '@/lib/api/types';
import { getFirestoreDb, getCurrentUserId } from '@/lib/firebase';
import {
  getFirestoreUser,
  updateFirestoreUser,
  getFollowingIds,
  getFollowerIds,
  followFirestore,
  unfollowFirestore,
  isFollowingFirestore,
  type FirestoreUser,
} from '@/lib/firestore/users';

export type UserRecord = ApiUser & { joinDate?: string };

function firestoreToUser(u: FirestoreUser): UserRecord {
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

export async function getUserById(id: string): Promise<UserRecord | null> {
  if (API_BASE_URL) {
    try {
      const data = await api.get<ApiUser>(`/users/${id}`);
      return { ...data, joinDate: (data as any).joinDate };
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }
  const db = getFirestoreDb();
  if (db) {
    const u = await getFirestoreUser(id);
    return u ? firestoreToUser(u) : null;
  }
  return null;
}

export async function updateUserProfile(
  userId: string,
  updates: ApiUserProfileUpdate & { avatar?: string | null; banner?: string | null }
): Promise<{ success: boolean } & typeof updates> {
  if (API_BASE_URL) {
    await api.patch(`/users/${userId}`, updates);
    return { success: true, ...updates };
  }
  const db = getFirestoreDb();
  if (db) {
    await updateFirestoreUser(userId, updates as Record<string, unknown>);
    return { success: true, ...updates };
  }
  return { success: true, ...updates };
}

export async function followUser(userId: string, targetUserId: string): Promise<void> {
  const db = getFirestoreDb();
  if (db) {
    await followFirestore(userId, targetUserId);
    return;
  }
}

export async function unfollowUser(userId: string, targetUserId: string): Promise<void> {
  const db = getFirestoreDb();
  if (db) {
    await unfollowFirestore(userId, targetUserId);
    return;
  }
}

export async function isFollowing(userId: string, targetUserId: string): Promise<boolean> {
  const db = getFirestoreDb();
  if (db) return isFollowingFirestore(userId, targetUserId);
  return false;
}

export async function getFollowers(userId: string): Promise<UserRecord[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const ids = await getFollowerIds(userId);
  const users = await Promise.all(ids.map((id) => getFirestoreUser(id)));
  return users.filter(Boolean).map((u) => firestoreToUser(u!));
}

export async function getFollowing(userId: string): Promise<UserRecord[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const ids = await getFollowingIds(userId);
  const users = await Promise.all(ids.map((id) => getFirestoreUser(id)));
  return users.filter(Boolean).map((u) => firestoreToUser(u!));
}

export async function blockUser(userId: string, targetUserId: string): Promise<void> {
  await unfollowUser(userId, targetUserId);
  await unfollowUser(targetUserId, userId);
}

export async function reportUser(userId: string, targetUserId: string, reason: string): Promise<void> {
  // Report is added to the review queue by the caller (useReportBlock)
}

/** Use in app: current signed-in user id, or fallback for compatibility. */
export function getCurrentUserIdOrFallback(): string {
  return getCurrentUserId() ?? '1';
}
