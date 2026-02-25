import { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, FlatList, View, RefreshControl, TouchableOpacity, Text, Platform, Animated, InteractionManager, LayoutAnimation, UIManager, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Post, Story } from '@/types/post';
import { PostCard } from '@/components/feed/PostCard';
import { FeedPostRow } from '@/components/feed/FeedPostRow';
import { StoriesBar } from '@/components/stories/StoriesBar';
import { EmptyState } from '@/components/EmptyState';
import { ThemedText } from '@/components/themed-text';
import { FeedTabs, FeedTabType } from '@/components/feed/FeedTabs';
import { PostSkeleton } from '@/components/feed/PostSkeleton';
import { ScrollToTopButton } from '@/components/feed/ScrollToTopButton';
import { ContentFilterType } from '@/components/feed/ContentFilters';
import { SortMenu, SortOption } from '@/components/feed/SortMenu';
import { SearchOverlay } from '@/components/feed/SearchOverlay';
import { FeedScreenHeader } from '@/components/feed/FeedScreenHeader';
import { FeedMediaViewer } from '@/components/feed/FeedMediaViewer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { getFeedPosts, likePost as apiLikePost, savePost as apiSavePost } from '@/lib/api/posts';
import { getStories } from '@/lib/api/stories';
import { getSeenPostIds, addSeenPost } from '@/lib/services/seenPostsService';
import { Colors, Spacing, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useDebounce } from '@/hooks/useDebounce';
import { useReportBlock } from '@/hooks/useReportBlock';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sortPostsUnseenFirst } from '@/lib/utils/feedUtils';
import { addReport } from '@/lib/services/reportQueueService';
import { getRemovedPostIds } from '@/lib/services/reportQueueService';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { checkAndPublishScheduledPosts } from '@/lib/services/scheduledPostsService';

const SKELETON_COUNT = 3;
const FEED_SORT_KEY = '@strivon/feed_sort';
const FEED_FILTER_KEY = '@strivon/feed_filter';
const HEADER_HEIGHT_DEFAULT = 108;
const SEEN_VIEWABLE_MS = 2200;

export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const haptics = useHapticFeedback();
  const insets = useSafeAreaInsets();
  const currentUserId = useCurrentUserId();
  const listRefForYou = useRef<FlatList>(null);
  const listRefFollowing = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down'>('up');
  const forYouScrollYRef = useRef(0);
  const followingScrollYRef = useRef(0);
  const savedScrollOffsetRef = useRef(0);
  const hasReturnedToFeedRef = useRef(false);
  const postsRef = useRef<Post[]>([]);
  const headerHeightRef = useRef(HEADER_HEIGHT_DEFAULT);
  const [headerHeight, setHeaderHeight] = useState(HEADER_HEIGHT_DEFAULT);
  const prevVisibleTabRef = useRef<FeedTabType>('for-you');
  const visibleTabRef = useRef<FeedTabType>('for-you');

  const [forYouPosts, setForYouPosts] = useState<Post[]>([]);
  const [followingPosts, setFollowingPosts] = useState<Post[]>([]);
  const [visibleTab, setVisibleTab] = useState<FeedTabType>('for-you');
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forYouPage, setForYouPage] = useState(1);
  const [followingPage, setFollowingPage] = useState(1);
  const [forYouHasMore, setForYouHasMore] = useState(true);
  const [followingHasMore, setFollowingHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedTabType>('for-you');
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [sortOption, setSortOptionState] = useState<SortOption>('newest');
  const [contentFilter, setContentFilterState] = useState<ContentFilterType>('all');
  const [feedPrefsLoaded, setFeedPrefsLoaded] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [removedPostIds, setRemovedPostIds] = useState<Set<string>>(new Set());

  const setSortOption = useCallback((sort: SortOption) => {
    setSortOptionState(sort);
    AsyncStorage.setItem(FEED_SORT_KEY, sort).catch(() => {});
  }, []);
  const setContentFilter = useCallback((filter: ContentFilterType) => {
    setContentFilterState(filter);
    AsyncStorage.setItem(FEED_FILTER_KEY, filter).catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [storedSort, storedFilter] = await Promise.all([
          AsyncStorage.getItem(FEED_SORT_KEY),
          AsyncStorage.getItem(FEED_FILTER_KEY),
        ]);
        if (mounted) {
          if (storedSort && ['newest', 'popular', 'trending'].includes(storedSort)) {
            setSortOptionState(storedSort as SortOption);
          }
          if (storedFilter && ['all', 'media', 'text', 'links'].includes(storedFilter)) {
            setContentFilterState(storedFilter as ContentFilterType);
          }
          setFeedPrefsLoaded(true);
        }
      } catch (_) {
        if (mounted) setFeedPrefsLoaded(true);
      }
    })();
    return () => { mounted = false; };
  }, []);
  const [mediaViewerPostId, setMediaViewerPostId] = useState<string | null>(null);
  const [skipNextEnterAnimation, setSkipNextEnterAnimation] = useState(false);
  const returnToMediaViewerPostIdRef = useRef<string | null>(null);

  const { getReportBlockOptions } = useReportBlock();

  useFocusEffect(
    useCallback(() => {
      getRemovedPostIds().then(setRemovedPostIds);
    }, [])
  );

  const posts = useMemo(() => {
    const list = visibleTab === 'for-you' ? forYouPosts : followingPosts;
    if (removedPostIds.size === 0) return list;
    return list.filter((p) => !removedPostIds.has(p.id));
  }, [visibleTab, forYouPosts, followingPosts, removedPostIds]);

  const handleReportPost = useCallback((post: Post) => {
    const reasons = ['Spam', 'Harassment or bullying', 'Inappropriate content', 'Gore or violence', 'Scam or fraud', 'Misinformation', 'Other'];
    Alert.alert(
      'Report post',
      'Why are you reporting this post?',
      [
        ...reasons.map((reason) => ({
          text: reason,
          onPress: async () => {
            await addReport({
              type: 'post',
              targetUserId: post.author?.id ?? '',
              targetUserName: post.author?.name,
              targetUserHandle: post.author?.handle,
              targetPostId: post.id,
              targetPostPreview: (post.content || post.title || '').slice(0, 300),
              reason,
              reporterId: currentUserId,
            });
          },
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  }, [currentUserId]);

  const page = visibleTab === 'for-you' ? forYouPage : followingPage;
  const hasMore = visibleTab === 'for-you' ? forYouHasMore : followingHasMore;
  const forYouPageRef = useRef(1);
  const followingPageRef = useRef(1);
  useEffect(() => {
    forYouPageRef.current = forYouPage;
    followingPageRef.current = followingPage;
  }, [forYouPage, followingPage]);

  const setCurrentPosts = useCallback(
    (updater: (prev: Post[]) => Post[]) => {
      if (visibleTab === 'for-you') setForYouPosts(updater);
      else setFollowingPosts(updater);
    },
    [visibleTab]
  );
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const [, setSeenTick] = useState(0); // bump to re-render when a post is marked seen (view indicator)
  const viewableTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const prevViewableIdsRef = useRef<Set<string>>(new Set());

  const pageRef = useRef(page);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);
  const activeTabPageRef = useRef(1);
  useEffect(() => {
    activeTabPageRef.current = activeTab === 'for-you' ? forYouPage : followingPage;
  }, [activeTab, forYouPage, followingPage]);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  useEffect(() => {
    visibleTabRef.current = visibleTab;
  }, [visibleTab]);

  const showScrollToTopRef = useRef(false);
  const isAtTopRef = useRef(true);

  // Shared scroll state (header, scroll-to-top) so we can call it from either list
  const applyScrollState = useCallback((offsetY: number) => {
    const shouldShow = offsetY > 300;
    if (showScrollToTopRef.current !== shouldShow) {
      showScrollToTopRef.current = shouldShow;
      setShowScrollToTop(shouldShow);
    }
    const isAtTop = offsetY <= 10;
    if (isAtTop) {
      if (!isAtTopRef.current || scrollDirection.current !== 'up') {
        isAtTopRef.current = true;
        scrollDirection.current = 'up';
        headerTranslateY.stopAnimation();
        headerTranslateY.setValue(0);
        setHeaderVisible(true);
        lastScrollY.current = 0;
        return;
      }
    } else {
      isAtTopRef.current = false;
    }
    const currentScrollY = offsetY;
    const scrollDiff = currentScrollY - lastScrollY.current;
    if (Math.abs(scrollDiff) > 5) {
      if (scrollDiff > 0 && currentScrollY > 100) {
        if (scrollDirection.current !== 'down') {
          scrollDirection.current = 'down';
          Animated.spring(headerTranslateY, {
            toValue: -100,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
          }).start();
          setHeaderVisible(false);
        }
      } else if (scrollDiff < 0) {
        if (scrollDirection.current !== 'up') {
          scrollDirection.current = 'up';
          Animated.spring(headerTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
          }).start();
          setHeaderVisible(true);
        }
      }
    }
    lastScrollY.current = currentScrollY;
  }, [headerTranslateY]);

  const handleScrollForYou = useMemo(() => Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false, listener: (e: any) => { const y = e.nativeEvent.contentOffset.y; forYouScrollYRef.current = y; applyScrollState(y); } }
  ), [applyScrollState, scrollY]);

  const handleScrollFollowing = useMemo(() => Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false, listener: (e: any) => { const y = e.nativeEvent.contentOffset.y; followingScrollYRef.current = y; applyScrollState(y); } }
  ), [applyScrollState, scrollY]);

  const loadStories = useCallback(async () => {
    try {
      const fetchedStories = await getStories();
      setStories(fetchedStories);
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  }, []);

  const loadUnreadNotifications = useCallback(async () => {
    try {
      const { getUnreadNotificationCount } = await import('@/lib/api/notifications');
      const count = await getUnreadNotificationCount();
      setUnreadNotifications(count);
      // Update badge count
      const { notificationService } = await import('@/lib/services/notificationService');
      await notificationService.setBadgeCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  const loadPosts = useCallback(async (isRefresh = false, forTab?: FeedTabType) => {
    const tab = forTab ?? activeTab;
    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
        if (tab === 'for-you') {
          setForYouPage(1);
          forYouPageRef.current = 1;
        } else {
          setFollowingPage(1);
          followingPageRef.current = 1;
        }
      } else {
        setLoading(true);
      }

      const currentPage = isRefresh ? 1 : (tab === 'for-you' ? forYouPageRef.current : followingPageRef.current);
      const response = await getFeedPosts(tab, currentPage, 10, sortOption, contentFilter);

      if (response && response.data) {
        const seenIds = await getSeenPostIds();
        seenIdsRef.current = seenIds;
        const sorted = sortPostsUnseenFirst(response.data, seenIds);

        if (isRefresh) {
          if (tab === 'for-you') {
            setForYouPosts(sorted);
          } else {
            setFollowingPosts(sorted);
          }
          if (tab === 'for-you') setForYouHasMore(response.hasMore ?? false);
          else setFollowingHasMore(response.hasMore ?? false);
          if (tab === 'for-you') {
            setForYouPage(2);
            forYouPageRef.current = 2;
          } else {
            setFollowingPage(2);
            followingPageRef.current = 2;
          }
        } else {
          if (tab === 'for-you') {
            setForYouPosts(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newPosts = response.data.filter(p => !existingIds.has(p.id));
              return sortPostsUnseenFirst([...prev, ...newPosts], seenIds);
            });
            setForYouHasMore(response.hasMore ?? false);
            setForYouPage(p => p + 1);
            forYouPageRef.current = forYouPageRef.current + 1;
          } else {
            setFollowingPosts(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newPosts = response.data.filter(p => !existingIds.has(p.id));
              return sortPostsUnseenFirst([...prev, ...newPosts], seenIds);
            });
            setFollowingHasMore(response.hasMore ?? false);
            setFollowingPage(p => p + 1);
            followingPageRef.current = followingPageRef.current + 1;
          }
        }
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load posts';
      setError(errorMessage.includes('network') || errorMessage.includes('Network')
        ? 'Network error. Please check your connection.'
        : 'Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, sortOption, contentFilter]);

  // Reset header state function
  const resetHeaderState = useCallback(() => {
    // Stop any ongoing animations
    headerTranslateY.stopAnimation();
    // Immediately reset to 0
    headerTranslateY.setValue(0);
    setHeaderVisible(true);
    scrollDirection.current = 'up';
    lastScrollY.current = 0;
  }, [headerTranslateY]);

  // Reset header on mount
  useLayoutEffect(() => {
    resetHeaderState();
  }, [resetHeaderState]);

  useEffect(() => {
    loadStories();
    loadUnreadNotifications();
  }, [loadStories, loadUnreadNotifications]);

  useEffect(() => {
    getSeenPostIds().then((s) => {
      seenIdsRef.current = s;
    });
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    return () => {
      viewableTimeoutsRef.current.forEach((t) => clearTimeout(t));
      viewableTimeoutsRef.current.clear();
    };
  }, []);

  // Refresh feed when screen comes into focus (e.g., after creating a post). Skip initial load here to avoid duplicate request with useEffect.
  useFocusEffect(
    useCallback(() => {
      // If we navigated to thread from the media viewer, reopen the viewer when coming back
      const postIdToReopen = returnToMediaViewerPostIdRef.current;
      if (postIdToReopen) {
        returnToMediaViewerPostIdRef.current = null;
        setMediaViewerPostId(postIdToReopen);
      }

      // Reset header animation state immediately when returning to feed
      resetHeaderState();
      
      // Reset scroll position to top immediately and after interactions
      requestAnimationFrame(() => {
        const ref = visibleTabRef.current === 'for-you' ? listRefForYou : listRefFollowing;
        ref.current?.scrollToOffset({ offset: 0, animated: false });
      });
      
      InteractionManager.runAfterInteractions(() => {
        const ref = visibleTabRef.current === 'for-you' ? listRefForYou : listRefFollowing;
        ref.current?.scrollToOffset({ offset: 0, animated: false });
        resetHeaderState();
      });
      
      // Publish any scheduled posts that are due (fire-and-forget)
      checkAndPublishScheduledPosts().catch(() => {});

      // Only refresh posts when returning to feed (not on first mount; useEffect handles initial load)
      if (hasReturnedToFeedRef.current) {
        loadPosts(true);
        loadStories();
        loadUnreadNotifications();
      } else {
        hasReturnedToFeedRef.current = true;
        loadStories();
        loadUnreadNotifications();
      }
    }, [loadPosts, loadStories, loadUnreadNotifications, resetHeaderState])
  );

  // Load feed after prefs are loaded, and when tab, sort, or filter changes. Keep previous list visible while loading.
  useEffect(() => {
    if (!feedPrefsLoaded) return;
    setSkipNextEnterAnimation(true);
    setError(null);
    if (activeTab === 'for-you') {
      setForYouPage(1);
      setForYouHasMore(true);
    } else {
      setFollowingPage(1);
      setFollowingHasMore(true);
    }
    loadPosts(true);
  }, [feedPrefsLoaded, activeTab, sortOption, contentFilter, loadPosts]);

  useEffect(() => {
    if (!skipNextEnterAnimation) return;
    const id = requestAnimationFrame(() => setSkipNextEnterAnimation(false));
    return () => cancelAnimationFrame(id);
  }, [posts, skipNextEnterAnimation]);

  // Restore scroll position when switching tabs so the screen doesn't jump
  const prevVisibleTabRefForEffect = useRef(visibleTab);
  useEffect(() => {
    if (prevVisibleTabRefForEffect.current === visibleTab) return;
    prevVisibleTabRefForEffect.current = visibleTab;
    const offset = savedScrollOffsetRef.current;
    const listRef = visibleTab === 'for-you' ? listRefForYou : listRefFollowing;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset, animated: false });
      applyScrollState(offset);
    });
  }, [visibleTab, applyScrollState]);


  const handleRetry = useCallback(() => {
    haptics.medium();
    setError(null);
    loadPosts(true);
  }, [loadPosts, haptics]);

  const onRefresh = useCallback(() => {
    haptics.light();
    loadStories();
    loadPosts(true);
  }, [loadPosts, loadStories, haptics]);

  const handleScrollToTop = useCallback(() => {
    const listRef = visibleTab === 'for-you' ? listRefForYou : listRefFollowing;
    listRef.current?.scrollToOffset({
      offset: 0,
      animated: true,
    });
  }, [visibleTab]);

  const handleLike = useCallback(async (postId: string) => {
    let wasLiked = false;
    setCurrentPosts(prevPosts => {
      const post = prevPosts.find(p => p.id === postId);
      wasLiked = post?.isLiked ?? false;
      return prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      );
    });
    haptics.light();
    try {
      const result = await apiLikePost(postId);
      setCurrentPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, isLiked: result.isLiked, likes: result.likes } : post
        )
      );
      if (!wasLiked) {
        const { incrementEngagement } = await import('@/lib/services/userMetricsService');
        await incrementEngagement();
      }
    } catch (e) {
      setCurrentPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes + 1 : post.likes - 1 }
            : post
        )
      );
    }
  }, [haptics, setCurrentPosts]);


  const handleSave = useCallback(async (postId: string) => {
    setCurrentPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              isSaved: !post.isSaved,
              saves: post.isSaved ? post.saves - 1 : post.saves + 1,
            }
          : post
      )
    );
    haptics.light();
    try {
      const result = await apiSavePost(postId);
      setCurrentPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, isSaved: result.isSaved, saves: result.saves } : post
        )
      );
    } catch (e) {
      setCurrentPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, isSaved: !post.isSaved, saves: post.isSaved ? post.saves + 1 : post.saves - 1 }
            : post
        )
      );
    }
  }, [haptics, setCurrentPosts]);

  const handlePostPress = useCallback((postId: string) => {
    addSeenPost(postId);
    router.push(`/thread/${postId}`);
  }, [router]);

  const handleOpenMediaViewer = useCallback((postId: string) => {
    setMediaViewerPostId(postId);
  }, []);

  const onViewableItemsChanged = useRef((info: { viewableItems: Array<{ item: Post }> }) => {
    const viewableIds = new Set(info.viewableItems.map((v) => v.item.id));
    prevViewableIdsRef.current.forEach((id) => {
      if (!viewableIds.has(id)) {
        const t = viewableTimeoutsRef.current.get(id);
        if (t) {
          clearTimeout(t);
          viewableTimeoutsRef.current.delete(id);
        }
      }
    });
    prevViewableIdsRef.current = viewableIds;
    viewableIds.forEach((id) => {
      if (viewableTimeoutsRef.current.has(id)) return;
      const t = setTimeout(() => {
        addSeenPost(id);
        seenIdsRef.current.add(id);
        setSeenTick((prev) => prev + 1); // re-render so FeedPostRow shows seen (dimmed) state
        viewableTimeoutsRef.current.delete(id);
      }, SEEN_VIEWABLE_MS);
      viewableTimeoutsRef.current.set(id, t);
    });
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 55,
    minimumViewTime: 100,
  }).current;

  const handleComment = useCallback((postId: string) => {
    router.push(`/thread/${postId}`);
  }, [router]);

  const handlePollVote = useCallback(async (postId: string, optionId: string) => {
    haptics.light();
    try {
      const { votePoll } = await import('@/lib/api/posts');
      const updatedPoll = await votePoll(postId, optionId);
      setCurrentPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId && post.poll) {
            return { ...post, poll: updatedPoll };
          }
          return post;
        })
      );
      haptics.success();
    } catch (error) {
      console.error('Error voting on poll:', error);
      haptics.error();
    }
  }, [haptics, setCurrentPosts]);

  const handlePostLongPress = useCallback((post: Post) => {
    if (!post.author) return;
    const authorOpts = getReportBlockOptions({
      id: post.author.id,
      name: post.author.name,
      handle: post.author.handle,
      avatar: post.author.avatar,
    });
    const opts = [
      { text: 'Report post', onPress: () => handleReportPost(post) },
      ...authorOpts.map((o) => ({ text: o.text, style: o.style as 'default' | 'destructive' | 'cancel', onPress: o.onPress })),
    ];
    if (opts.length === 0) return;
    Alert.alert('Options', '', [...opts, { text: 'Cancel', style: 'cancel' as const }]);
  }, [getReportBlockOptions, handleReportPost]);

  const renderPost = useCallback(
    ({ item, index }: { item: Post; index: number }, listTab: FeedTabType) => {
      const isSeen = seenIdsRef.current.has(item.id);
      const isFeedVisible = visibleTab === listTab;
      return (
        <FeedPostRow index={index} isSeen={isSeen} skipEnterAnimation={skipNextEnterAnimation}>
          <View style={styles.postWrapper} collapsable={false}>
            <PostCard
              post={item}
              onLike={() => handleLike(item.id)}
              onSave={() => handleSave(item.id)}
              onComment={() => handleComment(item.id)}
              onPress={() => handlePostPress(item.id)}
              onLongPress={handlePostLongPress}
              onPollVote={(optionId: string) => handlePollVote(item.id, optionId)}
              onOpenMediaViewer={handleOpenMediaViewer}
              isFeedVisible={isFeedVisible}
            />
          </View>
        </FeedPostRow>
      );
    },
    [handleLike, handleSave, handleComment, handlePostPress, handlePollVote, handleOpenMediaViewer, handlePostLongPress, skipNextEnterAnimation, visibleTab]
  );

  const renderSkeleton = useCallback(() => (
    <View>
      {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <PostSkeleton key={`skeleton-${index}`} />
      ))}
    </View>
  ), []);

  if ((loading || !feedPrefsLoaded) && posts.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <FeedScreenHeader
          onSearchPress={() => setShowSearchBar(true)}
          onCreatePress={() => router.push('/(tabs)/create')}
          onNotificationsPress={() => router.push('/notifications')}
          unreadNotifications={unreadNotifications}
        />
        {stories.length > 0 && (
          <View style={[styles.storiesSection, {
            borderBottomColor: colors.divider,
            backgroundColor: colors.cardBackground,
          }]}>
            <StoriesBar stories={stories} />
          </View>
        )}
        {renderSkeleton()}
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height;
        if (Math.abs(headerHeightRef.current - h) > 2) {
          headerHeightRef.current = h;
          setHeaderHeight(h);
        }
      }}
    >
      {/* Top Header Bar */}
      <FeedScreenHeader
        ContainerComponent={Animated.View}
        containerStyle={{ transform: [{ translateY: headerTranslateY }] }}
        onSearchPress={() => setShowSearchBar(true)}
        onCreatePress={() => router.push('/(tabs)/create')}
        onNotificationsPress={() => router.push('/notifications')}
        unreadNotifications={unreadNotifications}
      />

      {/* Stories Section */}
      {stories.length > 0 && (
        <View style={[styles.storiesSection, {
          borderBottomColor: colors.divider,
          backgroundColor: colors.cardBackground,
        }]}>
          <StoriesBar stories={stories} />
        </View>
      )}

      {/* Feed Tabs + Sort/Filter */}
      <FeedTabs
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === visibleTab) return;
          const leavingTab = visibleTab;
          savedScrollOffsetRef.current = leavingTab === 'for-you' ? forYouScrollYRef.current : followingScrollYRef.current;
          setSkipNextEnterAnimation(true);
          setActiveTab(tab);
          setVisibleTab(tab);
          prevVisibleTabRef.current = tab;
          setError(null);
          if (tab === 'for-you') {
            setForYouPage(1);
            setForYouHasMore(true);
          } else {
            setFollowingPage(1);
            setFollowingHasMore(true);
          }
        }}
        filterButton={
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              setShowSortMenu(true);
            }}
            style={styles.filterButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Sort and filter feed"
            accessibilityHint="Opens sort and filter options"
          >
            <Ionicons name="options-outline" size={20} color={colors.secondary} />
          </TouchableOpacity>
        }
      />
    </View>
  );

  const renderEmptyState = (forTab?: FeedTabType) => {
    const tab = forTab ?? activeTab;
    if (error) {
      return (
        <View style={styles.center}>
          <View style={styles.errorContainer}>
            <View style={[styles.errorIconContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)' }]}>
              <Ionicons name="alert-circle-outline" size={36} color={colors.error} />
            </View>
            <ThemedText style={[styles.errorTitle, { color: colors.text }]}>
              Something went wrong
            </ThemedText>
            <ThemedText style={[styles.errorText, { color: colors.secondary }]}>
              {error}
            </ThemedText>
            <View style={styles.errorActions}>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}
                onPress={handleRetry}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Try again"
                accessibilityHint="Retries loading the feed"
              >
                <Ionicons name="refresh" size={18} color="#FFFFFF" style={styles.retryIcon} />
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.retryButtonSecondary, { borderColor: colors.border }]}
                onPress={() => {
                  haptics.light();
                  router.push('/(tabs)/spaces');
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Explore community"
                accessibilityHint="Opens spaces to explore"
              >
                <Text style={[styles.retryTextSecondary, { color: colors.text }]}>Explore Community</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <EmptyState
        icon="mail-outline"
        title="No posts yet"
        message={tab === 'for-you'
          ? "Your feed is empty. Start following people or join spaces to see posts here!"
          : "You're not following anyone yet. Discover and follow people to see their posts here!"}
        actions={[
          {
            label: 'Explore Community',
            onPress: () => {
              haptics.light();
              router.push('/(tabs)/spaces');
            },
            variant: 'primary' as const,
          },
          {
            label: 'Find People',
            onPress: () => {
              haptics.light();
              router.push('/search');
            },
            variant: 'secondary' as const,
          },
        ]}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ErrorBoundary>
      <View style={[styles.listContainer, { backgroundColor: colors.background }]}>
        {/* Two stacked lists so tab switch only toggles visibility — no scroll jump, screen stays in place */}
        <FlatList
          ref={listRefForYou}
          data={forYouPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => renderPost({ item, index }, 'for-you')}
          contentContainerStyle={styles.listContent}
          style={[styles.list, styles.listStacked, visibleTab !== 'for-you' && styles.listHidden]}
          pointerEvents={visibleTab === 'for-you' ? 'auto' : 'none'}
          showsVerticalScrollIndicator={false}
          onScroll={handleScrollForYou}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing && activeTab === 'for-you'}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressViewOffset={headerHeight}
            />
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={() => renderEmptyState('for-you')}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={() => {
            if (forYouHasMore && !loading && !refreshing) loadPosts(false, 'for-you');
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && activeTab === 'for-you' && forYouPosts.length > 0 ? (
              <View style={styles.footer}>
                {Array.from({ length: 2 }).map((_, index) => (
                  <View key={`footer-skeleton-fy-${index}`} style={styles.skeletonWrapper}>
                    <PostSkeleton />
                  </View>
                ))}
              </View>
            ) : null
          }
          removeClippedSubviews={false}
          maxToRenderPerBatch={6}
          updateCellsBatchingPeriod={50}
          windowSize={11}
          initialNumToRender={6}
        />
        <FlatList
          ref={listRefFollowing}
          data={followingPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => renderPost({ item, index }, 'following')}
          contentContainerStyle={styles.listContent}
          style={[styles.list, styles.listStacked, visibleTab !== 'following' && styles.listHidden]}
          pointerEvents={visibleTab === 'following' ? 'auto' : 'none'}
          showsVerticalScrollIndicator={false}
          onScroll={handleScrollFollowing}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing && activeTab === 'following'}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressViewOffset={headerHeight}
            />
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={() => renderEmptyState('following')}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={() => {
            if (followingHasMore && !loading && !refreshing) loadPosts(false, 'following');
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && activeTab === 'following' && followingPosts.length > 0 ? (
              <View style={styles.footer}>
                {Array.from({ length: 2 }).map((_, index) => (
                  <View key={`footer-skeleton-fl-${index}`} style={styles.skeletonWrapper}>
                    <PostSkeleton />
                  </View>
                ))}
              </View>
            ) : null
          }
          removeClippedSubviews={false}
          maxToRenderPerBatch={6}
          updateCellsBatchingPeriod={50}
          windowSize={11}
          initialNumToRender={6}
        />
      </View>
      <ScrollToTopButton visible={showScrollToTop} onPress={handleScrollToTop} bottomInset={insets.bottom} />
      <SortMenu
        activeSort={sortOption}
        onSortChange={setSortOption}
        activeFilter={contentFilter}
        onFilterChange={setContentFilter}
        visible={showSortMenu}
        onClose={() => setShowSortMenu(false)}
      />
      <SearchOverlay
        visible={showSearchBar}
        query={searchQuery}
        allPosts={posts}
        onQueryChange={setSearchQuery}
        onClose={() => {
          setShowSearchBar(false);
          setSearchQuery('');
        }}
        onSearch={(query) => {
          // Just update the query, don't navigate
          setSearchQuery(query);
        }}
        onSelectResult={(type, id, searchQueryParam) => {
          haptics.light();
          // Use the query from the overlay if provided, otherwise use searchQuery
          const queryToUse = searchQueryParam || searchQuery;
          // Navigate to search results screen to see all matching results
          router.push(`/search-results?q=${encodeURIComponent(queryToUse)}&type=${type}`);
        }}
      />
      <FeedMediaViewer
        visible={mediaViewerPostId !== null}
        posts={posts}
        initialPostId={mediaViewerPostId}
        onClose={() => setMediaViewerPostId(null)}
        onLike={handleLike}
        onSave={handleSave}
        onComment={(postId) => {
          returnToMediaViewerPostIdRef.current = postId;
          router.push(`/thread/${postId}`);
          setTimeout(() => setMediaViewerPostId(null), 400);
        }}
      />
      </ErrorBoundary>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    position: 'relative',
  },
  listLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  list: {
    flex: 1,
  },
  listStacked: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  listHidden: {
    opacity: 0,
    zIndex: 0,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl + Spacing.lg,
  },
  storiesSection: {
    paddingVertical: Spacing.sm,
    paddingTop: Spacing.sm + 2,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    minHeight: 320,
  },
  errorContainer: {
    alignItems: 'center',
    maxWidth: 320,
    paddingHorizontal: Spacing.lg,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg + 4,
  },
  errorIcon: {
    marginBottom: 0,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  errorActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    borderRadius: 20,
    gap: Spacing.xs + 2,
    minWidth: 120,
    justifyContent: 'center',
    ...Shadows.md,
  },
  retryButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 120,
    justifyContent: 'center',
  },
  retryTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  retryIcon: {
    marginRight: 0,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  footer: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  skeletonWrapper: {
    marginBottom: Spacing.xs,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs + 2,
    marginRight: Spacing.sm,
    minHeight: 40,
  },
  searchIcon: {
    marginRight: Spacing.xs + 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  cancelButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '500',
  },
  filterButton: {
    padding: Spacing.xs,
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: 12,
  },
  filterButtonTextInline: {
    fontSize: 13,
    fontWeight: '600',
  },
  postWrapper: {
    marginBottom: 0,
  },
});
