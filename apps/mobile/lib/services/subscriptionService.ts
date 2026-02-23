import { getUserMetrics } from './userMetricsService';

export type SubscriptionTier = 'free' | 'pro' | 'pro-plus';

export interface SubscriptionFeatures {
  canSchedulePosts: boolean;
  canPinPosts: boolean;
  maxPinnedPosts: number;
  canUseAdvancedAnalytics: boolean;
  canUseUnlimitedDrafts: boolean;
  canUseAdvancedProfileCustomization: boolean;
  maxBoostCredits: number;
  boostDuration: number; // hours
  canUsePriorityPlacement: boolean;
  maxMediaItems: number;
  maxVideoDuration: number; // seconds
  maxSpaces: number; // 5 for free, -1 for unlimited
  canCreatePrivateSpaces: boolean;
  maxStoriesPerDay: number; // 1 for free, -1 for unlimited
  storyExpirationHours: number; // 24/48/168
  maxConversations: number; // 5 for free, -1 for unlimited
  maxGroupChatMembers: number; // 0 for free, 50 for Pro, 500 for Pro+
  maxDrafts: number; // 1 for free, -1 for unlimited
  canUseAdvancedSearch: boolean;
}

/** Display name for the top tier (matches web pricing: "Premium") */
export const PREMIUM_TIER_DISPLAY_NAME = 'Premium';

/**
 * Get current subscription tier
 */
export async function getSubscriptionTier(): Promise<SubscriptionTier> {
  const metrics = await getUserMetrics();
  if (metrics.subscriptionTier === 'pro') return 'pro';
  if (metrics.subscriptionTier === 'pro-plus') return 'pro-plus';
  return 'free';
}

/**
 * Get subscription features based on tier
 */
export async function getSubscriptionFeatures(): Promise<SubscriptionFeatures> {
  const tier = await getSubscriptionTier();
  
  switch (tier) {
    case 'pro-plus':
      return {
        canSchedulePosts: true,
        canPinPosts: true,
        maxPinnedPosts: 5,
        canUseAdvancedAnalytics: true,
        canUseUnlimitedDrafts: true,
        canUseAdvancedProfileCustomization: true,
        maxBoostCredits: 25,
        boostDuration: 48,
        canUsePriorityPlacement: true,
        maxMediaItems: 20,
        maxVideoDuration: -1, // unlimited
        maxSpaces: -1, // unlimited
        canCreatePrivateSpaces: true,
        maxStoriesPerDay: -1, // unlimited
        storyExpirationHours: 168, // 7 days
        maxConversations: -1, // unlimited
        maxGroupChatMembers: 500,
        maxDrafts: -1, // unlimited
        canUseAdvancedSearch: true,
      };
    
    case 'pro':
      return {
        canSchedulePosts: true,
        canPinPosts: true,
        maxPinnedPosts: 3,
        canUseAdvancedAnalytics: true,
        canUseUnlimitedDrafts: true,
        canUseAdvancedProfileCustomization: true,
        maxBoostCredits: 10,
        boostDuration: 24,
        canUsePriorityPlacement: false,
        maxMediaItems: 10,
        maxVideoDuration: -1, // unlimited
        maxSpaces: -1, // unlimited
        canCreatePrivateSpaces: true,
        maxStoriesPerDay: -1, // unlimited
        storyExpirationHours: 48, // 2 days
        maxConversations: -1, // unlimited
        maxGroupChatMembers: 50,
        maxDrafts: -1, // unlimited
        canUseAdvancedSearch: true,
      };
    
    case 'free':
    default:
      return {
        canSchedulePosts: false,
        canPinPosts: false,
        maxPinnedPosts: 0,
        canUseAdvancedAnalytics: false,
        canUseUnlimitedDrafts: false,
        canUseAdvancedProfileCustomization: false,
        maxBoostCredits: 0,
        boostDuration: 0,
        canUsePriorityPlacement: false,
        maxMediaItems: 5,
        maxVideoDuration: -1, // unlimited
        maxSpaces: 5,
        canCreatePrivateSpaces: false,
        maxStoriesPerDay: 1,
        storyExpirationHours: 24, // 1 day
        maxConversations: 5,
        maxGroupChatMembers: 0, // No group chats
        maxDrafts: 1,
        canUseAdvancedSearch: false,
      };
  }
}

/**
 * Check if user can schedule posts
 */
export async function canSchedulePosts(): Promise<boolean> {
  const features = await getSubscriptionFeatures();
  return features.canSchedulePosts;
}

/**
 * Check if user can pin posts
 */
export async function canPinPosts(): Promise<boolean> {
  const features = await getSubscriptionFeatures();
  return features.canPinPosts;
}

/**
 * Get max number of posts user can pin
 */
export async function getMaxPinnedPosts(): Promise<number> {
  const features = await getSubscriptionFeatures();
  return features.maxPinnedPosts;
}

/**
 * Check if user can use advanced analytics
 */
export async function canUseAdvancedAnalytics(): Promise<boolean> {
  const features = await getSubscriptionFeatures();
  return features.canUseAdvancedAnalytics;
}

/**
 * Check if user can use unlimited drafts
 */
export async function canUseUnlimitedDrafts(): Promise<boolean> {
  const features = await getSubscriptionFeatures();
  return features.canUseUnlimitedDrafts;
}

/**
 * Check if user can use advanced profile customization
 */
export async function canUseAdvancedProfileCustomization(): Promise<boolean> {
  const features = await getSubscriptionFeatures();
  return features.canUseAdvancedProfileCustomization;
}

/**
 * Get max number of media items per post
 */
export async function getMaxMediaItems(): Promise<number> {
  const features = await getSubscriptionFeatures();
  return features.maxMediaItems;
}

/**
 * Get max video duration in seconds
 */
export async function getMaxVideoDuration(): Promise<number> {
  const features = await getSubscriptionFeatures();
  return features.maxVideoDuration;
}

/**
 * Get max number of spaces user can join (-1 for unlimited)
 */
export async function getMaxSpaces(): Promise<number> {
  const features = await getSubscriptionFeatures();
  return features.maxSpaces;
}

/**
 * Check if user can create private spaces
 */
export async function canCreatePrivateSpaces(): Promise<boolean> {
  const features = await getSubscriptionFeatures();
  return features.canCreatePrivateSpaces;
}

/**
 * Get max stories per day (-1 for unlimited)
 */
export async function getMaxStoriesPerDay(): Promise<number> {
  const features = await getSubscriptionFeatures();
  return features.maxStoriesPerDay;
}

/**
 * Get story expiration hours
 */
export async function getStoryExpirationHours(): Promise<number> {
  const features = await getSubscriptionFeatures();
  return features.storyExpirationHours;
}

/**
 * Get max number of conversations (-1 for unlimited)
 */
export async function getMaxConversations(): Promise<number> {
  const features = await getSubscriptionFeatures();
  return features.maxConversations;
}

/**
 * Get max group chat members (0 means no group chats allowed)
 */
export async function getMaxGroupChatMembers(): Promise<number> {
  const features = await getSubscriptionFeatures();
  return features.maxGroupChatMembers;
}

/**
 * Get max number of drafts (-1 for unlimited)
 */
export async function getMaxDrafts(): Promise<number> {
  const features = await getSubscriptionFeatures();
  return features.maxDrafts;
}

/**
 * Check if user can use advanced search
 */
export async function canUseAdvancedSearch(): Promise<boolean> {
  const features = await getSubscriptionFeatures();
  return features.canUseAdvancedSearch;
}
