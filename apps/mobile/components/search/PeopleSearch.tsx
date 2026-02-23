import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/EmptyState';
import { SearchBar } from './SearchBar';
import { FollowButton } from '@/components/profile/FollowButton';
import { searchUsers } from '@/lib/api/search';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import { useDebounce } from '@/hooks/useDebounce';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { ScrollView } from 'react-native';

interface PeopleSearchProps {
  initialQuery?: string;
  showFilters?: boolean;
}

export function PeopleSearch({ initialQuery = '', showFilters = true }: PeopleSearchProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const currentUserId = useCurrentUserId();
  const [query, setQuery] = useState(initialQuery);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'verified' | 'following' | 'followers'>('all');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      performSearch();
    } else {
      setUsers([]);
    }
  }, [debouncedQuery, filter]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const results = await searchUsers(debouncedQuery);
      const filtered = results;

      // Apply filters
      if (filter === 'verified') {
        // In real app, filter by verified status
      } else if (filter === 'following') {
        // In real app, filter by following status
      } else if (filter === 'followers') {
        // In real app, filter by followers
      }

      setUsers(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderUser = useCallback(({ item: user }: { item: any }) => (
    <TouchableOpacity
      style={[styles.userItem, { borderBottomColor: colors.divider }]}
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
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.userDetails}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {user.name}
            </Text>
            {user.label && (
              <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="checkmark" size={10} color="#FFFFFF" />
              </View>
            )}
          </View>
          <Text style={[styles.handle, { color: colors.secondary }]} numberOfLines={1}>
            {user.handle}
          </Text>
          {user.bio && (
            <Text style={[styles.bio, { color: colors.secondary }]} numberOfLines={1}>
              {user.bio}
            </Text>
          )}
        </View>
      </View>
      {user.id !== currentUserId && (
        <FollowButton userId={user.id} variant="outline" />
      )}
    </TouchableOpacity>
  ), [colors, router, haptics]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchContainer, { borderBottomColor: colors.divider }]}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search people..."
          onClear={() => setQuery('')}
        />
      </View>

      {showFilters && query.trim().length >= 2 && (
        <View style={[styles.filters, { borderBottomColor: colors.divider }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
            {(['all', 'verified', 'following', 'followers'] as const).map((filterOption) => (
              <TouchableOpacity
                key={filterOption}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: filter === filterOption ? colors.primary : colors.cardBackground,
                    borderColor: filter === filterOption ? colors.primary : colors.cardBorder,
                  },
                ]}
                onPress={() => {
                  haptics.light();
                  setFilter(filterOption);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: filter === filterOption ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            query.trim().length >= 2 ? (
              <EmptyState
                icon="people"
                title="No people found"
                message={`No users match "${query}"`}
              />
            ) : (
              <EmptyState
                icon="search"
                title="Search for people"
                message="Enter a name or username to search"
              />
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filters: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.sm,
  },
  filtersContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  },
  bio: {
    fontSize: Typography.sm,
    opacity: 0.6,
    marginTop: 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

