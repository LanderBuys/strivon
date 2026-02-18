import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  canUseRewardedBoost,
  applyRewardedBoost,
  getRewardedBoostsToday,
  isPostBoosted,
} from '@/lib/services/boostService';
import { BoostConversionModal } from './BoostConversionModal';

interface RewardedBoostButtonProps {
  postId: string;
  baseReach?: number; // Optional base reach for analytics
  onBoostComplete?: (reachImprovement: number) => void;
}

/**
 * Component that allows free users to boost a post by watching a rewarded ad
 * Shows conversion modal after successful boost
 */
export function RewardedBoostButton({
  postId,
  baseReach = 100, // Default base reach
  onBoostComplete,
}: RewardedBoostButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [loading, setLoading] = useState(false);
  const [canBoost, setCanBoost] = useState(false);
  const [boostsToday, setBoostsToday] = useState(0);
  const [isBoosted, setIsBoosted] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [reachImprovement, setReachImprovement] = useState(0);

  useEffect(() => {
    checkBoostAvailability();
  }, [postId]);

  const checkBoostAvailability = async () => {
    const boosted = await isPostBoosted(postId);
    setIsBoosted(boosted);
    
    if (!boosted) {
      const available = await canUseRewardedBoost(postId, false);
      setCanBoost(available);
    } else {
      setCanBoost(false);
    }
    
    const today = await getRewardedBoostsToday();
    setBoostsToday(today);
  };

  const handleBoost = async () => {
    if (!canBoost || isBoosted) {
      if (boostsToday >= 2) {
        Alert.alert(
          'Daily Limit Reached',
          'You\'ve reached the daily limit of 2 rewarded boosts. Upgrade to Pro for 10 boosts every month!',
          [
            { text: 'OK' },
            { text: 'Upgrade', onPress: () => {/* Navigate to upgrade */} },
          ]
        );
      }
      return;
    }

    setLoading(true);

    try {
      // Simulate watching rewarded ad
      // In production, integrate with ad SDK (Google AdMob, etc.)
      await simulateRewardedAd();

      // Apply boost after ad is watched
      const boostResult = await applyRewardedBoost(postId, baseReach);
      
      setReachImprovement(boostResult.reachImprovement);
      setIsBoosted(true);
      setCanBoost(false);
      
      // Update daily count
      const today = await getRewardedBoostsToday();
      setBoostsToday(today);

      // Show conversion modal
      setShowConversionModal(true);

      // Notify parent
      if (onBoostComplete) {
        onBoostComplete(boostResult.reachImprovement);
      }
    } catch (error) {
      console.error('Error applying boost:', error);
      Alert.alert('Error', 'Failed to apply boost. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Simulate rewarded ad watching
  // In production, replace with actual ad SDK integration
  // Example: import { showRewardedAd } from '@/lib/services/adService';
  const simulateRewardedAd = (): Promise<void> => {
    return new Promise((resolve) => {
      // Simulate 3-5 second ad
      setTimeout(() => {
        resolve();
      }, 3000 + Math.random() * 2000);
    });
  };

  // Example: Real ad integration
  // const watchRewardedAd = async (): Promise<void> => {
  //   const { showRewardedAd } = await import('@/lib/services/adService');
  //   return showRewardedAd({
  //     onRewarded: () => {
  //       // Ad watched successfully
  //     },
  //     onAdFailedToShow: (error) => {
  //       throw error;
  //     },
  //   });
  // };

  if (isBoosted) {
    return (
      <View style={[styles.container, styles.boostedContainer]}>
        <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
        <Text style={[styles.boostedText, { color: colors.primary }]}>
          Boosted
        </Text>
      </View>
    );
  }

  if (!canBoost) {
    return null; // Don't show button if user can't boost
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleBoost}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="rocket" size={16} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              Boost Post {boostsToday > 0 && `(${2 - boostsToday} left today)`}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <BoostConversionModal
        visible={showConversionModal}
        reachImprovement={reachImprovement}
        onClose={() => setShowConversionModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  boostedContainer: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  boostedText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
});
