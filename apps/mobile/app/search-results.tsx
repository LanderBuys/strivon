import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Text, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Post, User, Space } from '@/types/post';
import { PostCard } from '@/components/feed/PostCard';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { searchAll } from '@/lib/api/search';

type ResultTabType = 'all' | 'posts' | 'users' | 'spaces';

function getParamString(p: string | string[] | undefined): string {
  if (p == null) return '';
  return (Array.isArray(p) ? p[0] : p) ?? '';
}

export default function SearchResultsScreen() {
  const params = useLocalSearchParams<{ q?: string; type?: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();

  const query = getParamString(params.q).trim();
  const tabParam = getParamString(params.type);
  const [activeTab, setActiveTab] = useState<ResultTabType>(() => {
    if (tabParam === 'post') return 'posts';
    if (tabParam === 'user') return 'users';
    if (tabParam === 'space') return 'spaces';
    return 'all';
  });
  const [searchResults, setSearchResults] = useState<{ users: User[]; posts: Post[]; spaces: Space[] }>({
    users: [],
    posts: [],
    spaces: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const searchIdRef = useRef(0);

  const loadSearch = useCallback(async () => {
    if (!query) {
      setSearchResults({ users: [], posts: [], spaces: [] });
      setLoading(false);
      return;
    }
    const id = ++searchIdRef.current;
    setLoading(true);
    try {
      const results = await searchAll(query);
      if (id !== searchIdRef.current) return;
      setSearchResults(results);
    } catch (error) {
      if (id !== searchIdRef.current) return;
      console.error('Error searching:', error);
      setSearchResults({ users: [], posts: [], spaces: [] });
    } finally {
      if (id === searchIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [query]);

  useEffect(() => {
    setLoading(true);
    loadSearch();
  }, [loadSearch]);

  // Sync tab from URL type when params change
  useEffect(() => {
    if (tabParam === 'post') setActiveTab('posts');
    else if (tabParam === 'user') setActiveTab('users');
    else if (tabParam === 'space') setActiveTab('spaces');
  }, [tabParam]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSearch();
  }, [loadSearch]);

  const handleLike = useCallback((postId: string) => {
    setSearchResults(prev => ({
      ...prev,
      posts: prev.posts.map(p =>
        p.id === postId ? { ...p, isLiked: !p.isLiked, likes: (p.isLiked ? p.likes - 1 : p.likes + 1) } : p
      ),
    }));
    haptics.light();
  }, [haptics]);

  const handleSave = useCallback((postId: string) => {
    setSearchResults(prev => ({
      ...prev,
      posts: prev.posts.map(p =>
        p.id === postId ? { ...p, isSaved: !p.isSaved, saves: (p.isSaved ? p.saves - 1 : p.saves + 1) } : p
      ),
    }));
    haptics.light();
  }, [haptics]);

  const handlePollVote = useCallback(async (postId: string, optionId: string) => {
    const post = searchResults.posts.find(p => p.id === postId);
    if (!post || !post.poll) return;
    if (post.poll.userVote === optionId) return;

    const previousPoll = JSON.parse(JSON.stringify(post.poll));

    setSearchResults(prev => ({
      ...prev,
      posts: prev.posts.map(p => {
        if (p.id !== postId || !p.poll) return p;
        const updatedPoll = { ...p.poll };
        if (updatedPoll.userVote) {
          const previousOption = updatedPoll.options.find((opt: any) => opt.id === updatedPoll.userVote);
          if (previousOption) previousOption.votes = Math.max(0, previousOption.votes - 1);
        }
        const selectedOption = updatedPoll.options.find((opt: any) => opt.id === optionId);
        if (selectedOption) {
          selectedOption.votes += 1;
          updatedPoll.userVote = optionId;
        }
        updatedPoll.totalVotes = updatedPoll.options.reduce((sum: number, opt: any) => sum + (opt.votes || 0), 0);
        return { ...p, poll: updatedPoll };
      }),
    }));

    try {
      const { votePoll } = await import('@/lib/api/posts');
      const updatedPoll = await votePoll(postId, optionId);
      setSearchResults(prev => ({
        ...prev,
        posts: prev.posts.map(p => (p.id === postId ? { ...p, poll: updatedPoll } : p)),
      }));
    } catch (error) {
      console.error('Error voting on poll:', error);
      setSearchResults(prev => ({
        ...prev,
        posts: prev.posts.map(p => (p.id === postId ? { ...p, poll: previousPoll } : p)),
      }));
    }
  }, [searchResults.posts]);

  const handleUserPress = useCallback((userId: string) => {
    haptics.light();
    router.push(`/profile/${userId}`);
  }, [router, haptics]);

  const handlePostPress = useCallback((postId: string) => {
    haptics.light();
    router.push(`/thread/${postId}`);
  }, [router, haptics]);

  const handleSpacePress = useCallback((spaceId: string) => {
    haptics.light();
    router.push(`/space/${spaceId}`);
  }, [router, haptics]);

  const tabs: { key: ResultTabType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: searchResults.posts.length + searchResults.users.length + searchResults.spaces.length },
    { key: 'posts', label: 'Posts', count: searchResults.posts.length },
    { key: 'users', label: 'Users', count: searchResults.users.length },
    { key: 'spaces', label: 'Spaces', count: searchResults.spaces.length },
  ];

  const renderTabs = () => (
    <View style={[styles.tabsContainer, { 
      backgroundColor: colors.surface, 
      borderBottomColor: colors.divider,
    }]}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={tabs}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              style={[
                styles.tab,
                isActive && [styles.activeTab, { borderBottomColor: colors.primary }],
              ]}
              onPress={() => {
                haptics.light();
                setActiveTab(item.key);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.tabText, 
                { 
                  color: isActive ? colors.text : colors.secondary,
                  fontWeight: isActive ? '700' : '600',
                }
              ]}>
                {item.label}
              </Text>
              {item.count > 0 && (
                <View style={[
                  styles.countBadge, 
                  { 
                    backgroundColor: isActive ? colors.primary + '15' : colors.divider,
                  }
                ]}>
                  <Text style={[
                    styles.countText, 
                    { 
                      color: isActive ? colors.primary : colors.secondary,
                    }
                  ]}>
                    {item.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.tabsContent}
      />
    </View>
  );

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userItem, { borderBottomColor: colors.divider }]}
      onPress={() => handleUserPress(item.id)}
      activeOpacity={0.6}
    >
      {item.avatar ? (
        <ExpoImage source={{ uri: item.avatar }} style={styles.userAvatar} contentFit="cover" />
      ) : (
        <View style={[styles.userAvatarPlaceholder, { backgroundColor: colors.divider }]}>
          <Ionicons name="person" size={20} color={colors.secondary} />
        </View>
      )}
      <View style={styles.userInfo}>
        <View style={styles.userInfoRow}>
          <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          {item.label && (
            <Text style={[styles.labelText, { color: colors.secondary }]}> • {item.label}</Text>
          )}
        </View>
        <Text style={[styles.userHandle, { color: colors.secondary }]} numberOfLines={1}>{item.handle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.secondary} style={{ opacity: 0.4 }} />
    </TouchableOpacity>
  );

  const renderSpace = ({ item }: { item: Space }) => (
    <TouchableOpacity
      style={[styles.spaceItem, { borderBottomColor: colors.divider }]}
      onPress={() => handleSpacePress(item.id)}
      activeOpacity={0.6}
    >
      <View style={[styles.spaceIcon, { backgroundColor: colors.divider }]}>
        <Ionicons name="people" size={20} color={colors.secondary} />
      </View>
      <View style={styles.spaceInfo}>
        <Text style={[styles.spaceName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.spaceDescription, { color: colors.secondary }]} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.spaceMeta}>
          <Ionicons name="people" size={13} color={colors.secondary} style={{ opacity: 0.6 }} />
          <Text style={[styles.spaceMemberCount, { color: colors.secondary }]}>
            {item.memberCount.toLocaleString()} members
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.secondary} style={{ opacity: 0.4 }} />
    </TouchableOpacity>
  );

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postWrapper}>
      <PostCard
        post={item}
        onLike={() => handleLike(item.id)}
        onSave={() => handleSave(item.id)}
        onPollVote={(optionId) => handlePollVote(item.id, optionId)}
        onPress={() => handlePostPress(item.id)}
      />
    </View>
  );

  const getData = () => {
    if (activeTab === 'posts') return searchResults.posts;
    if (activeTab === 'users') return searchResults.users;
    if (activeTab === 'spaces') return searchResults.spaces;
    // All tab - combine all results
    return [
      ...searchResults.posts.map(p => ({ type: 'post' as const, data: p })),
      ...searchResults.users.map(u => ({ type: 'user' as const, data: u })),
      ...searchResults.spaces.map(s => ({ type: 'space' as const, data: s })),
    ];
  };

  const renderAllItem = ({ item }: { item: any }) => {
    if (item.type === 'post') return renderPost({ item: item.data });
    if (item.type === 'user') return renderUser({ item: item.data });
    if (item.type === 'space') return renderSpace({ item: item.data });
    return null;
  };

  const data = getData();
  const isEmpty = data.length === 0;
  const showLoading = loading && query.length > 0;

  if (showLoading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.divider, backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{query || 'Search'}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.secondary }]}>Searching...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { 
        borderBottomColor: colors.divider, 
        backgroundColor: colors.surface,
      }]}>
        <TouchableOpacity 
          onPress={() => {
            haptics.light();
            router.back();
          }} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {query || 'Search Results'}
          </Text>
          {!isEmpty && (
            <Text style={[styles.resultCount, { color: colors.secondary }]}>
              {data.length} {data.length === 1 ? 'result' : 'results'}
            </Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {renderTabs()}

      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={40} color={colors.secondary} style={{ opacity: 0.3, marginBottom: Spacing.md }} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {query ? 'No results found' : 'Enter a search term'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.secondary }]}>
            {query
              ? 'Try different keywords or check your spelling'
              : 'Search for people, posts, and spaces'}
          </Text>
        </View>
      ) : (
        <FlatList<any>
          data={data as any[]}
          keyExtractor={(item: any, index) => {
            if (activeTab === 'all') {
              return `${item.type}-${item.data.id}-${index}`;
            }
            return item.id || `item-${index}`;
          }}
          renderItem={
            (activeTab === 'all'
              ? (renderAllItem as any)
              : activeTab === 'posts'
                ? (renderPost as any)
                : activeTab === 'users'
                  ? (renderUser as any)
                  : (renderSpace as any)) as any
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultCount: {
    fontSize: Typography.sm,
    opacity: 0.6,
    marginTop: 1,
  },
  tabsContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabsContent: {
    paddingHorizontal: Spacing.lg,
  },
  tab: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    // borderBottomColor set dynamically
  },
  tabText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  postWrapper: {
    marginBottom: 0,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius['2xl'],
    marginRight: Spacing.md,
  },
  userAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius['2xl'],
    marginRight: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: Spacing.xs,
  },
  userName: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  labelText: {
    fontSize: Typography.sm,
    opacity: 0.6,
  },
  userHandle: {
    fontSize: Typography.sm,
    opacity: 0.6,
    marginTop: 2,
  },
  spaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  spaceIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius['2xl'],
    marginRight: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceInfo: {
    flex: 1,
  },
  spaceName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  spaceDescription: {
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 4,
    lineHeight: 18,
  },
  spaceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs - 2,
  },
  spaceMemberCount: {
    fontSize: Typography.xs,
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.sm,
    marginTop: Spacing.md,
    opacity: 0.8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.sm,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
  },
});
