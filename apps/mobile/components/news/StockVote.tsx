import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { StockVote } from '@/types/news';

interface StockVoteProps {
  longVotes: number;
  shortVotes: number;
  userVote: StockVote;
  onVote: (vote: 'long' | 'short' | null) => void;
  compact?: boolean;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export function StockVoteComponent({ 
  longVotes, 
  shortVotes, 
  userVote, 
  onVote,
  compact = false 
}: StockVoteProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();

  const handleVote = (vote: 'long' | 'short' | null) => {
    haptics.light();
    // If clicking the same vote, remove it (toggle off)
    const newVote = userVote === vote ? null : vote;
    onVote(newVote);
  };

  const totalVotes = longVotes + shortVotes;
  const longPercentage = totalVotes > 0 ? (longVotes / totalVotes) * 100 : 0;
  const shortPercentage = totalVotes > 0 ? (shortVotes / totalVotes) * 100 : 0;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <TouchableOpacity
          style={[
            styles.compactButton,
            {
              backgroundColor: userVote === 'long' 
                ? colors.success + '15' 
                : colors.surface,
              borderColor: userVote === 'long' 
                ? colors.success 
                : colors.cardBorder,
              borderWidth: userVote === 'long' ? 1.5 : StyleSheet.hairlineWidth,
            },
          ]}
          onPress={() => handleVote('long')}
          activeOpacity={0.6}
        >
          <View style={[
            styles.compactIconContainer,
            { backgroundColor: userVote === 'long' ? colors.success + '20' : 'transparent' }
          ]}>
            <Ionicons 
              name="trending-up" 
              size={14} 
              color={userVote === 'long' ? colors.success : colors.secondary} 
            />
          </View>
          <Text
            style={[
              styles.compactText,
              {
                color: userVote === 'long' ? colors.success : colors.text,
                fontWeight: userVote === 'long' ? '700' : '500',
              },
            ]}
          >
            Long {formatNumber(longVotes)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.compactButton,
            {
              backgroundColor: userVote === 'short' 
                ? colors.error + '15' 
                : colors.surface,
              borderColor: userVote === 'short' 
                ? colors.error 
                : colors.cardBorder,
              borderWidth: userVote === 'short' ? 1.5 : StyleSheet.hairlineWidth,
            },
          ]}
          onPress={() => handleVote('short')}
          activeOpacity={0.6}
        >
          <View style={[
            styles.compactIconContainer,
            { backgroundColor: userVote === 'short' ? colors.error + '20' : 'transparent' }
          ]}>
            <Ionicons 
              name="trending-down" 
              size={14} 
              color={userVote === 'short' ? colors.error : colors.secondary} 
            />
          </View>
          <Text
            style={[
              styles.compactText,
              {
                color: userVote === 'short' ? colors.error : colors.text,
                fontWeight: userVote === 'short' ? '700' : '500',
              },
            ]}
          >
            Short {formatNumber(shortVotes)}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="pulse" size={18} color={colors.primary} />
          <Text style={[styles.label, { color: colors.text }]}>Market Sentiment</Text>
        </View>
        {totalVotes > 0 && (
          <Text style={[styles.totalVotes, { color: colors.secondary }]}>
            {formatNumber(totalVotes)} votes
          </Text>
        )}
      </View>
      
      <View style={styles.voteButtons}>
        {/* Long Button */}
        <TouchableOpacity
          style={[
            styles.voteButton,
            {
              backgroundColor: userVote === 'long' 
                ? colors.success + '15' 
                : colors.background,
              borderColor: userVote === 'long' 
                ? colors.success 
                : colors.cardBorder,
              borderWidth: userVote === 'long' ? 1.5 : StyleSheet.hairlineWidth,
            },
          ]}
          onPress={() => handleVote('long')}
          activeOpacity={0.6}
        >
          <View style={[
            styles.iconContainer,
            { backgroundColor: userVote === 'long' ? colors.success + '25' : colors.surface }
          ]}>
            <Ionicons 
              name="trending-up" 
              size={22} 
              color={userVote === 'long' ? colors.success : colors.secondary} 
            />
          </View>
          <View style={styles.voteButtonContent}>
            <Text
              style={[
                styles.voteButtonText,
                {
                  color: userVote === 'long' ? colors.success : colors.text,
                  fontWeight: userVote === 'long' ? '700' : '600',
                },
              ]}
            >
              Long
            </Text>
            <Text
              style={[
                styles.voteCount,
                { color: userVote === 'long' ? colors.success : colors.secondary },
              ]}
            >
              {formatNumber(longVotes)}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Short Button */}
        <TouchableOpacity
          style={[
            styles.voteButton,
            {
              backgroundColor: userVote === 'short' 
                ? colors.error + '15' 
                : colors.background,
              borderColor: userVote === 'short' 
                ? colors.error 
                : colors.cardBorder,
              borderWidth: userVote === 'short' ? 1.5 : StyleSheet.hairlineWidth,
            },
          ]}
          onPress={() => handleVote('short')}
          activeOpacity={0.6}
        >
          <View style={[
            styles.iconContainer,
            { backgroundColor: userVote === 'short' ? colors.error + '25' : colors.surface }
          ]}>
            <Ionicons 
              name="trending-down" 
              size={22} 
              color={userVote === 'short' ? colors.error : colors.secondary} 
            />
          </View>
          <View style={styles.voteButtonContent}>
            <Text
              style={[
                styles.voteButtonText,
                {
                  color: userVote === 'short' ? colors.error : colors.text,
                  fontWeight: userVote === 'short' ? '700' : '600',
                },
              ]}
            >
              Short
            </Text>
            <Text
              style={[
                styles.voteCount,
                { color: userVote === 'short' ? colors.error : colors.secondary },
              ]}
            >
              {formatNumber(shortVotes)}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Vote Percentage Bars */}
      {totalVotes > 0 && (
        <View style={styles.percentageContainer}>
          <View style={[styles.percentageBar, { backgroundColor: colors.divider }]}>
            {longPercentage > 0 && (
              <View
                style={[
                  styles.percentageFill,
                  {
                    width: `${longPercentage}%`,
                    backgroundColor: colors.success,
                  },
                ]}
              />
            )}
            {shortPercentage > 0 && (
              <View
                style={[
                  styles.percentageFill,
                  {
                    width: `${shortPercentage}%`,
                    backgroundColor: colors.error,
                  },
                ]}
              />
            )}
          </View>
          <View style={styles.percentageLabels}>
            <View style={styles.percentageLabelItem}>
              <View style={[styles.percentageDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.percentageText, { color: colors.success }]}>
                {longPercentage.toFixed(0)}% Long
              </Text>
            </View>
            <View style={styles.percentageLabelItem}>
              <View style={[styles.percentageDot, { backgroundColor: colors.error }]} />
              <Text style={[styles.percentageText, { color: colors.error }]}>
                {shortPercentage.toFixed(0)}% Short
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginVertical: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  label: {
    fontSize: Typography.base,
    fontWeight: '700',
  },
  totalVotes: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
  voteButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteButtonContent: {
    flex: 1,
    alignItems: 'flex-start',
  },
  voteButtonText: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  voteCount: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
  percentageContainer: {
    marginTop: Spacing.xs,
  },
  percentageBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  percentageFill: {
    height: '100%',
  },
  percentageLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  percentageLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  percentageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  percentageText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  compactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  compactIconContainer: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactText: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
});
