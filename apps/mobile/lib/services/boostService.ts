import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserMetrics } from './userMetricsService';

const REWARDED_BOOSTS_TODAY_KEY = '@strivon_rewarded_boosts_today';
const REWARDED_BOOSTS_DATE_KEY = '@strivon_rewarded_boosts_date';
const BOOST_HISTORY_KEY = '@strivon_boost_history';

export interface BoostResult {
  postId: string;
  timestamp: string;
  reachImprovement: number; // Percentage (e.g., 18 for 18%)
  boostType: 'rewarded' | 'pro' | 'premium';
  duration: number; // Hours (24 for free, 48 for pro+)
}

export interface BoostHistory {
  boosts: BoostResult[];
}

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Reset daily counter if it's a new day
 */
async function resetDailyCounterIfNeeded(): Promise<void> {
  const lastDate = await AsyncStorage.getItem(REWARDED_BOOSTS_DATE_KEY);
  const today = getTodayDateString();
  
  if (lastDate !== today) {
    await AsyncStorage.setItem(REWARDED_BOOSTS_DATE_KEY, today);
    await AsyncStorage.setItem(REWARDED_BOOSTS_TODAY_KEY, '0');
  }
}

/**
 * Get number of rewarded boosts used today
 */
export async function getRewardedBoostsToday(): Promise<number> {
  await resetDailyCounterIfNeeded();
  const count = await AsyncStorage.getItem(REWARDED_BOOSTS_TODAY_KEY);
  return count ? parseInt(count, 10) : 0;
}

/**
 * Check if user can use a rewarded boost
 * Rules:
 * - Max 2 rewarded ads/day
 * - Free users only (no subscription)
 * - No stacking (can't boost already boosted post)
 */
export async function canUseRewardedBoost(postId: string, isAlreadyBoosted: boolean = false): Promise<boolean> {
  // Check if post is already boosted
  if (isAlreadyBoosted) {
    return false;
  }

  // Check user subscription tier
  const metrics = await getUserMetrics();
  if (metrics.subscriptionTier === 'pro' || metrics.subscriptionTier === 'premium') {
    return false; // Premium users don't get rewarded boosts
  }

  // Check daily limit (max 2 per day)
  const boostsToday = await getRewardedBoostsToday();
  if (boostsToday >= 2) {
    return false;
  }

  return true;
}

/**
 * Apply a rewarded boost to a post
 * Returns the reach improvement percentage
 */
export async function applyRewardedBoost(postId: string, baseReach: number): Promise<BoostResult> {
  // Increment daily counter
  await resetDailyCounterIfNeeded();
  const boostsToday = await getRewardedBoostsToday();
  await AsyncStorage.setItem(REWARDED_BOOSTS_TODAY_KEY, (boostsToday + 1).toString());

  // Calculate reach improvement (10-25% for rewarded boosts, lower than Pro's 25%)
  // This ensures rewarded boosts are less powerful than Pro boosts
  const improvement = Math.floor(Math.random() * 16) + 10; // 10-25%

  const boostResult: BoostResult = {
    postId,
    timestamp: new Date().toISOString(),
    reachImprovement: improvement,
    boostType: 'rewarded',
    duration: 24, // 24 hours for rewarded boosts
  };

  // Save to history
  await saveBoostToHistory(boostResult);

  return boostResult;
}

/**
 * Save boost result to history
 */
async function saveBoostToHistory(boost: BoostResult): Promise<void> {
  try {
    const historyJson = await AsyncStorage.getItem(BOOST_HISTORY_KEY);
    const history: BoostHistory = historyJson ? JSON.parse(historyJson) : { boosts: [] };
    
    history.boosts.push(boost);
    
    // Keep only last 100 boosts
    if (history.boosts.length > 100) {
      history.boosts = history.boosts.slice(-100);
    }
    
    await AsyncStorage.setItem(BOOST_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving boost to history:', error);
  }
}

/**
 * Get boost history for a specific post
 */
export async function getBoostHistoryForPost(postId: string): Promise<BoostResult | null> {
  try {
    const historyJson = await AsyncStorage.getItem(BOOST_HISTORY_KEY);
    if (!historyJson) return null;
    
    const history: BoostHistory = JSON.parse(historyJson);
    const boost = history.boosts.find(b => b.postId === postId && b.boostType === 'rewarded');
    
    return boost || null;
  } catch (error) {
    console.error('Error getting boost history:', error);
    return null;
  }
}

/**
 * Get all boost history
 */
export async function getAllBoostHistory(): Promise<BoostResult[]> {
  try {
    const historyJson = await AsyncStorage.getItem(BOOST_HISTORY_KEY);
    if (!historyJson) return [];
    
    const history: BoostHistory = JSON.parse(historyJson);
    return history.boosts;
  } catch (error) {
    console.error('Error getting boost history:', error);
    return [];
  }
}

/**
 * Check if a post is currently boosted
 */
export async function isPostBoosted(postId: string): Promise<boolean> {
  const boost = await getBoostHistoryForPost(postId);
  if (!boost) return false;
  
  // Check if boost is still active (within duration)
  const boostTime = new Date(boost.timestamp).getTime();
  const now = Date.now();
  const hoursElapsed = (now - boostTime) / (1000 * 60 * 60);
  
  return hoursElapsed < boost.duration;
}
