import { getMockMessages, mockMessages } from '@/lib/mocks/messages';
import { mockConversations } from '@/lib/mocks/notifications';
import { mockUsers } from '@/lib/mocks/users';
import { getCurrentUserIdOrFallback } from '@/lib/api/users';
import { ThreadMessage, SharedPostPayload, SharedArticlePayload } from '@/types/post';

/**
 * Resolves a user ID (share target) to the conversation ID for that 1:1 DM.
 * Required because share targets use user IDs but chat threads use conversation IDs (e.g. conv-1).
 */
export function getConversationIdForUser(userId: string): string | null {
  const conv = mockConversations.find(
    (c) => !c.isGroup && c.user?.id === userId
  );
  return conv ? conv.id : null;
}

const CHAT_PAGE_SIZE = 50;
const CHAT_LOAD_OLDER_SIZE = 20;

export async function getChatMessages(id: string) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return getMockMessages(id);
}

export interface GetChatMessagesPageResult {
  messages: ThreadMessage[];
  hasMore: boolean;
}

/**
 * Initial load: returns the most recent messages (newest at end).
 * Load older: pass oldestMessageId to get messages older than that.
 */
export async function getChatMessagesPaginated(
  id: string,
  options?: { olderThanMessageId?: string; limit?: number }
): Promise<GetChatMessagesPageResult> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const limit = options?.limit ?? (options?.olderThanMessageId ? CHAT_LOAD_OLDER_SIZE : CHAT_PAGE_SIZE);
  const all = getMockMessages(id);
  const sorted = [...all].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  if (sorted.length === 0) return { messages: [], hasMore: false };

  if (!options?.olderThanMessageId) {
    // Initial load: return newest `limit` messages
    const start = Math.max(0, sorted.length - limit);
    const messages = sorted.slice(start, sorted.length);
    return { messages, hasMore: start > 0 };
  }

  const idx = sorted.findIndex(m => m.id === options.olderThanMessageId);
  if (idx <= 0) return { messages: [], hasMore: false };
  const from = Math.max(0, idx - limit);
  const messages = sorted.slice(from, idx);
  return { messages, hasMore: from > 0 };
}

export async function sendChatMessage(
  id: string,
  text: string,
  media?: any[],
  replyToId?: string,
  poll?: any,
  sharedPost?: SharedPostPayload,
  sharedArticle?: SharedArticlePayload
): Promise<ThreadMessage> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));

  const currentUser = mockUsers.find(u => u.id === getCurrentUserIdOrFallback()) || mockUsers[0];
  // Extract mentions if text provided
  const mentions = text ? (() => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(m => m.substring(1)) : [];
  })() : [];

  const derivedPreview = (() => {
    if (sharedPost) return '📎 Shared a post';
    if (sharedArticle) return '📰 Shared an article';
    const trimmed = (text || '').trim();
    if (trimmed) return trimmed;
    if (poll) return '📊 ' + (poll.question || 'Poll');
    if (!media || media.length === 0) return '';

    // Try to derive a readable preview for media-only messages so inbox updates are meaningful.
    const types = new Set(media.map((m: any) => m?.type).filter(Boolean));
    if (types.has('CALL')) return 'Call';
    if (types.has('AUDIO')) return '🎤 Voice message';
    if (types.has('IMAGE')) return '📷 Photo';
    if (types.has('VIDEO')) return '🎥 Video';
    if (types.has('FILE')) return '📎 Attachment';
    return '📎 Media';
  })();

  const newMessage: ThreadMessage = {
    id: `msg-${id}-${Date.now()}`,
    author: currentUser,
    content: derivedPreview,
    createdAt: new Date().toISOString(),
    reactions: [],
    replyTo: replyToId,
    media: media,
    poll: poll,
    status: 'sent',
    mentions: mentions.length > 0 ? mentions : undefined,
    sharedPost: sharedPost,
    sharedArticle: sharedArticle,
  };
  
  // Add to mock messages
  if (!mockMessages[id]) {
    mockMessages[id] = [];
  }
  mockMessages[id].push(newMessage);

  // Keep conversation previews in sync (so inbox reflects new messages/call logs).
  try {
    const { mockConversations } = await import('@/lib/mocks/notifications');
    const conv = mockConversations.find(c => c.id === id);
    if (conv) {
      conv.lastMessage = derivedPreview || conv.lastMessage;
      conv.lastMessageTime = newMessage.createdAt;
    }
  } catch {
    // ignore
  }
  
  return newMessage;
}

export async function deleteChatMessage(id: string, messageId: string) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (mockMessages[id]) {
    mockMessages[id] = mockMessages[id].filter(msg => msg.id !== messageId);
  }

  // Update conversation preview if we deleted the last message (or if the preview referenced it).
  try {
    const { mockConversations } = await import('@/lib/mocks/notifications');
    const conv = mockConversations.find(c => c.id === id);
    if (conv) {
      const remaining = (mockMessages[id] || []).slice().sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const last = remaining[remaining.length - 1];

      if (!last) {
        conv.lastMessage = 'No messages yet';
        conv.lastMessageTime = new Date().toISOString();
      } else {
        const preview = (last.content || '').trim() || '📎 Media';
        conv.lastMessage = preview;
        conv.lastMessageTime = last.createdAt;
      }
    }
  } catch {
    // ignore
  }
  
  return { id, messageId };
}

export async function reactToChatMessage(id: string, messageId: string, emoji: string) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (mockMessages[id]) {
    const message = mockMessages[id].find(msg => msg.id === messageId);
    if (message) {
      if (!message.reactions) {
        message.reactions = [];
      }
      const existingReaction = message.reactions.find(r => r.emoji === emoji);
      if (existingReaction) {
        // Toggle behavior:
        // - If current user already reacted with this emoji: remove their reaction (decrement).
        // - Otherwise: add their reaction (increment).
        if (existingReaction.userReacted) {
          existingReaction.count = Math.max(0, (existingReaction.count || 0) - 1);
          existingReaction.userReacted = false;
          if (existingReaction.count <= 0) {
            message.reactions = message.reactions.filter(r => r.emoji !== emoji);
          }
        } else {
          existingReaction.count = (existingReaction.count || 0) + 1;
          existingReaction.userReacted = true;
        }
      } else {
        message.reactions.push({ emoji, count: 1, userReacted: true });
      }
    }
  }
  
  return {};
}

export async function voteOnPoll(id: string, messageId: string, pollId: string, optionId: string) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (mockMessages[id]) {
    const message = mockMessages[id].find(msg => msg.id === messageId);
    if (message && message.poll) {
      const poll = message.poll;
      const option = poll.options.find(opt => opt.id === optionId);
      const currentUserId = getCurrentUserIdOrFallback();
      
      if (option) {
        // Check if user already voted for this option
        const alreadyVoted = poll.userVotes?.includes(optionId);
        
        if (alreadyVoted) {
          // Remove vote (toggle off)
          const currentVotes = option.votes || 0;
          option.votes = Math.max(0, currentVotes - 1);
          if (option.voters) {
            option.voters = option.voters.filter(v => v !== currentUserId);
          }
          
          // Update poll totals - recalculate from all options
          poll.totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
          if (poll.userVotes) {
            poll.userVotes = poll.userVotes.filter(v => v !== optionId);
          }
        } else {
          // Add vote
          const currentVotes = option.votes || 0;
          option.votes = currentVotes + 1;
          if (!option.voters) option.voters = [];
          option.voters.push(currentUserId);
          
          // Update poll totals - recalculate from all options
          poll.totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
          if (!poll.userVotes) poll.userVotes = [];
          poll.userVotes.push(optionId);
        }
      }
    }
  }
  
  return {};
}

export async function forwardMessage(fromId: string, messageId: string, toId: string) {
  await new Promise(resolve => setTimeout(resolve, 200));

  const source = mockMessages[fromId]?.find(m => m.id === messageId);
  if (!source) {
    throw new Error('Message not found');
  }

  const currentUser = mockUsers.find(u => u.id === getCurrentUserIdOrFallback()) || mockUsers[0];

  const forwarded: ThreadMessage = {
    ...source,
    id: `msg-${toId}-${Date.now()}`,
    // Treat forwarded messages as sent by the current user
    author: currentUser,
    createdAt: new Date().toISOString(),
    status: 'sent',
  };

  if (!mockMessages[toId]) mockMessages[toId] = [];
  mockMessages[toId].push(forwarded);

  // Update inbox preview for destination conversation
  const preview = (forwarded.content || '').trim() || '📩 Forwarded message';
  const { mockConversations } = await import('@/lib/mocks/notifications');
  const conv = mockConversations.find(c => c.id === toId);
  if (conv) {
    conv.lastMessage = preview;
    conv.lastMessageTime = forwarded.createdAt;
    conv.unreadCount = (conv.unreadCount || 0) + 1;
  }

  return { toId, messageId: forwarded.id };
}

export async function createGroupChat(name: string, memberIds: string[]): Promise<string> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Generate unique group chat ID
  // Find the highest existing group chat number
  const { mockConversations } = await import('@/lib/mocks/notifications');
  const groupChats = mockConversations.filter(conv => conv.isGroup && conv.id.startsWith('gc-'));
  let maxNumber = 0;
  
  if (groupChats.length > 0) {
    const numbers = groupChats.map(conv => {
      const match = conv.id.match(/gc-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    maxNumber = Math.max(...numbers);
  }
  
  const newId = `gc-${maxNumber + 1}`;
  
  // Initialize empty messages for the new group chat
  if (!mockMessages[newId]) {
    mockMessages[newId] = [];
  }
  
  return newId;
}

export async function pinConversation(id: string, pinned: boolean) {
  await new Promise(resolve => setTimeout(resolve, 150));
  const { mockConversations } = await import('@/lib/mocks/notifications');
  const conv = mockConversations.find(c => c.id === id);
  if (conv) conv.pinned = pinned;
  return { id, pinned };
}

export async function muteConversation(id: string, muted: boolean) {
  await new Promise(resolve => setTimeout(resolve, 150));
  const { mockConversations } = await import('@/lib/mocks/notifications');
  const conv = mockConversations.find(c => c.id === id);
  if (conv) conv.muted = muted;
  return { id, muted };
}

export async function deleteConversation(id: string) {
  await new Promise(resolve => setTimeout(resolve, 150));
  const { mockConversations } = await import('@/lib/mocks/notifications');
  const idx = mockConversations.findIndex(c => c.id === id);
  if (idx !== -1) mockConversations.splice(idx, 1);
  if (mockMessages[id]) {
    delete mockMessages[id];
  }
  return { id };
}

export async function markConversationAsRead(id: string, read: boolean) {
  await new Promise(resolve => setTimeout(resolve, 150));
  const { mockConversations } = await import('@/lib/mocks/notifications');
  const conv = mockConversations.find(c => c.id === id);
  if (conv) conv.unreadCount = read ? 0 : (conv.unreadCount || 0);
  return { id, read };
}

export async function editChatMessage(id: string, messageId: string, newContent: string): Promise<ThreadMessage> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (mockMessages[id]) {
    const message = mockMessages[id].find(msg => msg.id === messageId);
    if (message) {
      message.content = newContent;
      message.editedAt = new Date().toISOString();
      return message;
    }
  }
  
  throw new Error('Message not found');
}

export async function pinChatMessage(id: string, messageId: string, pinned: boolean): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (mockMessages[id]) {
    const message = mockMessages[id].find(msg => msg.id === messageId);
    if (message) {
      message.pinned = pinned;
    }
  }
}

// Helper to extract mentions from text
export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex);
  if (!matches) return [];
  
  // Extract usernames (remove @)
  return matches.map(match => match.substring(1));
}

// Helper to extract URLs from text
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches || [];
}


