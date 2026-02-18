import AsyncStorage from '@react-native-async-storage/async-storage';
import { blockUser as apiBlockUser } from '@/lib/api/users';

const BLOCKED_USERS_KEY = '@strivon_blocked_users';

export interface BlockedUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  blockedAt: string;
}

/**
 * Block a user
 */
export async function blockUser(
  userId: string,
  userName: string,
  userHandle: string,
  userAvatar?: string | null
): Promise<void> {
  try {
    // Get current blocked users
    const stored = await AsyncStorage.getItem(BLOCKED_USERS_KEY);
    const blockedUsers: BlockedUser[] = stored ? JSON.parse(stored) : [];

    // Check if already blocked
    if (blockedUsers.some(u => u.id === userId)) {
      throw new Error('User is already blocked');
    }

    // Add to blocked list
    const newBlockedUser: BlockedUser = {
      id: userId,
      name: userName,
      username: userHandle,
      avatar: userAvatar || undefined,
      blockedAt: new Date().toISOString(),
    };

    blockedUsers.push(newBlockedUser);
    await AsyncStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(blockedUsers));

    // Call API to block user (unfollow both ways)
    try {
      const currentUserId = await AsyncStorage.getItem('@strivon_user_id') || '1'; // Default to '1' for demo
      await apiBlockUser(currentUserId, userId);
    } catch (error) {
      console.error('Error calling block user API:', error);
      // Continue even if API call fails - local blocking still works
    }
  } catch (error) {
    console.error('Error blocking user:', error);
    throw error;
  }
}

/**
 * Unblock a user
 */
export async function unblockUser(userId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(BLOCKED_USERS_KEY);
    if (!stored) return;

    const blockedUsers: BlockedUser[] = JSON.parse(stored);
    const updated = blockedUsers.filter(u => u.id !== userId);
    await AsyncStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error unblocking user:', error);
    throw error;
  }
}

/**
 * Check if a user is blocked
 */
export async function isUserBlocked(userId: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(BLOCKED_USERS_KEY);
    if (!stored) return false;

    const blockedUsers: BlockedUser[] = JSON.parse(stored);
    return blockedUsers.some(u => u.id === userId);
  } catch (error) {
    console.error('Error checking if user is blocked:', error);
    return false;
  }
}

/**
 * Get all blocked users
 */
export async function getBlockedUsers(): Promise<BlockedUser[]> {
  try {
    const stored = await AsyncStorage.getItem(BLOCKED_USERS_KEY);
    if (!stored) return [];

    return JSON.parse(stored);
  } catch (error) {
    console.error('Error getting blocked users:', error);
    return [];
  }
}
