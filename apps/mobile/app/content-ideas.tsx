import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { getSubscriptionTier } from '@/lib/services/subscriptionService';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { mockTrendingTopics, mockBestTimesToPost } from '@/lib/mocks/contentIdeas';

interface TrendingTopic {
  id: string;
  topic: string;
  engagement: number;
  trend: 'up' | 'down' | 'stable';
}

interface BestTimeToPost {
  day: string;
  hour: number;
  engagement: number;
}

export default function ContentIdeasScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const haptics = useHapticFeedback();
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'premium'>('free');
  const [tierLoaded, setTierLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [bestTimes, setBestTimes] = useState<BestTimeToPost[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadSubscriptionTier();
      loadContentIdeas();
    }, [])
  );

  const loadSubscriptionTier = async () => {
    const tier = await getSubscriptionTier();
    setSubscriptionTier(tier);
    setTierLoaded(true);
  };

  const loadContentIdeas = async () => {
    setTrendingTopics(mockTrendingTopics as TrendingTopic[]);
    setBestTimes(mockBestTimesToPost as BestTimeToPost[]);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadContentIdeas();
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Content ideas: Pro and Premium per feature set. Wait for tier to load to avoid flash.
  if (!tierLoaded) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>Content Ideas</ThemedText>
          <View style={styles.placeholder} />
        </View>
        <View style={[styles.lockedContainer, { justifyContent: 'center' }]}>
          <ThemedText style={[styles.lockedMessage, { color: colors.secondary }]}>Loading...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }
  if (subscriptionTier === 'free') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>Content Ideas</ThemedText>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={64} color={colors.secondary} />
          <ThemedText type="title" style={[styles.lockedTitle, { color: colors.text }]}>
            Content Ideas Dashboard
          </ThemedText>
          <ThemedText style={[styles.lockedMessage, { color: colors.secondary }]}>
            Get trending topics, best times to post, and content suggestions. Available with Pro or Premium.
          </ThemedText>
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/settings/subscription-info')}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Pro or Premium</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>Content Ideas</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Trending Topics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Trending Topics</Text>
          </View>
          {trendingTopics.map((topic, index) => (
            <TouchableOpacity
              key={topic.id}
              style={[styles.topicCard, {
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
                borderBottomWidth: index < trendingTopics.length - 1 ? StyleSheet.hairlineWidth : 0,
              }]}
              activeOpacity={0.7}
              onPress={() => {
                haptics.light();
                router.push(`/(tabs)/create?hashtag=${encodeURIComponent(topic.topic)}`);
              }}
            >
              <View style={styles.topicInfo}>
                <Text style={[styles.topicText, { color: colors.text }]}>{topic.topic}</Text>
                <View style={styles.topicMeta}>
                  <Ionicons
                    name={topic.trend === 'up' ? 'arrow-up' : topic.trend === 'down' ? 'arrow-down' : 'remove'}
                    size={12}
                    color={topic.trend === 'up' ? colors.success : topic.trend === 'down' ? colors.error : colors.secondary}
                  />
                  <Text style={[styles.topicEngagement, { color: colors.secondary }]}>
                    {topic.engagement.toLocaleString()} engagements
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Best Times to Post */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Best Times to Post</Text>
          </View>
          <View style={[styles.timesCard, {
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
          }]}>
            {bestTimes.map((time, index) => (
              <View
                key={`${time.day}-${time.hour}`}
                style={[styles.timeItem, {
                  borderBottomColor: colors.divider,
                  borderBottomWidth: index < bestTimes.length - 1 ? StyleSheet.hairlineWidth : 0,
                }]}
              >
                <View style={styles.timeInfo}>
                  <View style={[styles.timeIconContainer, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="calendar" size={16} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.timeDay, { color: colors.text }]}>{time.day}</Text>
                    <Text style={[styles.timeHour, { color: colors.secondary }]}>
                      {time.hour}:00
                    </Text>
                  </View>
                </View>
                <View style={styles.timeEngagement}>
                  <Ionicons name="trending-up" size={14} color={colors.success} />
                  <Text style={[styles.timeEngagementText, { color: colors.text }]}>
                    {time.engagement} avg
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Content Suggestions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Content Suggestions</Text>
          </View>
          <View style={[styles.suggestionsCard, {
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
          }]}>
            <Text style={[styles.suggestionText, { color: colors.text }]}>
              • Share your latest trading win or lesson learned
            </Text>
            <Text style={[styles.suggestionText, { color: colors.text }]}>
              • Post a tip about dropshipping strategies
            </Text>
            <Text style={[styles.suggestionText, { color: colors.text }]}>
              • Ask your audience what they want to learn
            </Text>
            <Text style={[styles.suggestionText, { color: colors.text }]}>
              • Share behind-the-scenes of your business
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: Typography['2xl'],
    fontWeight: '700',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl * 2,
  },
  lockedTitle: {
    fontSize: Typography.xl + 4,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  lockedMessage: {
    fontSize: Typography.base,
    textAlign: 'center',
    lineHeight: Typography.base * 1.6,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  upgradeButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 200,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.base,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  topicInfo: {
    flex: 1,
  },
  topicText: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topicEngagement: {
    fontSize: Typography.sm,
  },
  timesCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeDay: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  timeHour: {
    fontSize: Typography.sm,
    marginTop: 2,
  },
  timeEngagement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeEngagementText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  suggestionsCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  suggestionText: {
    fontSize: Typography.base,
    lineHeight: Typography.base * 1.6,
    marginBottom: Spacing.sm,
  },
});
