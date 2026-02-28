import { getCurrentUserIdOrFallback } from '@/lib/api/users';
import { Badge, BadgeLevel, BadgeThresholds, BADGE_THRESHOLDS, TIME_BASED_BADGES, PAID_BADGES, LIMITED_PAID_BADGES, METRIC_BADGE_INFO, getAllBadges } from '@/types/badges';
import { User } from '@/types/post';

interface BadgeTestingState {
  supporter?: boolean;
  contributor?: boolean;
  'member-plus'?: boolean;
  vip?: boolean;
  elite?: boolean;
  'level-ii'?: boolean;
  'level-iii'?: boolean;
  'day-one'?: boolean;
  'beta-tester'?: boolean;
  early?: boolean;
}

function getBadgeTestingState(): BadgeTestingState {
  return {};
}

export interface UserMetrics {
  followers: number;
  comments: number;
  posts: number;
  totalEngagement: number; // likes + replies + saves
  joinDate: string;
  isBetaTester: boolean;
  isDayOne: boolean;
  isEarly: boolean;
  subscriptionTier?: 'pro' | 'premium' | 'pro-plus' | 'supporter' | 'contributor' | 'member-plus' | 'vip' | 'elite' | 'investor' | 'whale';
  limitedTier?: 'level-ii' | 'level-iii';
  activeDays: number;
  consecutiveActiveDays: number;
  lastActiveDate: string;
}

export interface CalculatedBadges {
  badges: Array<{ badge: Badge; earnedAt: string; level?: BadgeLevel }>;
  activeStatus: boolean;
  activeStreak: number;
}

export async function calculateBadges(user: User, metrics: UserMetrics): Promise<CalculatedBadges> {
  const badges: Array<{ badge: Badge; earnedAt: string; level?: BadgeLevel }> = [];
  const now = new Date();
  const joinDate = new Date(metrics.joinDate);
  const daysSinceJoin = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
  const yearsActive = daysSinceJoin / 365;
  
  const testingState = getBadgeTestingState();
  const isOwner = user.id === getCurrentUserIdOrFallback() || user.id === '1';
  
  if (isOwner) {
    // Give owner all badges (filtered by testing state)
    return getAllBadgesForOwner(metrics, testingState);
  }

  // Time-based badges (day-one, beta-tester, early are now handled below with testing state)

  // Active status (consistent usage) - lowered threshold to 1 day for testing
  const isActive = metrics.consecutiveActiveDays >= 1 || metrics.activeDays >= 1;
  if (isActive) {
    badges.push({
      badge: { ...TIME_BASED_BADGES['active'], id: 'active' } as Badge,
      earnedAt: new Date().toISOString(),
    });
  }

  // Day milestones
  if (metrics.activeDays >= 30) {
    badges.push({
      badge: { ...TIME_BASED_BADGES['30-days'], id: '30-days' } as Badge,
      earnedAt: new Date(Date.now() - (metrics.activeDays - 30) * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  if (metrics.activeDays >= 90) {
    badges.push({
      badge: { ...TIME_BASED_BADGES['90-days'], id: '90-days' } as Badge,
      earnedAt: new Date(Date.now() - (metrics.activeDays - 90) * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  if (metrics.activeDays >= 180) {
    badges.push({
      badge: { ...TIME_BASED_BADGES['180-days'], id: '180-days' } as Badge,
      earnedAt: new Date(Date.now() - (metrics.activeDays - 180) * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // Veteran (1+ year)
  if (yearsActive >= 1) {
    badges.push({
      badge: { ...TIME_BASED_BADGES['veteran'], id: 'veteran' } as Badge,
      earnedAt: new Date(joinDate.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // Legacy (2+ years)
  if (yearsActive >= 2) {
    badges.push({
      badge: { ...TIME_BASED_BADGES['legacy'], id: 'legacy' } as Badge,
      earnedAt: new Date(joinDate.getTime() + 730 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // Paid badges (check testing state)
  if (metrics.subscriptionTier) {
    const paidBadgeMap: Record<string, keyof typeof PAID_BADGES> = {
      'supporter': 'supporter',
      'contributor': 'contributor',
      'member-plus': 'member-plus',
      'vip': 'vip',
      'elite': 'elite',
      'investor': 'investor',
      'whale': 'whale',
    };

    const badgeKey = paidBadgeMap[metrics.subscriptionTier];
    if (badgeKey) {
      const badgeId = badgeKey as keyof BadgeTestingState;
      // If testing state exists and badge is explicitly disabled, skip it
      if (Object.keys(testingState).length > 0 && testingState[badgeId] === false) {
        // Skip this badge
      } else {
        // If testing state is empty or badge is enabled, add it
        badges.push({
          badge: { ...PAID_BADGES[badgeKey], id: badgeKey } as Badge,
          earnedAt: new Date().toISOString(),
        });
      }
    }
  }

  // Limited paid badges (check testing state)
  if (metrics.limitedTier) {
    const limitedBadgeMap: Record<string, keyof typeof LIMITED_PAID_BADGES> = {
      'level-ii': 'level-ii',
      'level-iii': 'level-iii',
    };

    const badgeKey = limitedBadgeMap[metrics.limitedTier];
    if (badgeKey) {
      const badgeId = badgeKey as keyof BadgeTestingState;
      // If testing state exists and badge is explicitly disabled, skip it
      if (Object.keys(testingState).length > 0 && testingState[badgeId] === false) {
        // Skip this badge
      } else {
        // If testing state is empty or badge is enabled, add it
        badges.push({
          badge: { ...LIMITED_PAID_BADGES[badgeKey], id: badgeKey } as Badge,
          earnedAt: new Date().toISOString(),
        });
      }
    }
  }

  // Also check for day-one, beta-tester, early badges (check testing state)
  if (metrics.isDayOne) {
    const badgeId = 'day-one' as keyof BadgeTestingState;
    if (Object.keys(testingState).length === 0 || testingState[badgeId] === true) {
      badges.push({
        badge: { ...LIMITED_PAID_BADGES['day-one'], id: 'day-one' } as Badge,
        earnedAt: metrics.joinDate,
      });
    }
  }

  if (metrics.isBetaTester) {
    const badgeId = 'beta-tester' as keyof BadgeTestingState;
    if (Object.keys(testingState).length === 0 || testingState[badgeId] === true) {
      badges.push({
        badge: { ...LIMITED_PAID_BADGES['beta-tester'], id: 'beta-tester' } as Badge,
        earnedAt: metrics.joinDate,
      });
    }
  }

  if (metrics.isEarly && daysSinceJoin <= 30) {
    const badgeId = 'early' as keyof BadgeTestingState;
    if (Object.keys(testingState).length === 0 || testingState[badgeId] === true) {
      badges.push({
        badge: { ...LIMITED_PAID_BADGES['early'], id: 'early' } as Badge,
        earnedAt: metrics.joinDate,
      });
    }
  }

  // Metric-based badges
  const metricBadges = calculateMetricBadges(metrics);
  badges.push(...metricBadges);

  return {
    badges: badges.sort((a, b) => {
      // Sort by rarity (legendary first)
      const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
      return rarityOrder[a.badge.rarity] - rarityOrder[b.badge.rarity];
    }),
    activeStatus: isActive,
    activeStreak: metrics.consecutiveActiveDays,
  };
}

/**
 * Get all badges for owner
 */
function getAllBadgesForOwner(metrics: UserMetrics, testingState: BadgeTestingState = {}): CalculatedBadges {
  const badges: Array<{ badge: Badge; earnedAt: string; level?: BadgeLevel }> = [];
  const now = new Date();
  const addedIds = new Set<string>();
  
  // Add all time-based badges (excluding day-one, beta-tester, early which are now limited)
  Object.keys(TIME_BASED_BADGES).forEach((key) => {
    if (key !== 'day-one' && key !== 'beta-tester' && key !== 'early') {
      badges.push({
        badge: { ...TIME_BASED_BADGES[key as keyof typeof TIME_BASED_BADGES], id: key } as Badge,
        earnedAt: metrics.joinDate,
      });
      addedIds.add(key);
    }
  });
  
  // Add paid badges (only if enabled in testing state, or if testing state is empty)
  Object.keys(PAID_BADGES).forEach((key) => {
    const badgeKey = key as keyof BadgeTestingState;
    // If testing state exists and badge is explicitly disabled, skip it
    if (Object.keys(testingState).length > 0 && testingState[badgeKey] === false) {
      return;
    }
    // If testing state exists and badge is enabled, or if testing state is empty, add it
    if (Object.keys(testingState).length === 0 || testingState[badgeKey] === true) {
      badges.push({
        badge: { ...PAID_BADGES[key as keyof typeof PAID_BADGES], id: key } as Badge,
        earnedAt: now.toISOString(),
      });
      addedIds.add(key);
    }
  });
  
  // Add limited paid badges (only if enabled in testing state, or if testing state is empty)
  Object.keys(LIMITED_PAID_BADGES).forEach((key) => {
    if (!addedIds.has(key)) {
      const badgeKey = key as keyof BadgeTestingState;
      // If testing state exists and badge is explicitly disabled, skip it
      if (Object.keys(testingState).length > 0 && testingState[badgeKey] === false) {
        return;
      }
      // If testing state exists and badge is enabled, or if testing state is empty, add it
      if (Object.keys(testingState).length === 0 || testingState[badgeKey] === true) {
        badges.push({
          badge: { ...LIMITED_PAID_BADGES[key as keyof typeof LIMITED_PAID_BADGES], id: key } as Badge,
          earnedAt: metrics.joinDate,
        });
        addedIds.add(key);
      }
    }
  });
  
  // Add all metric badges at max level (V)
  Object.keys(METRIC_BADGE_INFO).forEach((metricName) => {
    const badgeInfo = METRIC_BADGE_INFO[metricName as keyof typeof METRIC_BADGE_INFO];
    const badgeId = `${metricName}-V`;
    badges.push({
      badge: {
        ...badgeInfo,
        id: badgeId,
        level: 'V',
        displayName: `${badgeInfo.displayName} V`,
      } as Badge,
      earnedAt: now.toISOString(),
      level: 'V',
    });
    addedIds.add(badgeId);
  });
  
  return {
    badges: badges.sort((a, b) => {
      // Sort by rarity (legendary first)
      const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
      return rarityOrder[a.badge.rarity] - rarityOrder[b.badge.rarity];
    }),
    activeStatus: true,
    activeStreak: 999,
  };
}

function calculateMetricBadges(metrics: UserMetrics): Array<{ badge: Badge; earnedAt: string; level: BadgeLevel }> {
  const badges: Array<{ badge: Badge; earnedAt: string; level: BadgeLevel }> = [];

  // Calculate Reach badge
  const reachLevel = calculateLevel(metrics.followers, BADGE_THRESHOLDS.reach);
  if (reachLevel) {
    badges.push({
      badge: {
        ...METRIC_BADGE_INFO.reach,
        id: `reach-${reachLevel}`,
        level: reachLevel,
        displayName: `Reach ${reachLevel}`,
      } as Badge,
      earnedAt: new Date().toISOString(),
      level: reachLevel,
    });
  }

  // Calculate Voice badge
  const voiceLevel = calculateLevel(metrics.comments, BADGE_THRESHOLDS.voice);
  if (voiceLevel) {
    badges.push({
      badge: {
        ...METRIC_BADGE_INFO.voice,
        id: `voice-${voiceLevel}`,
        level: voiceLevel,
        displayName: `Voice ${voiceLevel}`,
      } as Badge,
      earnedAt: new Date().toISOString(),
      level: voiceLevel,
    });
  }

  // Calculate Presence badge
  const presenceLevel = calculateLevel(metrics.posts, BADGE_THRESHOLDS.presence);
  if (presenceLevel) {
    badges.push({
      badge: {
        ...METRIC_BADGE_INFO.presence,
        id: `presence-${presenceLevel}`,
        level: presenceLevel,
        displayName: `Presence ${presenceLevel}`,
      } as Badge,
      earnedAt: new Date().toISOString(),
      level: presenceLevel,
    });
  }

  // Calculate Impact badge
  const impactLevel = calculateLevel(metrics.totalEngagement, BADGE_THRESHOLDS.impact);
  if (impactLevel) {
    badges.push({
      badge: {
        ...METRIC_BADGE_INFO.impact,
        id: `impact-${impactLevel}`,
        level: impactLevel,
        displayName: `Impact ${impactLevel}`,
      } as Badge,
      earnedAt: new Date().toISOString(),
      level: impactLevel,
    });
  }

  return badges;
}

function calculateLevel(value: number, thresholds: BadgeThresholds['reach']): BadgeLevel | null {
  if (value >= thresholds.V) return 'V';
  if (value >= thresholds.IV) return 'IV';
  if (value >= thresholds.III) return 'III';
  if (value >= thresholds.II) return 'II';
  if (value >= thresholds.I) return 'I';
  return null;
}

// Active status calculation
export function isActiveToday(lastActiveDate: string): boolean {
  const today = new Date();
  const lastActive = new Date(lastActiveDate);
  
  // Check if last active was today
  return (
    today.getFullYear() === lastActive.getFullYear() &&
    today.getMonth() === lastActive.getMonth() &&
    today.getDate() === lastActive.getDate()
  );
}

export function calculateActiveStreak(
  activityDates: string[], // Array of dates when user was active
  graceDays: number = 1, // Grace days per 14 days
  gracePeriod: number = 14 // Days in grace period
): number {
  if (activityDates.length === 0) return 0;

  const sortedDates = activityDates
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  let graceDaysUsed = 0;
  let daysInPeriod = 0;

  for (let i = 0; i < sortedDates.length; i++) {
    const activeDate = new Date(sortedDates[i]);
    activeDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((currentDate.getTime() - activeDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Active today
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
      daysInPeriod++;
    } else if (daysDiff === 1) {
      // Active yesterday, continue streak
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
      daysInPeriod++;
    } else if (daysDiff > 1) {
      // Gap in activity
      if (daysInPeriod >= gracePeriod) {
        graceDaysUsed = 0;
        daysInPeriod = 0;
      }

      if (graceDaysUsed < graceDays && daysDiff <= graceDays + 1) {
        // Use grace day
        graceDaysUsed++;
        streak++;
        currentDate = new Date(activeDate);
        currentDate.setDate(currentDate.getDate() - 1);
        daysInPeriod++;
      } else {
        // Streak broken
        break;
      }
    }
  }

  return streak;
}


