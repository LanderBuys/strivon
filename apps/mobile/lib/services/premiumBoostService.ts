import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSubscriptionTier, getSubscriptionFeatures } from './subscriptionService';

const PREMIUM_BOOST_CREDITS_KEY = '@strivon_premium_boost_credits';
const PREMIUM_BOOST_MONTH_KEY = '@strivon_premium_boost_month';
const PREMIUM_BOOST_HISTORY_KEY = '@strivon_premium_boost_history';

export interface PremiumBoostResult {
  postId: string;
  timestamp: string;
  reachImprovement: number; // Percentage
  boostType: 'pro' | 'premium';
  duration: number; // Hours
}

export interface PremiumBoostHistory {
  boosts: PremiumBoostResult[];
}

/**
 * Get current month as YYYY-MM string
 */
function getCurrentMonthString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Reset monthly credits if it's a new month
 */
async function resetMonthlyCreditsIfNeeded(): Promise<void> {
  const lastMonth = await AsyncStorage.getItem(PREMIUM_BOOST_MONTH_KEY);
  const currentMonth = getCurrentMonthString();
  
  if (lastMonth !== currentMonth) {
    await AsyncStorage.setItem(PREMIUM_BOOST_MONTH_KEY, currentMonth);
    // Reset credits based on subscription tier
    const tier = await getSubscriptionTier();
    const features = await getSubscriptionFeatures();
    await AsyncStorage.setItem(PREMIUM_BOOST_CREDITS_KEY, features.maxBoostCredits.toString());
  }
}

/**
 * Get remaining premium boost credits for current month
 */
export async function getRemainingBoostCredits(): Promise<number> {
  await resetMonthlyCreditsIfNeeded();
  const credits = await AsyncStorage.getItem(PREMIUM_BOOST_CREDITS_KEY);
  return credits ? parseInt(credits, 10) : 0;
}

/**
 * Check if user can use a premium boost
 */
export async function canUsePremiumBoost(): Promise<boolean> {
  const tier = await getSubscriptionTier();
  if (tier === 'free') {
    return false;
  }

  const remaining = await getRemainingBoostCredits();
  return remaining > 0;
}

/**
 * Apply a premium boost to a post
 */
export async function applyPremiumBoost(postId: string, baseReach: number): Promise<PremiumBoostResult> {
  const tier = await getSubscriptionTier();
  if (tier === 'free') {
    throw new Error('Premium boosts are only available for Pro and Premium subscribers');
  }

  await resetMonthlyCreditsIfNeeded();
  const remaining = await getRemainingBoostCredits();
  
  if (remaining <= 0) {
    throw new Error('No premium boost credits remaining this month');
  }

  // Decrement credits
  await AsyncStorage.setItem(PREMIUM_BOOST_CREDITS_KEY, (remaining - 1).toString());

  // Get subscription features for boost parameters
  const features = await getSubscriptionFeatures();
  
  // Calculate reach improvement (25% for Pro, 30% for Premium)
  const improvement = tier === 'premium' ? 30 : 25;

  const boostResult: PremiumBoostResult = {
    postId,
    timestamp: new Date().toISOString(),
    reachImprovement: improvement,
    boostType: tier === 'premium' ? 'premium' : 'pro',
    duration: features.boostDuration, // 24h for Pro, 48h for Premium
  };

  // Save to history
  await saveBoostToHistory(boostResult);

  return boostResult;
}

/**
 * Save boost to history
 */
async function saveBoostToHistory(boost: PremiumBoostResult): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(PREMIUM_BOOST_HISTORY_KEY);
    const history: PremiumBoostHistory = stored ? JSON.parse(stored) : { boosts: [] };
    history.boosts.unshift(boost);
    // Keep only last 100 boosts
    if (history.boosts.length > 100) {
      history.boosts = history.boosts.slice(0, 100);
    }
    await AsyncStorage.setItem(PREMIUM_BOOST_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving boost history:', error);
  }
}

/**
 * Get boost history
 */
export async function getBoostHistory(): Promise<PremiumBoostResult[]> {
  try {
    const stored = await AsyncStorage.getItem(PREMIUM_BOOST_HISTORY_KEY);
    if (stored) {
      const history: PremiumBoostHistory = JSON.parse(stored);
      return history.boosts;
    }
    return [];
  } catch (error) {
    console.error('Error loading boost history:', error);
    return [];
  }
}

/**
 * Check if a post is currently premium boosted
 */
export async function isPostPremiumBoosted(postId: string): Promise<boolean> {
  try {
    const history = await getBoostHistory();
    const boost = history.find(b => b.postId === postId);
    if (!boost) return false;
    
    // Check if boost is still active (within duration)
    const boostTime = new Date(boost.timestamp).getTime();
    const now = Date.now();
    const hoursElapsed = (now - boostTime) / (1000 * 60 * 60);
    
    return hoursElapsed < boost.duration;
  } catch (error) {
    console.error('Error checking premium boost status:', error);
    return false;
  }
}
