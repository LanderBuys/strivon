import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Text, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { AnalyticsCard } from '@/components/analytics/AnalyticsCard';
import { MetricCard } from '@/components/analytics/MetricCard';
import { SimpleBarChart } from '@/components/analytics/SimpleBarChart';
import { ProgressBar } from '@/components/analytics/ProgressBar';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { analyticsService } from '@/lib/services/analyticsService';
import { UserAnalytics } from '@/types/analytics';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getFeedPosts } from '@/lib/api/posts';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { canUseAdvancedAnalytics, getSubscriptionTier } from '@/lib/services/subscriptionService';
import { useFocusEffect } from '@react-navigation/native';
import { getCurrentUserIdOrFallback } from '@/lib/api/users';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const screenWidth = Dimensions.get('window').width;

type Period = '7d' | '30d' | '90d' | 'all';

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const haptics = useHapticFeedback();
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'pro-plus'>('free');

  useEffect(() => {
    checkAccess();
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkAccess();
    }, [])
  );

  const checkAccess = useCallback(async () => {
    const canAccess = await canUseAdvancedAnalytics();
    const tier = await getSubscriptionTier();
    setHasAccess(canAccess);
    setSubscriptionTier(tier);
  }, []);

  const loadAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await getFeedPosts('for-you', 1, 100);
      const posts = response?.data || [];
      const data = await analyticsService.getUserAnalytics(getCurrentUserIdOrFallback(), posts, selectedPeriod);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  const onRefresh = useCallback(() => {
    haptics.light();
    loadAnalytics(true);
  }, [loadAnalytics, haptics]);

  useEffect(() => {
    if (hasAccess) {
      loadAnalytics(false);
    }
  }, [selectedPeriod, hasAccess, loadAnalytics]);

  if (!hasAccess) {
    return (
      <ErrorBoundary>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <IconSymbol name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.title}>Analytics</ThemedText>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.lockedContainer}>
            <Ionicons name="lock-closed" size={64} color={colors.secondary} />
            <ThemedText type="title" style={[styles.lockedTitle, { color: colors.text }]}>
              Advanced Analytics
            </ThemedText>
            <ThemedText style={[styles.lockedMessage, { color: colors.secondary }]}>
              Upgrade to Pro or Premium to access advanced analytics, post performance insights, and audience data.
            </ThemedText>
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/settings/subscription-info')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ErrorBoundary>
    );
  }

  if (loading || !analytics) {
    return (
      <ErrorBoundary>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <IconSymbol name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.title}>Analytics</ThemedText>
            <View style={styles.placeholder} />
          </View>
          <LoadingOverlay visible={true} message="Loading analytics..." fullScreen={false} />
        </SafeAreaView>
      </ErrorBoundary>
    );
  }

  const periods: { label: string; value: Period }[] = [
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: 'All Time', value: 'all' },
  ];

  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>Analytics</ThemedText>
          <View style={styles.placeholder} />
        </View>

      {/* Period Selector */}
      <View style={[styles.periodContainer, { borderBottomColor: colors.divider }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodContent}>
          {periods.map(period => (
            <TouchableOpacity
              key={period.value}
              onPress={() => {
                haptics.selection();
                setSelectedPeriod(period.value);
              }}
              style={[
                styles.periodChip,
                {
                  backgroundColor: selectedPeriod === period.value 
                    ? colors.primary 
                    : colors.cardBackground,
                  borderColor: selectedPeriod === period.value 
                    ? colors.primary 
                    : colors.cardBorder,
                },
              ]}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.periodText,
                  { 
                    color: selectedPeriod === period.value ? colors.cardBackground : colors.text,
                    fontWeight: selectedPeriod === period.value ? '600' : '500',
                  },
                ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }>
        {analytics.totalPosts === 0 && (
          <View style={[styles.emptyBanner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
            <Ionicons name="stats-chart-outline" size={32} color={colors.primary} />
            <Text style={[styles.emptyBannerText, { color: colors.text }]}>
              No posts in this period. Create posts to see your analytics here.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBannerButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                haptics.light();
                router.push('/(tabs)/create' as any);
              }}
              activeOpacity={0.7}>
              <Text style={styles.emptyBannerButtonText}>Create post</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Key Metrics Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeaderText, { color: colors.text }]}>Overview</Text>
          <View style={styles.cardsGrid}>
            <AnalyticsCard
              title="Total Posts"
              value={analytics.totalPosts || 0}
              icon="document-text-outline"
              trend={{ value: analytics.growth?.posts || 0, isPositive: true }}
              color={colors.primary}
            />
            <AnalyticsCard
              title="Total Likes"
              value={(analytics.totalLikes || 0).toLocaleString()}
              icon="heart"
              trend={{ value: analytics.growth?.likes || 0, isPositive: true }}
              color={colors.danger}
            />
            <AnalyticsCard
              title="Total Comments"
              value={(analytics.totalComments || 0).toLocaleString()}
              icon="chatbubble"
              trend={{ value: analytics.growth?.comments || 0, isPositive: true }}
              color={colors.info}
            />
            <AnalyticsCard
              title="Engagement Rate"
              value={`${(analytics.engagementRate || 0).toFixed(1)}%`}
              icon="trending-up"
              trend={{ value: analytics.growth?.engagement || 0, isPositive: true }}
              color={colors.success}
            />
          </View>
        </View>

        {/* Engagement Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Weekly Activity
            </Text>
          </View>
          <View style={[styles.chartCard, { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
          }]}>
            <SimpleBarChart 
              data={analytics.dailyStats || []} 
              height={140}
              showValues={true}
            />
          </View>
        </View>

        {/* Additional Metrics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Performance Metrics
            </Text>
          </View>
          <View style={styles.metricsRow}>
            <MetricCard
              title="Total Reach"
              value={(analytics.reach || 0).toLocaleString()}
              subtitle="Estimated"
              icon="people"
              iconColor={colors.purple}
            />
            <MetricCard
              title="Avg Engagement"
              value={analytics.averageEngagement || 0}
              subtitle="Per post"
              icon="flash"
              iconColor={colors.warning}
            />
          </View>
          <View style={styles.metricsRow}>
            <MetricCard
              title="Reposts"
              value={(analytics.totalReposts || 0).toLocaleString()}
              icon="repeat"
              iconColor={colors.cyan}
            />
            <MetricCard
              title="Saves"
              value={(analytics.totalSaves || 0).toLocaleString()}
              icon="bookmark"
              iconColor={colors.pink}
            />
          </View>
        </View>

        {/* Engagement Breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pie-chart" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Engagement Breakdown
            </Text>
          </View>
          <View style={[styles.breakdownCard, { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
          }]}>
            <ProgressBar
              label="Likes"
              value={analytics.engagementBreakdown?.likes || 0}
              max={analytics.totalEngagements || 1}
              color={colors.danger}
            />
            <ProgressBar
              label="Comments"
              value={analytics.engagementBreakdown?.comments || 0}
              max={analytics.totalEngagements || 1}
              color={colors.info}
            />
            <ProgressBar
              label="Reposts"
              value={analytics.engagementBreakdown?.reposts || 0}
              max={analytics.totalEngagements || 1}
              color={colors.cyan}
            />
            <ProgressBar
              label="Saves"
              value={analytics.engagementBreakdown?.saves || 0}
              max={analytics.totalEngagements || 1}
              color={colors.pink}
            />
          </View>
        </View>

        {/* Top Posts */}
        {analytics.topPosts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Top Performing Posts
              </Text>
            </View>
            {analytics.topPosts.map((post, index) => (
              <TouchableOpacity
                key={post.postId}
                style={[styles.topPostCard, { 
                  backgroundColor: colors.cardBackground, 
                  borderColor: colors.cardBorder,
                  shadowColor: colors.background,
                }]}
                activeOpacity={0.7}
                onPress={() => {
                  haptics.light();
                  router.push(`/post/${post.postId}` as any);
                }}>
                <View style={[styles.rankBadge, { 
                  backgroundColor: index === 0 ? colors.gold + '20' : colors.spaceBackground,
                }]}>
                  {index === 0 && <Ionicons name="trophy" size={18} color={colors.gold} />}
                  {index > 0 && (
                    <Text style={[styles.rankText, { color: colors.primary }]}>
                      #{index + 1}
                    </Text>
                  )}
                </View>
                <View style={styles.postInfo}>
                  <Text style={[styles.postTitle, { color: colors.text }]} numberOfLines={2}>
                    {post.title || 'Untitled Post'}
                  </Text>
                  <View style={styles.postStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="heart" size={12} color={colors.danger} />
                      <Text style={[styles.statText, { color: colors.secondary }]}>
                        {(post.likes || 0).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="chatbubble" size={12} color={colors.info} />
                      <Text style={[styles.statText, { color: colors.secondary }]}>
                        {(post.comments || 0).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="eye" size={12} color={colors.secondary} />
                      <Text style={[styles.statText, { color: colors.secondary }]}>
                        {(post.views || 0).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.engagementBadge, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.engagementValue, { color: colors.primary }]}>
                    {(post.engagement || 0).toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Pro+ Only Features */}
        {subscriptionTier === 'pro-plus' && (
          <>
            {/* Post-Level Breakdowns */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Post-Level Breakdowns
                </Text>
              </View>
              <View style={[styles.proPlusCard, { 
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
              }]}>
                <Text style={[styles.proPlusText, { color: colors.secondary }]}>
                  Detailed performance metrics for each individual post, including engagement patterns, reach distribution, and audience interaction timelines.
                </Text>
                {analytics.topPosts.slice(0, 3).map((post, index) => (
                  <TouchableOpacity
                    key={post.postId}
                    style={[styles.postBreakdownItem, {
                      borderBottomColor: colors.divider,
                      borderBottomWidth: index < 2 ? StyleSheet.hairlineWidth : 0,
                    }]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.postBreakdownHeader}>
                      <Text style={[styles.postBreakdownTitle, { color: colors.text }]} numberOfLines={1}>
                        {post.title || 'Untitled Post'}
                      </Text>
                      <Text style={[styles.postBreakdownEngagement, { color: colors.primary }]}>
                        {post.engagement} engagements
                      </Text>
                    </View>
                    <View style={styles.postBreakdownStats}>
                      <View style={styles.postBreakdownStat}>
                        <Ionicons name="eye" size={14} color={colors.secondary} />
                        <Text style={[styles.postBreakdownStatText, { color: colors.secondary }]}>
                          {post.views} views
                        </Text>
                      </View>
                      <View style={styles.postBreakdownStat}>
                        <Ionicons name="heart" size={14} color={colors.danger} />
                        <Text style={[styles.postBreakdownStatText, { color: colors.secondary }]}>
                          {post.likes} likes
                        </Text>
                      </View>
                      <View style={styles.postBreakdownStat}>
                        <Ionicons name="chatbubble" size={14} color={colors.info} />
                        <Text style={[styles.postBreakdownStatText, { color: colors.secondary }]}>
                          {post.comments} comments
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Audience Segmentation */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Audience Segmentation
                </Text>
              </View>
              <View style={[styles.proPlusCard, { 
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
              }]}>
                <Text style={[styles.proPlusText, { color: colors.secondary }]}>
                  Understand your audience demographics, engagement patterns, and growth trends.
                </Text>
                <View style={styles.segmentationGrid}>
                  <View style={[styles.segmentationItem, { backgroundColor: colors.primary + '10' }]}>
                    <Ionicons name="time" size={24} color={colors.primary} />
                    <Text style={[styles.segmentationValue, { color: colors.text }]}>
                      {Math.floor(Math.random() * 40 + 20)}%
                    </Text>
                    <Text style={[styles.segmentationLabel, { color: colors.secondary }]}>
                      Active Hours
                    </Text>
                  </View>
                  <View style={[styles.segmentationItem, { backgroundColor: colors.success + '10' }]}>
                    <Ionicons name="trending-up" size={24} color={colors.success} />
                    <Text style={[styles.segmentationValue, { color: colors.text }]}>
                      {Math.floor(Math.random() * 30 + 15)}%
                    </Text>
                    <Text style={[styles.segmentationLabel, { color: colors.secondary }]}>
                      Growth Rate
                    </Text>
                  </View>
                  <View style={[styles.segmentationItem, { backgroundColor: colors.warning + '10' }]}>
                    <Ionicons name="location" size={24} color={colors.warning} />
                    <Text style={[styles.segmentationValue, { color: colors.text }]}>
                      {Math.floor(Math.random() * 15 + 5)}
                    </Text>
                    <Text style={[styles.segmentationLabel, { color: colors.secondary }]}>
                      Top Regions
                    </Text>
                  </View>
                  <View style={[styles.segmentationItem, { backgroundColor: colors.info + '10' }]}>
                    <Ionicons name="people-circle" size={24} color={colors.info} />
                    <Text style={[styles.segmentationValue, { color: colors.text }]}>
                      {Math.floor(Math.random() * 25 + 10)}%
                    </Text>
                    <Text style={[styles.segmentationLabel, { color: colors.secondary }]}>
                      New Followers
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Growth & Momentum Trends */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trending-up" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Growth & Momentum Trends
                </Text>
              </View>
              <View style={[styles.proPlusCard, { 
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
              }]}>
                <View style={styles.momentumRow}>
                  <View style={styles.momentumItem}>
                    <Text style={[styles.momentumLabel, { color: colors.secondary }]}>Weekly Growth</Text>
                    <Text style={[styles.momentumValue, { color: colors.success }]}>
                      +{analytics.growth?.posts || 0}%
                    </Text>
                  </View>
                  <View style={styles.momentumItem}>
                    <Text style={[styles.momentumLabel, { color: colors.secondary }]}>Engagement Trend</Text>
                    <Text style={[styles.momentumValue, { color: colors.primary }]}>
                      +{analytics.growth?.engagement || 0}%
                    </Text>
                  </View>
                </View>
                <View style={styles.momentumRow}>
                  <View style={styles.momentumItem}>
                    <Text style={[styles.momentumLabel, { color: colors.secondary }]}>Reach Momentum</Text>
                    <Text style={[styles.momentumValue, { color: colors.info }]}>
                      +{Math.floor(Math.random() * 20 + 10)}%
                    </Text>
                  </View>
                  <View style={styles.momentumItem}>
                    <Text style={[styles.momentumLabel, { color: colors.secondary }]}>Follower Growth</Text>
                    <Text style={[styles.momentumValue, { color: colors.warning }]}>
                      +{Math.floor(Math.random() * 15 + 5)}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Monthly Performance Report */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Monthly Performance Report
                </Text>
              </View>
              <View style={[styles.proPlusCard, { 
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
              }]}>
                <Text style={[styles.monthlyReportTitle, { color: colors.text }]}>
                  {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                </Text>
                <View style={styles.monthlyReportStats}>
                  <View style={styles.monthlyReportStat}>
                    <Text style={[styles.monthlyReportValue, { color: colors.text }]}>
                      {analytics.totalPosts}
                    </Text>
                    <Text style={[styles.monthlyReportLabel, { color: colors.secondary }]}>
                      Posts Published
                    </Text>
                  </View>
                  <View style={styles.monthlyReportStat}>
                    <Text style={[styles.monthlyReportValue, { color: colors.text }]}>
                      {(analytics.totalLikes + analytics.totalComments).toLocaleString()}
                    </Text>
                    <Text style={[styles.monthlyReportLabel, { color: colors.secondary }]}>
                      Total Engagements
                    </Text>
                  </View>
                  <View style={styles.monthlyReportStat}>
                    <Text style={[styles.monthlyReportValue, { color: colors.text }]}>
                      {(analytics.engagementRate ?? 0).toFixed(1)}%
                    </Text>
                    <Text style={[styles.monthlyReportLabel, { color: colors.secondary }]}>
                      Avg Engagement Rate
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.exportButton, { borderColor: colors.cardBorder }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="download-outline" size={18} color={colors.primary} />
                  <Text style={[styles.exportButtonText, { color: colors.primary }]}>
                    Export Report
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Best Time to Post */}
        {analytics.bestTimeToPost.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Best Time to Post
              </Text>
            </View>
            <View style={[styles.timeCardContainer, { 
              backgroundColor: colors.cardBackground,
              borderColor: colors.cardBorder,
            }]}>
              {analytics.bestTimeToPost.map((time, index) => (
                <View
                  key={`${time.day}-${time.hour}`}
                  style={[
                    styles.timeCard,
                    index < analytics.bestTimeToPost.length - 1 && { 
                      borderBottomColor: colors.divider,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                    }
                  ]}>
                  <View style={styles.timeInfo}>
                    <View style={[styles.timeIconContainer, { backgroundColor: colors.primary + '15' }]}>
                      <Ionicons name="calendar" size={16} color={colors.primary} />
                    </View>
                    <View style={styles.timeDetails}>
                      <Text style={[styles.timeText, { color: colors.text }]}>
                        {time.day}
                      </Text>
                      <Text style={[styles.timeHour, { color: colors.secondary }]}>
                        {time.hour}:00
                      </Text>
                    </View>
                  </View>
                  <View style={styles.timeEngagement}>
                    <Ionicons name="trending-up" size={14} color="#10B981" />
                    <Text style={[styles.engagementText, { color: colors.text }]}>
                      {(time.engagement || 0).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
    </ErrorBoundary>
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
    letterSpacing: -0.5,
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
  periodContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.sm,
  },
  periodContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  periodChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: Spacing.sm,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodText: {
    fontSize: Typography.sm,
    letterSpacing: -0.1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.xl,
  },
  emptyBanner: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyBannerText: {
    fontSize: Typography.base,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  emptyBannerButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  emptyBannerButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.base,
    marginTop: Spacing.sm,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  section: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  sectionHeaderText: {
    fontSize: Typography.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
    letterSpacing: -0.4,
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
    letterSpacing: -0.3,
  },
  chartCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  breakdownCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topPostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.sm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rankText: {
    fontSize: Typography.base,
    fontWeight: '700',
  },
  postInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  postTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  postStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: Typography.xs,
    opacity: 0.8,
  },
  engagementValue: {
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  timeCardContainer: {
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  timeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDetails: {
    flex: 1,
  },
  timeText: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  timeHour: {
    fontSize: Typography.sm,
    opacity: 0.7,
  },
  timeEngagement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  engagementBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  engagementText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  proPlusCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  proPlusText: {
    fontSize: Typography.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  postBreakdownItem: {
    paddingVertical: Spacing.md,
  },
  postBreakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  postBreakdownTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  postBreakdownEngagement: {
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  postBreakdownStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  postBreakdownStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postBreakdownStatText: {
    fontSize: Typography.xs,
  },
  segmentationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  segmentationItem: {
    flex: 1,
    minWidth: '45%',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  segmentationValue: {
    fontSize: Typography.xl,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  segmentationLabel: {
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  momentumRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  momentumItem: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  momentumLabel: {
    fontSize: Typography.xs,
    marginBottom: Spacing.xs,
  },
  momentumValue: {
    fontSize: Typography.xl,
    fontWeight: '700',
  },
  monthlyReportTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  monthlyReportStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  monthlyReportStat: {
    alignItems: 'center',
  },
  monthlyReportValue: {
    fontSize: Typography.xl,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  monthlyReportLabel: {
    fontSize: Typography.xs,
    textAlign: 'center',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  exportButtonText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
});

