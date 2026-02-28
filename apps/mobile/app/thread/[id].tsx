import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Post, ThreadMessage } from '@/types/post';
import { ThemedText } from '@/components/themed-text';
import { ThreadHeader } from '@/components/thread/ThreadHeader';
import { MessageBubble } from '@/components/thread/MessageBubble';
import { ThreadInput } from '@/components/thread/ThreadInput';
import { EmptyState } from '@/components/EmptyState';
import { getPostById, incrementPostCommentCount } from '@/lib/api/posts';
import { getThreadMessages, sendThreadMessage, reactToMessage } from '@/lib/api/threads';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReportBlock } from '@/hooks/useReportBlock';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export type CommentGroup = { comment: ThreadMessage; replies: ThreadMessage[] };

type ListItem =
  | { type: 'comment'; message: ThreadMessage; replyCount: number }
  | { type: 'viewReplies'; parentId: string; parent: ThreadMessage; count: number }
  | { type: 'hideReplies'; parentId: string; count: number }
  | { type: 'reply'; message: ThreadMessage; parent: ThreadMessage };

export default function ThreadScreen() {
  const params = useLocalSearchParams<{ id: string | string[]; spaceName?: string; spaceId?: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const currentUserId = useCurrentUserId();
  const [post, setPost] = useState<Post | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ThreadMessage | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);
  const { getReportBlockOptions } = useReportBlock();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const spaceName = typeof params.spaceName === 'string' ? params.spaceName : undefined;
  const spaceId = typeof params.spaceId === 'string' ? params.spaceId : undefined;
  const originLabel = spaceName ? `From Space: ${spaceName}` : 'From Feed';

  useEffect(() => {
    if (id) {
      loadThread();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const loadThread = async () => {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const [fetchedPost, fetchedMessages] = await Promise.all([
        getPostById(id),
        getThreadMessages(id),
      ]);
      setPost(fetchedPost);
      const { flat } = buildGroups(fetchedMessages);
      setMessages(flat);
    } catch (err) {
      console.error('Error loading thread:', err);
      setError('Failed to load thread');
    } finally {
      setLoading(false);
    }
  };

  function buildGroups(allMessages: ThreadMessage[]): { groups: CommentGroup[]; flat: ThreadMessage[] } {
    const topLevel: ThreadMessage[] = [];
    const repliesMap = new Map<string, ThreadMessage[]>();
    const sorted = [...allMessages].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    sorted.forEach((message) => {
      if (message.replyTo) {
        if (!repliesMap.has(message.replyTo)) repliesMap.set(message.replyTo, []);
        repliesMap.get(message.replyTo)!.push(message);
      } else {
        topLevel.push(message);
      }
    });
    const groups: CommentGroup[] = topLevel.map((comment) => ({
      comment,
      replies: repliesMap.get(comment.id) || [],
    }));
    const flat: ThreadMessage[] = [];
    groups.forEach((g) => {
      flat.push(g.comment);
      flat.push(...g.replies);
    });
    return { groups, flat };
  }

  const { groups } = useMemo(() => buildGroups(messages), [messages]);

  const listData = useMemo((): ListItem[] => {
    const items: ListItem[] = [];
    groups.forEach(({ comment, replies }) => {
      items.push({ type: 'comment', message: comment, replyCount: replies.length });
      if (replies.length > 0) {
        const isExpanded = expandedReplies.has(comment.id);
        if (!isExpanded) {
          items.push({ type: 'viewReplies', parentId: comment.id, parent: comment, count: replies.length });
        } else {
          replies.forEach((reply) => {
            items.push({ type: 'reply', message: reply, parent: comment });
          });
          items.push({ type: 'hideReplies', parentId: comment.id, count: replies.length });
        }
      }
    });
    return items;
  }, [groups, expandedReplies]);

  const toggleReplies = useCallback((parentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  }, []);

  const handleSendMessage = useCallback(async (messageText: string, media?: any[], replyToId?: string) => {
    if (!id) return;

    const tempMessage: ThreadMessage = {
      id: `temp-${Date.now()}`,
      author: { id: 'current-user', name: 'You', handle: '@you' },
      content: messageText,
      createdAt: new Date().toISOString(),
      media: media,
      replyTo: replyToId,
    };
    setMessages((prev) => {
      const { flat } = buildGroups([...prev.filter((m) => !m.id.startsWith('temp-')), tempMessage]);
      return flat;
    });

    try {
      const newMessage = await sendThreadMessage(id, messageText, media, replyToId);
      const newCount = await incrementPostCommentCount(id);
      setPost((p) => (p ? { ...p, comments: newCount } : null));
      const { recordActivity } = await import('@/lib/services/activityService');
      const { incrementComments } = await import('@/lib/services/userMetricsService');
      await recordActivity('comment');
      await incrementComments();
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempMessage.id);
        const { flat } = buildGroups([...withoutTemp, newMessage]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        return flat;
      });
      if (replyToId) {
        setExpandedReplies((prev) => new Set(prev).add(replyToId));
      }
      setReplyingTo(null);
    } catch (error) {
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempMessage.id);
        const { flat } = buildGroups(withoutTemp);
        return flat;
      });
      console.error('Error sending message:', error);
    }
  }, [id]);

  const handleReply = useCallback((messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      setReplyingTo(message);
      const parentId = message.replyTo || message.id;
      if (message.replyTo) setExpandedReplies((prev) => new Set(prev).add(message.replyTo!));
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300);
    }
  }, [messages]);
  
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleReaction = useCallback(async (messageId: string, emoji: string) => {
    const msg = messages.find(m => m.id === messageId);
    const alreadyReacted = msg?.reactions?.some(r => r.emoji === emoji && r.userReacted);
    if (alreadyReacted) return;

    try {
      await reactToMessage(messageId, emoji);

      const { recordActivity } = await import('@/lib/services/activityService');
      const { incrementEngagement } = await import('@/lib/services/userMetricsService');
      await recordActivity('react');
      await incrementEngagement();

      setMessages(prev =>
        prev.map(m => {
          if (m.id !== messageId) return m;
          const existing = m.reactions?.find(r => r.emoji === emoji);
          if (existing) {
            return {
              ...m,
              reactions: m.reactions!.map(r =>
                r.emoji === emoji ? { ...r, count: r.count + 1, userReacted: true } : r
              ),
            };
          }
          return {
            ...m,
            reactions: [...(m.reactions || []), { emoji, count: 1, userReacted: true }],
          };
        })
      );
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }, [messages]);


  if (loading) {
    return (
      <ErrorBoundary>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </ErrorBoundary>
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
          <View style={styles.headerTitle}>
            <ThemedText style={[styles.headerTitleText, { color: colors.text }]}>Thread</ThemedText>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <ThemedText style={[styles.originLabel, { color: colors.primary }]}>{originLabel}</ThemedText>
            </TouchableOpacity>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.center, { padding: Spacing.lg }]}>
          <View style={[styles.errorIconWrap, { backgroundColor: (colors.error || '#DC2626') + '18' }]}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error || '#DC2626'} />
          </View>
          <ThemedText style={[styles.errorTitle, { color: colors.text }]}>Couldn't load thread</ThemedText>
          <ThemedText style={[styles.errorMessage, { color: colors.secondary }]}>{error}</ThemedText>
          <View style={styles.errorActions}>
            <TouchableOpacity
              style={[styles.errorButton, { backgroundColor: colors.primary }]}
              onPress={() => loadThread()}
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
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}>
              <ThemedText style={styles.backButtonText}>← Back</ThemedText>
            </TouchableOpacity>
          </View>
          <EmptyState
            icon="exclamationmark.triangle"
            title="Thread not found"
            message="This thread may have been deleted or doesn't exist"
          />
        </SafeAreaView>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <ThemedText style={[styles.headerTitleText, { color: colors.text }]}>Thread</ThemedText>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} accessibilityLabel={`${originLabel}, tap to go back`}>
              <ThemedText style={[styles.originLabel, { color: colors.primary }]}>{originLabel}</ThemedText>
            </TouchableOpacity>
            {messages.length > 0 && (
              <ThemedText style={[styles.headerSubtitle, { color: colors.secondary }]}>
                {groups.length} {groups.length === 1 ? 'comment' : 'comments'}
              </ThemedText>
            )}
          </View>
          {post?.author && post.author.id !== currentUserId && post.author.id !== '1' ? (
            <TouchableOpacity
              onPress={() => {
                const opts = getReportBlockOptions({
                  id: post.author!.id,
                  name: post.author!.name,
                  handle: post.author!.handle,
                  avatar: post.author!.avatar,
                });
                if (opts.length > 0) {
                  Alert.alert('Options', '', [...opts.map((o) => ({ text: o.text, style: o.style, onPress: o.onPress })), { text: 'Cancel', style: 'cancel' }]);
                }
              }}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        {/* Post Header - Hide when keyboard is visible */}
        {!keyboardVisible && <ThreadHeader post={post} />}

        {/* Comments list - TikTok style */}
        <FlatList
          ref={flatListRef}
          style={styles.messagesList}
          data={listData}
          keyExtractor={(item) =>
            item.type === 'comment'
              ? `c-${item.message.id}`
              : item.type === 'viewReplies'
                ? `v-${item.parentId}`
                : item.type === 'hideReplies'
                  ? `h-${item.parentId}`
                  : `r-${item.message.id}`
          }
          renderItem={({ item }) => {
            if (item.type === 'viewReplies') {
              return (
                <TouchableOpacity
                  style={[styles.viewRepliesWrap]}
                  onPress={() => toggleReplies(item.parentId)}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.viewRepliesText, { color: colors.secondary }]}>
                    View {item.count} {item.count === 1 ? 'reply' : 'replies'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.secondary} />
                </TouchableOpacity>
              );
            }
            if (item.type === 'hideReplies') {
              return (
                <TouchableOpacity
                  style={[styles.viewRepliesWrap]}
                  onPress={() => toggleReplies(item.parentId)}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.viewRepliesText, { color: colors.secondary }]}>Hide replies</Text>
                  <Ionicons name="chevron-up" size={16} color={colors.secondary} />
                </TouchableOpacity>
              );
            }
            const msg = item.type === 'comment' ? item.message : item.message;
            const replyToMessage = msg.replyTo
              ? item.type === 'reply'
                ? item.parent
                : messages.find((m) => m.id === msg.replyTo) || null
              : null;
            return (
              <MessageBubble
                message={msg}
                onReaction={handleReaction}
                onReply={handleReply}
                replyToMessage={replyToMessage}
                isReply={item.type === 'reply'}
              />
            );
          }}
          contentContainerStyle={[
            styles.messagesContent,
            listData.length === 0 && styles.emptyContent,
          ]}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={28} color={colors.secondary} style={{ opacity: 0.5, marginBottom: Spacing.md }} />
              <ThemedText style={[styles.emptyText, { color: colors.text }]}>No comments yet</ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: colors.secondary }]}>Be the first to comment.</ThemedText>
            </View>
          }
        />
        
        <ThreadInput 
          onSend={handleSendMessage}
          replyTo={replyingTo ? {
            id: replyingTo.id,
            author: { name: replyingTo.author?.name || 'User' },
            content: replyingTo.content || '',
          } : null}
          onCancelReply={handleCancelReply}
        />
      </KeyboardAvoidingView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  backButtonText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 36,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 1,
    opacity: 0.8,
  },
  originLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    paddingTop: Spacing.lg,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    opacity: 0.7,
  },
  viewRepliesWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingLeft: Spacing.lg + 32 + Spacing.md + 8,
  },
  viewRepliesText: {
    fontSize: 13,
    fontWeight: '500',
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

