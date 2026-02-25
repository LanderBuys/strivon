import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '@/types/post';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLS = 3;
const GAP = 4;
const CELL_SIZE = (SCREEN_WIDTH - (COLS - 1) * GAP) / COLS;

interface ProfilePostGridProps {
  posts: Post[];
  onLike?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onPollVote?: (postId: string, optionId: string) => void;
  ListHeaderComponent?: React.ReactElement | null;
  ListEmptyComponent?: React.ReactElement | null;
  refreshControl?: React.ReactElement;
  contentContainerStyle?: object;
  /** Optional custom background for text-only cells */
  placeholderBackground?: string;
}

function getThumbnail(post: Post): { uri: string; isVideo: boolean } | null {
  if (!post.media?.length) return null;
  const first = post.media[0];
  if (first.type === 'image') return { uri: first.url, isVideo: false };
  return { uri: first.thumbnail || first.url, isVideo: true };
}

export function ProfilePostGrid({
  posts,
  onLike,
  onSave,
  onPollVote,
  ListHeaderComponent,
  ListEmptyComponent,
  refreshControl,
  contentContainerStyle,
  placeholderBackground,
}: ProfilePostGridProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const haptics = useHapticFeedback();
  const bg = placeholderBackground ?? (colorScheme === 'dark' ? colors.surface : colors.cardBackground);

  const handlePress = (post: Post) => {
    haptics.light();
    router.push(`/post/${post.id}`);
  };

  const renderItem = ({ item }: { item: Post }) => {
    const thumb = getThumbnail(item);
    const hasMultiple = (item.media?.length ?? 0) > 1;

    return (
      <TouchableOpacity
        style={styles.cell}
        activeOpacity={0.85}
        onPress={() => handlePress(item)}
      >
        {thumb ? (
          <>
            <ExpoImage
              source={{ uri: thumb.uri }}
              style={styles.thumb}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            {thumb.isVideo && (
              <View style={styles.mediaBadge} pointerEvents="none">
                <Ionicons name="play" size={18} color="#fff" />
              </View>
            )}
            {hasMultiple && (
              <View style={styles.multiBadge} pointerEvents="none">
                <Ionicons name="grid-outline" size={14} color="#fff" />
              </View>
            )}
          </>
        ) : (
          <View style={[styles.placeholder, { backgroundColor: bg }]}>
            <Ionicons name="document-text-outline" size={28} color={colors.textMuted} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      numColumns={COLS}
      columnWrapperStyle={styles.row}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      style={styles.list}
      ListEmptyComponent={ListEmptyComponent}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  content: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiBadge: {
    position: 'absolute',
    bottom: Spacing.xs,
    right: Spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
