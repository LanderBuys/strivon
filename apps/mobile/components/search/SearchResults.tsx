import { View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { User, Post, Space } from '@/types/post';
import { PostCard } from '@/components/feed/PostCard';
import { FollowButton } from '@/components/profile/FollowButton';
import { EmptyState } from '@/components/EmptyState';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useReportBlock } from '@/hooks/useReportBlock';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';

interface SearchResultsProps {
  activeTab: 'people' | 'projects' | 'topics';
  users: User[];
  posts: Post[];
  spaces: Space[];
  query: string;
  loading: boolean;
}

export function SearchResults({ activeTab, users, posts, spaces, query, loading }: SearchResultsProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const currentUserId = useCurrentUserId();
  const { getReportBlockOptions } = useReportBlock();

  const handleUserPress = (userId: string) => {
    haptics.light();
    router.push(`/profile/${userId}`);
  };

  const handlePostPress = (postId: string) => {
    haptics.light();
    router.push(`/thread/${postId}`);
  };

  const handleSpacePress = (spaceId: string) => {
    haptics.light();
    router.push(`/space/${spaceId}`);
  };

  const renderUser = ({ item: user }: { item: User }) => {
    const reportBlockOpts = user.id !== currentUserId && user.id !== '1'
      ? getReportBlockOptions({ id: user.id, name: user.name, handle: user.handle, avatar: user.avatar })
      : [];
    return (
      <TouchableOpacity
        style={[styles.userItem, { borderBottomColor: colors.divider }]}
        onPress={() => handleUserPress(user.id)}
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
        <View style={styles.userItemActions}>
          {user.id !== currentUserId && (
            <FollowButton userId={user.id} variant="outline" />
          )}
          {reportBlockOpts.length > 0 && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                haptics.light();
                Alert.alert('Options', '', [
                  ...reportBlockOpts.map((o) => ({ text: o.text, style: o.style, onPress: o.onPress })),
                  { text: 'Cancel', style: 'cancel' },
                ]);
              }}
              style={[styles.moreButton, { backgroundColor: colors.surface }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const handleLike = (postId: string) => {
    // In a real app, this would update the like status
    console.log('Like post:', postId);
  };


  const handleSave = (postId: string) => {
    // In a real app, this would update the save status
    console.log('Save post:', postId);
  };

  const renderPost = ({ item: post }: { item: Post }) => {
    const reportBlockOpts = post.author && post.author.id !== currentUserId && post.author.id !== '1'
      ? getReportBlockOptions({
          id: post.author.id,
          name: post.author.name,
          handle: post.author.handle,
          avatar: post.author.avatar,
        })
      : [];
    return (
      <View style={styles.postWrapper}>
        <PostCard
          post={post}
          onPress={() => handlePostPress(post.id)}
          onLike={() => handleLike(post.id)}
          onSave={() => handleSave(post.id)}
          onLongPress={
            reportBlockOpts.length > 0
              ? () => {
                  haptics.light();
                  Alert.alert('Options', '', [
                    ...reportBlockOpts.map((o) => ({ text: o.text, style: o.style, onPress: o.onPress })),
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                }
              : undefined
          }
        />
      </View>
    );
  };

  const renderSpace = ({ item: space }: { item: Space }) => (
    <TouchableOpacity
      style={[styles.spaceItem, { borderBottomColor: colors.divider }]}
      onPress={() => handleSpacePress(space.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.spaceIcon, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name="people" size={24} color={colors.primary} />
      </View>
      <View style={styles.spaceInfo}>
        <Text style={[styles.spaceName, { color: colors.text }]} numberOfLines={1}>
          {space.name}
        </Text>
        {space.description && (
          <Text style={[styles.spaceDescription, { color: colors.secondary }]} numberOfLines={2}>
            {space.description}
          </Text>
        )}
        <View style={styles.spaceMeta}>
          <Ionicons name="people" size={14} color={colors.secondary} style={{ opacity: 0.6 }} />
          <Text style={[styles.spaceMemberCount, { color: colors.secondary }]}>
            {space.memberCount ? space.memberCount.toLocaleString() : '0'} members
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.secondary} style={{ opacity: 0.4 }} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const getEmptyState = () => {
    if (activeTab === 'people') {
      return {
        icon: 'people-outline',
        title: 'No people found',
        message: query.trim() ? `No users match "${query}"` : 'Search for people by name or username',
      };
    }
    if (activeTab === 'projects') {
      return {
        icon: 'document-text-outline',
        title: 'No posts found',
        message: query.trim() ? `No posts match "${query}"` : 'Search for posts by content or hashtags',
      };
    }
    if (activeTab === 'topics') {
      return {
        icon: 'people-outline',
        title: 'No spaces found',
        message: query.trim() ? `No spaces match "${query}"` : 'Search for spaces by name or description',
      };
    }
    return {
      icon: 'search-outline',
      title: 'No results',
      message: 'Try a different search term',
    };
  };

  if (activeTab === 'people') {
    return (
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState {...getEmptyState()} />
        }
      />
    );
  }

  if (activeTab === 'projects') {
    return (
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState {...getEmptyState()} />
        }
      />
    );
  }

  if (activeTab === 'topics') {
    return (
      <FlatList
        data={spaces}
        keyExtractor={(item) => item.id}
        renderItem={renderSpace}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState {...getEmptyState()} />
        }
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 52,
    height: 52,
    borderRadius: 26,
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
  userItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postWrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  spaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  spaceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  spaceInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  spaceName: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: 4,
  },
  spaceDescription: {
    fontSize: Typography.sm,
    opacity: 0.7,
    marginBottom: 6,
    lineHeight: Typography.sm * 1.4,
  },
  spaceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  spaceMemberCount: {
    fontSize: Typography.sm - 1,
    opacity: 0.6,
  },
});
