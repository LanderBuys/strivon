import { useState, useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, View, Dimensions, RefreshControl, TouchableOpacity, Text, Alert, FlatList, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { User, Post } from '@/types/post';
import { ThemedText } from '@/components/themed-text';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { type ProfileViewMode } from '@/components/profile/ProfileTabs';
import { PostCard } from '@/components/feed/PostCard';
import { ProfilePostGrid } from '@/components/profile/ProfilePostGrid';
import { EmptyState } from '@/components/EmptyState';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { getUserById, getFollowers, getFollowing, isFollowing } from '@/lib/api/users';
import { getFeedPosts, votePoll } from '@/lib/api/posts';
import { Colors, Spacing, Typography, BorderRadius, hexToRgba } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { FollowButton } from '@/components/profile/FollowButton';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { useUserBadges } from '@/hooks/useUserBadges';
import { useReportBlock } from '@/hooks/useReportBlock';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const screenWidth = Dimensions.get('window').width;

export default function UserProfileScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const currentUserId = useCurrentUserId();
  const [user, setUser] = useState<User | null>(null);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [viewMode, setViewMode] = useState<ProfileViewMode>('grid');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followers, setFollowers] = useState(1247);
  const [following, setFollowing] = useState(89);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  
  // Get user badges
  const { badges, activeStatus, activeStreak } = useUserBadges(user);
  const { getReportBlockOptions } = useReportBlock();

  // Ensure id is always a string
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const isOwnProfile = id === currentUserId;

  useEffect(() => {
    if (id) {
      loadProfile();
    }
  }, [id]);

  // Refresh profile when screen comes into focus (e.g., after following/unfollowing)
  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadProfile();
      }
    }, [id])
  );

  const loadProfile = async () => {
    if (!id) return;
    try {
      setError(null);
      setLoading(true);
      const fetchedUser = await getUserById(id);
      if (fetchedUser) {
        setUser(fetchedUser);
        // Load follow status
        if (id !== currentUserId) {
          const followingStatus = await isFollowing(currentUserId, id);
          setIsFollowingUser(followingStatus);
        }
        // Load follower/following counts
        const followersList = await getFollowers(id);
        const followingList = await getFollowing(id);
        setFollowers(followersList.length || 1247);
        setFollowing(followingList.length || 89);
      } else {
        setError('User not found');
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
      const response = await getFeedPosts('for-you', 1, 100);
      if (response && response.data) {
        setAllPosts(response.data);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setError('Failed to load posts');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user, loadPosts]);

  const onRefresh = useCallback(() => {
    haptics.light();
    loadProfile();
    loadPosts(true);
  }, [loadPosts, haptics]);

  const filteredPosts = useMemo(() => {
    if (!user || !allPosts || allPosts.length === 0) return [];
    try {
      return allPosts.filter((post) => post && post.author && post.author.id === user.id);
    } catch (err) {
      console.error('Error filtering posts:', err);
      return [];
    }
  }, [allPosts, user]);

  const postsCount = useMemo(() => {
    if (!user || !allPosts || allPosts.length === 0) return 0;
    try {
      return allPosts.filter((post) => post && post.author && post.author.id === user.id).length;
    } catch (err) {
      console.error('Error counting posts:', err);
      return 0;
    }
  }, [allPosts, user]);

  const handleLike = useCallback((postId: string) => {
    setAllPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  }, []);

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

    if (post.poll.userVote === optionId) {
      return;
    }

    const previousPoll = JSON.parse(JSON.stringify(post.poll));

    setAllPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId && p.poll) {
          const updatedPoll = { ...p.poll };
          
          if (updatedPoll.userVote) {
            const previousOption = updatedPoll.options.find((opt: any) => opt.id === updatedPoll.userVote);
            if (previousOption) {
              previousOption.votes = Math.max(0, previousOption.votes - 1);
            }
          }
          
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
      setAllPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId ? { ...p, poll: previousPoll } : p
        )
      );
    }
  }, [allPosts]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <LoadingOverlay visible={true} message="Loading profile..." fullScreen={false} />
      </SafeAreaView>
    );
  }

  if (error && !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={[styles.center, { padding: Spacing.lg }]}>
          <View style={[styles.errorIconWrap, { backgroundColor: (colors.error || '#DC2626') + '18' }]}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error || '#DC2626'} />
          </View>
          <ThemedText style={[styles.errorTitle, { color: colors.text }]}>Couldn't load profile</ThemedText>
          <ThemedText style={[styles.errorMessage, { color: colors.secondary }]}>{error}</ThemedText>
          <View style={styles.errorActions}>
            <TouchableOpacity
              style={[styles.errorButton, { backgroundColor: colors.primary }]}
              onPress={() => { haptics.light(); loadProfile(); }}
              activeOpacity={0.8}
              accessibilityLabel="Try again"
              accessibilityRole="button"
            >
              <ThemedText style={styles.errorButtonText}>Try again</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.errorButtonSecondary, { borderColor: colors.cardBorder }]}
              onPress={() => router.back()}
              activeOpacity={0.8}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <ThemedText style={[styles.errorButtonSecondaryText, { color: colors.text }]}>Go back</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <ThemedText>User not found</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{user.name}</Text>
        {id !== currentUserId && id !== '1' ? (
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              const opts = getReportBlockOptions({ id: user.id, name: user.name, handle: user.handle, avatar: user.avatar });
              if (opts.length === 0) return;
              Alert.alert('Options', '', [...opts.map((o) => ({ text: o.text, style: o.style, onPress: o.onPress })), { text: 'Cancel', style: 'cancel' }]);
            }}
            style={[styles.backButton, styles.topBarRightButton]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.topBarRightPlaceholder} />
        )}
      </View>
      <View style={styles.bannerWrapper}>
        <ProfileHeader 
          user={user} 
          activeStatus={activeStatus}
          activeStreak={activeStreak}
          showFollowButton={id !== currentUserId}
          followButtonBelowStats={id !== currentUserId}
          onFollowChange={async (following) => {
            setIsFollowingUser(following);
            // Reload actual follower/following counts
            try {
              const followersList = await getFollowers(id);
              const followingList = await getFollowing(id);
              setFollowers(followersList.length);
              setFollowing(followingList.length);
            } catch (error) {
              console.error('Error refreshing counts:', error);
            }
          }}
        />
      </View>
      <View style={styles.headerContent}>
        <ProfileStats
          followers={followers}
          following={following}
          posts={postsCount}
          onFollowersPress={() => {
            haptics.light();
            router.push(`/profile/${id}/followers`);
          }}
          onFollowingPress={() => {
            haptics.light();
            router.push(`/profile/${id}/following`);
          }}
        />
        {id !== currentUserId && user?.id && (
          <View style={styles.actionsRow}>
            <View style={styles.followButtonWrap}>
              <FollowButton
                userId={user.id}
                onFollowChange={async (following) => {
                  setIsFollowingUser(following);
                  try {
                    const [followersList, followingList] = await Promise.all([getFollowers(id), getFollowing(id)]);
                    setFollowers(followersList.length);
                    setFollowing(followingList.length);
                  } catch (e) {
                    console.error('Error refreshing counts:', e);
                  }
                }}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.messageButton,
                {
                  backgroundColor: colorScheme === 'dark' ? hexToRgba(colors.text, 0.12) : hexToRgba(colors.text, 0.06),
                  borderColor: colorScheme === 'dark' ? hexToRgba(colors.text, 0.2) : hexToRgba(colors.text, 0.12),
                  ...Platform.select({
                    ios: {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.06,
                      shadowRadius: 3,
                    },
                    android: { elevation: 2 },
                  }),
                },
              ]}
              onPress={() => { haptics.light(); router.push(`/chat/${user.id}` as any); }}
              activeOpacity={0.7}
            >
              <Ionicons name="mail-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}
        <View style={[styles.headerDivider, { backgroundColor: hexToRgba(colors.text, 0.15) }]} />
        <View style={styles.headerBottomSpacer} />
      </View>
    </View>
  );

  const getEmptyState = () => ({
    icon: 'document-text-outline' as const,
    title: 'No posts yet',
    message: "This user hasn't shared anything yet",
  });

  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
  );
  const listEmpty = error ? (
    <View style={styles.center}><ThemedText style={{ color: colors.error }}>{error}</ThemedText></View>
  ) : (
    <EmptyState {...getEmptyState()} />
  );

  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {viewMode === 'grid' ? (
          <ProfilePostGrid
            posts={filteredPosts}
            onLike={handleLike}
            onSave={handleSave}
            onPollVote={handlePollVote}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContent}
            refreshControl={refreshControl}
            ListEmptyComponent={listEmpty}
          />
        ) : (
          <FlatList
            data={filteredPosts}
            keyExtractor={(item, index) => item?.id || `post-${index}`}
            renderItem={({ item }) => {
              if (!item?.id || !item.author?.id || !item.author?.name) return null;
              return (
                <PostCard
                  post={item}
                  onLike={() => handleLike(item.id)}
                  onSave={() => handleSave(item.id)}
                  onPollVote={(optionId) => handlePollVote(item.id, optionId)}
                />
              );
            }}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContent}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
            ListEmptyComponent={listEmpty}
          />
        )}
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
  headerContainer: {
    width: '100%',
    marginTop: 0,
    paddingTop: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  backButton: {
    padding: Spacing.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginLeft: -Spacing.xs,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  topBarRightPlaceholder: {
    width: 44,
    marginRight: -Spacing.xs,
  },
  topBarRightButton: {
    alignItems: 'flex-end',
    marginRight: -Spacing.xs,
  },
  bannerWrapper: {
    width: screenWidth,
    marginLeft: -Spacing.md,
    marginTop: 0,
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  headerContent: {
    width: '100%',
    paddingHorizontal: Spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 10,
    marginBottom: 14,
  },
  followButtonWrap: {
    flex: 1,
  },
  messageButton: {
    width: 44,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDivider: {
    height: 1,
    width: '100%',
    marginTop: 0,
    opacity: 1,
  },
  headerBottomSpacer: {
    height: Spacing.sm,
    width: '100%',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: Typography.sm,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    maxWidth: 280,
  },
  errorActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  errorButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  errorButtonSecondary: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  errorButtonSecondaryText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
});
