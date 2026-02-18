import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Post } from '@/types/post';
import { PostCard } from './PostCard';
import { PostSkeleton } from './PostSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { getFeedPosts } from '@/lib/api/posts';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';

interface RecommendationsFeedProps {
  onPostPress?: (postId: string) => void;
  onLike?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onComment?: (postId: string) => void;
}

export function RecommendationsFeed({
  onPostPress,
  onLike,
  onSave,
  onComment,
}: RecommendationsFeedProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      // In real app, this would fetch personalized recommendations
      const response = await getFeedPosts('for-you', 1, 10);
      if (response && response.data) {
        // Shuffle and take top recommendations
        const shuffled = [...response.data].sort(() => Math.random() - 0.5);
        setPosts(shuffled.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <View style={styles.postWrapper}>
        <PostCard
          post={item}
          onLike={() => {
            onLike?.(item.id);
            setPosts(prev =>
              prev.map(p =>
                p.id === item.id
                  ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
                  : p
              )
            );
          }}
          onSave={() => {
            onSave?.(item.id);
            setPosts(prev =>
              prev.map(p =>
                p.id === item.id
                  ? { ...p, isSaved: !p.isSaved, saves: p.isSaved ? p.saves - 1 : p.saves + 1 }
                  : p
              )
            );
          }}
          onComment={() => onComment?.(item.id)}
          onPress={() => onPostPress?.(item.id)}
        />
      </View>
    ),
    [onLike, onSave, onComment, onPostPress]
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="sparkles" size={18} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Recommended for You</Text>
        </View>
        {Array.from({ length: 3 }).map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </View>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={18} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Recommended for You</Text>
        <TouchableOpacity
          onPress={loadRecommendations}
          style={styles.refreshButton}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        scrollEnabled={false}
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
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  refreshButton: {
    padding: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
  },
  postWrapper: {
    marginBottom: 0,
  },
});



