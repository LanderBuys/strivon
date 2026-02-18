import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, Text } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { FollowButton } from './FollowButton';
import { getUserById, getFollowing } from '@/lib/api/users';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import { mockUsers } from '@/lib/mocks/users';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';

interface UserSuggestionsProps {
  userId?: string;
  limit?: number;
  showTitle?: boolean;
}

export function UserSuggestions({ userId, limit = 5, showTitle = true }: UserSuggestionsProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const currentUserId = useCurrentUserId();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, [userId, currentUserId]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const effectiveUserId = userId || currentUserId;
      const following = await getFollowing(effectiveUserId);
      const followingIds = new Set(following.map(u => u.id));
      
      const allUsers = await Promise.all(
        mockUsers
          .filter(u => u.id !== effectiveUserId && !followingIds.has(u.id))
          .slice(0, limit * 2)
          .map(id => getUserById(id.id))
      );
      
      // Shuffle and take limit
      const shuffled = allUsers.sort(() => Math.random() - 0.5);
      setSuggestions(shuffled.slice(0, limit));
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSuggestion = useCallback(({ item: user }: { item: any }) => (
    <TouchableOpacity
      style={[styles.userItem, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
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
                <Ionicons name="checkmark" size={8} color="#FFFFFF" />
              </View>
            )}
          </View>
          <Text style={[styles.handle, { color: colors.secondary }]} numberOfLines={1}>
            {user.handle}
          </Text>
        </View>
      </View>
      <FollowButton 
        userId={user.id} 
        variant="outline"
        onFollowChange={() => {
          // Reload suggestions when follow status changes
          loadSuggestions();
        }}
      />
    </TouchableOpacity>
  ), [colors, router, haptics]);

  if (loading || suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {showTitle && (
        <View style={styles.header}>
          <Ionicons name="people-outline" size={18} color={colors.secondary} />
          <Text style={[styles.title, { color: colors.text }]}>People you may know</Text>
        </View>
      )}
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        renderItem={renderSuggestion}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  userItem: {
    width: 160,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
    width: '100%',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: Spacing.sm,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
  },
  userDetails: {
    alignItems: 'center',
    width: '100%',
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
    textAlign: 'center',
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handle: {
    fontSize: Typography.sm,
    opacity: 0.7,
    textAlign: 'center',
  },
});



