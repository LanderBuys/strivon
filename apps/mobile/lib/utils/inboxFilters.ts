import { Conversation } from '@/lib/mocks/notifications';
import { getMockMessages } from '@/lib/mocks/messages';

export type InboxFilterKey = 'all' | 'people' | 'groups' | 'media';

export interface InboxFilterOptions {
  searchQuery: string;
  filter: InboxFilterKey;
}

export function isMediaConversation(conversation: Conversation): boolean {
  const text = (conversation.lastMessage || '').toLowerCase();
  return (
    text.includes('📸') ||
    text.includes('📹') ||
    text.includes('photo') ||
    text.includes('video')
  );
}

export function matchesInboxSearch(conversation: Conversation, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  // Search in group name or user name
  const name = conversation.isGroup
    ? (conversation.groupName || 'Group Chat')
    : conversation.user.name;
  const nameMatch = name.toLowerCase().includes(q);

  // Search in user handle (for non-group conversations)
  const handleMatch = !conversation.isGroup && conversation.user.handle
    ? conversation.user.handle.toLowerCase().includes(q)
    : false;

  // Search in last message preview
  const lastMessageMatch = (conversation.lastMessage || '').toLowerCase().includes(q);

  // Search through all messages in the conversation
  let messageHistoryMatch = false;
  try {
    const allMessages = getMockMessages(conversation.id);
    if (allMessages && allMessages.length > 0) {
      messageHistoryMatch = allMessages.some(message => {
        const content = (message.content || '').toLowerCase();
        return content.includes(q);
      });
    }
  } catch (error) {
    // If message loading fails, fall back to last message only
    console.warn('Error loading messages for search:', error);
  }

  // For group chats, also search in member names
  let memberMatch = false;
  if (conversation.isGroup && conversation.members) {
    memberMatch = conversation.members.some(member =>
      member.name.toLowerCase().includes(q) ||
      (member.handle && member.handle.toLowerCase().includes(q))
    );
  }

  return nameMatch || handleMatch || lastMessageMatch || messageHistoryMatch || memberMatch;
}

export function matchesInboxFilter(conversation: Conversation, filter: InboxFilterKey): boolean {
  switch (filter) {
    case 'people':
      return !conversation.isGroup;
    case 'groups':
      return conversation.isGroup;
    case 'media':
      return isMediaConversation(conversation);
    case 'all':
    default:
      return true;
  }
}

export function applyInboxFilters(
  conversations: Conversation[],
  options: InboxFilterOptions
): Conversation[] {
  const { searchQuery, filter } = options;

  let filtered = conversations;

  if (searchQuery.trim()) {
    filtered = filtered.filter(c => matchesInboxSearch(c, searchQuery));
  }

  filtered = filtered.filter(c => matchesInboxFilter(c, filter));

  // Sort: global chat first, then pinned, then recent
  return [...filtered].sort((a, b) => {
    const aIsGlobal = a.id === 'gc-global';
    const bIsGlobal = b.id === 'gc-global';
    
    // Global chat always first
    if (aIsGlobal && !bIsGlobal) return -1;
    if (!aIsGlobal && bIsGlobal) return 1;
    
    // Then pinned conversations
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    
    // Then by most recent message
    return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
  });
}


