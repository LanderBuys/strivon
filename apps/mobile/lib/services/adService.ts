/**
 * Ad Service - Integration layer for rewarded ads
 * 
 * This service provides an abstraction layer for integrating with ad SDKs.
 * Currently uses a mock implementation, but can be easily replaced with:
 * - Google AdMob (react-native-google-mobile-ads)
 * - Facebook Audience Network
 * - Unity Ads
 * - etc.
 */

export interface RewardedAdCallbacks {
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: Error) => void;
  onAdOpened?: () => void;
  onAdClosed?: () => void;
  onRewarded?: (reward: { type: string; amount: number }) => void;
  onAdFailedToShow?: (error: Error) => void;
}

/**
 * Mock implementation of rewarded ad service
 * Replace this with actual ad SDK integration
 */
class MockAdService {
  private isAdReady = false;

  async loadRewardedAd(adUnitId?: string): Promise<void> {
    // Mock: Simulate ad loading
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isAdReady = true;
        resolve();
      }, 1000);
    });
  }

  async showRewardedAd(callbacks: RewardedAdCallbacks): Promise<void> {
    if (!this.isAdReady) {
      await this.loadRewardedAd();
    }

    // Mock: Simulate ad showing
    callbacks.onAdOpened?.();

    // Simulate watching ad (3-5 seconds)
    const watchTime = 3000 + Math.random() * 2000;
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Mock: 90% success rate
        if (Math.random() > 0.1) {
          callbacks.onRewarded?.({ type: 'boost', amount: 1 });
          callbacks.onAdClosed?.();
          resolve();
        } else {
          const error = new Error('Ad failed to show');
          callbacks.onAdFailedToShow?.(error);
          reject(error);
        }
      }, watchTime);
    });
  }

  isRewardedAdReady(): boolean {
    return this.isAdReady;
  }
}

// Example: Google AdMob integration
// Uncomment and configure when ready to use real ads
/*
import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

class GoogleAdMobService {
  private rewardedAd: RewardedAd;
  private adUnitId: string;

  constructor() {
    // Use test ID for development, replace with your actual ad unit ID for production
    this.adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx';
    this.rewardedAd = RewardedAd.createForAdRequest(this.adUnitId);
  }

  async loadRewardedAd(): Promise<void> {
    return new Promise((resolve, reject) => {
      const unsubscribeLoaded = this.rewardedAd.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          unsubscribeLoaded();
          resolve();
        }
      );

      const unsubscribeError = this.rewardedAd.addAdEventListener(
        RewardedAdEventType.ERROR,
        (error) => {
          unsubscribeError();
          reject(error);
        }
      );

      this.rewardedAd.load();
    });
  }

  async showRewardedAd(callbacks: RewardedAdCallbacks): Promise<void> {
    return new Promise((resolve, reject) => {
      const unsubscribeEarned = this.rewardedAd.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        (reward) => {
          unsubscribeEarned();
          callbacks.onRewarded?.(reward);
        }
      );

      const unsubscribeClosed = this.rewardedAd.addAdEventListener(
        RewardedAdEventType.CLOSED,
        () => {
          unsubscribeClosed();
          callbacks.onAdClosed?.();
          resolve();
          // Reload ad for next time
          this.loadRewardedAd();
        }
      );

      const unsubscribeError = this.rewardedAd.addAdEventListener(
        RewardedAdEventType.ERROR,
        (error) => {
          unsubscribeError();
          callbacks.onAdFailedToShow?.(error);
          reject(error);
        }
      );

      this.rewardedAd.show();
    });
  }

  isRewardedAdReady(): boolean {
    return this.rewardedAd.loaded;
  }
}
*/

// Export mock service by default
// Replace with GoogleAdMobService or other implementation when ready
const adService = new MockAdService();

export default adService;

/**
 * Load a rewarded ad
 */
export async function loadRewardedAd(adUnitId?: string): Promise<void> {
  return adService.loadRewardedAd(adUnitId);
}

/**
 * Show a rewarded ad
 */
export async function showRewardedAd(callbacks: RewardedAdCallbacks): Promise<void> {
  return adService.showRewardedAd(callbacks);
}

/**
 * Check if rewarded ad is ready
 */
export function isRewardedAdReady(): boolean {
  return adService.isRewardedAdReady();
}
