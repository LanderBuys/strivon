import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { useMemo, useRef } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { ThreadMessage } from '@/types/post';
import { Colors, hexToRgba } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, Typography } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FormattedMessageText } from './FormattedMessageText';
import { sanitizeForDisplay } from '@/lib/utils/sanitize';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_MEDIA_WIDTH = SCREEN_WIDTH * 0.65;

interface ChatMessageBubbleProps {
  message: ThreadMessage;
  isCurrentUser?: boolean;
  showAvatar?: boolean;
  isGrouped?: boolean;
  highlighted?: boolean;
  showAuthor?: boolean;
  showTimestamp?: boolean;
  showStatus?: boolean;
  onLongPress?: (message: ThreadMessage) => void;
  onReply?: (message: ThreadMessage) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onDoubleTap?: (message: ThreadMessage) => void;
  onMediaPress?: (message: ThreadMessage, mediaIndex: number) => void;
  onPollVote?: (messageId: string, pollId: string, optionId: string) => void;
  onSharedPostPress?: (postId: string) => void;
  onSharedArticlePress?: (articleId: string) => void;
}

export function ChatMessageBubble({ 
  message, 
  isCurrentUser = false, 
  showAvatar = false,
  isGrouped = false,
  highlighted = false,
  showAuthor = true,
  showTimestamp = true,
  showStatus = false,
  onLongPress,
  onReaction,
  onDoubleTap,
  onMediaPress,
  onPollVote,
  onSharedPostPress,
  onSharedArticlePress,
}: ChatMessageBubbleProps) {
  // Normalize and sanitize message content for safe display
  const rawContent = typeof message.content === 'string' ? message.content : String(message.content || '');
  const normalizedMessage = {
    ...message,
    content: sanitizeForDisplay(rawContent),
  };
  
  const lastTap = useRef<number>(0);
  const mediaTapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (lastTap.current && (now - lastTap.current) < DOUBLE_PRESS_DELAY) {
      onDoubleTap?.(normalizedMessage);
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  const handleMediaTap = (mediaIndex: number) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (lastTap.current && (now - lastTap.current) < DOUBLE_PRESS_DELAY) {
      if (mediaTapTimeout.current) {
        clearTimeout(mediaTapTimeout.current);
        mediaTapTimeout.current = null;
      }
      onDoubleTap?.(normalizedMessage);
      lastTap.current = 0;
      return;
    }

    lastTap.current = now;

    if (!onMediaPress) return;
    if (mediaTapTimeout.current) clearTimeout(mediaTapTimeout.current);
    mediaTapTimeout.current = setTimeout(() => {
      onMediaPress?.(normalizedMessage, mediaIndex);
      mediaTapTimeout.current = null;
      lastTap.current = 0;
    }, DOUBLE_PRESS_DELAY + 10);
  };
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // More "professional" / neutral chat styling (less candy-colored).
  const bubbleBackgroundColor = isCurrentUser
    ? hexToRgba(colors.primary, colorScheme === 'dark' ? 0.22 : 0.12)
    : colors.cardBackground;

  const bubbleBorderColor = isCurrentUser
    ? hexToRgba(colors.primary, colorScheme === 'dark' ? 0.35 : 0.22)
    : colors.cardBorder;

  const messageTextColor = colors.text;
  const messageSecondaryTextColor = colors.secondary;

  const metaText =
    isCurrentUser && normalizedMessage.status
      ? normalizedMessage.status === 'sending'
        ? 'Sending…'
        : normalizedMessage.status === 'sent'
          ? 'Unread'
          : normalizedMessage.status === 'delivered'
            ? 'Delivered'
            : 'Read'
      : null;
  
  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '--:--';
    try {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return '--:--';
    }
  };

  const formatVideoDuration = (seconds: number | undefined) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const hasSharedPost = !!(normalizedMessage.sharedPost);
  const hasSharedArticle = !!(normalizedMessage.sharedArticle);
  const hasMedia = !!(normalizedMessage.media && normalizedMessage.media.length > 0);
  const rawText = typeof normalizedMessage.content === 'string' ? normalizedMessage.content.trim() : '';
  const isMediaPlaceholderText =
    hasMedia &&
    (rawText === '📎 Media' ||
      rawText === '📷 Photo' ||
      rawText === '🎥 Video' ||
      rawText === '📎 Attachment' ||
      rawText === '🎤 Voice message' ||
      rawText === '📎 Shared a post' ||
      rawText === '📰 Shared an article');
  const hasText = !!(rawText.length > 0 && !isMediaPlaceholderText && !hasSharedPost && !hasSharedArticle);
  const hasVoice = !!(hasMedia && normalizedMessage.media?.some(m => m.type === 'AUDIO'));
  const hasCall = !!(hasMedia && normalizedMessage.media?.some(m => m.type === 'CALL'));
  const isImageOnlyMessage =
    hasMedia &&
    !hasVoice &&
    !hasCall &&
    !hasText &&
    Boolean(normalizedMessage.media?.every(m => m?.type === 'IMAGE' || m?.type === 'image'));

  const reactions = useMemo(() => {
    const list = normalizedMessage.reactions || [];
    // Stable ordering: most popular first, then emoji for consistency.
    return [...list].sort((a, b) => {
      const diff = (b.count || 0) - (a.count || 0);
      if (diff !== 0) return diff;
      return String(a.emoji).localeCompare(String(b.emoji));
    });
  }, [normalizedMessage.reactions]);
  const reactionsToShow = reactions.slice(0, 5);
  const remainingReactionsCount = Math.max(0, reactions.length - reactionsToShow.length);
  // In 1:1 chats, hide numeric reaction counts; only show counts in group chats.
  // `showAuthor` is passed as `isGroupChat` by callers.
  const showReactionCounts = showAuthor;

  const renderMedia = () => {
    if (!hasMedia) return null;

    const mediaItems = normalizedMessage.media!.filter((mediaItem) => {
      const isImage = mediaItem.type === 'IMAGE' || mediaItem.type === 'image';
      const isVideo = mediaItem.type === 'VIDEO' || mediaItem.type === 'video';
      return (isImage || isVideo) && (mediaItem.url || mediaItem.uri || mediaItem.thumbnail);
    });

    if (mediaItems.length === 0) return null;

    // Calculate size for horizontal layout
    const mediaCount = mediaItems.length;
    const gap = Spacing.xs;
    const totalGaps = (mediaCount - 1) * gap;
    const availableWidth = Math.min(MAX_MEDIA_WIDTH, SCREEN_WIDTH * 0.7);
    const maxItemHeight = SCREEN_WIDTH * 0.5;
    
    // Calculate item width (equal for all items)
    const itemWidth = (availableWidth - totalGaps) / mediaCount;
    
    // Find the tallest item to ensure all fit
    let maxHeight = 0;
    mediaItems.forEach((item) => {
      const isImage = item.type === 'IMAGE' || item.type === 'image';
      const aspectRatio = item.width && item.height 
        ? item.width / item.height 
        : isImage ? 4 / 3 : 16 / 9;
      const height = itemWidth / aspectRatio;
      if (height > maxHeight) maxHeight = height;
    });
    
    // If any item would be too tall, scale down all items
    const scale = maxHeight > maxItemHeight ? maxItemHeight / maxHeight : 1;
    const baseItemWidth = itemWidth * scale;

    return (
      <View
        style={[
          styles.mediaRowContainer,
          isImageOnlyMessage && styles.mediaContainerNoMargin,
        ]}
      >
        {mediaItems.map((mediaItem, index) => {
          const isImage = mediaItem.type === 'IMAGE' || mediaItem.type === 'image';
          const isVideo = mediaItem.type === 'VIDEO' || mediaItem.type === 'video';
          
          const aspectRatio = mediaItem.width && mediaItem.height 
            ? mediaItem.width / mediaItem.height 
            : isImage ? 4 / 3 : 16 / 9;
          
          // Calculate dimensions maintaining aspect ratio
          const finalWidth = baseItemWidth;
          const itemHeight = finalWidth / aspectRatio;

          const mediaUri = mediaItem.url || mediaItem.uri || mediaItem.thumbnail;
          if (!mediaUri) return null;

          return (
            <View
              key={index}
              style={[
                styles.mediaContainer,
                index < mediaCount - 1 && { marginRight: gap },
              ]}
            >
              {isImage ? (
                <TouchableOpacity
                  activeOpacity={0.98}
                  onPress={() => handleMediaTap(index)}
                  onLongPress={() => onLongPress?.(normalizedMessage)}
                >
                  <ExpoImage
                    source={{ uri: mediaUri }}
                    style={[styles.mediaImage, { width: finalWidth, height: itemHeight }]}
                    contentFit="cover"
                    transition={200}
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.98}
                  onPress={() => handleMediaTap(index)}
                  onLongPress={() => onLongPress?.(normalizedMessage)}
                >
                  <View style={[styles.mediaVideoContainer, { width: finalWidth, height: itemHeight }]}>
                    <ExpoImage
                      source={{ uri: mediaItem.thumbnail || mediaUri }}
                      style={[styles.mediaImage, { width: finalWidth, height: itemHeight }]}
                      contentFit="cover"
                      transition={200}
                    />
                    <View style={styles.videoOverlay}>
                      <View style={[styles.playButton, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                        <IconSymbol name="play" size={28} color="#FFFFFF" />
                      </View>
                    </View>
                    {mediaItem.duration && (
                      <View style={styles.videoDuration}>
                        <Text style={styles.videoDurationText}>
                          {formatVideoDuration(mediaItem.duration)}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderPoll = () => {
    if (!normalizedMessage.poll) return null;
    const poll = normalizedMessage.poll;
    const optionVotes = poll.options.map(opt => opt.votes || 0);
    const totalVotes = optionVotes.reduce((sum, votes) => sum + votes, 0);
    const userVotes = poll.userVotes || [];

    return (
      <View style={styles.pollContainer}>
        <View style={styles.pollQuestionRow}>
          <Text style={styles.pollEmoji}>📊</Text>
          <Text style={[styles.pollQuestion, { color: messageTextColor }]}>{poll.question}</Text>
        </View>
        <View style={styles.pollOptions}>
          {poll.options.map((option) => {
            const isSelected = userVotes.includes(option.id);
            const optionVoteCount = option.votes || 0;
            const hasVotes = optionVoteCount > 0;
            const percentage = totalVotes > 0 ? Math.min(100, Math.round((optionVoteCount / totalVotes) * 100)) : 0;
            
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.pollOption,
                  {
                    backgroundColor: isCurrentUser 
                      ? (isSelected ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.10)')
                      : (isSelected ? hexToRgba(colors.primary, 0.12) : colors.cardBackground),
                    borderColor: isCurrentUser
                      ? (isSelected ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.18)')
                      : (isSelected ? hexToRgba(colors.primary, 0.35) : colors.cardBorder),
                  }
                ]}
                onPress={() => {
                  if (onPollVote) {
                    onPollVote(normalizedMessage.id, poll.id, option.id);
                  }
                }}
                activeOpacity={0.75}
              >
                <View style={styles.pollOptionContent}>
                  <View style={styles.pollOptionRow}>
                    <Text style={[styles.pollOptionText, { color: messageTextColor }]}>
                      {option.text}
                    </Text>
                    <Text style={[styles.pollOptionVotes, { color: messageSecondaryTextColor }]}>
                      {Math.round(percentage)}%
                    </Text>
                  </View>
                  {hasVotes && (
                    <View style={[styles.pollBar, { backgroundColor: colors.divider }]}>
                      <View 
                        style={[
                          styles.pollBarFill, 
                          { 
                            width: `${percentage}%`,
                            backgroundColor: isSelected ? colors.primary : colors.secondary,
                          }
                        ]} 
                      />
                    </View>
                  )}
                </View>
                {isSelected && (
                  <IconSymbol name="checkmark-circle" size={18} color={isCurrentUser ? '#FFFFFF' : colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderSharedPostCard = () => {
    const sp = normalizedMessage.sharedPost;
    if (!sp) return null;
    const title = (sp.title || '').trim();
    const content = (sp.content || '').trim();
    const titleDisplay = title || content.slice(0, 100).trim() + (content.length > 100 ? '…' : '');
    const bodyContent = title ? content : content.slice(100).trim();
    const bodyShort = bodyContent.length > 200 ? bodyContent.slice(0, 200).trim() + '…' : bodyContent;
    const firstMedia = sp.media?.[0];
    const thumbUri = firstMedia?.thumbnail || firstMedia?.url;

    const cardBg = isCurrentUser ? 'rgba(255,255,255,0.18)' : colors.cardBackground;
    const cardBorder = isCurrentUser ? 'rgba(255,255,255,0.28)' : colors.cardBorder;

    return (
      <View style={styles.attachmentRow}>
        <TouchableOpacity
          style={[styles.sharedPostCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
          activeOpacity={0.82}
          onPress={() => onSharedPostPress?.(sp.postId)}
        >
          {thumbUri ? (
            <ExpoImage source={{ uri: thumbUri }} style={styles.sharedPostImage} contentFit="cover" />
          ) : null}
          <View style={styles.sharedPostCardBody}>
            <Text style={[styles.sharedPostCardTitle, { color: messageTextColor }]} numberOfLines={2}>
              {titleDisplay}
            </Text>
            <Text style={[styles.sharedPostCardAuthor, { color: messageSecondaryTextColor }]} numberOfLines={1}>
              {sp.author.name} · @{sp.author.handle}
            </Text>
            {bodyShort ? (
              <Text style={[styles.sharedPostCardBodyText, { color: messageTextColor }]} numberOfLines={3}>
                {bodyShort}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSharedArticleCard = () => {
    const sa = normalizedMessage.sharedArticle;
    if (!sa) return null;
    const titleDisplay = (sa.title || '').trim();
    const descShort = (sa.description || '').trim();
    const bodyShort = descShort.length > 200 ? descShort.slice(0, 200).trim() + '…' : descShort;

    const cardBg = isCurrentUser ? 'rgba(255,255,255,0.18)' : colors.cardBackground;
    const cardBorder = isCurrentUser ? 'rgba(255,255,255,0.28)' : colors.cardBorder;

    return (
      <View style={styles.attachmentRow}>
        <TouchableOpacity
          style={[styles.sharedPostCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
          activeOpacity={0.82}
          onPress={() => onSharedArticlePress?.(sa.articleId)}
        >
          {sa.imageUrl ? (
            <ExpoImage source={{ uri: sa.imageUrl }} style={styles.sharedPostImage} contentFit="cover" />
          ) : null}
          <View style={styles.sharedPostCardBody}>
            <Text style={[styles.sharedPostCardTitle, { color: messageTextColor }]} numberOfLines={2}>
              {titleDisplay || 'Article'}
            </Text>
            <Text style={[styles.sharedPostCardAuthor, { color: messageSecondaryTextColor }]} numberOfLines={1}>
              {sa.source}
            </Text>
            {bodyShort ? (
              <Text style={[styles.sharedPostCardBodyText, { color: messageTextColor }]} numberOfLines={3}>
                {bodyShort}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const showHeader = !isCurrentUser && !isGrouped && showAuthor;
  const shouldShowAvatar = !isCurrentUser && showAvatar && !isGrouped;

  const bubbleCornerStyle = isGrouped
    ? isCurrentUser
      ? { borderTopRightRadius: 7 }
      : { borderTopLeftRadius: 7 }
    : null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onLongPress={() => onLongPress?.(normalizedMessage)}
      onPress={Platform.OS === 'web' ? undefined : handleDoubleTap}
      {...(Platform.OS === 'web'
        ? ({ onDoubleClick: () => onDoubleTap?.(normalizedMessage) } as any)
        : {})}
      style={[
        styles.messageRow,
        isCurrentUser ? styles.messageRowCurrent : styles.messageRowOther,
      ]}
    >
      {!isCurrentUser && (shouldShowAvatar ? (
        <View style={styles.avatarContainer}>
          {normalizedMessage.author.avatar ? (
            <ExpoImage
              source={{ uri: normalizedMessage.author.avatar }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: hexToRgba(colors.secondary, 0.22) },
              ]}
            >
              <Text style={[styles.avatarText, { color: colors.text }]}>
                {getInitials(normalizedMessage.author.name)}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.avatarSpacer} />
      ))}

      <View style={[styles.messageMain, isCurrentUser ? styles.messageMainCurrent : styles.messageMainOther]}>
        {showHeader && (
          <View style={styles.headerRow}>
            <Text
              style={[
                styles.authorName,
                { color: colors.text },
              ]}
              numberOfLines={1}
            >
              {normalizedMessage.author.name}
            </Text>
          </View>
        )}

        <View style={styles.bubbleWrap}>
          <View
            style={[
              styles.bubble,
              isImageOnlyMessage
                ? styles.bubbleMediaOnly
                : { backgroundColor: bubbleBackgroundColor, borderColor: bubbleBorderColor },
              bubbleCornerStyle,
              highlighted && styles.bubbleHighlighted,
              highlighted && { borderColor: isCurrentUser ? 'rgba(255,255,255,0.55)' : colors.primary },
            ]}
          >
            {hasMedia && !hasVoice && !hasCall && renderMedia()}

            {normalizedMessage.poll && renderPoll()}

            {hasSharedPost && renderSharedPostCard()}
            {hasSharedArticle && renderSharedArticleCard()}

            {hasVoice && (
              <View style={styles.attachmentRow}>
                <TouchableOpacity
                  style={[
                    styles.voiceMessageCard,
                    {
                      backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.16)' : colors.cardBackground,
                      borderColor: isCurrentUser ? 'rgba(255,255,255,0.25)' : colors.cardBorder,
                    },
                  ]}
                  activeOpacity={0.8}
                  onLongPress={() => onLongPress?.(normalizedMessage)}
                  onPress={Platform.OS === 'web' ? undefined : handleDoubleTap}
                  {...(Platform.OS === 'web'
                    ? ({ onDoubleClick: () => onDoubleTap?.(normalizedMessage) } as any)
                    : {})}
                >
                  <View style={[
                    styles.voicePlayButton,
                    {
                      backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.2)' : hexToRgba(colors.primary, 0.1),
                    }
                  ]}>
                    <IconSymbol name="play" size={16} color={isCurrentUser ? '#FFFFFF' : colors.primary} />
                  </View>
                  <View style={styles.voiceContent}>
                    <View style={styles.voiceWaveform}>
                      <View style={[styles.waveBar, { height: 3, backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.4)' : colors.secondary }]} />
                      <View style={[styles.waveBar, { height: 10, backgroundColor: isCurrentUser ? '#FFFFFF' : colors.primary }]} />
                      <View style={[styles.waveBar, { height: 6, backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.5)' : colors.secondary }]} />
                      <View style={[styles.waveBar, { height: 14, backgroundColor: isCurrentUser ? '#FFFFFF' : colors.primary }]} />
                      <View style={[styles.waveBar, { height: 8, backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.5)' : colors.secondary }]} />
                      <View style={[styles.waveBar, { height: 5, backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.4)' : colors.secondary }]} />
                      <View style={[styles.waveBar, { height: 12, backgroundColor: isCurrentUser ? '#FFFFFF' : colors.primary }]} />
                      <View style={[styles.waveBar, { height: 7, backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.5)' : colors.secondary }]} />
                      <View style={[styles.waveBar, { height: 9, backgroundColor: isCurrentUser ? '#FFFFFF' : colors.primary }]} />
                      <View style={[styles.waveBar, { height: 4, backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.4)' : colors.secondary }]} />
                      <View style={[styles.waveBar, { height: 13, backgroundColor: isCurrentUser ? '#FFFFFF' : colors.primary }]} />
                      <View style={[styles.waveBar, { height: 6, backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.5)' : colors.secondary }]} />
                      <View style={[styles.waveBar, { height: 11, backgroundColor: isCurrentUser ? '#FFFFFF' : colors.primary }]} />
                      <View style={[styles.waveBar, { height: 5, backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.4)' : colors.secondary }]} />
                      <View style={[styles.waveBar, { height: 8, backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.5)' : colors.secondary }]} />
                      <View style={[styles.waveBar, { height: 15, backgroundColor: isCurrentUser ? '#FFFFFF' : colors.primary }]} />
                      <View style={[styles.waveBar, { height: 7, backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.5)' : colors.secondary }]} />
                      <View style={[styles.waveBar, { height: 4, backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.4)' : colors.secondary }]} />
                      <View style={[styles.waveBar, { height: 12, backgroundColor: isCurrentUser ? '#FFFFFF' : colors.primary }]} />
                      <View style={[styles.waveBar, { height: 6, backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.5)' : colors.secondary }]} />
                    </View>
                    <Text style={[styles.voiceDuration, { color: isCurrentUser ? 'rgba(255,255,255,0.9)' : messageSecondaryTextColor }]}>
                      {normalizedMessage.media?.[0]?.duration
                        ? formatVideoDuration(normalizedMessage.media[0].duration)
                        : '0:00'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {hasCall && (
              <View style={styles.attachmentRow}>
                {(() => {
                  const content =
                    normalizedMessage.content && typeof normalizedMessage.content === 'string'
                      ? normalizedMessage.content
                      : 'Call ended';
                  const parts = content.split(' • ');
                  const label = parts[0] || 'Call ended';
                  const duration = parts[1] || '';

                  return (
                    <View
                      style={[
                        styles.attachmentCard,
                        {
                          backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.14)' : colors.cardBackground,
                          borderColor: isCurrentUser ? 'rgba(255,255,255,0.22)' : colors.cardBorder,
                        },
                      ]}
                    >
                      <IconSymbol
                        name={normalizedMessage.media?.[0]?.isVideo ? 'videocam' : 'call'}
                        size={18}
                        color={isCurrentUser ? '#FFFFFF' : colors.primary}
                      />
                      <Text style={[styles.callText, { color: messageTextColor }]}>
                        {label}
                        {duration ? ` ${duration}` : ''}
                      </Text>
                    </View>
                  );
                })()}
              </View>
            )}

            {hasText && !hasCall && !normalizedMessage.poll && (
              <View style={styles.textBlock}>
                <FormattedMessageText
                  text={normalizedMessage.content}
                  mentions={normalizedMessage.mentions}
                  color={messageTextColor}
                />
              </View>
            )}

          {/* Timestamp / meta inside the bubble footer */}
            {!isImageOnlyMessage && ((showTimestamp && !isGrouped) || normalizedMessage.editedAt || normalizedMessage.pinned || metaText) ? (
              <View style={[styles.bubbleFooterRow, isCurrentUser ? styles.bubbleFooterRowCurrent : styles.bubbleFooterRowOther]}>
                <View style={styles.bubbleFooterLeft}>
                  {normalizedMessage.editedAt && (
                    <Text style={[styles.metaText, { color: messageSecondaryTextColor }]}>(edited)</Text>
                  )}
                  {metaText && (
                    <Text style={[styles.metaText, { color: messageSecondaryTextColor }]}>
                      {metaText}
                    </Text>
                  )}
                  {normalizedMessage.pinned && (
                    <IconSymbol
                      name="pin"
                      size={12}
                      color={messageSecondaryTextColor}
                      style={{ marginLeft: 4, opacity: 0.9 }}
                    />
                  )}
                </View>
                <View style={styles.bubbleFooterTimeWrap}>
                  <Text style={[styles.timeText, { color: messageSecondaryTextColor }]}>
                    {formatTime(normalizedMessage.createdAt)}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Floating reactions overlay (doesn't change message height) */}
          {reactionsToShow.length > 0 && (
            <View
              pointerEvents="box-none"
              style={[
                styles.reactionsOverlay,
                isCurrentUser ? styles.reactionsOverlayCurrent : styles.reactionsOverlayOther,
                isImageOnlyMessage && styles.reactionsOverlayOnMediaOnly,
              ]}
            >
              <View style={styles.reactionsOverlayRow}>
                {reactionsToShow.map((reaction, index) => {
                  const count = Math.max(1, Number(reaction.count || 1));
                  const isMine = Boolean(reaction.userReacted);
                  const chipBg = isCurrentUser
                    ? isMine ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.18)'
                    : isMine ? hexToRgba(colors.primary, 0.12) : colors.cardBackground;
                  const chipBorder = isCurrentUser
                    ? isMine ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.24)'
                    : isMine ? hexToRgba(colors.primary, 0.38) : colors.cardBorder;
                  const countColor = isCurrentUser ? 'rgba(255,255,255,0.92)' : (isMine ? colors.primary : colors.secondary);

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.reactionOverlayChip,
                        {
                          backgroundColor: chipBg,
                          borderColor: chipBorder,
                        },
                      ]}
                      onPress={() => onReaction?.(normalizedMessage.id, reaction.emoji)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel={`React with ${reaction.emoji}`}
                    >
                      <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                      {showReactionCounts && (
                        <Text style={[styles.reactionCount, { color: countColor }]}>
                          {count}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
                {showReactionCounts && remainingReactionsCount > 0 && (
                  <View
                    style={[
                      styles.reactionOverlayChip,
                      {
                        backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.18)' : colors.cardBackground,
                        borderColor: isCurrentUser ? 'rgba(255,255,255,0.24)' : colors.cardBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.reactionCount, { color: isCurrentUser ? 'rgba(255,255,255,0.92)' : colors.secondary }]}>
                      +{remainingReactionsCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Media-only image messages: show time underneath the image */}
        {isImageOnlyMessage && showTimestamp && !isGrouped && (
          <View
            style={[
              styles.mediaTimeRow,
              { alignSelf: isCurrentUser ? 'flex-end' : 'flex-start' },
            ]}
          >
            <Text style={[styles.timeText, { color: colors.secondary }]}>
              {formatTime(normalizedMessage.createdAt)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md + 2,
    paddingTop: Spacing.xs + 4,
    paddingBottom: Spacing.md,
    alignItems: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageRowCurrent: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: Spacing.sm + 2,
    marginTop: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  avatarText: {
    fontSize: Typography.xs + 1,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  avatarSpacer: {
    width: 36,
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  messageMain: {
    flex: 1,
    maxWidth: SCREEN_WIDTH * 0.78,
  },
  messageMainOther: {
    alignItems: 'flex-start',
  },
  messageMainCurrent: {
    alignItems: 'flex-end',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  authorName: {
    fontSize: Typography.sm + 1,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  timeText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    letterSpacing: 0.2,
    opacity: 0.9,
  },
  metaText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    letterSpacing: 0.15,
    opacity: 0.9,
  },
  bubble: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    overflow: 'hidden',
  },
  bubbleHighlighted: {
    borderWidth: 1,
  },
  bubbleMediaOnly: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  bubbleWrap: {
    position: 'relative',
  },
  reactionsOverlay: {
    position: 'absolute',
    bottom: -10,
    zIndex: 10,
    elevation: 10,
    maxWidth: '100%',
  },
  reactionsOverlayOnMediaOnly: {
    bottom: 8,
  },
  reactionsOverlayOther: {
    left: 10,
  },
  reactionsOverlayCurrent: {
    right: 10,
  },
  reactionsOverlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  reactionOverlayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs + 4,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 24,
    gap: 4,
  },
  bubbleFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs + 6,
    alignSelf: 'stretch',
  },
  bubbleFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  bubbleFooterTimeWrap: {
    flexShrink: 0,
    minWidth: 44,
  },
  bubbleFooterRowOther: {
    justifyContent: 'flex-start',
  },
  bubbleFooterRowCurrent: {
    justifyContent: 'flex-start',
  },
  timeRight: {
    marginLeft: 'auto',
  },
  textBlock: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  messageTextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pollEmoji: {
    fontSize: Typography.base,
    marginRight: 4,
  },
  attachmentRow: {
    marginTop: Spacing.xs + 2,
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  sharedPostCard: {
    overflow: 'hidden',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: SCREEN_WIDTH * 0.8,
  },
  sharedPostImage: {
    width: '100%',
    height: 160,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  sharedPostCardBody: {
    padding: Spacing.md,
  },
  sharedPostCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  sharedPostCardAuthor: {
    fontSize: 13,
    marginBottom: 8,
    opacity: 0.85,
  },
  sharedPostCardBodyText: {
    fontSize: 15,
    lineHeight: 22,
  },
  mediaRowContainer: {
    marginTop: Spacing.xs + 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mediaContainer: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  mediaContainerNoMargin: {
    marginTop: 0,
  },
  mediaImage: {
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  mediaVideoContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  videoDuration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  videoDurationText: {
    color: '#FFFFFF',
    fontSize: Typography.xs - 1,
    fontWeight: '600',
  },
  reactionEmoji: {
    fontSize: Typography.xs + 1,
  },
  pollContainer: {
    marginTop: Spacing.xs + 2,
    gap: Spacing.md,
    width: SCREEN_WIDTH * 0.72,
  },
  pollQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  pollQuestion: {
    fontSize: Typography.base,
    fontWeight: '600',
    lineHeight: Typography.base * 1.3,
    flex: 1,
  },
  pollQuestionVotes: {
    fontSize: Typography.xs,
    marginLeft: Spacing.xs,
  },
  pollOptions: {
    gap: Spacing.sm,
  },
  pollOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  pollOptionContent: {
    flex: 1,
    gap: Spacing.xs + 2,
  },
  pollOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pollOptionText: {
    fontSize: Typography.sm,
    flex: 1,
    lineHeight: Typography.sm * 1.3,
  },
  pollOptionVotes: {
    fontSize: Typography.xs,
    marginLeft: Spacing.sm,
  },
  pollBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  pollBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  pollTotalVotes: {
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
    opacity: 0.7,
  },
  reactionCount: {
    fontSize: Typography.xs - 1,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  mediaTimeRow: {
    marginTop: 6,
    paddingHorizontal: Spacing.xs,
  },
  voiceMessageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
    minHeight: 56,
    minWidth: SCREEN_WIDTH * 0.60,
    maxWidth: SCREEN_WIDTH * 0.70,
  },
  voicePlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  voiceContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  voiceWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    height: 20,
    justifyContent: 'flex-start',
  },
  waveBar: {
    width: 3.5,
    borderRadius: 2,
    minHeight: 3,
  },
  voiceDuration: {
    fontSize: Typography.xs,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  callText: {
    fontSize: Typography.base,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
});
