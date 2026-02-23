import { useState, useCallback, useMemo, useEffect } from 'react';
import { StyleSheet, FlatList, View, RefreshControl, TouchableOpacity, Alert, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ConversationItem } from '@/components/inbox/ConversationItem';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SearchBar } from '@/components/search/SearchBar';
import { GroupChatCreateModal } from '@/components/inbox/GroupChatCreateModal';
import { BorderRadius, Colors, Shadows, Spacing, Typography, hexToRgba } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDebounce } from '@/hooks/useDebounce';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Conversation } from '@/lib/mocks/notifications';
import { createGroupChat, pinConversation, muteConversation, deleteConversation, getConversationsList } from '@/lib/api/chat';
import { getUserById } from '@/lib/api/users';
import { getCurrentUserIdOrFallback } from '@/lib/api/users';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { applyInboxFilters } from '@/lib/utils/inboxFilters';
import { formatRelativeTime } from '@/lib/utils/time';
import { getMaxConversations } from '@/lib/services/subscriptionService';

export default function InboxScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const haptics = useHapticFeedback();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const loadConversations = useCallback(async () => {
    try {
      const list = await getConversationsList();
      setConversations(list);
    } catch (e) {
      console.error('Error loading conversations:', e);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      loadConversations();
      return () => {};
    }, [loadConversations])
  );
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showGroupChatModal, setShowGroupChatModal] = useState(false);
  const [maxConversations, setMaxConversations] = useState(-1); // -1 means unlimited
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    loadConversationLimit();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConversationLimit();
    }, [])
  );

  const loadConversationLimit = async () => {
    const max = await getMaxConversations();
    setMaxConversations(max);
  };

  // Search: filter conversations by user name or group name
  const searchResults = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return [];
    const q = debouncedSearchQuery.trim().toLowerCase();
    return conversations.filter(
      (c) =>
        c.user.name.toLowerCase().includes(q) ||
        (c.groupName || '').toLowerCase().includes(q) ||
        (c.user.handle || '').toLowerCase().includes(q)
    );
  }, [conversations, debouncedSearchQuery]);

  const filteredAndSortedConversations = useMemo(() => {
    return applyInboxFilters(conversations, {
      searchQuery: debouncedSearchQuery,
      filter: 'all',
    });
  }, [conversations, debouncedSearchQuery]);

  const globalChat = useMemo(() => {
    // Always show global chat at the top
    return filteredAndSortedConversations.find(c => c.id === 'gc-global');
  }, [filteredAndSortedConversations]);

  const unreadConversations = useMemo(() => {
    // Hide unread section when searching
    if (debouncedSearchQuery.trim()) return [];
    // Keep pinned threads in the pinned section (avoid duplicates), exclude global chat
    return filteredAndSortedConversations.filter(c => c.id !== 'gc-global' && !c.pinned && (c.unreadCount || 0) > 0);
  }, [filteredAndSortedConversations, debouncedSearchQuery]);

  const pinnedConversations = useMemo(() => {
    // Hide pinned section when searching
    if (debouncedSearchQuery.trim()) return [];
    // Exclude global chat from pinned section
    return filteredAndSortedConversations.filter(c => c.id !== 'gc-global' && c.pinned);
  }, [filteredAndSortedConversations, debouncedSearchQuery]);

  const mainListConversations = useMemo(() => {
    // When searching, show all matching conversations (including unread)
    if (debouncedSearchQuery.trim()) {
      return filteredAndSortedConversations;
    }
    // Avoid duplication: show pinned/unread threads in their sections only, exclude global chat
    return filteredAndSortedConversations.filter(c => c.id !== 'gc-global' && !c.pinned && (c.unreadCount || 0) === 0);
  }, [filteredAndSortedConversations, debouncedSearchQuery]);

  const loadData = useCallback(async () => {
    try {
      await loadConversations();
    } catch (error) {
      console.error('Error loading inbox data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadConversations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleConversationPress = useCallback((conversationId: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      )
    );
    router.push(`/chat/${conversationId}` as any);
  }, [router]);

  const handlePinConversation = useCallback(async (conversationId: string, pinned: boolean) => {
    try {
      haptics.light();
      await pinConversation(conversationId, pinned);
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, pinned } : conv
        )
      );
    } catch (error) {
      console.error('Error pinning conversation:', error);
    }
  }, [haptics]);

  const handleMuteConversation = useCallback(async (conversationId: string, muted: boolean) => {
    try {
      haptics.light();
      await muteConversation(conversationId, muted);
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, muted } : conv
        )
      );
    } catch (error) {
      console.error('Error muting conversation:', error);
    }
  }, [haptics]);

  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    try {
      haptics.medium();
      await deleteConversation(conversationId);
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    } catch (error) {
      console.error('Error deleting conversation:', error);
      Alert.alert('Error', 'Failed to delete conversation. Please try again.');
    }
  }, [haptics]);


  const handleCreateGroupChat = useCallback(async (groupName: string, memberIds: string[]) => {
    try {
      if (!groupName.trim() || memberIds.length === 0) {
        Alert.alert('Error', 'Please enter a group name and select at least one member.');
        return;
      }

      // Check conversation limit for free users
      if (maxConversations > 0) {
        const nonGroupConversations = conversations.filter(c => !c.isGroup && c.id !== 'gc-global');
        if (nonGroupConversations.length >= maxConversations) {
          Alert.alert(
            'Conversation Limit Reached',
            `You can have up to ${maxConversations} conversations with your current plan. Upgrade to Pro for unlimited conversations.`,
            [
              { text: 'OK' },
              { text: 'Upgrade', onPress: () => router.push('/settings/subscription-info') },
            ]
          );
          return;
        }
      }

      haptics.success();
      const conversationId = await createGroupChat(groupName.trim(), memberIds);
      
      const members = await Promise.all(memberIds.map(id => getUserById(id)));
      const validMembers = members.filter((u): u is NonNullable<typeof u> => u != null);
      
      if (validMembers.length === 0) {
        Alert.alert('Error', 'No valid members selected.');
        return;
      }
      
      const currentUser = await getUserById(getCurrentUserIdOrFallback());
      if (!currentUser) {
        Alert.alert('Error', 'Could not load your profile.');
        return;
      }
      
      const newConversation: Conversation = {
        id: conversationId,
        user: { id: validMembers[0].id, name: validMembers[0].name, handle: validMembers[0].handle, avatar: validMembers[0].avatar ?? null },
        lastMessage: 'Group chat created',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        isGroup: true,
        groupName: groupName.trim(),
        members: [{ id: currentUser.id, name: currentUser.name, handle: currentUser.handle, avatar: currentUser.avatar ?? null }, ...validMembers.map(u => ({ id: u.id, name: u.name, handle: u.handle, avatar: u.avatar ?? null }))],
        pinned: false,
        muted: false,
      };
      
      setConversations(prev => [newConversation, ...prev]);
      router.push(`/chat/${conversationId}` as any);
    } catch (error) {
      console.error('Error creating group chat:', error);
      Alert.alert('Error', 'Failed to create group chat. Please try again.');
    }
  }, [router, haptics, conversations, maxConversations]);

  const renderConversationItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <ConversationItem
        conversation={item}
        onPress={() => handleConversationPress(item.id)}
        onPin={() => handlePinConversation(item.id, !item.pinned)}
        onMute={() => handleMuteConversation(item.id, !item.muted)}
        onDelete={() => handleDeleteConversation(item.id)}
      />
    ),
    [handleConversationPress, handlePinConversation, handleMuteConversation, handleDeleteConversation]
  );

  const renderGlobalChatSection = useCallback(() => {
    if (!globalChat || debouncedSearchQuery.trim()) return null;

    return (
      <View style={styles.sectionWrap}>
        <View style={styles.sectionList}>
          <ConversationItem
            key={`global-${globalChat.id}`}
            conversation={globalChat}
            onPress={() => handleConversationPress(globalChat.id)}
            onPin={() => handlePinConversation(globalChat.id, !globalChat.pinned)}
            onMute={() => handleMuteConversation(globalChat.id, !globalChat.muted)}
            onDelete={() => handleDeleteConversation(globalChat.id)}
          />
        </View>

        <View style={styles.globalChatDivider}>
          <View style={[styles.globalChatDividerLine, { 
            backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' 
          }]} />
        </View>
      </View>
    );
  }, [
    colorScheme,
    globalChat,
    debouncedSearchQuery,
    handleConversationPress,
    handleDeleteConversation,
    handleMuteConversation,
    handlePinConversation,
  ]);

  const renderUnreadSection = useCallback(() => {
    if (unreadConversations.length === 0) return null;

    return (
      <View style={styles.sectionWrap}>
        <View style={styles.sectionList}>
          {unreadConversations.map((c) => (
            <ConversationItem
              key={`unread-${c.id}`}
              conversation={c}
              onPress={() => handleConversationPress(c.id)}
              onPin={() => handlePinConversation(c.id, !c.pinned)}
              onMute={() => handleMuteConversation(c.id, !c.muted)}
              onDelete={() => handleDeleteConversation(c.id)}
            />
          ))}
        </View>

        <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />
      </View>
    );
  }, [
    colors,
    handleConversationPress,
    handleDeleteConversation,
    handleMuteConversation,
    handlePinConversation,
    unreadConversations,
  ]);

  const renderPinnedSection = useCallback(() => {
    if (pinnedConversations.length === 0) return null;

    return (
      <View style={styles.sectionWrap}>
        <View style={styles.sectionList}>
          {pinnedConversations.map((c) => (
            <ConversationItem
              key={`pinned-${c.id}`}
              conversation={c}
              onPress={() => handleConversationPress(c.id)}
              onPin={() => handlePinConversation(c.id, !c.pinned)}
              onMute={() => handleMuteConversation(c.id, !c.muted)}
              onDelete={() => handleDeleteConversation(c.id)}
            />
          ))}
        </View>

        <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />
      </View>
    );
  }, [
    colors,
    handleConversationPress,
    handleDeleteConversation,
    handleMuteConversation,
    handlePinConversation,
    pinnedConversations,
  ]);

  const handleOpenNewMessage = useCallback(() => {
    haptics.light();
    setShowGroupChatModal(true);
  }, [haptics]);

  return (
    <ErrorBoundary>
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { 
        backgroundColor: colors.cardBackground,
        borderBottomColor: colors.divider,
        shadowColor: (colors as any).shadow ?? '#000',
        ...Shadows.sm,
      }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: colors.text }]}>
              Messages
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                haptics.light();
                setShowSearch(!showSearch);
                if (showSearch) {
                  setSearchQuery('');
                }
              }}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <IconSymbol name={showSearch ? "close" : "search"} size={20} color={colors.text} />
            </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              haptics.medium();
              setShowGroupChatModal(true);
            }}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol name="add" size={22} color={colors.primary} />
          </TouchableOpacity>
          </View>
        </View>
        
        {showSearch && (
          <View style={styles.searchWrapper}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search conversations or messages..."
              onClear={() => {
                setSearchQuery('');
                setShowSearch(false);
              }}
              autoFocus
            />
          </View>
        )}
      </View>

      {debouncedSearchQuery.trim() ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              onPress={() => {
                setConversations(prev =>
                  prev.map(conv => (conv.id === item.id ? { ...conv, unreadCount: 0 } : conv))
                );
                router.push(`/chat/${item.id}` as any);
              }}
              onPin={() => handlePinConversation(item.id, !item.pinned)}
              onMute={() => handleMuteConversation(item.id, !item.muted)}
              onDelete={() => handleDeleteConversation(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          style={[styles.list, { backgroundColor: colors.background }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="search"
              title="No results"
              message={`No conversations match "${debouncedSearchQuery}"`}
            />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
        />
      ) : (
        <FlatList
          data={mainListConversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.listContent}
          style={[styles.list, { backgroundColor: colors.background }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <>
              {renderGlobalChatSection()}
              {renderPinnedSection()}
              {renderUnreadSection()}
            </>
          )}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="message"
              title="No conversations yet"
              message="Start a chat or create a group to see your conversations here."
              actions={[
                { label: 'New message', onPress: handleOpenNewMessage, variant: 'primary' },
              ]}
            />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
        />
      )}
      <GroupChatCreateModal
        visible={showGroupChatModal}
        onClose={() => setShowGroupChatModal(false)}
        onCreateGroup={handleCreateGroupChat}
      />
    </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.md + 4,
    paddingBottom: Spacing.md + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    minWidth: 0,
  },
  backButton: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconButton: {
    padding: Spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  searchWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.xs,
  },
  sectionWrap: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs + 2,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.xs + 1,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  sectionCountBadge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCountText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sectionList: {
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: Spacing.xs,
    marginHorizontal: Spacing.lg,
    opacity: 0.5,
  },
  globalChatDivider: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  globalChatDividerLine: {
    height: 2,
    width: '100%',
  },
  messageResultItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 72,
  },
  messageResultHeader: {
    marginBottom: Spacing.xs + 2,
  },
  messageResultUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
  },
  messageResultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageResultAvatarText: {
    fontSize: Typography.sm + 1,
    fontWeight: '600',
  },
  messageResultUserInfo: {
    flex: 1,
    minWidth: 0,
  },
  messageResultName: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  messageResultTime: {
    fontSize: Typography.xs,
    opacity: 0.7,
    fontWeight: '500',
  },
  messageResultContent: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.45,
    opacity: 0.85,
    marginTop: Spacing.xs + 2,
  },
});
