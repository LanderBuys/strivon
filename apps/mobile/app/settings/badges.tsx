import { useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import { BadgeDisplay } from '@/components/badges/BadgeDisplay';
import { getAllBadges, TIME_BASED_BADGES, PAID_BADGES, LIMITED_PAID_BADGES, METRIC_BADGE_INFO, BADGE_THRESHOLDS } from '@/types/badges';

export default function BadgesInfoScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'time' | 'paid' | 'metric'>('all');

  const allBadges = getAllBadges();
  // Deduplicate badges by ID to prevent duplicate keys
  const uniqueBadges = Array.from(
    new Map(allBadges.map(badge => [badge.id, badge])).values()
  );
  const timeBadges = uniqueBadges.filter(b => b.category === 'time');
  const paidBadges = uniqueBadges.filter(b => b.category === 'paid' || b.category === 'limited');
  const metricBadges = uniqueBadges.filter(b => b.category === 'metric');

  const getFilteredBadges = () => {
    switch (selectedCategory) {
      case 'time':
        return timeBadges;
      case 'paid':
        return paidBadges;
      case 'metric':
        return metricBadges;
      default:
        return uniqueBadges;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return '#F59E0B';
      case 'epic':
        return '#8B5CF6';
      case 'rare':
        return '#3B82F6';
      case 'uncommon':
        return '#10B981';
      default:
        return colors.secondary;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Badges</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Category Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filtersContent}
        >
          {(['all', 'time', 'paid', 'metric'] as const).map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedCategory === category ? colors.primary : 'transparent',
                  borderColor: selectedCategory === category ? colors.primary : colors.cardBorder,
                },
                selectedCategory === category && styles.filterChipActive,
              ]}
              onPress={() => {
                haptics.light();
                setSelectedCategory(category);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: selectedCategory === category ? '#FFFFFF' : colors.text,
                    fontWeight: selectedCategory === category ? '700' : '600',
                  },
                ]}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Time-Based Badges */}
        {(selectedCategory === 'all' || selectedCategory === 'time') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Time-Based Badges</Text>
            </View>
            <Text style={[styles.sectionDescription, { color: colors.secondary }]}>
              Earned through consistent activity and time on the platform
            </Text>
            <View style={styles.badgesGrid}>
              {timeBadges.map((badge, index) => (
                <View
                  key={`time-${badge.id}-${index}`}
                  style={[
                    styles.badgeCard,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.cardBorder,
                      shadowColor: badge.rarity === 'legendary' || badge.rarity === 'epic' 
                        ? badge.color 
                        : '#000',
                    },
                  ]}
                >
                  <View style={styles.badgeCardHeader}>
                    <BadgeDisplay badge={badge} size="large" />
                    <View
                      style={[
                        styles.rarityBadge,
                        { 
                          backgroundColor: getRarityColor(badge.rarity) + '15',
                          borderColor: getRarityColor(badge.rarity) + '40',
                        },
                      ]}
                    >
                      <Text style={[styles.rarityText, { color: getRarityColor(badge.rarity) }]}>
                        {badge.rarity}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.badgeCardName, { color: colors.text }]}>{badge.displayName}</Text>
                  <Text style={[styles.badgeCardDescription, { color: colors.secondary }]}>
                    {badge.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Paid Badges */}
        {(selectedCategory === 'all' || selectedCategory === 'paid') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="diamond-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Paid Badges</Text>
            </View>
            <Text style={[styles.sectionDescription, { color: colors.secondary }]}>
              Available through subscriptions and special contributions
            </Text>
            <View style={styles.badgesGrid}>
              {paidBadges.map((badge, index) => (
                <View
                  key={`paid-${badge.id}-${index}`}
                  style={[
                    styles.badgeCard,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.cardBorder,
                      shadowColor: badge.rarity === 'legendary' || badge.rarity === 'epic' 
                        ? badge.color 
                        : '#000',
                    },
                  ]}
                >
                  <View style={styles.badgeCardHeader}>
                    <BadgeDisplay badge={badge} size="large" />
                    <View
                      style={[
                        styles.rarityBadge,
                        { 
                          backgroundColor: getRarityColor(badge.rarity) + '15',
                          borderColor: getRarityColor(badge.rarity) + '40',
                        },
                      ]}
                    >
                      <Text style={[styles.rarityText, { color: getRarityColor(badge.rarity) }]}>
                        {badge.rarity}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.badgeCardName, { color: colors.text }]}>{badge.displayName}</Text>
                  <Text style={[styles.badgeCardDescription, { color: colors.secondary }]}>
                    {badge.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Metric-Based Badges */}
        {(selectedCategory === 'all' || selectedCategory === 'metric') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Metric-Based Badges</Text>
            </View>
            <Text style={[styles.sectionDescription, { color: colors.secondary }]}>
              Level up automatically based on your activity and engagement
            </Text>

            {/* Reach Badge */}
            <View style={styles.metricSection}>
              <View style={styles.metricHeader}>
                <BadgeDisplay badge={{ ...METRIC_BADGE_INFO.reach, id: 'reach', level: 'I' } as any} size="medium" />
                <View style={styles.metricInfo}>
                  <Text style={[styles.metricName, { color: colors.text }]}>Reach</Text>
                  <Text style={[styles.metricDescription, { color: colors.secondary }]}>
                    Based on follower count
                  </Text>
                </View>
              </View>
              <View style={[styles.thresholdsList, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                {(['I', 'II', 'III', 'IV', 'V'] as const).map((level, index) => (
                  <View 
                    key={level} 
                    style={[
                      styles.thresholdItem, 
                      { 
                        borderBottomColor: colors.divider,
                        backgroundColor: index % 2 === 0 ? 'transparent' : colors.background + '50',
                      }
                    ]}
                  >
                    <View style={styles.thresholdLevelContainer}>
                      <Text style={[styles.thresholdLevel, { color: colors.text }]}>Reach {level}</Text>
                    </View>
                    <Text style={[styles.thresholdValue, { color: colors.primary }]}>
                      {BADGE_THRESHOLDS.reach[level].toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Voice Badge */}
            <View style={styles.metricSection}>
              <View style={styles.metricHeader}>
                <BadgeDisplay badge={{ ...METRIC_BADGE_INFO.voice, id: 'voice', level: 'I' } as any} size="medium" />
                <View style={styles.metricInfo}>
                  <Text style={[styles.metricName, { color: colors.text }]}>Voice</Text>
                  <Text style={[styles.metricDescription, { color: colors.secondary }]}>
                    Based on comment count
                  </Text>
                </View>
              </View>
              <View style={[styles.thresholdsList, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                {(['I', 'II', 'III', 'IV', 'V'] as const).map((level, index) => (
                  <View 
                    key={level} 
                    style={[
                      styles.thresholdItem, 
                      { 
                        borderBottomColor: colors.divider,
                        backgroundColor: index % 2 === 0 ? 'transparent' : colors.background + '50',
                      }
                    ]}
                  >
                    <View style={styles.thresholdLevelContainer}>
                      <Text style={[styles.thresholdLevel, { color: colors.text }]}>Voice {level}</Text>
                    </View>
                    <Text style={[styles.thresholdValue, { color: colors.primary }]}>
                      {BADGE_THRESHOLDS.voice[level].toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Presence Badge */}
            <View style={styles.metricSection}>
              <View style={styles.metricHeader}>
                <BadgeDisplay badge={{ ...METRIC_BADGE_INFO.presence, id: 'presence', level: 'I' } as any} size="medium" />
                <View style={styles.metricInfo}>
                  <Text style={[styles.metricName, { color: colors.text }]}>Presence</Text>
                  <Text style={[styles.metricDescription, { color: colors.secondary }]}>
                    Based on post count
                  </Text>
                </View>
              </View>
              <View style={[styles.thresholdsList, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                {(['I', 'II', 'III', 'IV', 'V'] as const).map((level, index) => (
                  <View 
                    key={level} 
                    style={[
                      styles.thresholdItem, 
                      { 
                        borderBottomColor: colors.divider,
                        backgroundColor: index % 2 === 0 ? 'transparent' : colors.background + '50',
                      }
                    ]}
                  >
                    <View style={styles.thresholdLevelContainer}>
                      <Text style={[styles.thresholdLevel, { color: colors.text }]}>Presence {level}</Text>
                    </View>
                    <Text style={[styles.thresholdValue, { color: colors.primary }]}>
                      {BADGE_THRESHOLDS.presence[level].toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Impact Badge */}
            <View style={styles.metricSection}>
              <View style={styles.metricHeader}>
                <BadgeDisplay badge={{ ...METRIC_BADGE_INFO.impact, id: 'impact', level: 'I' } as any} size="medium" />
                <View style={styles.metricInfo}>
                  <Text style={[styles.metricName, { color: colors.text }]}>Impact</Text>
                  <Text style={[styles.metricDescription, { color: colors.secondary }]}>
                    Based on total engagement (likes + replies + saves)
                  </Text>
                </View>
              </View>
              <View style={[styles.thresholdsList, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                {(['I', 'II', 'III', 'IV', 'V'] as const).map((level, index) => (
                  <View 
                    key={level} 
                    style={[
                      styles.thresholdItem, 
                      { 
                        borderBottomColor: colors.divider,
                        backgroundColor: index % 2 === 0 ? 'transparent' : colors.background + '50',
                      }
                    ]}
                  >
                    <View style={styles.thresholdLevelContainer}>
                      <Text style={[styles.thresholdLevel, { color: colors.text }]}>Impact {level}</Text>
                    </View>
                    <Text style={[styles.thresholdValue, { color: colors.primary }]}>
                      {BADGE_THRESHOLDS.impact[level].toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Active Status Info */}
        <View style={[styles.infoBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>What counts as "Active"?</Text>
            <Text style={[styles.infoText, { color: colors.secondary }]}>
              Active means meaningful social activity, not just opening the app. You're Active if you do at least ONE of these in a day:
            </Text>
            <View style={styles.infoList}>
              {[
                'Create a post',
                'Comment on a post',
                'Reply to comments',
                'React/engage (like, upvote, etc.)',
                'Send or reply to a DM',
              ].map((item, index) => (
                <View key={index} style={styles.infoListItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  <Text style={[styles.infoListItemText, { color: colors.secondary }]}>{item}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.infoNote, { color: colors.secondary }]}>
              Note: Opening the app, scrolling, or watching content without interacting does NOT count as active.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  filtersContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.sm,
  },
  filtersContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  filterChipText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.xl * 2,
  },
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionDescription: {
    fontSize: Typography.sm,
    marginBottom: Spacing.md,
    lineHeight: Typography.sm * 1.5,
    opacity: 0.7,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  badgeCard: {
    width: '47%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  badgeCardHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  badgeCardName: {
    fontSize: Typography.base,
    fontWeight: '700',
    marginTop: Spacing.md,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  badgeCardDescription: {
    fontSize: Typography.sm,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: Typography.sm * 1.5,
    opacity: 0.75,
  },
  badgeCardFooter: {
    marginTop: Spacing.sm,
  },
  rarityBadge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  rarityText: {
    fontSize: Typography.xs - 1,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricSection: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'transparent',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  metricInfo: {
    flex: 1,
  },
  metricName: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  metricDescription: {
    fontSize: Typography.sm,
    opacity: 0.7,
    lineHeight: Typography.sm * 1.4,
  },
  thresholdsList: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  thresholdItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thresholdLevelContainer: {
    flex: 1,
  },
  thresholdLevel: {
    fontSize: Typography.base,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  thresholdValue: {
    fontSize: Typography.base,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoBox: {
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: Spacing.md,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.5,
    marginBottom: Spacing.sm,
  },
  infoList: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  infoListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  infoListItemText: {
    fontSize: Typography.sm,
    flex: 1,
  },
  infoNote: {
    fontSize: Typography.sm - 1,
    fontStyle: 'italic',
    opacity: 0.6,
    marginTop: Spacing.xs,
  },
});

