import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { StyleSheet, FlatList, View, Dimensions, RefreshControl, TouchableOpacity, Modal, Pressable, Text, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { User, Post } from '@/types/post';
import { ThemedText } from '@/components/themed-text';
import { ProfileHeader, BANNER_HEIGHT } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { ProfileEditModal } from '@/components/profile/ProfileEditModal';
import { ProfileCustomizationModal } from '@/components/profile/ProfileCustomizationModal';
import { PostCard } from '@/components/feed/PostCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { getUserById, updateUserProfile, getFollowers, getFollowing } from '@/lib/api/users';
import { getFeedPosts, votePoll } from '@/lib/api/posts';
import { Colors, Spacing, BorderRadius, Typography, hexToRgba } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useRouter } from 'expo-router';
import { getCurrentUserIdOrFallback } from '@/lib/api/users';
import { getProfilePageCustomization } from '@/lib/services/badgePerksService';
import { getUserMetrics, updateSubscriptionTier } from '@/lib/services/userMetricsService';
import { canUseAdvancedProfileCustomization, canUseAdvancedAnalytics, getSubscriptionTier, PREMIUM_TIER_DISPLAY_NAME } from '@/lib/services/subscriptionService';

const screenWidth = Dimensions.get('window').width;

type ProfileTabType = 'posts' | 'saved';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const router = useRouter();
  const [user, setUser] = useState<(User & { bio?: string; banner?: string | null; occupation?: string; country?: string; joinDate?: string }) | null>(null);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTabType>('posts');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [canCustomize, setCanCustomize] = useState(false);
  const [canUseAnalytics, setCanUseAnalytics] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [pageCustomization, setPageCustomization] = useState<{
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    postCardBackgroundColor?: string;
    postCardBackgroundImage?: string;
    postCardTextColor?: string;
  }>({});
  const [customizationKey, setCustomizationKey] = useState(0);
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'pro-plus'>('free');
  
  // Active status and streak
  const [activeStatus] = useState(false);
  const [activeStreak] = useState(0);

  // Load subscription tier
  useEffect(() => {
    loadSubscriptionTier();
  }, []);

  const loadSubscriptionTier = async () => {
    try {
      const tier = await getSubscriptionTier();
      setSubscriptionTier(tier); // 'free' | 'pro' | 'pro-plus'
    } catch (error) {
      console.error('Error loading subscription tier:', error);
      setSubscriptionTier('free');
    }
  };

  const handleToggleSubscription = async () => {
    haptics.medium();
    let newTier: 'pro' | 'pro-plus' | undefined;
    let tierName: string;
    
    // Cycle through: free → pro → pro-plus → free
    if (subscriptionTier === 'free' || !subscriptionTier) {
      newTier = 'pro';
      tierName = 'Pro';
    } else if (subscriptionTier === 'pro') {
      newTier = 'pro-plus';
      tierName = PREMIUM_TIER_DISPLAY_NAME;
    } else {
      newTier = undefined; // Back to free
      tierName = 'Free';
    }
    
    try {
      await updateSubscriptionTier(newTier);
      setSubscriptionTier(newTier || 'free');
      // Refresh customization access
      await checkCustomizationAccess();
      haptics.success();
      
      // Show success message
      Alert.alert(
        'Subscription Updated',
        `You are now on the ${tierName} plan. Premium features are now ${newTier ? 'enabled' : 'disabled'}.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error updating subscription tier:', error);
      haptics.error();
      Alert.alert('Error', 'Failed to update subscription tier. Please try again.');
    }
  };

  // Load page customizations
  const loadPageCustomization = useCallback(async () => {
    if (user) {
      const customization = await getProfilePageCustomization();
      // Create new object reference to force re-render
      setPageCustomization({ ...customization });
      setCustomizationKey(prev => prev + 1);
    }
  }, [user]);

  useEffect(() => {
    loadPageCustomization();
  }, [loadPageCustomization]);

  // Reload customizations when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadPageCustomization();
      loadSubscriptionTier();
      checkCustomizationAccess();
      checkAnalyticsAccess();
    }, [loadPageCustomization])
  );

  const checkCustomizationAccess = async () => {
    const hasAccess = await canUseAdvancedProfileCustomization();
    setCanCustomize(hasAccess);
  };

  const checkAnalyticsAccess = async () => {
    const hasAccess = await canUseAdvancedAnalytics();
    setCanUseAnalytics(hasAccess);
  };

  useEffect(() => {
    checkCustomizationAccess();
    checkAnalyticsAccess();
    loadSubscriptionTier();
  }, []);

  useEffect(() => {
    loadFollowerCounts();
  }, [user]);

  const loadFollowerCounts = async () => {
    if (!user) return;
    try {
      const followersList = await getFollowers(user.id);
      const followingList = await getFollowing(user.id);
      setFollowers(followersList.length);
      setFollowing(followingList.length);

      const { updateUserMetrics } = await import('@/lib/services/userMetricsService');
      await updateUserMetrics({ followers: followersList.length });
    } catch (error) {
      console.error('Error loading follower counts:', error);
      // Keep previous counts on error; do not overwrite with fallbacks
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setError(null);
      // In real app, get current user
      const fetchedUser = await getUserById(getCurrentUserIdOrFallback());
      if (fetchedUser) {
        setUser(fetchedUser);
        
        // Initialize metrics if not already done
        const { initializeUserMetrics } = await import('@/lib/services/userMetricsService');
        await initializeUserMetrics();
        
        // Record today's activity to ensure user gets at least the Active badge
        const { recordActivity } = await import('@/lib/services/activityService');
        await recordActivity('post'); // Record a generic activity for today
      } else {
        setError('Failed to load user profile');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = useCallback(async (isRefresh = false) => {
    if (!user) return;

    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      }
      const response = await getFeedPosts('for-you', 1, 100); // Get more posts for profile
      // In real app, filter by user ID for posts
      // For reposts and saved, fetch from user's reposts/saved collections
      if (response && response.data) {
        setAllPosts(response.data);

        // Update post count in metrics
        const userPosts = response.data.filter((post) => post && post.author && post.author.id === user.id);
        const { updateUserMetrics } = await import('@/lib/services/userMetricsService');
        await updateUserMetrics({ posts: userPosts.length });
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setError('Failed to load posts');
      // Don't clear existing posts on error, just show error
    } finally {
      if (isRefresh) {
        setRefreshing(false);
        haptics.success();
      }
    }
  }, [user, haptics]);

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user, loadPosts]);

  // Refresh posts when screen comes into focus (e.g., after creating a post)
  useFocusEffect(
    useCallback(() => {
      if (user) {
        // Only refresh if we have a user, and add a small delay to avoid race conditions
        const timeoutId = setTimeout(() => {
          loadPosts(false);
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    }, [user, loadPosts])
  );

  const onRefresh = useCallback(() => {
    haptics.light();
    loadProfile();
    loadPosts(true);
    getProfilePageCustomization().then(setPageCustomization);
  }, [loadPosts, haptics]);

  const handleSaveProfile = async (updates: Partial<User & { bio?: string; banner?: string | null; occupation?: string; country?: string }>) => {
    if (!user) return;
    
    try {
      // Call API to update user profile
      await updateUserProfile(user.id, updates);
      
      // Update local state with the changes
      setUser({ ...user, ...updates });
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error; // Re-throw so the modal can handle it
    }
  };

  const handleFollowersPress = useCallback(() => {
    haptics.light();
    if (user) {
      router.push(`/profile/${user.id}/followers`);
    }
  }, [haptics, user, router]);

  const handleFollowingPress = useCallback(() => {
    haptics.light();
    if (user) {
      router.push(`/profile/${user.id}/following`);
    }
  }, [haptics, user, router]);

  const handlePostsPress = useCallback(() => {
    haptics.light();
    // Scroll to top or focus on posts tab
    setActiveTab('posts');
  }, [haptics]);

  // Filter posts based on active tab
  const filteredPosts = useMemo(() => {
    if (!user || !allPosts || allPosts.length === 0) return [];
    
    try {
      if (activeTab === 'posts') {
        // Show user's own posts (in real app, filter by author.id === user.id)
        return allPosts.filter((post) => post && post.author && post.author.id === user.id);
      } else if (activeTab === 'saved') {
        // Show saved posts (private - only visible to user)
        return allPosts.filter((post) => post && post.isSaved === true);
      }
    } catch (err) {
      console.error('Error filtering posts:', err);
      return [];
    }
    return [];
  }, [allPosts, activeTab, user]);

  const postsCount = useMemo(() => {
    if (!user || !allPosts || allPosts.length === 0) return 0;
    try {
      return allPosts.filter((post) => post && post.author && post.author.id === user.id).length;
    } catch (err) {
      console.error('Error counting posts:', err);
      return 0;
    }
  }, [allPosts, user]);

  const savedCount = useMemo(() => {
    if (!user || !allPosts || allPosts.length === 0) return 0;
    try {
      return allPosts.filter((post) => post && post.isSaved === true).length;
    } catch (err) {
      console.error('Error counting saved posts:', err);
      return 0;
    }
  }, [allPosts, user]);

  const handleLike = useCallback(async (postId: string) => {
    const post = allPosts.find(p => p.id === postId);
    const wasLiked = post?.isLiked;
    
    setAllPosts((prevPosts) =>
      prevPosts.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likes: p.isLiked ? p.likes - 1 : p.likes + 1,
            }
          : p
      )
    );
    haptics.light();
    
    // Track engagement (only when liking, not unliking)
    if (!wasLiked) {
      const { incrementEngagement } = await import('@/lib/services/userMetricsService');
      await incrementEngagement();
    }
  }, [haptics, allPosts]);

  const handleSave = useCallback((postId: string) => {
    setAllPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isSaved: !post.isSaved,
              saves: post.isSaved ? post.saves - 1 : post.saves + 1,
            }
          : post
      )
    );
  }, []);

  const handlePollVote = useCallback(async (postId: string, optionId: string) => {
    const post = allPosts.find(p => p.id === postId);
    if (!post || !post.poll) return;

    // If clicking the same option that's already voted, do nothing
    if (post.poll.userVote === optionId) {
      return;
    }

    // Store previous state for rollback
    const previousPoll = JSON.parse(JSON.stringify(post.poll));

    // Optimistic update - handle vote change
    setAllPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId && p.poll) {
          const updatedPoll = { ...p.poll };
          
          // If user already voted on a different option, remove that vote
          if (updatedPoll.userVote) {
            const previousOption = updatedPoll.options.find((opt: any) => opt.id === updatedPoll.userVote);
            if (previousOption) {
              previousOption.votes = Math.max(0, previousOption.votes - 1);
            }
          }
          
          // Add vote to selected option
          const selectedOption = updatedPoll.options.find((opt: any) => opt.id === optionId);
          if (selectedOption) {
            selectedOption.votes += 1;
            updatedPoll.userVote = optionId;
          }
          
          // Recalculate totalVotes from options to ensure accuracy (one user = one vote)
          updatedPoll.totalVotes = updatedPoll.options.reduce((sum: number, opt: any) => sum + (opt.votes || 0), 0);
          
          return { ...p, poll: updatedPoll };
        }
        return p;
      })
    );

    // API call with rollback on error
    try {
      const updatedPoll = await votePoll(postId, optionId);
      // Update with API response to ensure consistency
      setAllPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId ? { ...p, poll: updatedPoll } : p
        )
      );
    } catch (error) {
      console.error('Error voting on poll:', error);
      // Rollback on error
      setAllPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId ? { ...p, poll: previousPoll } : p
        )
      );
    }
  }, [allPosts]);

  // Get page colors with fallback to theme colors
  const pageBackgroundColor = pageCustomization.backgroundColor || colors.background;
  const pageTextColor = pageCustomization.textColor || colors.text;
  const pageAccentColor = pageCustomization.accentColor || colors.primary;

  // Hooks must run unconditionally (before any early return)
  const getEmptyState = useCallback(() => {
    if (activeTab === 'posts') {
      return {
        icon: 'document-text-outline',
        title: 'No posts yet',
        message: 'Start sharing your journey with the community',
        actions: [
          { label: 'Create post', onPress: () => router.push('/(tabs)/create' as any), variant: 'primary' as const },
        ],
      };
    }
    if (activeTab === 'saved') {
      return {
        icon: 'bookmark-outline',
        title: 'No saved posts yet',
        message: 'Posts you save will appear here',
        actions: [
          { label: 'Go to feed', onPress: () => router.push('/(tabs)' as any), variant: 'secondary' as const },
        ],
      };
    }
    return {
      icon: 'document-text-outline',
      title: 'No posts yet',
      message: 'Start sharing your journey',
      actions: [{ label: 'Create post', onPress: () => router.push('/(tabs)/create' as any), variant: 'primary' as const }],
    };
  }, [activeTab, router]);

  const listHeader = useMemo(
    () =>
      !user ? null : (
        <View style={[styles.header, { backgroundColor: 'transparent', zIndex: 30 }]}>
          <View style={styles.bannerWrapper}>
            <ProfileHeader
              key={`profile-header-${customizationKey}`}
              user={user}
              activeStatus={activeStatus}
              activeStreak={activeStreak}
              pageCustomization={pageCustomization}
            />
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => {
                  haptics.selection();
                  setShowMenu(true);
                }}
                activeOpacity={0.7}
                accessibilityLabel="Profile options menu"
                accessibilityRole="button">
                <Ionicons name="ellipsis-horizontal" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.headerContent}>
            <ProfileStats
              followers={followers}
              following={following}
              posts={postsCount}
              onFollowersPress={handleFollowersPress}
              onFollowingPress={handleFollowingPress}
              onPostsPress={handlePostsPress}
              loading={loading}
              textColor={pageTextColor}
              accentColor={pageAccentColor}
            />
            <ProfileTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              accentColor={pageAccentColor}
              textColor={pageTextColor}
              counts={{
                posts: postsCount,
                saved: savedCount,
              }}
            />
          </View>
        </View>
      ),
    [
      user,
      customizationKey,
      pageCustomization,
      followers,
      following,
      postsCount,
      savedCount,
      activeTab,
      loading,
      pageTextColor,
      pageAccentColor,
      activeStatus,
      activeStreak,
      handleFollowersPress,
      handleFollowingPress,
      handlePostsPress,
      haptics,
    ]
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: pageBackgroundColor }]} edges={['top']}>
        <LoadingOverlay visible={true} message="Loading profile..." fullScreen={false} />
      </SafeAreaView>
    );
  }

  if (error && !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: pageBackgroundColor }]} edges={['top']}>
        <View style={styles.center}>
          <ThemedText style={{ color: colors.error }}>{error}</ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: pageAccentColor }]}
            onPress={() => {
              setLoading(true);
              loadProfile();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: pageBackgroundColor }]}>
        <View style={styles.center}>
          <ThemedText style={{ color: pageTextColor }}>User not found</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <ErrorBoundary>
    <View style={[styles.container, { backgroundColor: pageBackgroundColor }]}>
      <SafeAreaView style={[styles.safeAreaContent, { backgroundColor: pageBackgroundColor }]} edges={['top']}>
        <FlatList
        data={filteredPosts}
        keyExtractor={(item, index) => item?.id || `post-${index}`}
        renderItem={({ item }) => {
          // Aggressive validation
          if (!item || !item.id || !item.author || !item.author.id || !item.author.name) {
            return null;
          }
          // Use the custom post card background color/image/text color if set
          // Pass undefined if not set to allow PostCard to use defaults
          // If the field exists but is empty string, pass null to signal clear
          const postBackgroundColor = pageCustomization.postCardBackgroundColor === '' 
            ? null 
            : (pageCustomization.postCardBackgroundColor || undefined);
          const postBackgroundImage = pageCustomization.postCardBackgroundImage === '' 
            ? null 
            : (pageCustomization.postCardBackgroundImage || undefined);
          const postCardTextColor = pageCustomization.postCardTextColor === '' 
            ? null 
            : (pageCustomization.postCardTextColor || undefined);
          
          return (
            <PostCard
              key={`post-${item.id}-${customizationKey}`}
              post={item}
              onLike={() => handleLike(item.id)}
              onSave={() => handleSave(item.id)}
              onPollVote={(optionId) => handlePollVote(item.id, optionId)}
              backgroundColor={postBackgroundColor}
              backgroundImage={postBackgroundImage}
              textColor={postCardTextColor}
            />
          );
        }}
        ListHeaderComponent={listHeader}
        contentContainerStyle={[
          styles.listContent,
          { backgroundColor: pageBackgroundColor, flexGrow: 1 },
        ]}
        style={[styles.list, { zIndex: 10, backgroundColor: pageBackgroundColor }]}
        removeClippedSubviews={false}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={pageAccentColor}
            colors={[pageAccentColor]}
          />
        }
        ListEmptyComponent={
          error && filteredPosts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={{ color: colors.error, marginBottom: Spacing.md }}>{error}</ThemedText>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setError(null);
                  loadPosts(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <EmptyState {...getEmptyState()} />
          )
        }
      />
      <ProfileEditModal
        visible={showEditModal}
        user={user}
        onClose={async () => {
          setShowEditModal(false);
          // Small delay to ensure storage writes are complete
          await new Promise(resolve => setTimeout(resolve, 100));
        }}
        onSave={handleSaveProfile}
      />
      <ProfileCustomizationModal
        visible={showCustomizationModal}
        onClose={async () => {
          setShowCustomizationModal(false);
          // Small delay to ensure storage writes are complete
          await new Promise(resolve => setTimeout(resolve, 100));
          // Reload customizations
          await loadPageCustomization();
        }}
        onCustomizationChange={async () => {
          // Immediately reload customizations when colors change
          const customization = await getProfilePageCustomization();
          // Create new object reference to force re-render
          setPageCustomization({ ...customization });
          setCustomizationKey(prev => prev + 1);
        }}
      />
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)}>
          <View style={[styles.menuContainer, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.cardBorder }]}
              onPress={() => {
                haptics.selection();
                setShowMenu(false);
                setShowEditModal(true);
              }}
              activeOpacity={0.7}
              accessibilityLabel="Edit profile"
              accessibilityRole="button">
              <IconSymbol name="create-outline" size={20} color={pageAccentColor} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Edit Profile</Text>
            </TouchableOpacity>
            {canCustomize && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  haptics.selection();
                  setShowMenu(false);
                  setShowCustomizationModal(true);
                }}
                activeOpacity={0.7}
                accessibilityLabel="Customization"
                accessibilityRole="button">
                <Ionicons name="color-palette-outline" size={20} color={pageAccentColor} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Customization</Text>
              </TouchableOpacity>
            )}
            {canUseAnalytics && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  haptics.selection();
                  setShowMenu(false);
                  router.push('/analytics');
                }}
                activeOpacity={0.7}
                accessibilityLabel="Analytics"
                accessibilityRole="button">
                <Ionicons name="stats-chart" size={20} color={pageAccentColor} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Analytics</Text>
              </TouchableOpacity>
            )}
            {subscriptionTier === 'pro-plus' && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    haptics.selection();
                    setShowMenu(false);
                    router.push('/scheduled-posts');
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel="Scheduled posts"
                  accessibilityRole="button">
                  <Ionicons name="calendar" size={20} color={pageAccentColor} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Scheduled Posts</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    haptics.selection();
                    setShowMenu(false);
                    router.push('/content-ideas');
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel="Content ideas"
                  accessibilityRole="button">
                  <Ionicons name="bulb" size={20} color={pageAccentColor} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Content Ideas</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                haptics.selection();
                setShowMenu(false);
                handleToggleSubscription();
              }}
              activeOpacity={0.7}
              accessibilityLabel="Subscription"
              accessibilityRole="button">
              <Ionicons name="card-outline" size={20} color={pageAccentColor} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Subscription</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomWidth: 0 }]}
              onPress={() => {
                haptics.selection();
                setShowMenu(false);
                router.push('/settings');
              }}
              activeOpacity={0.7}
              accessibilityLabel="Settings"
              accessibilityRole="button">
              <IconSymbol name="settings-outline" size={20} color={pageAccentColor} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Settings</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      </SafeAreaView>
    </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'visible',
  },
  safeAreaContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    width: '100%',
    minHeight: 100000,
  },
  backgroundImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    top: 0,
    height: 200000,
    zIndex: 0,
    opacity: 0.85,
  },
  bannerAreaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 2,
  },
  backgroundImageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 1,
  },
  header: {
    width: '100%',
    marginTop: 0,
    paddingTop: 0,
    zIndex: 30,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  bannerWrapper: {
    width: screenWidth,
    marginLeft: -Spacing.md,
    marginTop: 0,
    paddingTop: 0,
    paddingHorizontal: 0,
    zIndex: 30,
    position: 'relative',
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  headerContent: {
    width: '100%',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl + Spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  headerButtons: {
    position: 'absolute',
    top: Spacing.md + 8,
    right: Spacing.md + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    zIndex: 50,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Spacing.xl * 2 + 8,
    paddingRight: Spacing.md,
  },
  menuContainer: {
    minWidth: 200,
    borderRadius: BorderRadius.lg + 2,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
    paddingVertical: Spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
  },
  menuItemText: {
    fontSize: Typography.base,
    fontWeight: '600',
    letterSpacing: -0.2,
    flex: 1,
  },
  retryButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 20,
    marginTop: Spacing.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
