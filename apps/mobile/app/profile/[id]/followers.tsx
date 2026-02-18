import { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, Text, ActivityIndicator, ScrollView, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/EmptyState';
import { SearchBar } from '@/components/search/SearchBar';
import { FollowButton } from '@/components/profile/FollowButton';
import { getFollowers, getFollowing } from '@/lib/api/users';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import { useDebounce } from '@/hooks/useDebounce';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';

const SCREEN_WIDTH = Dimensions.get('window').width;

type TabType = 'followers' | 'following';

export default function FollowersScreen() {
  const params = useLocalSearchParams<{ id: string | string[]; tab?: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const currentUserId = useCurrentUserId();
  
  const [activeTab, setActiveTab] = useState<TabType>((params.tab as TabType) || 'followers');
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [followersLoading, setFollowersLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState(true);
  const [followersSearchQuery, setFollowersSearchQuery] = useState('');
  const [followingSearchQuery, setFollowingSearchQuery] = useState('');
  const debouncedFollowersQuery = useDebounce(followersSearchQuery, 300);
  const debouncedFollowingQuery = useDebounce(followingSearchQuery, 300);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const indicatorPosition = useRef(new Animated.Value(activeTab === 'followers' ? 0 : 1)).current;

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (id) {
      loadFollowers();
      loadFollowing();
    }
  }, [id]);

  // Refresh lists when screen comes into focus (e.g., after following/unfollowing)
  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadFollowers();
        loadFollowing();
      }
    }, [id])
  );

  useEffect(() => {
    const index = activeTab === 'followers' ? 0 : 1;
    scrollViewRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    Animated.spring(indicatorPosition, {
      toValue: index,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [activeTab]);

  const loadFollowers = async () => {
    if (!id) return;
    try {
      setFollowersLoading(true);
      const fetchedFollowers = await getFollowers(id);
      setFollowers(fetchedFollowers);
    } catch (error) {
      console.error('Error loading followers:', error);
    } finally {
      setFollowersLoading(false);
    }
  };

  const loadFollowing = async () => {
    if (!id) return;
    try {
      setFollowingLoading(true);
      const fetchedFollowing = await getFollowing(id);
      setFollowing(fetchedFollowing);
    } catch (error) {
      console.error('Error loading following:', error);
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    const newTab = index === 0 ? 'followers' : 'following';
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
    indicatorPosition.setValue(offsetX / SCREEN_WIDTH);
  };

  const handleTabPress = (tab: TabType) => {
    haptics.light();
    setActiveTab(tab);
  };

  const filteredFollowers = followers.filter(user => {
    const name = user?.name?.toLowerCase() || '';
    const handle = user?.handle?.toLowerCase() || '';
    const query = debouncedFollowersQuery.toLowerCase();
    return name.includes(query) || handle.includes(query);
  });

  const filteredFollowing = following.filter(user => {
    const name = user?.name?.toLowerCase() || '';
    const handle = user?.handle?.toLowerCase() || '';
    const query = debouncedFollowingQuery.toLowerCase();
    return name.includes(query) || handle.includes(query);
  });

  const renderUser = useCallback((user: any, isFollowingTab: boolean) => (
    <TouchableOpacity
      style={[styles.userItem]}
      onPress={() => {
        haptics.light();
        router.push(`/profile/${user.id}`);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.userInfo}>
        {user.avatar ? (
          <ExpoImage
            source={{ uri: user.avatar }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.secondary + '40' }]}>
            <Text style={[styles.avatarText, { color: colors.text }]}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}
        <View style={styles.userDetails}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {user?.name || 'User'}
            </Text>
            {user?.label && (
              <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="checkmark" size={10} color="#FFFFFF" />
              </View>
            )}
          </View>
          <Text style={[styles.handle, { color: colors.secondary }]} numberOfLines={1}>
            {user?.handle || '@user'}
          </Text>
          {user.bio && (
            <Text style={[styles.bio, { color: colors.secondary }]} numberOfLines={1}>
              {user.bio}
            </Text>
          )}
        </View>
      </View>
      {user.id !== currentUserId && (
        <FollowButton 
          userId={user.id} 
          variant="outline"
          onFollowChange={async () => {
            // Refresh the lists when follow status changes
            if (activeTab === 'followers') {
              await loadFollowers();
            } else {
              await loadFollowing();
            }
          }}
        />
      )}
    </TouchableOpacity>
  ), [colors, router, haptics]);

  const tabWidth = SCREEN_WIDTH / 2;
  const translateX = indicatorPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, tabWidth],
  });

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
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabPress('followers')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, { color: activeTab === 'followers' ? colors.text : colors.secondary }]}>
              Followers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabPress('following')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, { color: activeTab === 'following' ? colors.text : colors.secondary }]}>
              Following
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ width: 40 }} />
      </View>
      <Animated.View
        style={[
          styles.indicator,
          {
            backgroundColor: colors.primary,
            width: tabWidth,
            transform: [{ translateX }],
          },
        ]}
      />

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentOffset={{ x: activeTab === 'followers' ? 0 : SCREEN_WIDTH, y: 0 }}
      >
        {/* Followers Tab */}
        <View style={styles.tabContent}>
          <View style={[styles.searchContainer, { borderBottomColor: colors.divider, backgroundColor: colors.background }]}>
            <SearchBar
              value={followersSearchQuery}
              onChangeText={setFollowersSearchQuery}
              placeholder="Search followers..."
              onClear={() => setFollowersSearchQuery('')}
            />
          </View>
          {followersLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredFollowers}
              keyExtractor={(item, index) =>
                item?.id ? String(item.id) : `follower-${index}`
              }
              renderItem={({ item }) => renderUser(item, false)}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => (
                <View style={[styles.itemSeparator, { backgroundColor: colors.divider }]} />
              )}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <EmptyState
                  icon="people"
                  title={debouncedFollowersQuery ? "No followers found" : "No followers yet"}
                  message={debouncedFollowersQuery ? `No followers match "${debouncedFollowersQuery}"` : "This user doesn't have any followers yet"}
                />
              }
            />
          )}
        </View>

        {/* Following Tab */}
        <View style={styles.tabContent}>
          <View style={[styles.searchContainer, { borderBottomColor: colors.divider, backgroundColor: colors.background }]}>
            <SearchBar
              value={followingSearchQuery}
              onChangeText={setFollowingSearchQuery}
              placeholder="Search following..."
              onClear={() => setFollowingSearchQuery('')}
            />
          </View>
          {followingLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredFollowing}
              keyExtractor={(item, index) =>
                item?.id ? String(item.id) : `following-${index}`
              }
              renderItem={({ item }) => renderUser(item, true)}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => (
                <View style={[styles.itemSeparator, { backgroundColor: colors.divider }]} />
              )}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <EmptyState
                  icon="people"
                  title={debouncedFollowingQuery ? "No following found" : "Not following anyone"}
                  message={debouncedFollowingQuery ? `No following match "${debouncedFollowingQuery}"` : "This user is not following anyone yet"}
                />
              }
            />
          )}
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
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: Spacing.xs,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  tabText: {
    fontSize: Typography.base,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: Spacing.md,
  },
  tabContent: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listContent: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Spacing.md,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  name: {
    fontSize: Typography.base,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handle: {
    fontSize: Typography.sm,
    opacity: 0.7,
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  bio: {
    fontSize: Typography.sm,
    opacity: 0.65,
    marginTop: 1,
  },
  itemSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.md + 44 + Spacing.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
