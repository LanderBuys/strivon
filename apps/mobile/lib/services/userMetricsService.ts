import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types/post';

const METRICS_KEY = '@strivon_user_metrics';
const JOIN_DATE_KEY = '@strivon_join_date';

export interface UserMetrics {
  followers: number;
  comments: number;
  posts: number;
  totalEngagement: number; // likes + replies + saves
  joinDate: string;
  isBetaTester: boolean;
  isDayOne: boolean;
  isEarly: boolean;
  subscriptionTier?: 'pro' | 'pro-plus' | 'supporter' | 'contributor' | 'member-plus' | 'vip' | 'elite' | 'investor' | 'whale';
  limitedTier?: 'level-ii' | 'level-iii';
  activeDays: number;
  consecutiveActiveDays: number;
  lastActiveDate: string;
}

const DEFAULT_METRICS: UserMetrics = {
  followers: 0,
  comments: 0,
  posts: 0,
  totalEngagement: 0,
  joinDate: new Date().toISOString(),
  isBetaTester: false,
  isDayOne: false,
  isEarly: false,
  activeDays: 0,
  consecutiveActiveDays: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
};

/**
 * Initialize user metrics if not exists
 */
export async function initializeUserMetrics(): Promise<UserMetrics> {
  try {
    const stored = await AsyncStorage.getItem(METRICS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    // Check if join date exists
    let joinDate = await AsyncStorage.getItem(JOIN_DATE_KEY);
    if (!joinDate) {
      joinDate = new Date().toISOString();
      await AsyncStorage.setItem(JOIN_DATE_KEY, joinDate);
      
      // Check if user is early (joined within first 30 days of app launch)
      const appLaunchDate = new Date('2024-01-01'); // Adjust to actual launch date
      const daysSinceLaunch = Math.floor((new Date(joinDate).getTime() - appLaunchDate.getTime()) / (1000 * 60 * 60 * 24));
      DEFAULT_METRICS.isEarly = daysSinceLaunch <= 30;
      DEFAULT_METRICS.isDayOne = daysSinceLaunch === 0;
      DEFAULT_METRICS.isBetaTester = daysSinceLaunch < 0; // Before launch
    }

    // Initialize with some starter values to ensure badges show up
    const metrics = { 
      ...DEFAULT_METRICS, 
      joinDate,
      // Give some starter metrics so users see badges
      followers: 0,
      posts: 0,
      comments: 0,
      totalEngagement: 0,
    };
    await AsyncStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
    return metrics;
  } catch (error) {
    return { ...DEFAULT_METRICS, joinDate: new Date().toISOString() };
  }
}

/**
 * Get user metrics
 */
export async function getUserMetrics(): Promise<UserMetrics> {
  try {
    const stored = await AsyncStorage.getItem(METRICS_KEY);
    if (!stored) {
      return await initializeUserMetrics();
    }
    return JSON.parse(stored);
  } catch (error) {
    return await initializeUserMetrics();
  }
}

/**
 * Update user metrics
 */
export async function updateUserMetrics(updates: Partial<UserMetrics>): Promise<UserMetrics> {
  try {
    const current = await getUserMetrics();
    const updated = { ...current, ...updates };
    await AsyncStorage.setItem(METRICS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    return await getUserMetrics();
  }
}

/**
 * Increment follower count
 */
export async function incrementFollowers(count: number = 1): Promise<void> {
  const metrics = await getUserMetrics();
  await updateUserMetrics({ followers: metrics.followers + count });
}

/**
 * Increment post count
 */
export async function incrementPosts(count: number = 1): Promise<void> {
  const metrics = await getUserMetrics();
  await updateUserMetrics({ posts: metrics.posts + count });
}

/**
 * Increment comment count
 */
export async function incrementComments(count: number = 1): Promise<void> {
  const metrics = await getUserMetrics();
  await updateUserMetrics({ comments: metrics.comments + count });
}

/**
 * Increment engagement (likes, replies, saves)
 */
export async function incrementEngagement(count: number = 1): Promise<void> {
  const metrics = await getUserMetrics();
  await updateUserMetrics({ totalEngagement: metrics.totalEngagement + count });
}

/**
 * Update subscription tier
 */
export async function updateSubscriptionTier(tier?: UserMetrics['subscriptionTier']): Promise<void> {
  await updateUserMetrics({ subscriptionTier: tier });
}

/**
 * Update limited tier
 */
export async function updateLimitedTier(tier?: UserMetrics['limitedTier']): Promise<void> {
  await updateUserMetrics({ limitedTier: tier });
}

/**
 * Sync metrics with activity service
 */
export async function syncActivityMetrics(): Promise<void> {
  const { getTotalActiveDays, getConsecutiveActiveDays, getLastActiveDate } = await import('./activityService');
  
  const activeDays = await getTotalActiveDays();
  const consecutiveDays = await getConsecutiveActiveDays();
  const lastActive = await getLastActiveDate();
  
  // If user has no activity, give them at least 1 active day for today
  const finalActiveDays = activeDays > 0 ? activeDays : 1;
  const finalConsecutiveDays = consecutiveDays > 0 ? consecutiveDays : 1;
  
  await updateUserMetrics({
    activeDays: finalActiveDays,
    consecutiveActiveDays: finalConsecutiveDays,
    lastActiveDate: lastActive || new Date().toISOString().split('T')[0],
  });
}

