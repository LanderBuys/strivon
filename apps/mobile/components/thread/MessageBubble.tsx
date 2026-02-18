import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ThreadMessage } from '@/types/post';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

const DOUBLE_TAP_DELAY_MS = 280;

interface MessageBubbleProps {
  message: ThreadMessage;
  onReaction?: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string) => void;
  replyToMessage?: ThreadMessage | null;
  isReply?: boolean;
}

export function MessageBubble({ message, onReaction, onReply, replyToMessage, isReply = false }: MessageBubbleProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const likeCount = message.reactions?.reduce((sum, r) => sum + r.count, 0) ?? 0;
  const contentStr = message.content && typeof message.content === 'string' ? message.content : String(message.content || '');

  const alreadyLiked = message.reactions?.some(r => r.userReacted) ?? false;

  const handleCommentPress = () => {
    if (singleTapTimer.current) {
      clearTimeout(singleTapTimer.current);
      singleTapTimer.current = null;
      if (!alreadyLiked) {
        haptics.light();
        onReaction?.(message.id, '❤️');
      }
      return;
    }
    singleTapTimer.current = setTimeout(() => {
      singleTapTimer.current = null;
      haptics.light();
      onReply?.(message.id);
    }, DOUBLE_TAP_DELAY_MS);
  };

  return (
    <View style={[
      styles.container,
      { borderBottomColor: colors.divider },
      isReply && styles.replyContainer,
    ]}>
      <View style={[styles.messageRow, isReply && styles.replyRow]}>
        <TouchableOpacity
          style={styles.commentTouchable}
          onPress={handleCommentPress}
          activeOpacity={0.6}
        >
          <View style={styles.avatarContainer}>
            {message.author?.avatar ? (
              <ExpoImage
                source={{ uri: message.author.avatar }}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
              />
            ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.divider }]}>
              <Text style={[styles.avatarText, { color: colors.secondary }]}>
                  {getInitials(message.author?.name || 'U')}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.contentCol}>
            {message.replyTo && replyToMessage && (
              <Text style={[styles.replyToText, { color: colors.secondary }]}>
                Replying to {replyToMessage.author?.name || 'User'}
              </Text>
            )}
            <View style={styles.nameRow}>
              <Text style={[styles.authorName, { color: colors.text }]} numberOfLines={1}>
                {message.author?.name || 'User'}
              </Text>
              <Text style={[styles.timestamp, { color: colors.secondary }]}>
                {formatTime(message.createdAt)}
              </Text>
            </View>
            {contentStr ? (
              <Text style={[styles.messageText, { color: colors.text }]}>
                {contentStr}
              </Text>
            ) : null}
            {message.media && message.media.length > 0 && (
              <View style={styles.mediaRow}>
                {message.media.slice(0, 3).map((item, index) => (
                  <View key={item.id || index} style={[styles.mediaThumb, { backgroundColor: colors.divider }]}>
                    {item.type === 'video' ? (
                      <>
                        <ExpoImage source={{ uri: item.thumbnail || item.url }} style={styles.mediaThumbImg} contentFit="cover" />
                        <Ionicons name="play" size={16} color="#FFF" style={styles.mediaPlayIcon} />
                      </>
                    ) : (
                      <ExpoImage source={{ uri: item.url }} style={styles.mediaThumbImg} contentFit="cover" />
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Like */}
        <View style={styles.actionsCol}>
          <TouchableOpacity
            onPress={() => !alreadyLiked && onReaction?.(message.id, '❤️')}
            style={styles.actionBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={message.reactions?.some(r => r.userReacted) ? 'heart' : 'heart-outline'}
              size={22}
              color={message.reactions?.some(r => r.userReacted) ? '#EF4444' : colors.secondary}
            />
            {likeCount > 0 && (
              <Text style={[styles.actionCount, { color: colors.secondary }]}>{likeCount}</Text>
            )}
          </TouchableOpacity>
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
  replyContainer: {
    paddingLeft: Spacing.lg + 32 + Spacing.md,
  },
  replyRow: {},
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    minWidth: 0,
  },
  avatarContainer: {
    marginRight: Spacing.sm + 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  contentCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: Spacing.xs,
  },
  replyToText: {
    marginBottom: 4,
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.95,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
    fontWeight: '400',
  },
  actionsCol: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  actionCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  mediaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.xs + 2,
  },
  mediaThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaThumbImg: {
    width: '100%',
    height: '100%',
  },
  mediaPlayIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -8,
    marginLeft: -8,
  },
});
