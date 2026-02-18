export type BadgeType = 
  | 'time-based'
  | 'paid'
  | 'limited-paid'
  | 'metric-based';

export type TimeBasedBadge = 
  | 'active'
  | 'veteran'
  | 'early'
  | 'beta-tester'
  | 'day-one'
  | '30-days'
  | '90-days'
  | '180-days'
  | 'legacy';

export type PaidBadge = 
  | 'supporter'
  | 'contributor'
  | 'member-plus'
  | 'vip'
  | 'elite'
  | 'investor'
  | 'whale';

export type LimitedPaidBadge = 
  | 'level-ii'
  | 'level-iii'
  | 'day-one'
  | 'beta-tester'
  | 'early';

export type MetricBadgeName = 
  | 'reach'
  | 'voice'
  | 'presence'
  | 'impact';

export type BadgeLevel = 'I' | 'II' | 'III' | 'IV' | 'V';

export interface Badge {
  id: string;
  type: BadgeType;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  level?: BadgeLevel;
  category: 'time' | 'paid' | 'limited' | 'metric';
}

export interface UserBadge {
  badgeId: string;
  earnedAt: string;
  level?: BadgeLevel;
}

export interface BadgeThresholds {
  reach: { [key in BadgeLevel]: number };
  voice: { [key in BadgeLevel]: number };
  presence: { [key in BadgeLevel]: number };
  impact: { [key in BadgeLevel]: number };
}

export const BADGE_THRESHOLDS: BadgeThresholds = {
  reach: {
    I: 100,
    II: 1000,
    III: 10000,
    IV: 50000,
    V: 100000,
  },
  voice: {
    I: 50,
    II: 250,
    III: 1000,
    IV: 5000,
    V: 10000,
  },
  presence: {
    I: 10,
    II: 50,
    III: 200,
    IV: 500,
    V: 1000,
  },
  impact: {
    I: 100, // Total engagement
    II: 1000,
    III: 10000,
    IV: 50000,
    V: 100000,
  },
};

export const TIME_BASED_BADGES: Record<TimeBasedBadge, Omit<Badge, 'id'>> = {
  'active': {
    type: 'time-based',
    name: 'active',
    displayName: 'Active',
    description: 'Consistent app usage',
    icon: 'flash',
    color: '#10B981',
    rarity: 'common',
    category: 'time',
  },
  'veteran': {
    type: 'time-based',
    name: 'veteran',
    displayName: 'Veteran',
    description: '1+ year active',
    icon: 'shield-checkmark',
    color: '#3B82F6',
    rarity: 'rare',
    category: 'time',
  },
  'early': {
    type: 'limited-paid',
    name: 'early',
    displayName: 'Early',
    description: 'Joined early',
    icon: 'rocket',
    color: '#8B5CF6',
    rarity: 'epic',
    category: 'limited',
  },
  'beta-tester': {
    type: 'limited-paid',
    name: 'beta-tester',
    displayName: 'Beta Tester',
    description: 'Used Strivon during beta phase',
    icon: 'flask',
    color: '#EC4899',
    rarity: 'epic',
    category: 'limited',
  },
  'day-one': {
    type: 'limited-paid',
    name: 'day-one',
    displayName: 'Day One',
    description: 'Joined on day one',
    icon: 'star',
    color: '#F59E0B',
    rarity: 'legendary',
    category: 'limited',
  },
  '30-days': {
    type: 'time-based',
    name: '30-days',
    displayName: '30 Days',
    description: '30 days of activity',
    icon: 'calendar',
    color: '#10B981',
    rarity: 'common',
    category: 'time',
  },
  '90-days': {
    type: 'time-based',
    name: '90-days',
    displayName: '90 Days',
    description: '90 days of activity',
    icon: 'calendar',
    color: '#3B82F6',
    rarity: 'uncommon',
    category: 'time',
  },
  '180-days': {
    type: 'time-based',
    name: '180-days',
    displayName: '180 Days',
    description: '180 days of activity',
    icon: 'calendar',
    color: '#8B5CF6',
    rarity: 'rare',
    category: 'time',
  },
  'legacy': {
    type: 'time-based',
    name: 'legacy',
    displayName: 'Legacy',
    description: '2+ years active',
    icon: 'trophy',
    color: '#F59E0B',
    rarity: 'legendary',
    category: 'time',
  },
};

export const PAID_BADGES: Record<PaidBadge, Omit<Badge, 'id'>> = {
  'supporter': {
    type: 'paid',
    name: 'supporter',
    displayName: 'Supporter',
    description: 'Thank you for supporting Strivon!',
    icon: 'heart',
    color: '#EC4899',
    rarity: 'uncommon',
    category: 'paid',
  },
  'contributor': {
    type: 'paid',
    name: 'contributor',
    displayName: 'Contributor',
    description: 'Thank you for supporting Strivon!',
    icon: 'hand-left',
    color: '#10B981',
    rarity: 'uncommon',
    category: 'paid',
  },
  'member-plus': {
    type: 'paid',
    name: 'member-plus',
    displayName: 'Member+',
    description: 'Thank you for supporting Strivon!',
    icon: 'star',
    color: '#3B82F6',
    rarity: 'rare',
    category: 'paid',
  },
  'vip': {
    type: 'paid',
    name: 'vip',
    displayName: 'VIP',
    description: 'Thank you for supporting Strivon!',
    icon: 'diamond',
    color: '#8B5CF6',
    rarity: 'epic',
    category: 'paid',
  },
  'elite': {
    type: 'paid',
    name: 'elite',
    displayName: 'Elite',
    description: 'Thank you for supporting Strivon!',
    icon: 'trophy',
    color: '#F59E0B',
    rarity: 'epic',
    category: 'paid',
  },
  'investor': {
    type: 'paid',
    name: 'investor',
    displayName: 'Investor',
    description: 'Thank you for supporting Strivon!',
    icon: 'trending-up',
    color: '#10B981',
    rarity: 'legendary',
    category: 'paid',
  },
  'whale': {
    type: 'paid',
    name: 'whale',
    displayName: 'Whale',
    description: 'Thank you for supporting Strivon!',
    icon: 'diamond',
    color: '#EC4899',
    rarity: 'legendary',
    category: 'paid',
  },
};

export const LIMITED_PAID_BADGES: Record<LimitedPaidBadge, Omit<Badge, 'id'>> = {
  'level-ii': {
    type: 'limited-paid',
    name: 'level-ii',
    displayName: 'Level II',
    description: 'Limited tier',
    icon: 'star',
    color: '#8B5CF6',
    rarity: 'epic',
    category: 'limited',
  },
  'level-iii': {
    type: 'limited-paid',
    name: 'level-iii',
    displayName: 'Level III',
    description: 'Ultra-limited tier',
    icon: 'star',
    color: '#F59E0B',
    rarity: 'legendary',
    category: 'limited',
  },
  'day-one': {
    type: 'limited-paid',
    name: 'day-one',
    displayName: 'Day One',
    description: 'Joined on day one',
    icon: 'star',
    color: '#F59E0B',
    rarity: 'legendary',
    category: 'limited',
  },
  'beta-tester': {
    type: 'limited-paid',
    name: 'beta-tester',
    displayName: 'Beta Tester',
    description: 'Used Strivon during beta phase',
    icon: 'flask',
    color: '#EC4899',
    rarity: 'epic',
    category: 'limited',
  },
  'early': {
    type: 'limited-paid',
    name: 'early',
    displayName: 'Early',
    description: 'Joined early',
    icon: 'rocket',
    color: '#8B5CF6',
    rarity: 'epic',
    category: 'limited',
  },
};

export const METRIC_BADGE_INFO: Record<MetricBadgeName, Omit<Badge, 'id' | 'level'>> = {
  'reach': {
    type: 'metric-based',
    name: 'reach',
    displayName: 'Reach',
    description: 'Based on follower count',
    icon: 'people',
    color: '#1D9BF0',
    rarity: 'common',
    category: 'metric',
  },
  'voice': {
    type: 'metric-based',
    name: 'voice',
    displayName: 'Voice',
    description: 'Based on comment count',
    icon: 'chatbubbles',
    color: '#10B981',
    rarity: 'common',
    category: 'metric',
  },
  'presence': {
    type: 'metric-based',
    name: 'presence',
    displayName: 'Presence',
    description: 'Based on post count',
    icon: 'document-text',
    color: '#8B5CF6',
    rarity: 'common',
    category: 'metric',
  },
  'impact': {
    type: 'metric-based',
    name: 'impact',
    displayName: 'Impact',
    description: 'Based on engagement (likes, replies, saves)',
    icon: 'flash',
    color: '#F59E0B',
    rarity: 'common',
    category: 'metric',
  },
};

export function getAllBadges(): Badge[] {
  const badges: Badge[] = [];
  
  // Time-based badges
  Object.entries(TIME_BASED_BADGES).forEach(([key, badge]) => {
    badges.push({ ...badge, id: key } as Badge);
  });
  
  // Paid badges
  Object.entries(PAID_BADGES).forEach(([key, badge]) => {
    badges.push({ ...badge, id: key } as Badge);
  });
  
  // Limited paid badges
  Object.entries(LIMITED_PAID_BADGES).forEach(([key, badge]) => {
    badges.push({ ...badge, id: key } as Badge);
  });
  
  // Metric badges (one per level)
  Object.entries(METRIC_BADGE_INFO).forEach(([metricName, badgeInfo]) => {
    (['I', 'II', 'III', 'IV', 'V'] as BadgeLevel[]).forEach((level) => {
      badges.push({
        ...badgeInfo,
        id: `${metricName}-${level}`,
        level,
        displayName: `${badgeInfo.displayName} ${level}`,
      } as Badge);
    });
  });
  
  return badges;
}


