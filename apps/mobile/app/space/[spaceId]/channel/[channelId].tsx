import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Alert, TextInput, Modal } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { ThreadMessage } from '@/types/post';
import { ChatMessageBubble } from '@/components/inbox/ChatMessageBubble';
import { ChatInput } from '@/components/inbox/ChatInput';
import { TypingIndicator } from '@/components/inbox/TypingIndicator';
import { EmptyState } from '@/components/EmptyState';
import { EmojiPicker } from '@/components/inbox/EmojiPicker';
import { VoiceMessageRecorder } from '@/components/inbox/VoiceMessageRecorder';
import { ReplyPreview } from '@/components/inbox/ReplyPreview';
import { MessageOptionsMenu } from '@/components/inbox/MessageOptionsMenu';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getChannelMessages, sendChannelMessage, reactToChannelMessage, deleteChannelMessage, editChannelMessage } from '@/lib/api/channels';
import { getSpaceById } from '@/lib/api/spaces';
import { Space } from '@/types/post';
import { mockUsers, mockUserSpaces } from '@/lib/mocks/users';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useReportBlock } from '@/hooks/useReportBlock';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { getSpaceInitials } from '@/lib/utils/spaceUtils';

interface MessageGroup {
  id: string;
  messages: ThreadMessage[];
  authorId: string;
  date: string;
}

export default function ChannelChatScreen() {
  const params = useLocalSearchParams<{ spaceId?: string; channelId?: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState<string | null>(null);
  const [lastReactionEmoji, setLastReactionEmoji] = useState<string>('❤️');
  const [canUserModerate, setCanUserModerate] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ThreadMessage | null>(null);
  const [editText, setEditText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ThreadMessage | null>(null);
  const [selectedMessageForMenu, setSelectedMessageForMenu] = useState<ThreadMessage | null>(null);
  const [actionSheet, setActionSheet] = useState<{ title: string; message?: string; options: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }> } | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const haptics = useHapticFeedback();
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUserId = mockUsers[0].id;
  const { getReportBlockOptions } = useReportBlock();

  const handleTyping = useCallback(() => {
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      typingTimeoutRef.current = null;
    }, 2000);
  }, []);

  // Use route params
  const spaceId = params.spaceId;
  const channelId = params.channelId;
  const embedded = false; // Always false for route-based screens

  const channel = space?.channels.find(c => c.id === channelId);
  const isOwner = Boolean(space && (space.ownerId === currentUserId || space.ownerId === `user-${currentUserId}`));
  const isAnnouncementsChannel = Boolean(
    channel &&
      (channel.type === 'announcement' || String(channel.name).toLowerCase() === 'announcements')
  );
  // Owner-only: announcements can only be posted by the space owner.
  const canPostToAnnouncements = isOwner;

  useEffect(() => {
    if (spaceId && channelId) {
      loadChannel();
    }
  }, [spaceId, channelId]);

  const loadChannel = useCallback(async () => {
    if (!spaceId || !channelId) return;
    
    setLoading(true);
    try {
      const fetchedSpace = await getSpaceById(spaceId);
      if (!fetchedSpace) {
        setLoading(false);
        return;
      }

      const fetchedChannel = fetchedSpace.channels.find(c => c.id === channelId);
      const fetchedIsAnnouncements = Boolean(
        fetchedChannel &&
          (fetchedChannel.type === 'announcement' || String(fetchedChannel.name).toLowerCase() === 'announcements')
      );
      if (fetchedIsAnnouncements) {
        router.replace({
          pathname: '/space/[id]/announcements',
          params: { id: spaceId },
        });
        return;
      }
      
      const currentUserId = mockUsers[0].id;
      // ALWAYS check ownerId first - this is the source of truth
      const isOwner = fetchedSpace.ownerId === currentUserId || fetchedSpace.ownerId === `user-${currentUserId}`;
      const isJoined = mockUserSpaces.includes(fetchedSpace.id) || isOwner;
      
      // Force owner role if user is owner, regardless of what's in fetchedSpace
      const finalMemberRole = isOwner ? 'owner' : (fetchedSpace.memberRole || (isJoined ? 'member' : undefined));
      
      const enrichedSpace = {
        ...fetchedSpace,
        isJoined: isJoined || isOwner, // Always join if owner
        memberRole: finalMemberRole,
      };
      
      console.log('🔍 Channel loaded:', {
        spaceId: enrichedSpace.id,
        spaceName: enrichedSpace.name,
        ownerId: enrichedSpace.ownerId,
        currentUserId,
        isOwner,
        memberRole: enrichedSpace.memberRole,
        isJoined: enrichedSpace.isJoined,
        fetchedMemberRole: fetchedSpace.memberRole,
      });
      
      setSpace(enrichedSpace);
      setIsMember(enrichedSpace.isJoined);
      
      // Check moderation permissions - owner, admin, or moderator can moderate
      const canMod = isOwner || enrichedSpace.memberRole === 'admin' || enrichedSpace.memberRole === 'moderator';
      console.log('🛡️ Moderation check:', { canMod, isOwner, memberRole: enrichedSpace.memberRole });
      setCanUserModerate(canMod);
      
      // Only load messages if user is a member
      if (isJoined) {
        const fetchedMessages = await getChannelMessages(spaceId, channelId);
        const sortedMessages = [...fetchedMessages].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(sortedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading channel:', error);
    } finally {
      setLoading(false);
    }
  }, [router, spaceId, channelId]);

  // Format date for display
  const formatDate = useCallback((date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
    }
  }, []);

  // Group messages by sender and date
  const messageGroups = useMemo(() => {
    if (messages.length === 0) return [];
    
    const groups: (MessageGroup | { type: 'date'; date: string; id: string })[] = [];
    let currentGroup: MessageGroup | null = null;
    let lastDate: string | null = null;
    
    messages.forEach((message, index) => {
      const messageDate = new Date(message.createdAt);
      const messageDateString = messageDate.toDateString();
      const displayDate = formatDate(messageDate);
      
      const needsDateSeparator = lastDate !== messageDateString;
      const needsNewGroup = 
        !currentGroup || 
        currentGroup.authorId !== message.author.id ||
        needsDateSeparator;
      
      if (needsDateSeparator && lastDate !== null) {
        groups.push({
          type: 'date',
          date: displayDate,
          id: `date-${messageDateString}`,
        });
      }
      
      if (needsNewGroup) {
        currentGroup = {
          id: `group-${index}`,
          messages: [message],
          authorId: message.author.id,
          date: messageDateString,
        };
        groups.push(currentGroup);
        lastDate = messageDateString;
      } else {
        currentGroup!.messages.push(message);
      }
    });
    
    return groups;
  }, [messages, formatDate]);

  const handleSendMessage = useCallback(async (content: string, media?: any[]) => {
    if (isAnnouncementsChannel && !canPostToAnnouncements) {
      haptics.error();
      return;
    }
    if ((!content.trim() && (!media || media.length === 0)) || !spaceId || !channelId) return;
    
    setReplyingTo(null);
    haptics.light();
    
    // Optimistic update
    const tempMessage: ThreadMessage = {
      id: `temp-${Date.now()}`,
      author: mockUsers[0],
      content: content.trim() || (media && media.length > 0 ? '📎 Media' : ''),
      createdAt: new Date().toISOString(),
      reactions: [],
      status: 'sending',
      media: media,
    };
    
    setMessages(prev => [...prev, tempMessage]);
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      const sentMessage = await sendChannelMessage(spaceId, channelId, content.trim() || '', currentUserId);
      
      // Update with real message
      setMessages(prev => prev.map(m => 
        m.id === tempMessage.id ? { ...sentMessage, status: 'sent', media: media } : m
      ));
      
      // Simulate status updates
      setTimeout(() => {
        setMessages(prev => prev.map(m => 
          m.id === sentMessage.id ? { ...m, status: 'delivered' } : m
        ));
      }, 1000);
      
      setTimeout(() => {
        setMessages(prev => prev.map(m => 
          m.id === sentMessage.id ? { ...m, status: 'read' } : m
        ));
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove failed message
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    }
  }, [spaceId, channelId, currentUserId, haptics, isAnnouncementsChannel, canPostToAnnouncements]);

  const handleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!spaceId || !channelId) return;
    
    setLastReactionEmoji(emoji);
    haptics.light();
    
    // Optimistically update the message state
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
    
    // Then update on the server
    try {
      await reactToChannelMessage(spaceId, channelId, messageId, emoji);
    } catch (error) {
      console.error('Error adding reaction:', error);
      // Revert on error by reloading
      await loadChannel();
    }
  }, [spaceId, channelId, loadChannel, haptics]);

  const handleDeleteMessage = useCallback(async (message: ThreadMessage) => {
    if (!spaceId || !channelId) return;
    try {
      await deleteChannelMessage(spaceId, channelId, message.id, currentUserId);
      setMessages(prev => prev.filter(m => m.id !== message.id));
      haptics.success();
    } catch (error) {
      haptics.error();
      Alert.alert('Error', 'Failed to delete message.');
    }
  }, [spaceId, channelId, currentUserId, haptics]);

  const handleEditMessage = useCallback((message: ThreadMessage) => {
    setEditingMessage(message);
    setEditText(message.content || '');
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingMessage || !spaceId || !channelId || !editText.trim()) return;
    
    try {
      const updated = await editChannelMessage(spaceId, channelId, editingMessage.id, editText.trim());
      if (updated) {
        setMessages(prev => prev.map(m => 
          m.id === editingMessage.id ? updated : m
        ));
        setEditingMessage(null);
        setEditText('');
        haptics.success();
      }
    } catch (error) {
      haptics.error();
      setActionSheet({
        title: 'Error',
        message: 'Failed to edit message.',
        options: [{ text: 'OK', onPress: () => setActionSheet(null) }],
      });
    }
  }, [editingMessage, spaceId, channelId, editText, haptics]);

  if (loading) {
    const loadingContent = (
      <View style={styles.center}>
        <LoadingSpinner size={50} color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.secondary }]}>Loading messages...</Text>
      </View>
    );
    
    if (embedded) {
      return <View style={styles.container}>{loadingContent}</View>;
    }
    
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {loadingContent}
      </SafeAreaView>
    );
  }

  // Show locked state if not a member
  if (space && !isMember) {
    const lockedContent = (
      <>
        {!embedded && (
          <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}>
                <IconSymbol name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.serverIconContainer}>
                  {space.iconImage ? (
                    <ExpoImage
                      source={{ uri: space.iconImage }}
                      style={styles.serverIcon}
                      contentFit="cover"
                      onError={() => {
                        // Image failed to load
                      }}
                    />
                  ) : (
                    <View style={[styles.serverIcon, styles.serverIconPlaceholder, { backgroundColor: (space.color || colors.primary) }]}>
                      <Text style={[styles.serverIconText, { color: colors.cardBackground }]}>
                        {getSpaceInitials(space.name)}
                      </Text>
                    </View>
                  )}
              </View>
              <View style={styles.headerInfo}>
                <View style={styles.headerTop}>
                  <IconSymbol name="lock-closed" size={16} color={colors.secondary} />
                  <Text style={[styles.channelName, { color: colors.text }]}>
                    {channel?.name || 'Channel'}
                  </Text>
                </View>
                <Text style={[styles.serverName, { color: colors.secondary }]} numberOfLines={1}>
                  {space?.name || 'Server'}
                </Text>
              </View>
            </View>
          </View>
        )}
        <View style={styles.center}>
          <IconSymbol name="lock-closed" size={48} color={colors.secondary} />
          <Text style={[styles.lockedTitle, { color: colors.text }]}>
            Channel is private
          </Text>
          <Text style={[styles.lockedText, { color: colors.secondary }]}>
            Join {space.name} to access this channel
          </Text>
          <TouchableOpacity
            style={[styles.joinSpaceButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              haptics.medium();
              router.push(`/space/${spaceId}`);
            }}
            activeOpacity={0.8}>
            <Text style={[styles.joinSpaceButtonText, { color: colorScheme === 'dark' ? colors.text : colors.cardBackground }]}>Join Space</Text>
          </TouchableOpacity>
        </View>
      </>
    );

    if (embedded) {
      return <View style={styles.container}>{lockedContent}</View>;
    }

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {lockedContent}
      </SafeAreaView>
    );
  }

  const content = (
    <>
      {!embedded && (
        <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}>
                <IconSymbol name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
              {space && (
                <View style={styles.serverIconContainer}>
                  {space.iconImage ? (
                    <ExpoImage
                      source={{ uri: space.iconImage }}
                      style={styles.serverIcon}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.serverIcon, styles.serverIconPlaceholder, { backgroundColor: (space.color || colors.primary) }]}>
                      <Text style={[styles.serverIconText, { color: colors.cardBackground }]}>
                        {space.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              <View style={styles.headerInfo}>
                <View style={styles.headerTop}>
                  <IconSymbol name="pricetag-outline" size={16} color={colors.primary} />
                  <Text style={[styles.channelName, { color: colors.text }]}>
                    {channel?.name || 'Channel'}
                  </Text>
                  {isAnnouncementsChannel && (
                    <View style={[styles.announcementBadge, { backgroundColor: colors.error + '15', borderColor: colors.error + '35' }]}>
                      <IconSymbol name="lock-closed" size={12} color={colors.error} />
                      <Text style={[styles.announcementBadgeText, { color: colors.error }]}>Owner only</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.serverName, { color: colors.secondary }]} numberOfLines={1}>
                  {space?.name || 'Server'}
                </Text>
              </View>
              {canUserModerate && (
                <View style={[styles.modBadge, { backgroundColor: colors.primary + '15' }]}>
                  <IconSymbol name="shield-checkmark" size={12} color={colors.primary} />
                  <Text style={[styles.modBadgeText, { color: colors.primary }]}>
                    {space?.memberRole === 'owner' ? 'Owner' : space?.memberRole === 'admin' ? 'Admin' : 'Mod'}
                  </Text>
                </View>
              )}
            </View>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        {messages.length === 0 ? (
          <EmptyState
            icon="bubble.left.and.bubble.right"
            title="No messages yet"
            message={`Be the first to send a message in #${channel?.name || 'channel'}`}
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messageGroups}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              if ('type' in item && item.type === 'date') {
                return (
                  <View style={styles.dateSeparator}>
                    <View style={[styles.dateSeparatorLine, { backgroundColor: colors.cardBorder }]} />
                    <Text style={[styles.dateSeparatorText, { color: colors.secondary }]}>
                      {item.date}
                    </Text>
                    <View style={[styles.dateSeparatorLine, { backgroundColor: colors.cardBorder }]} />
                  </View>
                );
              }
              
              const group = item as MessageGroup;
              return (
                <View style={styles.messageGroup}>
                  {group.messages.map((message: ThreadMessage, index: number) => {
                    const isCurrentUser = message.author.id === currentUserId;
                    const isGrouped = index > 0 && group.messages[index - 1].author.id === message.author.id;
                    const showAvatar = !isCurrentUser && (index === 0 || group.messages[index - 1].author.id !== message.author.id);
                    const lastMessageId = messages[messages.length - 1]?.id;
                    const showStatus = isCurrentUser && !!lastMessageId && message.id === lastMessageId;
                    
                    return (
                      <ChatMessageBubble
                        key={message.id}
                        message={message}
                        isCurrentUser={isCurrentUser}
                        showAvatar={showAvatar}
                        isGrouped={isGrouped}
                        showTimestamp={!isGrouped}
                        showStatus={showStatus}
                        onReaction={(messageId, emoji) => {
                          handleReaction(messageId, emoji);
                        }}
                        onDoubleTap={(msg) => {
                          const emoji = '❤️';
                          setLastReactionEmoji('❤️');
                          handleReaction(msg.id, emoji);
                        }}
                        onLongPress={(msg) => {
                          haptics.medium();
                          setSelectedMessageForMenu(msg);
                        }}
                      />
                    );
                  })}
                </View>
              );
            }}
            contentContainerStyle={styles.messagesContent}
            ListFooterComponent={
            isTyping ? (
              <TypingIndicator
                avatar={mockUsers[0].avatar}
                name={mockUsers[0].name}
              />
            ) : null
          }
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {isAnnouncementsChannel && !canPostToAnnouncements ? (
          <View style={[styles.readOnlyBanner, { backgroundColor: colors.spaceBackground, borderTopColor: colors.cardBorder }]}>
            <IconSymbol name="megaphone-outline" size={16} color={colors.secondary} />
            <Text style={[styles.readOnlyText, { color: colors.secondary }]}>
              Only the owner can post announcements.
            </Text>
          </View>
        ) : (
          <>
          {replyingTo && (
            <ReplyPreview
              replyingTo={replyingTo}
              onCancel={() => setReplyingTo(null)}
            />
          )}
          <ChatInput
            onSend={handleSendMessage}
            placeholder={`Message #${channel?.name || 'channel'}`}
            onTyping={handleTyping}
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
                duration: video.duration,
              }]);
            }}
            onVoicePress={() => {
              setShowVoiceRecorder(true);
            }}
          />
          </>
        )}
      </KeyboardAvoidingView>

      <MessageOptionsMenu
        visible={selectedMessageForMenu !== null}
        message={selectedMessageForMenu}
        isCurrentUser={selectedMessageForMenu?.author.id === currentUserId}
        canDeleteMessage={(msg) => msg.author.id === currentUserId || canUserModerate}
        hidePin
        hideForward
        onClose={() => setSelectedMessageForMenu(null)}
        onReply={(msg) => {
          setReplyingTo(msg);
          setSelectedMessageForMenu(null);
        }}
        onEdit={handleEditMessage}
        onDelete={(msg) => {
          setSelectedMessageForMenu(null);
          Alert.alert(
            'Delete Message',
            'Are you sure you want to delete this message?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => handleDeleteMessage(msg) },
            ]
          );
        }}
        onForward={() => {}}
        onCopy={async (msg) => {
          if (msg.content) {
            try {
              await Clipboard.setStringAsync(msg.content);
              haptics.success();
            } catch {
              Alert.alert('Error', 'Failed to copy message');
            }
          }
        }}
        onReact={(msg) => {
          setSelectedMessageForReaction(msg.id);
          setShowEmojiPicker(true);
          setSelectedMessageForMenu(null);
        }}
        onPin={() => {}}
        reportBlockOptions={
          selectedMessageForMenu?.author
            ? getReportBlockOptions({
                id: selectedMessageForMenu.author.id,
                name: selectedMessageForMenu.author.name,
                handle: selectedMessageForMenu.author.handle,
                avatar: selectedMessageForMenu.author.avatar,
              })
            : []
        }
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

      {showEmojiPicker && (
        <EmojiPicker
          visible={showEmojiPicker}
          onClose={() => {
            setShowEmojiPicker(false);
            setSelectedMessageForReaction(null);
          }}
          selectedEmojis={(() => {
            const msg = selectedMessageForReaction ? messages.find(m => m.id === selectedMessageForReaction) : null;
            const reacted = msg?.reactions?.filter(r => r.userReacted).map(r => r.emoji) || [];
            return reacted;
          })()}
          onEmojiSelect={(emoji) => {
            if (selectedMessageForReaction) {
              handleReaction(selectedMessageForReaction, emoji);
            }
            setShowEmojiPicker(false);
            setSelectedMessageForReaction(null);
          }}
        />
      )}

      {/* Edit Message Modal */}
      <Modal
        visible={editingMessage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setEditingMessage(null);
          setEditText('');
        }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Message</Text>
              <TouchableOpacity
                onPress={() => {
                  setEditingMessage(null);
                  setEditText('');
                }}
                activeOpacity={0.7}>
                <IconSymbol name="close" size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.editInput, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder, color: colors.text }]}
              value={editText}
              onChangeText={setEditText}
              placeholder="Edit your message..."
              placeholderTextColor={colors.secondary}
              multiline
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, { borderColor: colors.cardBorder }]}
                onPress={() => {
                  setEditingMessage(null);
                  setEditText('');
                }}
                activeOpacity={0.7}>
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSubmit, { backgroundColor: colors.primary }]}
                onPress={handleSaveEdit}
                activeOpacity={0.7}>
                <Text style={[styles.modalButtonText, { color: colorScheme === 'dark' ? colors.text : colors.cardBackground }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Action Sheet */}
      <Modal
        visible={!!actionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setActionSheet(null)}>
        <TouchableOpacity
          style={styles.actionSheetOverlay}
          activeOpacity={1}
          onPress={() => setActionSheet(null)}>
          <View style={[styles.actionSheetContainer, { backgroundColor: colors.cardBackground }]}>
            {actionSheet && (
              <>
                <View style={styles.actionSheetHeader}>
                  <Text style={[styles.actionSheetTitle, { color: colors.text }]}>
                    {actionSheet.title}
                  </Text>
                  {actionSheet.message && (
                    <Text style={[styles.actionSheetMessage, { color: colors.secondary }]}>
                      {actionSheet.message}
                    </Text>
                  )}
                </View>
                <View style={[styles.actionSheetDivider, { backgroundColor: colors.cardBorder }]} />
                <View style={styles.actionSheetOptions}>
                  {actionSheet.options.map((option, index) => {
                    const isDestructive = option.style === 'destructive';
                    const isCancel = option.style === 'cancel';
                    const showDivider = index > 0 && !isDestructive;
                    
                    return (
                      <View key={index}>
                        {showDivider && (
                          <View style={[styles.actionSheetDivider, { backgroundColor: colors.cardBorder }]} />
                        )}
                        {isDestructive && index > 0 && (
                          <View style={[styles.actionSheetDivider, { backgroundColor: colors.cardBorder, marginTop: Spacing.sm }]} />
                        )}
                        <TouchableOpacity
                          style={[
                            styles.actionSheetOption,
                            index === actionSheet.options.length - 1 && styles.actionSheetOptionLast,
                          ]}
                          onPress={() => {
                            haptics.light();
                            option.onPress();
                          }}
                          activeOpacity={0.7}>
                          <Text
                            style={[
                              styles.actionSheetOptionText,
                              {
                                color: isDestructive
                                  ? colors.error
                                  : isCancel
                                  ? colors.secondary
                                  : colors.primary,
                                fontWeight: isCancel ? '500' : '600',
                              },
                            ]}>
                            {option.text}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );

  if (embedded) {
    return <View style={[styles.container, styles.embeddedContainer]}>{content}</View>;
  }

  return <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>{content}</SafeAreaView>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  embeddedContainer: {
    width: '100%',
    height: '100%',
  },
  headerContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.base,
    marginTop: Spacing.md,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  embeddedHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    marginRight: Spacing.sm,
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  serverIconContainer: {
    marginRight: Spacing.sm,
    marginLeft: -Spacing.xs / 2,
  },
  serverIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  serverIconPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverIconText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  headerAction: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
    marginRight: -Spacing.xs,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
    marginBottom: 1,
  },
  channelName: {
    fontSize: Typography.base,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  announcementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    marginLeft: Spacing.xs,
  },
  announcementBadgeText: {
    fontSize: Typography.xs,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  serverName: {
    fontSize: Typography.xs,
    fontWeight: '500',
    marginTop: 1,
    opacity: 0.75,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 0,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  readOnlyText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    flex: 1,
  },
  messageGroup: {
    marginBottom: Spacing.xs,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  dateSeparatorLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dateSeparatorText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    paddingHorizontal: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lockedTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  lockedText: {
    fontSize: Typography.sm,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  joinSpaceButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  joinSpaceButtonText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
  },
  editInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.base,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalButtonSubmit: {
    borderWidth: 0,
  },
  modalButtonText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    // Color will be set dynamically based on theme and button type
  },
  modBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.xs,
  },
  modBadgeText: {
    fontSize: Typography.xs - 1,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  actionSheetHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  actionSheetTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  actionSheetMessage: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.5,
    marginTop: Spacing.xs,
  },
  actionSheetDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.sm,
  },
  actionSheetOptions: {
    paddingHorizontal: Spacing.md,
  },
  actionSheetOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  actionSheetOptionLast: {
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
  actionSheetOptionText: {
    fontSize: Typography.base,
    textAlign: 'center',
  },
});

