import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, ActivityIndicator, Text, Alert, KeyboardAvoidingView, Platform, RefreshControl, Animated } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { BlurView } from 'expo-blur';
import { ThreadMessage } from '@/types/post';
import { ThemedText } from '@/components/themed-text';
import { ChatMessageBubble } from '@/components/inbox/ChatMessageBubble';
import { ChatInput, ChatInputRef } from '@/components/inbox/ChatInput';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MessageSearch } from '@/components/inbox/MessageSearch';
import { MediaGallery } from '@/components/inbox/MediaGallery';
import { EmptyState } from '@/components/EmptyState';
import { TypingIndicator } from '@/components/inbox/TypingIndicator';
import { OnlineStatus } from '@/components/inbox/OnlineStatus';
import { ReplyPreview } from '@/components/inbox/ReplyPreview';
import { EmojiPicker } from '@/components/inbox/EmojiPicker';
import { ChatInfoModal } from '@/components/inbox/ChatInfoModal';
import { VoiceMessageRecorder } from '@/components/inbox/VoiceMessageRecorder';
import { MessageOptionsMenu } from '@/components/inbox/MessageOptionsMenu';
import { CallScreen } from '@/components/inbox/CallScreen';
import { VideoCallScreen } from '@/components/inbox/VideoCallScreen';
import { Ionicons } from '@expo/vector-icons';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getChatMessagesPaginated, sendChatMessage, deleteChatMessage, reactToChatMessage, forwardMessage, editChatMessage, pinChatMessage, extractMentions, voteOnPoll, getConversationById, getConversationsList } from '@/lib/api/chat';
import { getUserById } from '@/lib/api/users';
import { getCurrentUserIdOrFallback } from '@/lib/api/users';
import { notificationService } from '@/lib/services/notificationService';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useReportBlock } from '@/hooks/useReportBlock';
import { Spacing, Typography } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatChatDateHeader } from '@/lib/utils/time';

const getChatDraftKey = (conversationId: string) => `@strivon/chat_draft/${conversationId}`;

interface MessageGroup {
  id: string;
  messages: ThreadMessage[];
  authorId: string;
  date: string;
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{ id: string | string[]; messageId?: string | string[] }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loadingMoreOlder, setLoadingMoreOlder] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftRestored, setDraftRestored] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ThreadMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ThreadMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState<string | null>(null);
  const [lastReactionEmoji, setLastReactionEmoji] = useState<string>('❤️');
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [mediaGalleryInitialIndex, setMediaGalleryInitialIndex] = useState(0);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [chatNickname, setChatNickname] = useState<string | undefined>();
  const [chatBackground, setChatBackground] = useState<string | undefined>();
  const [disappearingMessages, setDisappearingMessages] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ThreadMessage | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [conversation, setConversation] = useState<{ id: string; user: { id: string; name: string; handle: string; avatar?: string | null; label?: string }; isGroup?: boolean; groupName?: string; members?: Array<{ id: string; name: string; handle: string; avatar?: string | null }> } | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; handle: string; avatar?: string | null; label?: string } | null>(null);
  const [otherConversations, setOtherConversations] = useState<Array<{ id: string; user: { id: string; name: string } }>>([]);
  const [conversationLoaded, setConversationLoaded] = useState(false);
  const [callMuted, setCallMuted] = useState(false);
  const [callSpeakerOn, setCallSpeakerOn] = useState(false);
  const [callVideoOn, setCallVideoOn] = useState(true);
  const [callCameraOn, setCallCameraOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const haptics = useHapticFeedback();
  const flatListRef = useRef<FlatList>(null);
  const chatInputRef = useRef<ChatInputRef>(null);
  const initialScrollToMessageIdRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const scrollToBottomOpacity = useRef(new Animated.Value(0)).current;

  const { getReportBlockOptions } = useReportBlock();

  const handleTyping = useCallback(() => {
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      typingTimeoutRef.current = null;
    }, 2000);
  }, []);

  // Ensure id is always a string
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const messageIdParam = Array.isArray(params.messageId) ? params.messageId[0] : params.messageId;
  const isGlobalChat = id === 'gc-global';

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const [conv, user] = await Promise.all([getConversationById(id), getUserById(getCurrentUserIdOrFallback())]);
      if (cancelled) return;
      setConversation(conv ?? null);
      setCurrentUser(user ? { id: user.id, name: user.name, handle: user.handle, avatar: user.avatar ?? null, label: user.label } : null);
      setConversationLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    getConversationsList().then((list) => setOtherConversations(list.filter((c) => c.id !== id)));
  }, [id]);

  const chatUser = conversation?.user;
  const isGroupChat = conversation?.isGroup || id?.startsWith('gc-') || false;
  const groupName = conversation?.groupName || 'Group Chat';
  const groupMembers = conversation?.members || [];
  const currentUserId = currentUser?.id ?? getCurrentUserIdOrFallback();

  const callCaller = useMemo(() => {
    if (isGroupChat) {
      return {
        id: id || 'group',
        name: groupName || 'Group Chat',
        avatar: undefined,
      };
    }
    if (chatUser) {
      return {
        id: chatUser.id,
        name: chatNickname || chatUser.name || 'Unknown',
        avatar: chatUser.avatar || undefined,
      };
    }
    return undefined;
  }, [chatNickname, chatUser, groupName, id, isGroupChat]);

  const videoCallParticipants = useMemo(() => {
    if (!isGroupChat) return undefined;
    return groupMembers.map(m => ({ id: m.id, name: m.name, avatar: m.avatar || undefined }));
  }, [isGroupChat, groupMembers]);

  useEffect(() => {
    if (id) {
      setDraft('');
      setDraftRestored(false);
      loadChat();
      AsyncStorage.getItem(getChatDraftKey(id)).then((s) => {
        if (s != null) setDraft(s);
      }).finally(() => setDraftRestored(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveDraft = useCallback((text: string) => {
    if (!id) return;
    setDraft(text);
    if (text.trim()) AsyncStorage.setItem(getChatDraftKey(id), text).catch(() => {});
    else AsyncStorage.removeItem(getChatDraftKey(id)).catch(() => {});
  }, [id]);

  // Global chat is text-only: make sure calls can't open
  useEffect(() => {
    if (!isGlobalChat) return;
    setShowCall(false);
    setShowVideoCall(false);
    setIsIncomingCall(false);
  }, [isGlobalChat]);

  // Group messages by sender and date
  const messageGroups = useMemo(() => {
    if (messages.length === 0) return [];
    
    // Normalize all messages before grouping to ensure content is always a string
    const normalizedMessages = messages.map(msg => ({
      ...msg,
      content: typeof msg.content === 'string' ? msg.content : String(msg.content || '')
    }));
    
    const groups: MessageGroup[] = [];
    let currentGroup: MessageGroup | null = null;
    
    normalizedMessages.forEach((message, index) => {
      const messageDate = new Date(message.createdAt).toDateString();
      const prevMessage = index > 0 ? normalizedMessages[index - 1] : null;
      const prevDate = prevMessage ? new Date(prevMessage.createdAt).toDateString() : null;
      
      // Check if we need a new date separator
      const needsDateSeparator = prevDate !== messageDate;
      
      // Check if we need a new group (different sender or new date)
      const needsNewGroup = 
        !currentGroup || 
        currentGroup.authorId !== message.author.id ||
        needsDateSeparator;
      
      if (needsNewGroup) {
        currentGroup = {
          id: `group-${index}`,
          messages: [message],
          authorId: message.author.id,
          date: messageDate,
        };
        groups.push(currentGroup);
      } else {
        currentGroup!.messages.push(message);
      }
    });
    
    return groups;
  }, [messages]);

  useEffect(() => {
    // When opening from inbox search, we pass a messageId to scroll to.
    initialScrollToMessageIdRef.current = messageIdParam || null;
    setHighlightMessageId(null);
  }, [id, messageIdParam]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0 && flatListRef.current) {
      // If we have a pending "scroll to specific message", don't auto-scroll to end.
      if (initialScrollToMessageIdRef.current) return;
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    const targetId = initialScrollToMessageIdRef.current;
    if (!targetId) return;
    if (!flatListRef.current) return;
    if (messages.length === 0) return;

    const groupIndex = messageGroups.findIndex(g => g.messages.some(m => m.id === targetId));
    initialScrollToMessageIdRef.current = null;

    if (groupIndex < 0) return;

    requestAnimationFrame(() => {
      flatListRef.current?.scrollToIndex({ index: groupIndex, animated: true });
      setHighlightMessageId(targetId);
      setTimeout(() => setHighlightMessageId(null), 1800);
    });
  }, [messages.length, messageGroups]);

  useEffect(() => {
    // Scroll to bottom when replyingTo changes (to show reply preview)
    if (replyingTo && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [replyingTo]);

  const loadChat = useCallback(async (isRefresh = false) => {
    if (!id) return;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setLoadError(null);
    try {
      const { messages: pageMessages, hasMore } = await getChatMessagesPaginated(id);
      const normalized = pageMessages.map(msg => ({
        ...msg,
        content: typeof msg.content === 'string' ? msg.content : String(msg.content || '')
      }));
      setMessages(normalized);
      setHasMoreOlder(hasMore);
    } catch (error) {
      console.error('Error loading chat:', error);
      setLoadError(error instanceof Error ? error.message : 'Could not load messages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  const loadOlderMessages = useCallback(async () => {
    if (!id || !hasMoreOlder || loadingMoreOlder || messages.length === 0) return;
    const oldestId = messages[0].id;
    setLoadingMoreOlder(true);
    try {
      const { messages: older, hasMore } = await getChatMessagesPaginated(id, { olderThanMessageId: oldestId });
      const normalized = older.map(msg => ({
        ...msg,
        content: typeof msg.content === 'string' ? msg.content : String(msg.content || '')
      }));
      setMessages(prev => [...normalized, ...prev]);
      setHasMoreOlder(hasMore);
    } catch (_) {
      setHasMoreOlder(false);
    } finally {
      setLoadingMoreOlder(false);
    }
  }, [id, hasMoreOlder, loadingMoreOlder, messages]);

  const onRefreshChat = useCallback(() => {
    haptics.light();
    loadChat(true);
  }, [loadChat, haptics]);

  const handleScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - layoutMeasurement.height - contentOffset.y;
    const shouldShow = distanceFromBottom > 300;
    setShowScrollToBottom(shouldShow);
    Animated.timing(scrollToBottomOpacity, {
      toValue: shouldShow ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    if (contentOffset.y < 120 && hasMoreOlder && !loadingMoreOlder) {
      loadOlderMessages();
    }
  }, [hasMoreOlder, loadingMoreOlder, loadOlderMessages, scrollToBottomOpacity]);

  const handleSendMessage = useCallback(async (messageText: string, media?: any[], poll?: any) => {
    if (!id) return;
    
    // Ensure messageText is a string
    const text = typeof messageText === 'string' ? messageText : String(messageText || '');
    
    // Don't send if there's no text, no media, and no poll
    if (!text.trim() && (!media || media.length === 0) && !poll) return;
    
    // Handle editing
    if (editingMessage) {
      try {
        const updatedMessage = await editChatMessage(id, editingMessage.id, messageText);
        const normalizedUpdatedMessage = {
          ...updatedMessage,
          content: typeof updatedMessage.content === 'string' ? updatedMessage.content : String(updatedMessage.content || '')
        };
        setMessages(prev => prev.map(m => m.id === editingMessage.id ? normalizedUpdatedMessage : m));
        setEditingMessage(null);
        haptics.success();
        return;
      } catch (error) {
        Alert.alert('Error', 'Failed to edit message.');
        return;
      }
    }
    
    const replyToId = replyingTo?.id;
    setReplyingTo(null); // Clear reply after sending
    
    // Extract mentions if group chat
    const mentions = isGroupChat ? extractMentions(text) : [];
    
    // Optimistic update
    const messageContent = (text.trim() 
      ? text.trim() 
      : (poll ? '📊 ' + poll.question : (media && media.length > 0 ? '📎 Media' : ''))) || '';
    
    const tempMessage: ThreadMessage = {
      id: `temp-${Date.now()}`,
      author: currentUser ? { id: currentUser.id, name: currentUser.name, handle: currentUser.handle, avatar: currentUser.avatar ?? null } : { id: currentUserId, name: 'You', handle: '@you', avatar: null },
      content: typeof messageContent === 'string' ? messageContent : String(messageContent || ''),
      createdAt: new Date().toISOString(),
      reactions: [],
      replyTo: replyToId,
      media: media,
      poll: poll,
      status: 'sending',
      mentions: mentions.length > 0 ? mentions : undefined,
    };
    setMessages(prev => [...prev, tempMessage]);

    // Timeout to prevent stuck "sending" status
    const timeoutId = setTimeout(() => {
      setMessages(prev => {
        const message = prev.find(m => m.id === tempMessage.id);
        if (message && message.status === 'sending') {
          return prev.map(m => 
            m.id === tempMessage.id ? { ...m, status: 'sent' as const } : m
          );
        }
        return prev;
      });
    }, 10000); // 10 second timeout

    try {
      const newMessage = await sendChatMessage(id, text, media, replyToId, poll);
      
      // Notify mentioned users (in-app + optional push)
      const mentionedHandles = newMessage.mentions || extractMentions(text);
      const authorForNotif = currentUser ? { id: currentUser.id, name: currentUser.name, handle: currentUser.handle, avatar: currentUser.avatar ?? null } : { id: currentUserId, name: 'You', handle: '@you', avatar: null };
      for (const handle of mentionedHandles) {
        if (newMessage.author.id !== currentUserId) {
          notificationService.createNotification({
            type: 'mention',
            user: authorForNotif,
            title: authorForNotif.name,
            body: 'mentioned you in a chat',
            read: false,
            link: `/chat/${id}`,
            metadata: { conversationId: id },
          });
        }
      }

      // Record activity for badges
      const { recordActivity } = await import('@/lib/services/activityService');
      await recordActivity('dm');
      
      clearTimeout(timeoutId);
      // Replace temp message with real message and sort by date
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== tempMessage.id);
        const normalizedNewMessage = {
          ...newMessage,
          status: 'sent' as const,
          content: typeof newMessage.content === 'string' ? newMessage.content : String(newMessage.content || '')
        };
        const updated = [...withoutTemp, normalizedNewMessage];
        // Sort by creation date (oldest first)
        const sorted = updated.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        // Scroll to bottom after adding message
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 150);
        
        // Update status to delivered after a delay
        setTimeout(() => {
          setMessages(prev => prev.map(m => 
            m.id === newMessage.id ? { ...m, status: 'delivered' as const } : m
          ));
        }, 500);
        // Update status to read after another delay
        setTimeout(() => {
          setMessages(prev => prev.map(m => 
            m.id === newMessage.id ? { ...m, status: 'read' as const } : m
          ));
        }, 1500);
        return sorted;
      });
    } catch (error) {
      clearTimeout(timeoutId);
      // Remove temp message on error or update status
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  }, [id, replyingTo]);

  const openMediaGalleryAt = useCallback((messageId: string, mediaIndex: number) => {
    // Find the flattened media index that `MediaGallery` uses.
    let flatIndex = 0;
    for (const m of messages || []) {
      const media = (m as any)?.media;
      if (!Array.isArray(media)) continue;
      for (let idx = 0; idx < media.length; idx++) {
        const t = (media[idx]?.type || '').toString().toLowerCase();
        const isImage = t === 'image';
        const isVideo = t === 'video';
        if (!isImage && !isVideo) continue;

        if (m.id === messageId && idx === mediaIndex) {
          setMediaGalleryInitialIndex(flatIndex);
          setShowMediaGallery(true);
          return;
        }
        flatIndex++;
      }
    }
    // Fallback: open at start
    setMediaGalleryInitialIndex(0);
    setShowMediaGallery(true);
  }, [messages]);

  if (loading && messages.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.center, styles.loadingCenter]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.secondary }]}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!conversationLoaded && id && !isGlobalChat) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.center, styles.loadingCenter]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.secondary }]}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (conversationLoaded && !conversation && !id?.startsWith('gc-')) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}>
            <ThemedText style={styles.backButtonText}>← Back</ThemedText>
          </TouchableOpacity>
        </View>
        <EmptyState
          icon="exclamationmark.triangle"
          title="Conversation not found"
          message="This conversation may have been deleted or doesn't exist"
        />
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {chatBackground && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ExpoImage
            source={{ uri: chatBackground }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + '60' }]} />
        </View>
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
      <View style={[styles.header, { borderBottomColor: chatBackground ? 'transparent' : colors.cardBorder }]}>
        {chatBackground && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <ExpoImage
              source={{ uri: chatBackground }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <BlurView 
              intensity={Platform.OS === 'ios' ? 100 : 50} 
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          </View>
        )}
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}>
            <View style={[styles.backButtonIcon, { backgroundColor: chatBackground ? colors.spaceBackground + 'E6' : colors.spaceBackground }]}>
              <ThemedText style={[styles.backButtonText, { color: colors.text }]}>←</ThemedText>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.userInfo}
            onPress={() => {
              haptics.light();
              setShowChatInfo(true);
            }}
            activeOpacity={0.7}>
            <View style={styles.avatarContainer}>
              {isGroupChat ? (
                <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="people" size={24} color={colors.primary} />
                </View>
              ) : chatUser?.avatar ? (
                <ExpoImage
                  source={{ uri: chatUser.avatar }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : chatUser ? (
                <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.secondary + '40' }]}>
                  <Text style={[styles.avatarText, { color: colors.text }]}>
                    {chatUser.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              ) : null}
              {!isGroupChat && <OnlineStatus isOnline={true} size={12} />}
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                {(() => {
                  const name = isGroupChat ? groupName : (chatNickname || chatUser?.name || '');
                  return typeof name === 'string' ? name : String(name || '');
                })()}
              </Text>
              {isGroupChat && !isGlobalChat ? (
                <View style={styles.statusRow}>
                  <Text style={[styles.userLabel, { color: colors.secondary }]} numberOfLines={1}>
                    {String(groupMembers.length)} members
                  </Text>
                </View>
              ) : !isGroupChat && chatUser?.label ? (
                <View style={styles.statusRow}>
                  <Text style={[styles.userLabel, { color: colors.secondary }]} numberOfLines={1}>
                    {typeof chatUser.label === 'string' ? chatUser.label : String(chatUser.label || '')}
                  </Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIconButton, { backgroundColor: chatBackground ? 'rgba(255,255,255,0.2)' : colors.spaceBackground }]}
            onPress={() => {
              haptics.light();
              setShowMessageSearch(true);
            }}
            activeOpacity={0.7}
          >
            <IconSymbol name="search" size={20} color={chatBackground ? '#FFFFFF' : colors.primary} />
          </TouchableOpacity>
          {!isGlobalChat && (
            <View style={styles.callButtons}>
              <TouchableOpacity
                style={[styles.callButton, { backgroundColor: chatBackground ? 'rgba(255,255,255,0.2)' : colors.spaceBackground }]}
                onPress={() => {
                  haptics.light();
                  setIsIncomingCall(false);
                  setShowCall(true);
                  setCallDuration(0);
                  setCallStartTime(Date.now());
                }}
                activeOpacity={0.7}
              >
                <IconSymbol name="call" size={20} color={chatBackground ? '#FFFFFF' : colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.callButton, { backgroundColor: chatBackground ? 'rgba(255,255,255,0.2)' : colors.spaceBackground }]}
                onPress={() => {
                  haptics.light();
                  setIsIncomingCall(false);
                  setShowVideoCall(true);
                  setCallDuration(0);
                  setCallStartTime(Date.now());
                }}
                activeOpacity={0.7}
              >
                <IconSymbol name="videocam" size={20} color={chatBackground ? '#FFFFFF' : colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      <View style={styles.messagesContainer}>
        {loadError ? (
          <View style={[styles.errorBanner, { backgroundColor: colors.error + '18', borderBottomColor: colors.error + '40' }]}>
            <Text style={[styles.errorBannerText, { color: colors.text }]} numberOfLines={2}>{loadError}</Text>
            <TouchableOpacity style={[styles.errorBannerRetry, { backgroundColor: colors.primary }]} onPress={() => loadChat(true)} activeOpacity={0.8}>
              <Text style={styles.errorBannerRetryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <FlatList
        ref={flatListRef}
        style={[styles.messagesList, chatBackground && { backgroundColor: 'transparent' }]}
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        data={messageGroups}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefreshChat}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          loadingMoreOlder ? (
            <View style={styles.loadingOlder}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        onScrollToIndexFailed={({ index }) => {
          // Retry after a short delay if the item isn't measured yet.
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index, animated: true });
          }, 120);
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item: group, index }) => {
          const prevGroup = index > 0 ? messageGroups[index - 1] : null;
          const showDateSeparator = !prevGroup || prevGroup.date !== group.date;
          
          return (
            <View>
              {showDateSeparator && (
                <View style={styles.dateSeparator}>
                  <View style={[
                    styles.datePill, 
                    { 
                      backgroundColor: colors.cardBackground + 'E6',
                      borderColor: colors.cardBorder,
                    }
                  ]}>
                    <Text style={[styles.dateText, { color: colors.secondary }]}>
                      {formatChatDateHeader(group.date)}
                    </Text>
                  </View>
                </View>
              )}
              <View style={styles.messageGroup}>
                {group.messages.map((message: ThreadMessage, msgIndex: number) => {
                  const isCurrentUser = message.author.id === currentUserId;
                  const isGrouped = msgIndex > 0 && group.messages[msgIndex - 1].author.id === message.author.id;
                  const showAvatar = !isCurrentUser && (msgIndex === 0 || group.messages[msgIndex - 1].author.id !== message.author.id);
                  const lastMessageId = messages[messages.length - 1]?.id;
                  const showStatus = isCurrentUser && !!lastMessageId && message.id === lastMessageId;
                  
                  return (
                    <ChatMessageBubble 
                      key={message.id}
                      message={message} 
                      isCurrentUser={isCurrentUser}
                      highlighted={message.id === highlightMessageId}
                      showAvatar={showAvatar}
                      isGrouped={isGrouped}
                      showAuthor={isGroupChat}
                      showTimestamp={!isGrouped}
                      showStatus={showStatus}
                      onMediaPress={(msg, mediaIndex) => {
                        haptics.light();
                        openMediaGalleryAt(msg.id, mediaIndex);
                      }}
                      onDoubleTap={(msg) => {
                        haptics.light();
                        const emoji = '❤️';
                        setLastReactionEmoji(emoji);

                        // Double-tap should always ADD a heart (not toggle it off).
                        const current = messages.find(m => m.id === msg.id);
                        const alreadyHearted = Boolean(current?.reactions?.some(r => r.emoji === emoji && r.userReacted));
                        if (alreadyHearted) return;

                        // Optimistic add
                        setMessages(prev => prev.map(m => {
                          if (m.id !== msg.id) return m;
                          const existingReaction = m.reactions?.find(r => r.emoji === emoji);
                          if (existingReaction) {
                            return {
                              ...m,
                              reactions: (m.reactions || []).map(r =>
                                r.emoji === emoji
                                  ? { ...r, count: (r.count || 0) + 1, userReacted: true }
                                  : r
                              ),
                            };
                          }
                          return {
                            ...m,
                            reactions: [...(m.reactions || []), { emoji, count: 1, userReacted: true }],
                          };
                        }));

                        reactToChatMessage(id!, msg.id, emoji).then(() => {
                          if (msg.author.id !== currentUserId) {
                            notificationService.createNotification({
                              type: 'reaction',
                              user: currentUser ? { id: currentUser.id, name: currentUser.name, handle: currentUser.handle, avatar: currentUser.avatar ?? null } : { id: currentUserId, name: 'You', handle: '@you', avatar: null },
                              title: currentUser?.name ?? 'You',
                              body: `reacted to your message`,
                              read: false,
                              link: `/chat/${id}`,
                              metadata: { conversationId: id, messageId: msg.id },
                            });
                          }
                        }).catch(() => {});
                      }}
                      onLongPress={(msg) => {
                        haptics.medium();
                        setSelectedMessage(msg);
                        setShowMessageOptions(true);
                      }}
                      onReply={(msg) => setReplyingTo(msg)}
                      onSharedPostPress={(postId) => {
                        haptics.light();
                        router.push(`/post/${postId}` as any);
                      }}
                      onSharedArticlePress={(articleId) => {
                        haptics.light();
                        router.push(`/news/${articleId}` as any);
                      }}
                      onPollVote={async (messageId, pollId, optionId) => {
                        haptics.light();
                        
                        // Optimistic update
                        setMessages(prev => prev.map(m => {
                          if (m.id === messageId && m.poll) {
                            const poll = { ...m.poll };
                            const options = poll.options.map(opt => ({ ...opt }));
                            const option = options.find(opt => opt.id === optionId);
                            if (option) {
                              const alreadyVoted = poll.userVotes?.includes(optionId);
                              if (alreadyVoted) {
                                // Remove vote
                                option.votes = Math.max(0, (option.votes || 0) - 1);
                                if (poll.userVotes) {
                                  poll.userVotes = poll.userVotes.filter(v => v !== optionId);
                                }
                              } else {
                                // Add vote
                                option.votes = (option.votes || 0) + 1;
                                if (!poll.userVotes) poll.userVotes = [];
                                poll.userVotes.push(optionId);
                              }
                              // Recalculate total votes from all options
                              poll.totalVotes = options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
                              return { ...m, poll: { ...poll, options } };
                            }
                          }
                          return m;
                        }));
                        
                        await voteOnPoll(id!, messageId, pollId, optionId);
                      }}
                      onReaction={(messageId, emoji) => {
                        setLastReactionEmoji(emoji);
                        const targetMsg = messages.find(m => m.id === messageId);
                        reactToChatMessage(id!, messageId, emoji)
                          .then(() => {
                            if (targetMsg?.author.id !== currentUserId) {
                              notificationService.createNotification({
                                type: 'reaction',
                                user: currentUser ? { id: currentUser.id, name: currentUser.name, handle: currentUser.handle, avatar: currentUser.avatar ?? null } : { id: currentUserId, name: 'You', handle: '@you', avatar: null },
                                title: currentUser?.name ?? 'You',
                                body: 'reacted to your message',
                                read: false,
                                link: `/chat/${id}`,
                                metadata: { conversationId: id, messageId },
                              });
                            }
                            setMessages(prev => prev.map(m => {
                              if (m.id === messageId) {
                                const existingReaction = m.reactions?.find(r => r.emoji === emoji);
                                if (existingReaction) {
                                  if (existingReaction.userReacted) {
                                    // Toggle off
                                    const nextCount = Math.max(0, (existingReaction.count || 0) - 1);
                                    const next = (m.reactions || [])
                                      .map(r => r.emoji === emoji ? { ...r, count: nextCount, userReacted: false } : r)
                                      .filter(r => (r.count || 0) > 0);
                                    return { ...m, reactions: next };
                                  }
                                  // Toggle on
                                  return {
                                    ...m,
                                    reactions: (m.reactions || []).map(r =>
                                      r.emoji === emoji
                                        ? { ...r, count: (r.count || 0) + 1, userReacted: true }
                                        : r
                                    ),
                                  };
                                } else {
                                  return {
                                    ...m,
                                    reactions: [...(m.reactions || []), { emoji, count: 1, userReacted: true }],
                                  };
                                }
                              }
                              return m;
                            }));
                          })
                          .catch((error) => {
                            console.error('Error adding reaction:', error);
                            Alert.alert('Error', 'Failed to add reaction');
                          });
                      }}
                    />
                  );
                })}
              </View>
            </View>
          );
        }}
        contentContainerStyle={[
          styles.messagesContent,
          messages.length === 0 && styles.emptyContent
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconRing, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '30' }]}>
              <Ionicons name="chatbubble-outline" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No messages yet</Text>
            <Text style={[styles.emptyMessage, { color: colors.secondary }]}>
              Send a message below to start the conversation.
            </Text>
          </View>
        }
        ListFooterComponent={
          isTyping ? (
            <TypingIndicator
              avatar={currentUser?.avatar ?? undefined}
              name={currentUser?.name ?? 'You'}
            />
          ) : null
        }
        />

        <Animated.View
          pointerEvents={showScrollToBottom ? 'auto' : 'none'}
          style={[styles.scrollToBottomWrap, { opacity: scrollToBottomOpacity }]}
        >
          <TouchableOpacity
            style={[styles.scrollToBottomButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              haptics.light();
              flatListRef.current?.scrollToEnd({ animated: true });
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>
      {replyingTo && (
        <ReplyPreview 
          replyingTo={replyingTo} 
          onCancel={() => setReplyingTo(null)} 
        />
      )}
      {editingMessage && (
        <View style={[styles.editingBar, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
          <View style={styles.editingContent}>
            <IconSymbol name="create-outline" size={16} color={colors.primary} />
            <Text style={[styles.editingText, { color: colors.text }]}>Editing message</Text>
          </View>
          <TouchableOpacity onPress={() => setEditingMessage(null)}>
            <IconSymbol name="close" size={18} color={colors.secondary} />
          </TouchableOpacity>
        </View>
      )}
      <ChatInput
        ref={chatInputRef}
        onSend={handleSendMessage}
        placeholder={editingMessage ? "Edit message..." : "Message..."}
        hasBackground={!!chatBackground}
        initialValue={editingMessage?.content ?? draft}
        onCancel={() => setEditingMessage(null)}
        onTyping={handleTyping}
        onDraftChange={draftRestored ? saveDraft : undefined}
        onImagePress={(image) => {
          handleSendMessage('', [{
            id: `img-${Date.now()}`,
            type: 'IMAGE',
            url: image.uri,
            thumbnail: image.uri,
            width: image.width,
            height: image.height,
          }]);
        }}
        onVideoPress={(video) => {
          handleSendMessage('', [{
            id: `vid-${Date.now()}`,
            type: 'VIDEO',
            url: video.uri,
            thumbnail: video.uri,
            width: video.width,
            height: video.height,
          }]);
        }}
        onDocumentPress={(document) => {
          handleSendMessage(`📎 ${document.name}`, [{
            id: `doc-${Date.now()}`,
            type: 'FILE',
            url: document.uri,
            name: document.name,
            mimeType: document.mimeType,
            size: document.size,
          }]);
        }}
        onVoicePress={() => {
          setShowVoiceRecorder(true);
        }}
      />
      <MessageOptionsMenu
        visible={showMessageOptions}
        message={selectedMessage}
        isCurrentUser={selectedMessage?.author.id === currentUserId}
        reportBlockOptions={
          selectedMessage?.author
            ? getReportBlockOptions({
                id: selectedMessage.author.id,
                name: selectedMessage.author.name,
                handle: selectedMessage.author.handle,
                avatar: selectedMessage.author.avatar,
              })
            : []
        }
        onClose={() => {
          setShowMessageOptions(false);
          setSelectedMessage(null);
        }}
        onReply={(msg) => {
          setReplyingTo(msg);
        }}
        onMention={(msg) => {
          const handle = (msg.author.handle || '').replace('@', '');
          chatInputRef.current?.insertText(`@${handle} `);
        }}
        onEdit={(msg) => {
          setEditingMessage(msg);
          setReplyingTo(null);
        }}
        onDelete={(msg) => {
          Alert.alert(
            'Delete Message',
            'Are you sure you want to delete this message?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await deleteChatMessage(id!, msg.id);
                    setMessages(prev => prev.filter(m => m.id !== msg.id));
                    haptics.success();
                  } catch (error) {
                    Alert.alert('Error', 'Failed to delete message.');
                  }
                },
              },
            ]
          );
        }}
        onForward={(msg) => {
          Alert.alert(
            'Forward Message',
            'Select a conversation to forward to:',
            [
              ...otherConversations
                .slice(0, 5)
                .map(c => ({
                    text: c.user?.name ?? c.id,
                  onPress: async () => {
                    try {
                      await forwardMessage(id!, msg.id, c.id);
                      haptics.success();
                      Alert.alert('Success', 'Message forwarded!');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to forward message.');
                    }
                  },
                })),
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }}
        onCopy={async (msg) => {
          if (msg.content) {
            try {
              await Clipboard.setStringAsync(msg.content);
              haptics.success();
            } catch (error) {
              console.error('Copy error:', error);
              Alert.alert('Error', 'Failed to copy message');
            }
          }
        }}
        onReact={(msg) => {
          setSelectedMessageForReaction(msg.id);
          setShowEmojiPicker(true);
        }}
        onPin={async (msg) => {
          try {
            await pinChatMessage(id!, msg.id, !msg.pinned);
            setMessages(prev => prev.map(m =>
              m.id === msg.id ? { ...m, pinned: !msg.pinned } : m
            ));
            haptics.success();
          } catch (error) {
            Alert.alert('Error', 'Failed to pin message.');
          }
        }}
      />
      {showVoiceRecorder && (
        <VoiceMessageRecorder
          onSend={(duration, uri) => {
            handleSendMessage('', [{
              id: `audio-${Date.now()}`,
              type: 'AUDIO',
              url: uri,
              duration: duration,
            }]);
            setShowVoiceRecorder(false);
          }}
          onCancel={() => setShowVoiceRecorder(false)}
        />
      )}
      <CallScreen
        visible={showCall && !isGlobalChat}
        isIncoming={isIncomingCall}
        caller={callCaller}
        onAccept={() => {
          setIsIncomingCall(false);
          setCallDuration(0);
          setCallStartTime(Date.now());
        }}
        onDecline={() => {
          setShowCall(false);
          setIsIncomingCall(false);
          setCallStartTime(null);
        }}
        onEnd={() => {
          const isVideo = false;
          setShowCall(false);
          
          // Calculate duration from callStartTime to now (most accurate)
          let finalDuration = 0;
          if (callStartTime) {
            finalDuration = Math.floor((Date.now() - callStartTime) / 1000);
          } else {
            // Fallback to state duration if callStartTime wasn't set
            finalDuration = callDuration;
          }
          
          // Send call history message if call was started (callStartTime exists or duration > 0)
          if (callStartTime || finalDuration > 0) {
            const formatCallDuration = (seconds: number) => {
              if (!seconds || isNaN(seconds) || seconds < 0) {
                return '0 seconds';
              }
              const hours = Math.floor(seconds / 3600);
              const mins = Math.floor((seconds % 3600) / 60);
              const secs = Math.floor(seconds % 60);
              
              if (hours > 0) {
                if (mins > 0) {
                  return `${hours}h ${mins}m`;
                }
                return `${hours}h`;
              } else if (mins > 0) {
                if (secs > 0) {
                  return `${mins}m ${secs}s`;
                }
                return `${mins}m`;
              }
              return `${secs}s`;
            };
            
            const callType = isGroupChat
              ? (isVideo ? 'Group video call' : 'Group call')
              : (isVideo ? 'Video call' : 'Call');
            const callMessageText = `${callType} ended • ${formatCallDuration(finalDuration)}`;
            handleSendMessage(
              typeof callMessageText === 'string' ? callMessageText : String(callMessageText || ''),
              [{
                id: `call-${Date.now()}`,
                type: 'CALL',
                duration: finalDuration,
                isVideo: isVideo,
              }]
            );
          }
          
          setCallDuration(0);
          setCallStartTime(null);
        }}
        onToggleMute={() => setCallMuted(prev => !prev)}
        onToggleSpeaker={() => setCallSpeakerOn(prev => !prev)}
        onToggleCamera={() => {
          setCallCameraOn(prev => !prev);
          // Optionally switch to video call when camera is turned on
          if (!callCameraOn) {
            setShowCall(false);
            setShowVideoCall(true);
          }
        }}
        onDurationChange={(duration) => setCallDuration(duration)}
        callDuration={callDuration}
        isMuted={callMuted}
        isSpeakerOn={callSpeakerOn}
        isCameraOn={callCameraOn}
      />
      <VideoCallScreen
        visible={showVideoCall && !isGlobalChat}
        isIncoming={isIncomingCall}
        caller={callCaller}
        isGroupCall={isGroupChat}
        localParticipantId={currentUserId}
        participants={videoCallParticipants}
        onAccept={() => {
          setIsIncomingCall(false);
          setCallDuration(0);
          setCallStartTime(Date.now());
        }}
        onDecline={() => {
          setShowVideoCall(false);
          setIsIncomingCall(false);
          setCallStartTime(null);
        }}
        onEnd={() => {
          const isVideo = true;
          setShowVideoCall(false);
          
          // Calculate duration from callStartTime to now (most accurate)
          let finalDuration = 0;
          if (callStartTime) {
            finalDuration = Math.floor((Date.now() - callStartTime) / 1000);
          } else {
            // Fallback to state duration if callStartTime wasn't set
            finalDuration = callDuration;
          }
          
          // Send call history message if call was started (callStartTime exists or duration > 0)
          if (callStartTime || finalDuration > 0) {
            const formatCallDuration = (seconds: number) => {
              if (!seconds || isNaN(seconds) || seconds < 0) {
                return '0 seconds';
              }
              const hours = Math.floor(seconds / 3600);
              const mins = Math.floor((seconds % 3600) / 60);
              const secs = Math.floor(seconds % 60);
              
              if (hours > 0) {
                if (mins > 0) {
                  return `${hours}h ${mins}m`;
                }
                return `${hours}h`;
              } else if (mins > 0) {
                if (secs > 0) {
                  return `${mins}m ${secs}s`;
                }
                return `${mins}m`;
              }
              return `${secs}s`;
            };
            
            const callType = isGroupChat
              ? (isVideo ? 'Group video call' : 'Group call')
              : (isVideo ? 'Video call' : 'Call');
            const callMessageText = `${callType} ended • ${formatCallDuration(finalDuration)}`;
            handleSendMessage(
              typeof callMessageText === 'string' ? callMessageText : String(callMessageText || ''),
              [{
                id: `call-${Date.now()}`,
                type: 'CALL',
                duration: finalDuration,
                isVideo: isVideo,
              }]
            );
          }
          
          setCallDuration(0);
          setCallStartTime(null);
        }}
        onToggleMute={() => setCallMuted(prev => !prev)}
        onToggleSpeaker={() => setCallSpeakerOn(prev => !prev)}
        onToggleVideo={() => setCallVideoOn(prev => !prev)}
        onToggleCamera={() => setCallCameraOn(prev => !prev)}
        onDurationChange={(duration) => setCallDuration(duration)}
        callDuration={callDuration}
        isMuted={callMuted}
        isSpeakerOn={callSpeakerOn}
        isVideoOn={callVideoOn}
        isCameraOn={callCameraOn}
      />
      <EmojiPicker
        visible={showEmojiPicker}
        selectedEmojis={(() => {
          const msg = selectedMessageForReaction ? messages.find(m => m.id === selectedMessageForReaction) : null;
          const reacted = msg?.reactions?.filter(r => r.userReacted).map(r => r.emoji) || [];
          return reacted;
        })()}
        onEmojiSelect={(emoji) => {
          setLastReactionEmoji(emoji);
          if (selectedMessageForReaction && id) {
            const targetMsg = messages.find(m => m.id === selectedMessageForReaction);
            reactToChatMessage(id, selectedMessageForReaction, emoji)
              .then(() => {
                if (targetMsg?.author.id !== currentUserId) {
                  notificationService.createNotification({
                    type: 'reaction',
                    user: currentUser ? { id: currentUser.id, name: currentUser.name, handle: currentUser.handle, avatar: currentUser.avatar ?? null } : { id: currentUserId, name: 'You', handle: '@you', avatar: null },
                    title: currentUser?.name ?? 'You',
                    body: 'reacted to your message',
                    read: false,
                    link: `/chat/${id}`,
                    metadata: { conversationId: id, messageId: selectedMessageForReaction },
                  });
                }
                setMessages(prev => prev.map(m => {
                  if (m.id === selectedMessageForReaction) {
                    const existingReaction = m.reactions?.find(r => r.emoji === emoji);
                    if (existingReaction) {
                      if (existingReaction.userReacted) return m;
                      return {
                        ...m,
                        reactions: m.reactions?.map(r =>
                          r.emoji === emoji
                            ? { ...r, count: r.count + 1, userReacted: true }
                            : r
                        ),
                      };
                    } else {
                      return {
                        ...m,
                        reactions: [...(m.reactions || []), { emoji, count: 1, userReacted: true }],
                      };
                    }
                  }
                  return m;
                }));
              })
              .catch((error) => {
                console.error('Error adding reaction:', error);
                Alert.alert('Error', 'Failed to add reaction');
              });
          }
          setShowEmojiPicker(false);
          setSelectedMessageForReaction(null);
        }}
        onClose={() => {
          setShowEmojiPicker(false);
          setSelectedMessageForReaction(null);
        }}
      />
      {showMessageSearch && (
        <MessageSearch
          messages={messages}
          onSelectMessage={(message) => {
            // Scroll to message
            const messageIndex = messages.findIndex(m => m.id === message.id);
            if (messageIndex >= 0 && flatListRef.current) {
              // Find the group containing this message
              const groupIndex = messageGroups.findIndex(g => 
                g.messages.some(m => m.id === message.id)
              );
              if (groupIndex >= 0) {
                flatListRef.current.scrollToIndex({ index: groupIndex, animated: true });
              }
            }
            setShowMessageSearch(false);
          }}
          onClose={() => setShowMessageSearch(false)}
        />
      )}
      <MediaGallery
        messages={messages}
        visible={showMediaGallery}
        initialIndex={mediaGalleryInitialIndex}
        onClose={() => setShowMediaGallery(false)}
      />
      <ChatInfoModal
        visible={showChatInfo}
        user={chatUser || null}
        isGroupChat={isGroupChat}
        groupName={groupName}
        messages={messages}
        members={groupMembers}
        nickname={chatNickname}
        backgroundPhoto={chatBackground}
        disappearingMessages={disappearingMessages}
        onClose={() => setShowChatInfo(false)}
        onViewProfile={(userId) => {
          setShowChatInfo(false);
          if (!userId) return;
          router.push(`/profile/${userId}` as any);
        }}
        onUpdateNickname={(nickname) => {
          setChatNickname(nickname || undefined);
          haptics.success();
        }}
        onUpdateBackground={(uri) => {
          setChatBackground(uri);
          haptics.success();
        }}
        onUpdateDisappearingMessages={(enabled) => {
          setDisappearingMessages(enabled);
        }}
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
    paddingHorizontal: Spacing.lg + 2,
    paddingTop: Spacing.md + 4,
    paddingBottom: Spacing.md + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
    zIndex: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  callButtons: {
    flexDirection: 'row',
    gap: Spacing.xs + 2,
    marginLeft: Spacing.md,
    alignItems: 'center',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  backButton: {
    marginRight: Spacing.sm,
  },
  backButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: Typography.lg,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 0,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: Typography.base + 1,
    fontWeight: '700',
    lineHeight: Typography.base * 1.25,
    letterSpacing: -0.3,
  },
  userLabel: {
    fontSize: Typography.xs,
    marginTop: 1,
    lineHeight: Typography.xs * 1.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  onlineText: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
    position: 'relative',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  errorBannerText: {
    flex: 1,
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  errorBannerRetry: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: 8,
  },
  errorBannerRetryText: {
    color: '#FFFFFF',
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  loadingOlder: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: Spacing.md + 6,
    paddingBottom: Spacing.xxl + 24,
    flexGrow: 1,
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
  loadingCenter: {
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: Spacing.xl + 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyMessage: {
    fontSize: Typography.base,
    textAlign: 'center',
    lineHeight: Typography.base * 1.4,
    paddingHorizontal: Spacing.lg,
    opacity: 0.85,
  },
  dateSeparator: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md + 6,
    paddingHorizontal: Spacing.md + 2,
  },
  datePill: {
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.xs + 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  dateText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    opacity: 0.8,
  },
  messageGroup: {
    marginBottom: Spacing.sm + 2,
  },
  scrollToBottomWrap: {
    position: 'absolute',
    right: Spacing.lg + 4,
    bottom: Spacing.lg + 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollToBottomButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  editingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  editingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  editingText: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
});

