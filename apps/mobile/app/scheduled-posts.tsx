import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Text, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { getScheduledPosts, deleteScheduledPost, canUseAdvancedScheduling } from '@/lib/services/scheduledPostsService';
import { ScheduledPost } from '@/lib/services/scheduledPostsService';
import { getSubscriptionTier } from '@/lib/services/subscriptionService';
import { useFocusEffect } from '@react-navigation/native';

export default function ScheduledPostsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const haptics = useHapticFeedback();
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [canUseAdvanced, setCanUseAdvanced] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'pro-plus'>('free');

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const tier = await getSubscriptionTier();
    setSubscriptionTier(tier);
    const canUse = await canUseAdvancedScheduling();
    setCanUseAdvanced(canUse);
    await loadScheduledPosts();
  };

  const loadScheduledPosts = async () => {
    setLoading(true);
    try {
      const posts = await getScheduledPosts();
      setScheduledPosts(posts);
    } catch (error) {
      console.error('Error loading scheduled posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadScheduledPosts();
  }, []);

  const handleDelete = async (id: string) => {
    haptics.light();
    Alert.alert(
      'Delete Scheduled Post',
      'Are you sure you want to delete this scheduled post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteScheduledPost(id);
              haptics.success();
              await loadScheduledPosts();
            } catch (error) {
              console.error('Error deleting scheduled post:', error);
              Alert.alert('Error', 'Failed to delete scheduled post.');
            }
          },
        },
      ]
    );
  };

  const formatScheduledTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return 'Soon';
    }
  };

  if (subscriptionTier !== 'pro-plus') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>Scheduled Posts</ThemedText>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={64} color={colors.secondary} />
          <ThemedText type="title" style={[styles.lockedTitle, { color: colors.text }]}>
            Advanced Scheduling
          </ThemedText>
          <ThemedText style={[styles.lockedMessage, { color: colors.secondary }]}>
            Advanced scheduling queue is available for Premium subscribers. Upgrade to schedule multiple posts and manage your content queue.
          </ThemedText>
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/settings/subscription-info')}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
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
        <ThemedText type="title" style={styles.title}>Scheduled Posts</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.center}>
            <Text style={[styles.loadingText, { color: colors.secondary }]}>Loading...</Text>
          </View>
        ) : scheduledPosts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={colors.secondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Scheduled Posts</Text>
            <Text style={[styles.emptyMessage, { color: colors.secondary }]}>
              Schedule posts from the create screen to see them here.
            </Text>
          </View>
        ) : (
          scheduledPosts.map((post) => (
            <View
              key={post.id}
              style={[styles.postCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
            >
              <View style={styles.postHeader}>
                <View style={styles.postInfo}>
                  <Text style={[styles.postTitle, { color: colors.text }]} numberOfLines={2}>
                    {post.postData.title || post.postData.content?.substring(0, 50) || 'Untitled Post'}
                  </Text>
                  <View style={styles.postMeta}>
                    <Ionicons name="time-outline" size={14} color={colors.secondary} />
                    <Text style={[styles.postTime, { color: colors.secondary }]}>
                      {formatScheduledTime(post.scheduledFor)}
                    </Text>
                    <Text style={[styles.postDate, { color: colors.secondary }]}>
                      {' · '}
                      {new Date(post.scheduledFor).toLocaleString()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(post.id)}
                  style={styles.deleteButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
              {post.postData.media && post.postData.media.length > 0 && (
                <View style={styles.mediaIndicator}>
                  <Ionicons name="images-outline" size={16} color={colors.secondary} />
                  <Text style={[styles.mediaCount, { color: colors.secondary }]}>
                    {post.postData.media.length} media
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.base,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyMessage: {
    fontSize: Typography.base,
    textAlign: 'center',
  },
  postCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  postInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  postTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postTime: {
    fontSize: Typography.sm,
  },
  postDate: {
    fontSize: Typography.sm,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  mediaIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  mediaCount: {
    fontSize: Typography.xs,
  },
});
