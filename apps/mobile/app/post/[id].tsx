import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '@/types/post';
import { ThemedText } from '@/components/themed-text';
import { PostCard } from '@/components/feed/PostCard';
import { getPostById, likePost as apiLikePost, savePost as apiSavePost, votePoll } from '@/lib/api/posts';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function PostScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLike = async () => {
    if (!post) return;
    haptics.light();
    setPost((p) => p ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : null);
    try {
      const result = await apiLikePost(post.id);
      setPost((p) => p ? { ...p, isLiked: result.isLiked, likes: result.likes } : null);
    } catch (e) {
      setPost((p) => p ? { ...p, isLiked: !p!.isLiked, likes: p!.isLiked ? p!.likes + 1 : p!.likes - 1 } : null);
    }
  };

  const handleSave = async () => {
    if (!post) return;
    haptics.light();
    setPost((p) => p ? { ...p, isSaved: !p.isSaved, saves: p.isSaved ? p.saves - 1 : p.saves + 1 } : null);
    try {
      const result = await apiSavePost(post.id);
      setPost((p) => p ? { ...p, isSaved: result.isSaved, saves: result.saves } : null);
    } catch (e) {
      setPost((p) => p ? { ...p, isSaved: !p!.isSaved, saves: p!.isSaved ? p!.saves + 1 : p!.saves - 1 } : null);
    }
  };

  const handlePollVote = async (optionId: string) => {
    if (!post?.id || !post.poll) return;
    haptics.light();
    try {
      const updatedPoll = await votePoll(post.id, optionId);
      setPost((p) => p ? { ...p, poll: updatedPoll } : null);
    } catch (e) {
      // ignore
    }
  };

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const loadPost = useCallback(async () => {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const data = await getPostById(id);
      setPost(data ?? null);
    } catch {
      setError('Failed to load post');
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadPost();
    else setLoading(false);
  }, [id, loadPost]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Post</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <ErrorBoundary>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Post</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.centered, { padding: Spacing.lg }]}>
          <View style={[styles.errorIconWrap, { backgroundColor: (colors.error || '#DC2626') + '18' }]}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error || '#DC2626'} />
          </View>
          <ThemedText style={[styles.errorTitle, { color: colors.text }]}>Couldn't load post</ThemedText>
          <ThemedText style={[styles.errorMessage, { color: colors.secondary }]}>{error}</ThemedText>
          <View style={styles.errorActions}>
            <TouchableOpacity
              style={[styles.errorButton, { backgroundColor: colors.primary }]}
              onPress={() => { haptics.light(); loadPost(); }}
              activeOpacity={0.8}
              accessibilityLabel="Try again"
              accessibilityRole="button"
            >
              <Text style={styles.errorButtonText}>Try again</Text>
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
      </ErrorBoundary>
    );
  }

  if (!post) {
    return (
      <ErrorBoundary>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Post</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centered}>
          <ThemedText style={{ color: colors.secondary }}>Post not found</ThemedText>
        </View>
        </SafeAreaView>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Post</ThemedText>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <PostCard
          post={post}
          onLike={handleLike}
          onSave={handleSave}
          onComment={() => router.push(`/thread/${post.id}` as any)}
          onPollVote={handlePollVote}
          onPress={() => router.push(`/thread/${post.id}` as any)}
          onOpenMediaViewer={(postId) => router.push(`/thread/${postId}` as any)}
        />
      </ScrollView>
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
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  headerSpacer: {
    width: 36,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
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
