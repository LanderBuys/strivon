import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVITY_KEY = '@strivon_activity_dates';
const LAST_ACTIVE_KEY = '@strivon_last_active';

export interface ActivityRecord {
  date: string; // YYYY-MM-DD format
  actions: string[]; // Types of actions performed
}

/**
 * Records that the user was active today
 * Active means: created post, commented, replied, reacted, or sent/replied to DM
 */
export async function recordActivity(actionType: 'post' | 'comment' | 'reply' | 'react' | 'dm'): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const stored = await AsyncStorage.getItem(ACTIVITY_KEY);
    const activities: ActivityRecord[] = stored ? JSON.parse(stored) : [];
    
    // Find today's activity or create new
    let todayActivity = activities.find(a => a.date === today);
    if (!todayActivity) {
      todayActivity = { date: today, actions: [] };
      activities.push(todayActivity);
    }
    
    // Add action if not already recorded
    if (!todayActivity.actions.includes(actionType)) {
      todayActivity.actions.push(actionType);
    }
    
    // Keep only last 365 days
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    const filtered = activities.filter(a => new Date(a.date) >= oneYearAgo);
    
    await AsyncStorage.setItem(ACTIVITY_KEY, JSON.stringify(filtered));
    await AsyncStorage.setItem(LAST_ACTIVE_KEY, today);
  } catch (error) {
    // Silent fail
  }
}

/**
 * Gets all activity dates
 */
export async function getActivityDates(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(ACTIVITY_KEY);
    if (!stored) return [];
    
    const activities: ActivityRecord[] = JSON.parse(stored);
    return activities.map(a => a.date);
  } catch (error) {
    return [];
  }
}

/**
 * Gets the last active date
 */
export async function getLastActiveDate(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_ACTIVE_KEY);
  } catch (error) {
    return null;
  }
}

/**
 * Checks if user was active today
 */
export async function isActiveToday(): Promise<boolean> {
  const lastActive = await getLastActiveDate();
  if (!lastActive) return false;
  
  const today = new Date().toISOString().split('T')[0];
  return lastActive === today;
}

/**
 * Calculates total active days
 */
export async function getTotalActiveDays(): Promise<number> {
  const dates = await getActivityDates();
  return dates.length;
}

/**
 * Calculates consecutive active days with grace period
 * Grace: 1 day per 14 days
 */
export async function getConsecutiveActiveDays(): Promise<number> {
  const dates = await getActivityDates();
  if (dates.length === 0) return 0;
  
  const sortedDates = dates
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  let graceDaysUsed = 0;
  let daysInPeriod = 0;
  const graceDays = 1;
  const gracePeriod = 14;
  
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

/**
 * Clears all activity data (for testing/reset)
 */
export async function clearActivityData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ACTIVITY_KEY);
    await AsyncStorage.removeItem(LAST_ACTIVE_KEY);
  } catch (error) {
    // Silent fail
  }
}


