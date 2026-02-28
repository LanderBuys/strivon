import { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '@/types/post';
import { getFeedPosts, likePost as apiLikePost, savePost as apiSavePost } from '@/lib/api/posts';
import { PostCard } from '@/components/feed/PostCard';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

function hasVideoMedia(post: Post): boolean {
  return Boolean(post.media?.some((m) => m.type === 'video'));
}

export default function SavedVideosScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async (isRefresh = false) => {
    try {
      setError(null);
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const response = await getFeedPosts('for-you', 1, 200);
      if (response?.data) {
        const savedWithVideo = response.data.filter(
          (p) => p && p.isSaved === true && hasVideoMedia(p)
        );
        setPosts(savedWithVideo);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error('Error loading saved videos:', err);
      setError('Failed to load saved videos');
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleLike = useCallback(
    async (postId: string) => {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      setPosts((prev) =>
        prev.map((p) =>
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
      try {
        await apiLikePost(postId);
      } catch (e) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, isLiked: post.isLiked, likes: post.likes } : p
          )
        );
      }
    },
    [posts, haptics]
  );

  const handleSave = useCallback(
    async (postId: string) => {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      const newSaved = !post.isSaved;
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isSaved: newSaved, saves: newSaved ? p.saves + 1 : p.saves - 1 }
            : p
        )
      );
      haptics.light();
      try {
        await apiSavePost(postId);
        if (!newSaved) {
          setPosts((prev) => prev.filter((p) => p.id !== postId));
        }
      } catch (e) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, isSaved: post.isSaved, saves: post.saves } : p
          )
        );
      }
    },
    [posts, haptics]
  );

  const handlePollVote = useCallback(() => {}, []);

  if (loading && posts.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Saved Videos</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Text style={[styles.loadingText, { color: colors.secondary }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Saved Videos</Text>
        <View style={{ width: 40 }} />
      </View>

      {error && (
        <View style={styles.errorWrap}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (!item?.id || !item.author?.id || !item.author?.name) return null;
          return (
            <PostCard
              post={item}
              onLike={() => handleLike(item.id)}
              onSave={() => handleSave(item.id)}
              onPollVote={handlePollVote}
            />
          );
        }}
        contentContainerStyle={[styles.listContent, posts.length === 0 && styles.listContentEmpty]}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name="videocam-outline" size={40} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved videos</Text>
              <Text style={[styles.emptyMessage, { color: colors.secondary }]}>
                Save posts that contain video from the feed and they will appear here.
              </Text>
              <TouchableOpacity
                style={[styles.goToFeedButton, { backgroundColor: colors.primary }]}
                onPress={() => router.replace('/(tabs)')}
                activeOpacity={0.8}
              >
                <Text style={styles.goToFeedButtonText}>Go to feed</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPosts(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
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
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: Spacing.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.base,
  },
  errorWrap: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.sm,
  },
  listContent: {
    paddingBottom: Spacing.xl + Spacing.lg,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: Typography.sm,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  goToFeedButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 8,
  },
  goToFeedButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sm,
    fontWeight: '600',
  },
});
