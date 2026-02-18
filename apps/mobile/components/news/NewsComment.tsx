import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NewsComment as NewsCommentType } from '@/types/news';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { FormattedPostText } from '@/components/feed/FormattedPostText';

interface NewsCommentProps {
  comment: NewsCommentType;
  onReply?: (commentId: string) => void;
  onLike?: (commentId: string) => void;
  replyToComment?: NewsCommentType | null;
  isReply?: boolean;
}

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function NewsComment({ 
  comment, 
  onReply, 
  onLike,
  replyToComment,
  isReply = false 
}: NewsCommentProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const router = useRouter();
  const [likeAnim] = useState(new Animated.Value(1));

  const handleAuthorPress = () => {
    haptics.light();
    router.push(`/profile/${comment.author.id}`);
  };

  const handleReply = () => {
    haptics.light();
    onReply?.(comment.id);
  };

  const handleLike = () => {
    haptics.light();
    
    // Animate like button
    Animated.sequence([
      Animated.spring(likeAnim, {
        toValue: 1.3,
        useNativeDriver: true,
        tension: 300,
        friction: 3,
      }),
      Animated.spring(likeAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 3,
      }),
    ]).start();
    
    onLike?.(comment.id);
  };

  return (
    <View style={[
      styles.container,
      {
        borderBottomColor: colors.divider,
        backgroundColor: isReply ? (colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)') : 'transparent',
      },
      isReply && styles.replyContainer
    ]}>
      <View style={styles.commentRow}>
        {/* Avatar */}
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={handleAuthorPress}
          activeOpacity={0.7}
        >
          {comment.author.avatar ? (
            <ExpoImage
              source={{ uri: comment.author.avatar }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {getInitials(comment.author.name || 'U')}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Comment Content */}
        <View style={styles.commentContent}>
          {/* Reply Preview */}
          {comment.replyTo && replyToComment && (
            <TouchableOpacity
              style={[styles.replyPreview, {
                borderLeftColor: colors.primary,
                backgroundColor: colorScheme === 'dark' ? 'rgba(29, 155, 240, 0.15)' : 'rgba(29, 155, 240, 0.12)',
              }]}
              onPress={() => onReply?.(comment.replyTo!)}
              activeOpacity={0.7}
            >
              <View style={styles.replyPreviewHeader}>
                <Ionicons name="arrow-undo" size={12} color={colors.primary} />
                <Text style={[styles.replyAuthor, { color: colors.primary }]}>
                  {replyToComment.author?.name || 'User'}
                </Text>
              </View>
              <Text style={[styles.replyText, { color: colors.text }]} numberOfLines={1}>
                {replyToComment.content}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.commentHeader}>
            <TouchableOpacity onPress={handleAuthorPress} activeOpacity={0.7}>
              <Text style={[styles.authorName, { color: colors.text }]}>
                {comment.author.name || 'User'}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.timestamp, { color: colors.secondary }]}>
              {formatTimeAgo(comment.createdAt)}
            </Text>
          </View>

          <View style={styles.commentBody}>
            {comment.content && (
              <FormattedPostText
                text={comment.content}
                color={colors.text}
                style={styles.commentText}
              />
            )}
            
            {/* Media */}
            {comment.media && comment.media.length > 0 && (
              <View style={styles.mediaContainer}>
                {comment.media.map((item, index) => (
                  <View key={item.id || index} style={styles.mediaItem}>
                    {item.type === 'video' ? (
                      <View style={[styles.mediaThumbnail, { backgroundColor: colors.inputBackground }]}>
                        <ExpoImage
                          source={{ uri: item.thumbnail || item.url }}
                          style={styles.mediaImage}
                          contentFit="cover"
                        />
                        <View style={styles.videoOverlay}>
                          <Ionicons name="play-circle" size={32} color="#FFFFFF" />
                        </View>
                        {item.duration && (
                          <View style={styles.durationBadge}>
                            <Text style={styles.durationText}>
                              {Math.floor(item.duration)}s
                            </Text>
                          </View>
                        )}
                      </View>
                    ) : item.type === 'audio' ? (
                      <View style={[styles.audioContainer, { backgroundColor: colors.inputBackground }]}>
                        <Ionicons name="musical-notes" size={32} color={colors.primary} />
                        <Text style={[styles.audioDuration, { color: colors.text }]}>
                          {item.duration ? `${Math.floor(item.duration)}s` : 'Audio'}
                        </Text>
                      </View>
                    ) : item.type === 'document' ? (
                      <TouchableOpacity 
                        style={[styles.documentContainer, { backgroundColor: colors.inputBackground }]}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="document" size={32} color={colors.primary} />
                        <Text style={[styles.documentName, { color: colors.text }]} numberOfLines={2}>
                          {item.name || 'Document'}
                        </Text>
                        {item.size && (
                          <Text style={[styles.documentSize, { color: colors.secondary }]}>
                            {(item.size / 1024).toFixed(1)} KB
                          </Text>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <ExpoImage
                        source={{ uri: item.url}}
                        style={styles.mediaImage}
                        contentFit="cover"
                      />
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Poll */}
            {comment.poll && (
              <View style={[styles.pollContainer, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                <View style={styles.pollQuestionRow}>
                  <Ionicons name="bar-chart" size={18} color={colors.primary} />
                  <Text style={[styles.pollQuestion, { color: colors.text }]}>
                    {comment.poll.question}
                  </Text>
                </View>
                <View style={styles.pollOptions}>
                  {comment.poll.options.map((option) => {
                    // Recalculate totalVotes from options to ensure accuracy (one user = one vote)
                    const totalVotes = comment.poll!.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
                    const optionVotes = option.votes || 0;
                    const percentage = totalVotes > 0 ? Math.min(100, (optionVotes / totalVotes) * 100) : 0;
                    const isVoted = comment.poll!.userVotes?.includes(option.id);
                    
                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.pollOption,
                          {
                            borderColor: isVoted ? colors.primary : colors.cardBorder,
                            backgroundColor: isVoted ? colors.primary + '10' : 'transparent',
                          }
                        ]}
                        activeOpacity={0.7}
                      >
                        <View style={styles.pollOptionContent}>
                          <Text style={[styles.pollOptionText, { color: colors.text }]}>
                            {option.text}
                          </Text>
                          {totalVotes > 0 && (
                            <View style={[styles.pollBar, { backgroundColor: colors.divider }]}>
                              <View
                                style={[
                                  styles.pollBarFill,
                                  {
                                    width: `${percentage}%`,
                                    backgroundColor: colors.primary,
                                  }
                                ]}
                              />
                            </View>
                          )}
                          {totalVotes > 0 && (
                            <Text style={[styles.pollOptionVotes, { color: colors.secondary }]}>
                              {Math.round(percentage)}%
                            </Text>
                          )}
                        </View>
                        {isVoted && (
                          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLike}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.6}
            >
              <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
                <Ionicons
                  name={comment.isLiked ? 'heart' : 'heart-outline'}
                  size={18}
                  color={comment.isLiked ? '#EF4444' : colors.secondary}
                />
              </Animated.View>
              {comment.likes > 0 && (
                <Text style={[
                  styles.actionCount,
                  { color: comment.isLiked ? '#EF4444' : colors.secondary }
                ]}>
                  {comment.likes}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.replyButton]}
              onPress={handleReply}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.6}
            >
              <Ionicons name="arrow-undo-outline" size={16} color={colors.secondary} />
              <Text style={[styles.actionLabel, { color: colors.secondary }]}>Reply</Text>
            </TouchableOpacity>
          </View>

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <View style={styles.repliesContainer}>
              {comment.replies.map((reply) => (
                <NewsComment
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onLike={onLike}
                  isReply={true}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  replyContainer: {
    paddingLeft: Spacing.lg,
    marginLeft: Spacing.xl,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(29, 155, 240, 0.25)',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  commentRow: {
    flexDirection: 'row',
  },
  avatarContainer: {
    marginRight: Spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  commentContent: {
    flex: 1,
  },
  replyPreview: {
    padding: Spacing.xs,
    paddingLeft: Spacing.sm,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
  },
  replyPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  replyAuthor: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  replyText: {
    fontSize: Typography.xs,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  authorName: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: Typography.xs,
  },
  commentBody: {
    marginBottom: Spacing.xs,
  },
  commentText: {
    fontSize: Typography.sm,
    lineHeight: 20,
  },
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  mediaItem: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  audioContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  audioDuration: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  documentContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.xs,
  },
  documentName: {
    fontSize: Typography.xs,
    fontWeight: '500',
    textAlign: 'center',
  },
  documentSize: {
    fontSize: Typography.xs - 1,
  },
  pollContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pollQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  pollQuestion: {
    flex: 1,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  pollVoteCount: {
    fontSize: Typography.xs,
  },
  pollOptions: {
    gap: Spacing.xs,
  },
  pollOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  pollOptionContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  pollOptionText: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  pollBar: {
    height: 4,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  pollBarFill: {
    height: '100%',
  },
  pollOptionVotes: {
    fontSize: Typography.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  replyButton: {
    marginLeft: Spacing.xs,
  },
  actionCount: {
    fontSize: Typography.xs,
    fontWeight: '600',
    minWidth: 20,
  },
  actionLabel: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: Spacing.sm,
  },
});
