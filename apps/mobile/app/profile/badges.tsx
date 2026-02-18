import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Text, Platform, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import { BadgeDisplay } from '@/components/badges/BadgeDisplay';
import { Badge, BADGE_THRESHOLDS } from '@/types/badges';
import { getUserById } from '@/lib/api/users';
import { useUserBadges } from '@/hooks/useUserBadges';
import { User } from '@/types/post';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';

export default function UserBadgesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const currentUserId = useCurrentUserId();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  // Get user badges
  const { badges, activeStatus, activeStreak } = useUserBadges(user);

  // Check if viewing own profile
  const isOwnProfile = !params.userId || params.userId === '1' || user?.id === currentUserId || user?.id === '1';

  useEffect(() => {
    loadUser();
  }, [params.userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const userId = params.userId || currentUserId;
      const fetchedUser = await getUserById(userId);
      setUser(fetchedUser);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
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

  const getBadgeInfo = (badge: Badge): { description: string; perks: string[] } => {
    let description = badge.description;
    const perks: string[] = [];

    if (badge.category === 'time') {
      switch (badge.name) {
        case 'active':
          description = 'Earned by being consistently active on the platform. Active means doing at least one of: creating a post, commenting, replying, reacting, or sending a DM.';
          break;
        case '30-days':
          description = 'Earned by being active for 30 days. Active means meaningful social interaction, not just opening the app.';
          break;
        case '90-days':
          description = 'Earned by being active for 90 days. Keep engaging with the community!';
          break;
        case '180-days':
          description = 'Earned by being active for 180 days. Half a year of activity!';
          break;
        case 'veteran':
          description = 'Earned by being active for 1+ year. Shows your dedication to the platform.';
          break;
        case 'legacy':
          description = 'Earned by being active for 2+ years. The ultimate badge of commitment.';
          break;
        case 'day-one':
          description = 'Earned by joining on the first day of launch. Only available to the earliest supporters.';
          perks.push('Unique profile border');
          break;
        case 'beta-tester':
          description = 'Earned by using the platform during beta phase. Only available to users who joined before the official launch.';
          perks.push('Unique profile border');
          break;
        case 'early':
          description = 'Earned by joining early in the platform\'s lifecycle. Only available to users who joined within the first 30 days of launch.';
          perks.push('Unique profile border');
          break;
      }
    } else if (badge.category === 'paid') {
      // Paid badges are support-only - no perks, just cosmetic badges
      switch (badge.name) {
        case 'supporter':
          description = 'Supporter badge. Thank you for supporting Strivon!';
          break;
        case 'contributor':
          description = 'Contributor badge. Your contributions make a difference!';
          break;
        case 'member-plus':
          description = 'Member+ badge. Thank you for your support!';
          break;
        case 'vip':
          description = 'VIP badge. Thank you for supporting Strivon!';
          break;
        case 'elite':
          description = 'Elite badge. Thank you for your generous support!';
          break;
        case 'investor':
          description = 'Investor badge. Thank you for investing in Strivon\'s future!';
          break;
        case 'whale':
          description = 'Top tier supporter badge. Thank you for your incredible support!';
          break;
        default:
          description = badge.description || 'Support badge. Thank you for supporting Strivon!';
      }
    } else if (badge.category === 'limited') {
      if (badge.name === 'level-iii') {
        description = 'Rare badge. Ultra-limited tier with maximum benefits.';
        perks.push('Unique profile border');
        perks.push('~2.00× visibility boost');
        perks.push('Multiple boost credits');
      } else if (badge.name === 'level-ii') {
        description = 'Rare badge. Limited edition available only through special promotions or exclusive subscription tiers.';
        perks.push('Unique profile border');
        perks.push('~1.50× visibility boost');
        perks.push('Multiple boost credits');
      } else if (badge.name === 'day-one') {
        description = 'Earned by joining on the first day of launch. Only available to the earliest supporters.';
        perks.push('Unique profile border');
      } else if (badge.name === 'beta-tester') {
        description = 'Earned by using the platform during beta phase. Only available to users who joined before the official launch.';
        perks.push('Unique profile border');
      } else if (badge.name === 'early') {
        description = 'Earned by joining early in the platform\'s lifecycle. Only available to users who joined within the first 30 days of launch.';
        perks.push('Unique profile border');
      } else {
        description = 'Rare badge. Limited edition available only through special promotions or exclusive subscription tiers.';
        perks.push('Unique profile border');
        perks.push('Multiple boost credits');
      }
    } else if (badge.category === 'metric') {
      const metricName = badge.name.split('-')[0] as 'reach' | 'voice' | 'presence' | 'impact';
      const level = badge.level || 'I';
      
      switch (metricName) {
        case 'reach':
          description = `Based on your follower count. Level ${level} represents your growing influence and reach on the platform.`;
          break;
        case 'voice':
          description = `Based on your comment count. Level ${level} shows your active participation in conversations.`;
          break;
        case 'presence':
          description = `Based on your post count. Level ${level} reflects your consistent presence and content creation.`;
          break;
        case 'impact':
          description = `Based on your total engagement (likes, replies, saves). Level ${level} demonstrates the impact of your content.`;
          break;
      }
    }
    
    return { description, perks };
  };

  const handleBadgePress = (badge: Badge) => {
    haptics.light();
    setSelectedBadge(badge);
    setShowBadgeModal(true);
  };


  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.secondary }]}>Loading badges...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {user?.name || 'User'}'s Badges
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={[styles.statsContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{badges.length}</Text>
            <Text style={[styles.statLabel, { color: colors.secondary }]}>Total Badges</Text>
          </View>
          {activeStatus && (
            <View style={[styles.statItem, styles.statItemDivider, { borderColor: colors.divider }]}>
              <View style={styles.activeIndicator}>
                <Ionicons name="flash" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: colors.primary }]}>{activeStreak}</Text>
              <Text style={[styles.statLabel, { color: colors.secondary }]}>Day Streak</Text>
            </View>
          )}
        </View>

        {badges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={64} color={colors.secondary} style={{ opacity: 0.3 }} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No badges in this category</Text>
            <Text style={[styles.emptySubtext, { color: colors.secondary }]}>
              Keep engaging to earn more badges!
            </Text>
          </View>
        ) : (
          <View style={styles.badgesGrid}>
            {badges.map((badge, index) => (
              <TouchableOpacity
                key={`${badge.id}-${index}`}
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
                onPress={() => handleBadgePress(badge)}
                activeOpacity={0.7}
              >
                <View style={styles.badgeCardHeader}>
                  <BadgeDisplay badge={badge} size="large" />
                  {badge.category === 'limited' && (
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
                        Limited
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.badgeCardName, { color: colors.text }]}>{badge.displayName}</Text>
                <Text style={[styles.badgeCardDescription, { color: colors.secondary }]}>
                  {badge.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Badge Detail Modal */}
      <Modal
        visible={showBadgeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBadgeModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowBadgeModal(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedBadge && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalBadgeContainer}>
                    <BadgeDisplay badge={selectedBadge} size="large" />
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setShowBadgeModal(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {selectedBadge.displayName}
                  </Text>
                  
                  <View style={[styles.modalSection, getBadgeInfo(selectedBadge).perks.length > 0 && { borderBottomColor: colors.divider }]}>
                    <Text style={[styles.modalSectionTitle, { color: colors.text }]}>About</Text>
                    <Text style={[styles.modalSectionText, { color: colors.secondary }]}>
                      {getBadgeInfo(selectedBadge).description}
                    </Text>
                  </View>

                  {getBadgeInfo(selectedBadge).perks.length > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Perks</Text>
                      {getBadgeInfo(selectedBadge).perks.map((perk, index) => (
                        <View key={index} style={styles.perkItem}>
                          <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                          <Text style={[styles.perkText, { color: colors.secondary }]}>{perk}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
    flex: 1,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statItemDivider: {
    borderLeftWidth: 1,
  },
  activeIndicator: {
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: Typography.sm,
    marginTop: Spacing.xs,
    opacity: 0.7,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  emptyContainer: {
    paddingVertical: Spacing.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: Typography.lg,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: Typography.sm,
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
  badgeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  rarityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  rarityText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeCardName: {
    fontSize: Typography.base,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    letterSpacing: -0.2,
  },
  badgeCardDescription: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.4,
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  modalBadgeContainer: {
    flex: 1,
    alignItems: 'center',
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalBody: {
    gap: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.xxl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.md,
    letterSpacing: -0.5,
  },
  modalSection: {
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalSectionTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    letterSpacing: -0.2,
  },
  modalSectionText: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.6,
    opacity: 0.9,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  perkText: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.5,
    flex: 1,
    opacity: 0.9,
  },
});

