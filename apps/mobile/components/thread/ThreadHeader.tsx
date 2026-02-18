import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Post } from '@/types/post';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface ThreadHeaderProps {
  post: Post;
}

export function ThreadHeader({ post }: ThreadHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const haptics = useHapticFeedback();

  const handleProfilePress = () => {
    if (post.author?.id) {
      haptics.light();
      router.push(`/profile/${post.author.id}`);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const caption = [post.title, post.content].filter(Boolean).join(' ').trim();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
      <View style={styles.row}>
        <TouchableOpacity style={styles.avatarContainer} onPress={handleProfilePress} activeOpacity={0.7}>
          {post.author?.avatar ? (
            <ExpoImage source={{ uri: post.author.avatar }} style={styles.avatar} contentFit="cover" transition={200} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{getInitials(post.author?.name || 'U')}</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.info}>
          <TouchableOpacity style={styles.nameRow} onPress={handleProfilePress} activeOpacity={0.7}>
            <Text style={[styles.authorName, { color: colors.text }]} numberOfLines={1}>
              {post.author?.name || 'User'}
            </Text>
            {post.author?.label && <Ionicons name="checkmark-circle" size={14} color={colors.primary} style={{ marginLeft: 2 }} />}
            <Text style={[styles.meta, { color: colors.secondary }]}> · {formatTime(post.createdAt)}</Text>
          </TouchableOpacity>
          {caption ? (
            <Text style={[styles.caption, { color: colors.secondary }]} numberOfLines={2}>
              {caption}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 13,
    fontWeight: '400',
    marginLeft: 2,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    opacity: 0.85,
  },
});
