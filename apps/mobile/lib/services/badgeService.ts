import { Badge } from '@/types/badges';
import { User } from '@/types/post';
import { calculateBadges, UserMetrics } from '@/lib/badges/badgeCalculator';
import { getUserMetrics, syncActivityMetrics } from './userMetricsService';

/**
 * Get calculated badges for a user
 */
export async function getUserBadges(user: User): Promise<{
  badges: Array<{ badge: Badge; earnedAt: string; level?: string }>;
  activeStatus: boolean;
  activeStreak: number;
}> {
  try {
    // Sync activity metrics first
    await syncActivityMetrics();
    
    // Get user metrics
    const metrics = await getUserMetrics();
    
    // Calculate badges (now async)
    const result = await calculateBadges(user, metrics);
    
    // Remove duplicate badges by id
    const seenIds = new Set<string>();
    const uniqueBadges = result.badges.filter(({ badge }) => {
      if (seenIds.has(badge.id)) {
        return false;
      }
      seenIds.add(badge.id);
      return true;
    });
    
    return {
      ...result,
      badges: uniqueBadges,
    };
  } catch (error) {
    return {
      badges: [],
      activeStatus: false,
      activeStreak: 0,
    };
  }
}

/**
 * Get just the badge objects (for display)
 */
export async function getUserBadgeObjects(user: User): Promise<Badge[]> {
  const { badges } = await getUserBadges(user);
  return badges.map(b => b.badge);
}

