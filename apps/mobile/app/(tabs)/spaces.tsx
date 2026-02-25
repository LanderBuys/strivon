import { useState, useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, RefreshControl, TouchableOpacity, Alert, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Space } from '@/types/post';
import { SpaceSearchBar } from '@/components/spaces/SpaceSearchBar';
import { SpaceFilters, SpaceFilter } from '@/components/spaces/SpaceFilters';
import { SpaceSortMenu, SpaceSort } from '@/components/spaces/SpaceSortMenu';
import { SpaceActionSheet } from '@/components/spaces/SpaceActionSheet';
import { EmptyState } from '@/components/EmptyState';
import { SpaceCardSkeleton } from '@/components/spaces/SpaceCardSkeleton';
import { SpaceMiniCard } from '@/components/spaces/SpaceMiniCard';
import { CommunitySpaceCard } from '@/components/spaces/CommunitySpaceCard';
import { getSpacesPaginated, joinSpace, leaveSpace, getMyPendingJoinRequestIds } from '@/lib/api/spaces';
import { getCurrentUserIdOrFallback } from '@/lib/api/users';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useDebounce } from '@/hooks/useDebounce';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const COMMUNITY_SORT_KEY = '@strivon/community_sort';
const COMMUNITY_FILTER_KEY = '@strivon/community_filter';

export default function SpacesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const haptics = useHapticFeedback();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SpaceFilter>('all');
  const [activeSort, setActiveSort] = useState<SpaceSort>('members');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedSpaceForAction, setSelectedSpaceForAction] = useState<Space | null>(null);
  const [hasPendingRequests, setHasPendingRequests] = useState<Set<string>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [showRequestsOnly, setShowRequestsOnly] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const surfaceBg = useMemo(
    () => (colorScheme === 'dark' ? 'rgba(255,255,255,0.06)' : colors.spaceBackground),
    [colorScheme, colors.spaceBackground]
  );
  const surfaceBorder = useMemo(
    () => (colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : colors.cardBorder),
    [colorScheme, colors.cardBorder]
  );

  useEffect(() => {
    loadSpaces();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [storedSort, storedFilter] = await Promise.all([
          AsyncStorage.getItem(COMMUNITY_SORT_KEY),
          AsyncStorage.getItem(COMMUNITY_FILTER_KEY),
        ]);
        if (mounted && storedSort && ['members', 'activity', 'newest', 'alphabetical'].includes(storedSort)) {
          setActiveSort(storedSort as SpaceSort);
        }
        if (mounted && storedFilter) {
          setActiveFilter(storedFilter as SpaceFilter);
        }
      } catch {
        // ignore load preferences
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (spaces.length === 0) return;
    const currentUserId = getCurrentUserIdOrFallback();
    let mounted = true;
    getMyPendingJoinRequestIds(currentUserId).then((ids) => {
      if (mounted) setHasPendingRequests(new Set(ids));
    });
    return () => { mounted = false; };
  }, [spaces.length]);

  const enrichSpace = useCallback((space: Space, currentUserId: string): Space => {
    const isOwner = space.ownerId === currentUserId || space.ownerId === `user-${currentUserId}`;
    const hoursAgo = Math.floor(Math.random() * 48);
    const lastActivity = new Date();
    lastActivity.setHours(lastActivity.getHours() - hoursAgo);
    return {
      ...space,
      isJoined: space.isJoined ?? false,
      memberRole: isOwner ? 'owner' : (space.memberRole || (space.isJoined ? 'member' : undefined)),
      isTrending: (space.memberCount ?? 0) > 1500,
      unreadCount: space.isJoined ? Math.floor(Math.random() * 5) : 0,
      lastActivityAt: lastActivity.toISOString(),
      onlineMembers: Math.floor(space.memberCount * (0.1 + Math.random() * 0.2)),
      isMuted: false,
      channels: space.channels.map(ch => ({
        ...ch,
        unreadCount: space.isJoined && Math.random() > 0.6 ? Math.floor(Math.random() * 10) : 0,
      })),
    };
  }, []);

  const loadSpaces = useCallback(async (isRefresh = false) => {
    const currentUserId = getCurrentUserIdOrFallback();
    try {
      setLoadError(null);
      if (isRefresh) {
        setRefreshing(true);
        setNextOffset(0);
        setHasMore(true);
      } else {
        setLoading(true);
        setImageErrors(new Set());
      }
      const { spaces: pageSpaces, hasMore: more } = await getSpacesPaginated(0, 20);
      const enrichedSpaces = pageSpaces.map(space => enrichSpace(space, currentUserId));
      setSpaces(enrichedSpaces);
      setHasMore(more);
      setNextOffset(enrichedSpaces.length);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load spaces');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [enrichSpace]);

  const loadMoreSpaces = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    const currentUserId = getCurrentUserIdOrFallback();
    setLoadingMore(true);
    try {
      const { spaces: pageSpaces, hasMore: more } = await getSpacesPaginated(nextOffset, 20);
      const enrichedSpaces = pageSpaces.map(space => enrichSpace(space, currentUserId));
      setSpaces(prev => [...prev, ...enrichedSpaces]);
      setHasMore(more);
      setNextOffset(prev => prev + enrichedSpaces.length);
    } catch (_) {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, loading, nextOffset, enrichSpace]);

  const onRefresh = useCallback(() => {
    haptics.light();
    loadSpaces(true);
  }, [loadSpaces, haptics]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    spaces.forEach(space => {
      if (space.category && space.category.trim()) {
        cats.add(space.category);
      }
    });
    return Array.from(cats).sort();
  }, [spaces]);

  const filteredAndSortedSpaces = useMemo(() => {
    if (spaces.length === 0) {
      return [];
    }
    let filtered = [...spaces];

    // Requests-only filter (pending join requests)
    if (showRequestsOnly) {
      filtered = filtered.filter(s => hasPendingRequests.has(s.id));
    }

    // Apply search filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        space =>
          space.name.toLowerCase().includes(query) ||
          space.description.toLowerCase().includes(query) ||
          space.category?.toLowerCase().includes(query)
      );
    }

    // Apply category/status filter
    if (activeFilter === 'joined') {
      filtered = filtered.filter(s => s.isJoined);
    } else if (activeFilter === 'trending') {
      filtered = filtered.filter(s => s.isTrending);
    } else if (activeFilter !== 'all' && categories.includes(activeFilter)) {
      filtered = filtered.filter(s => s.category === activeFilter);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (activeSort) {
        case 'members':
          return b.memberCount - a.memberCount;
        case 'activity': {
          const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
          const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
          return bTime - aTime;
        }
        case 'newest':
          // Assuming newer spaces have higher IDs or we can use a timestamp
          return b.id.localeCompare(a.id);
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return sorted;
  }, [spaces, debouncedSearchQuery, activeFilter, activeSort, categories, showRequestsOnly, hasPendingRequests]);

  const joinedSpaces = useMemo(() => {
    const source = (debouncedSearchQuery.trim() || activeFilter !== 'all') 
      ? filteredAndSortedSpaces 
      : spaces;
    return source.filter(s => s.isJoined);
  }, [filteredAndSortedSpaces, spaces, debouncedSearchQuery, activeFilter]);

  const discoverSpaces = useMemo(() => {
    const source = (debouncedSearchQuery.trim() || activeFilter !== 'all') 
      ? filteredAndSortedSpaces 
      : spaces;
    return source.filter(s => !s.isJoined);
  }, [filteredAndSortedSpaces, spaces, debouncedSearchQuery, activeFilter]);

  const trendingSpaces = useMemo(() => {
    return spaces.filter(s => Boolean(s.isTrending) && !s.isJoined);
  }, [spaces]);

  const pendingRequestsCount = useMemo(() => hasPendingRequests.size, [hasPendingRequests]);

  const isAllDiscoverMode = !debouncedSearchQuery.trim() && activeFilter === 'all' && !showRequestsOnly;
  const listData = useMemo(() => {
    if (isAllDiscoverMode) return discoverSpaces;
    return filteredAndSortedSpaces;
  }, [isAllDiscoverMode, discoverSpaces, filteredAndSortedSpaces]);

  const toggleRequestsOnly = useCallback(() => {
    haptics.light();
    setShowRequestsOnly(prev => {
      const next = !prev;
      if (next) {
        setSearchQuery('');
        setActiveFilter('all');
      }
      return next;
    });
  }, [haptics]);

  const handleJoinSpace = useCallback(async (spaceId: string) => {
    try {
      // Check spaces join limit for free users
      const { getMaxSpaces } = await import('@/lib/services/subscriptionService');
      const maxSpaces = await getMaxSpaces();
      
      if (maxSpaces > 0) {
        // Count currently joined spaces
        const joinedCount = spaces.filter(s => s.isJoined).length;
        if (joinedCount >= maxSpaces) {
          Alert.alert(
            'Space Limit Reached',
            `You can join up to ${maxSpaces} spaces with your current plan. Upgrade to Pro for unlimited spaces.`,
            [
              { text: 'OK' },
              { text: 'Upgrade', onPress: () => router.push('/settings/subscription-info') },
            ]
          );
          return;
        }
      }

      const space = spaces.find(s => s.id === spaceId);
      if (space?.requiresApproval) {
        // Show request modal or navigate to space detail
        router.push(`/space/${spaceId}`);
        return;
      }
      
      await joinSpace(spaceId);
      setSpaces(prev =>
        prev.map(s => 
          s.id === spaceId 
            ? { ...s, isJoined: true, memberCount: (s.memberCount || 0) + 1 }
            : s
        )
      );
      haptics.success();
    } catch (error) {
      haptics.error();
    }
  }, [haptics, spaces, router]);

  const handleLeaveSpace = useCallback(async (spaceId: string) => {
    try {
      await leaveSpace(spaceId);
      setSpaces(prev =>
        prev.map(s => 
          s.id === spaceId 
            ? { ...s, isJoined: false, memberCount: Math.max(0, (s.memberCount || 0) - 1) }
            : s
        )
      );
      haptics.light();
    } catch (error) {
      haptics.error();
    }
  }, [haptics]);

  const handleSpacePress = useCallback((space: Space) => {
    haptics.selection();
    router.push(`/space/${space.id}`);
  }, [router, haptics]);

  const handleLongPress = useCallback((space: Space) => {
    haptics.medium();
    setSelectedSpaceForAction(space);
  }, [haptics]);

  const handleMuteSpace = useCallback((spaceId: string) => {
    setSpaces(prev =>
      prev.map(s => (s.id === spaceId ? { ...s, isMuted: !s.isMuted } : s))
    );
    haptics.light();
  }, [haptics]);

  const renderSpaceCard = useCallback(
    (space: Space) => {
      if (!space?.id) return null;
      return (
        <CommunitySpaceCard
          space={space}
          hasPendingRequest={hasPendingRequests.has(space.id)}
          hasImageError={imageErrors.has(space.id)}
          onPress={handleSpacePress}
          onLongPress={handleLongPress}
          onJoinPress={handleJoinSpace}
          onLeavePress={handleLeaveSpace}
          onImageError={(spaceId) => setImageErrors((prev) => new Set(prev).add(spaceId))}
        />
      );
    },
    [handleSpacePress, handleLongPress, handleJoinSpace, handleLeaveSpace, hasPendingRequests, imageErrors]
  );

  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.cardBorder }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.text }]}>{showRequestsOnly ? 'Requests' : 'Community'}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.headerButton,
                {
                  backgroundColor: surfaceBg,
                  borderColor: surfaceBorder,
                },
              ]}
              onPress={() => {
                haptics.light();
                setShowSortMenu(true);
              }}
              activeOpacity={0.7}
              accessibilityLabel="Sort spaces"
              accessibilityRole="button"
              accessibilityHint="Opens sort options">
              <IconSymbol name="swap-vertical-outline" size={20} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.headerButton,
                {
                  backgroundColor: showRequestsOnly ? colors.primary : surfaceBg,
                  borderColor: showRequestsOnly ? colors.primary : surfaceBorder,
                },
              ]}
              onPress={toggleRequestsOnly}
              activeOpacity={0.7}
              accessibilityLabel={showRequestsOnly ? 'Hide pending requests' : 'Show pending join requests'}
              accessibilityRole="button"
              accessibilityHint={pendingRequestsCount > 0 ? `${pendingRequestsCount} pending` : undefined}>
              <IconSymbol
                name="time-outline"
                size={20}
                color={showRequestsOnly ? '#FFFFFF' : colors.text}
              />
              {pendingRequestsCount > 0 && !showRequestsOnly && (
                <View style={[styles.headerBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.headerBadgeText}>
                    {pendingRequestsCount > 99 ? '99+' : String(pendingRequestsCount)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                haptics.medium();
                router.push('/space/create');
              }}
              activeOpacity={0.7}
              accessibilityLabel="Create new space"
              accessibilityRole="button"
              accessibilityHint="Opens create space screen">
              <IconSymbol name="add" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.searchContainer}>
          <SpaceSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery('')}
            placeholder="Search by name, description, or category"
          />
          {debouncedSearchQuery.trim() ? (
            <Text style={[styles.searchResultCount, { color: colors.secondary }]} numberOfLines={1}>
              {listData.length === 0
                ? 'No spaces found'
                : `${listData.length} ${listData.length === 1 ? 'space' : 'spaces'}`}
            </Text>
          ) : null}
        </View>

        {loadError ? (
          <View style={styles.errorBannerWrap}>
            <View style={[styles.errorBanner, { backgroundColor: colors.error + '18', borderColor: colors.error + '40' }]}>
              <IconSymbol name="warning-outline" size={18} color={colors.error} />
              <Text style={[styles.errorBannerText, { color: colors.text }]} numberOfLines={2}>
                {loadError}
              </Text>
              <TouchableOpacity
                style={[styles.errorBannerRetry, { backgroundColor: colors.error }]}
                onPress={() => {
                  haptics.light();
                  loadSpaces(true);
                }}
                activeOpacity={0.8}
                accessibilityLabel="Retry loading spaces"
                accessibilityRole="button">
                <Text style={styles.errorBannerRetryText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  haptics.light();
                  setLoadError(null);
                }}
                style={styles.errorBannerDismiss}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Dismiss"
                accessibilityRole="button">
                <IconSymbol name="close" size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {showRequestsOnly && (
          <View style={styles.modeBannerWrap}>
            <View style={[styles.modeBanner, { backgroundColor: surfaceBg, borderColor: surfaceBorder }]}>
              <View style={styles.modeBannerLeft}>
                <IconSymbol name="time-outline" size={14} color={colors.secondary} />
                <Text style={[styles.modeBannerText, { color: colors.text }]} numberOfLines={1}>
                  Showing pending requests ({pendingRequestsCount})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  haptics.light();
                  setShowRequestsOnly(false);
                }}
                activeOpacity={0.7}
                style={styles.modeBannerCta}
              >
                <Text style={[styles.modeBannerCtaText, { color: colors.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Filters */}
      {!debouncedSearchQuery && !showRequestsOnly && (
        <SpaceFilters
          categories={categories}
          activeFilter={activeFilter}
          onFilterChange={(filter) => {
            setActiveFilter(filter);
            AsyncStorage.setItem(COMMUNITY_FILTER_KEY, filter).catch(() => {});
          }}
        />
      )}


      {loading ? (
        <View style={styles.loadingContainer}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SpaceCardSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderSpaceCard(item)}
          extraData={listData.length}
          ListHeaderComponent={
            !debouncedSearchQuery.trim() && activeFilter === 'all' && !showRequestsOnly ? (
              <View>
                {joinedSpaces.length === 0 && (discoverSpaces.length > 0 || categories.length > 0) ? (
                  <View style={[styles.getStartedCard, { backgroundColor: surfaceBg, borderColor: surfaceBorder }]}>
                    <View style={[styles.getStartedIconWrap, { backgroundColor: colors.primary + '18' }]}>
                      <IconSymbol name="compass-outline" size={24} color={colors.primary} />
                    </View>
                    <Text style={[styles.getStartedTitle, { color: colors.text }]}>Find your first space</Text>
                    <Text style={[styles.getStartedMessage, { color: colors.secondary }]}>
                      Join communities by topic or browse what&apos;s popular.
                    </Text>
                    {categories.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.getStartedChips}
                        style={styles.getStartedChipsScroll}>
                        {categories.slice(0, 5).map((cat) => (
                          <TouchableOpacity
                            key={cat}
                            style={[styles.getStartedChip, { backgroundColor: colors.primary }]}
                            onPress={() => {
                              haptics.light();
                              setActiveFilter(cat);
                            }}
                            activeOpacity={0.8}>
                            <Text style={styles.getStartedChipText}>{cat}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                ) : null}

                {joinedSpaces.length > 0 && (
                  <View>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionHeaderLeft}>
                        <View style={[styles.sectionIconContainer, { backgroundColor: colors.primary + '15' }]}>
                          <IconSymbol name="checkmark-circle" size={12} color={colors.primary} />
                        </View>
                        <View>
                          <Text style={[styles.sectionLabel, { color: colors.text }]}>
                            Your Spaces
                          </Text>
                          <Text style={[styles.sectionSubtext, { color: colors.secondary }]}>
                            {joinedSpaces.length} joined
                          </Text>
                        </View>
                      </View>
                      {joinedSpaces.length > 4 && (
                        <TouchableOpacity
                          onPress={() => {
                            haptics.light();
                            setActiveFilter('joined');
                          }}
                          activeOpacity={0.7}
                          style={styles.viewAllButton}>
                          <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
                          <IconSymbol name="chevron-forward" size={12} color={colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.serverBoxesContainer}
                      style={styles.serverBoxesScroll}>
                      {joinedSpaces.slice(0, 8).map((space) => {
                        if (!space || !space.id) return null;
                        const spaceColor = space.color || colors.primary;
                        return (
                          <View key={space.id} style={{ marginRight: Spacing.sm }}>
                            <SpaceMiniCard
                              onPress={() => handleSpacePress(space)}
                              space={space}
                              accentColor={spaceColor}
                              subtitle={null}
                              showName={false}
                              unreadCount={space.unreadCount || 0}
                              isMuted={Boolean(space.isMuted)}
                              hasImageError={imageErrors.has(space.id)}
                              onImageError={() => setImageErrors(prev => new Set(prev).add(space.id))}
                            />
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {trendingSpaces.length > 0 && (
                  <View>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionHeaderLeft}>
                        <View style={[styles.sectionIconContainer, { backgroundColor: '#F97316' + '20' }]}>
                          <IconSymbol name="flame" size={12} color="#F97316" />
                        </View>
                        <View>
                          <Text style={[styles.sectionLabel, { color: colors.text }]}>
                            Trending now
                          </Text>
                          <Text style={[styles.sectionSubtext, { color: colors.secondary }]}>
                            Popular spaces this week
                          </Text>
                        </View>
                      </View>
                      {trendingSpaces.length > 4 && (
                        <TouchableOpacity
                          onPress={() => {
                            haptics.light();
                            setActiveFilter('trending');
                          }}
                          activeOpacity={0.7}
                          style={styles.viewAllButton}>
                          <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
                          <IconSymbol name="chevron-forward" size={12} color={colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.serverBoxesContainer}
                      style={styles.serverBoxesScroll}>
                      {trendingSpaces.slice(0, 8).map((space) => {
                        if (!space || !space.id) return null;
                        const spaceColor = space.color || colors.primary;
                        return (
                          <View key={space.id} style={{ marginRight: Spacing.sm }}>
                            <SpaceMiniCard
                              onPress={() => handleSpacePress(space)}
                              space={space}
                              accentColor={spaceColor}
                              subtitle={null}
                              showName={true}
                              unreadCount={0}
                              isMuted={false}
                              hasImageError={imageErrors.has(space.id)}
                              onImageError={() => setImageErrors(prev => new Set(prev).add(space.id))}
                            />
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {discoverSpaces.length > 0 && (
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                      <View style={[styles.sectionIconContainer, { backgroundColor: colors.secondary + '15' }]}>
                        <IconSymbol name="compass-outline" size={12} color={colors.secondary} />
                      </View>
                      <View>
                        <Text style={[styles.sectionLabel, { color: colors.text }]}>
                          Discover Spaces
                        </Text>
                        <Text style={[styles.sectionSubtext, { color: colors.secondary }]}>
                          {discoverSpaces.length} to explore
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.sectionCountBadge, { backgroundColor: colors.cardBorder }]}>
                      <Text style={[styles.sectionCount, { color: colors.secondary }]}>
                        {discoverSpaces.length}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="square.grid.2x2"
              title={
                debouncedSearchQuery
                  ? 'No spaces found'
                  : showRequestsOnly
                    ? 'No pending requests'
                    : 'No spaces yet'
              }
              message={
                debouncedSearchQuery
                  ? `No spaces match "${debouncedSearchQuery}"`
                  : showRequestsOnly
                    ? 'When you request to join a space, it will show up here.'
                    : 'Join or create a space to get started'
              }
              actions={!debouncedSearchQuery && !showRequestsOnly ? [
                {
                  label: "Create Space",
                  onPress: () => {
                    haptics.medium();
                    router.push('/space/create');
                  },
                  variant: 'primary' as const,
                },
              ] : undefined}
            />
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
          onEndReached={loadMoreSpaces}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={[styles.footerLoader, { paddingVertical: Spacing.lg }]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
        />
      )}

      {/* Sort Menu */}
      <SpaceSortMenu
        activeSort={activeSort}
        onSortChange={(sort) => {
          setActiveSort(sort);
          AsyncStorage.setItem(COMMUNITY_SORT_KEY, sort).catch(() => {});
        }}
        visible={showSortMenu}
        onClose={() => setShowSortMenu(false)}
      />

      {/* Action Sheet */}
      <SpaceActionSheet
        visible={selectedSpaceForAction !== null}
        space={selectedSpaceForAction}
        onClose={() => setSelectedSpaceForAction(null)}
        onJoin={handleJoinSpace}
        onLeave={handleLeaveSpace}
        onViewDetails={(spaceId) => {
          setSelectedSpaceForAction(null);
          const space = spaces.find(s => s.id === spaceId);
          if (space) handleSpacePress(space);
        }}
        onMute={handleMuteSpace}
      />
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    flex: 1,
  },
  createButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  searchResultCount: {
    fontSize: Typography.xs,
    fontWeight: '500',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  errorBannerWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  errorBannerText: {
    flex: 1,
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  errorBannerRetry: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.md,
  },
  errorBannerRetryText: {
    color: '#FFFFFF',
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  errorBannerDismiss: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  modeBannerWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  modeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  modeBannerText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  modeBannerCta: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  modeBannerCtaText: {
    fontSize: Typography.sm,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  loadingContainer: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  footerLoader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  getStartedIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  getStartedTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  getStartedMessage: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.35,
    textAlign: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  getStartedChipsScroll: {
    marginHorizontal: -Spacing.lg,
  },
  getStartedChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  getStartedChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  getStartedChipText: {
    color: '#FFFFFF',
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sectionIconContainer: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionLabel: {
    fontSize: Typography.sm,
    fontWeight: '600',
    letterSpacing: -0.1,
    marginBottom: 1,
  },
  sectionSubtext: {
    fontSize: Typography.xs - 1,
    fontWeight: '500',
    opacity: 0.6,
  },
  sectionCountBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.md,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCount: {
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  serverBoxesScroll: {
    marginTop: 0,
    marginBottom: Spacing.sm,
  },
  serverBoxesContainer: {
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  serverBox: {
    alignItems: 'center',
    padding: Spacing.md,
    width: 110,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  serverBoxTop: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  serverIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverIconImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  serverIconText: {
    fontSize: 20,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  serverName: {
    fontSize: Typography.xs + 1,
    textAlign: 'center',
    letterSpacing: -0.1,
    marginBottom: Spacing.xs / 2,
  },
  serverBoxBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs / 2,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  memberCount: {
    fontSize: Typography.xs - 1,
    fontWeight: '500',
    opacity: 0.7,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
  },
  viewAllText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 0,
    paddingBottom: Spacing.xl * 2,
  },
});
