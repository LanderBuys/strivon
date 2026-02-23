import { getFirestoreDb } from '@/lib/firebase';
import { getCurrentUserIdOrFallback } from '@/lib/api/users';
import { getUserById } from '@/lib/api/users';
import { ThreadMessage, SharedPostPayload, SharedArticlePayload, User } from '@/types/post';
import type { Conversation } from '@/lib/mocks/notifications';
import {
  getConversationsFirestore,
  getOrCreate1To1ConversationFirestore,
  getConversationIdForUserFirestore,
  createGroupConversationFirestore,
  updateConversationLastMessageFirestore,
  updateConversationPinFirestore,
  updateConversationMuteFirestore,
  deleteConversationFirestore,
  getConversationByIdFirestore,
} from '@/lib/firestore/conversations';
import {
  getMessagesFirestore,
  sendMessageFirestore,
  deleteMessageFirestore,
} from '@/lib/firestore/messages';

const CHAT_PAGE_SIZE = 50;
const CHAT_LOAD_OLDER_SIZE = 20;

/** Resolves a user ID (share target) to the conversation ID for that 1:1 DM. Creates conversation if needed. */
export async function getConversationIdForUser(userId: string): Promise<string | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const currentUserId = getCurrentUserIdOrFallback();
  const existing = await getConversationIdForUserFirestore(currentUserId, userId);
  if (existing) return existing;
  const id = await getOrCreate1To1ConversationFirestore(currentUserId, userId);
  return id;
}

export async function getChatMessages(id: string): Promise<ThreadMessage[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const messages = await getMessagesFirestore(id, { limit: CHAT_PAGE_SIZE });
  return messages;
}

export interface GetChatMessagesPageResult {
  messages: ThreadMessage[];
  hasMore: boolean;
}

export async function getChatMessagesPaginated(
  id: string,
  options?: { olderThanMessageId?: string; limit?: number }
): Promise<GetChatMessagesPageResult> {
  const db = getFirestoreDb();
  if (!db) return { messages: [], hasMore: false };
  const limitNum = options?.limit ?? (options?.olderThanMessageId ? CHAT_LOAD_OLDER_SIZE : CHAT_PAGE_SIZE);
  const messages = await getMessagesFirestore(id, { olderThanMessageId: options?.olderThanMessageId, limit: limitNum });
  return { messages, hasMore: messages.length >= limitNum };
}

function derivePreview(text: string, sharedPost?: SharedPostPayload, sharedArticle?: SharedArticlePayload, poll?: any, media?: any[]): string {
  if (sharedPost) return '📎 Shared a post';
  if (sharedArticle) return '📰 Shared an article';
  const trimmed = (text || '').trim();
  if (trimmed) return trimmed;
  if (poll) return '📊 ' + (poll.question || 'Poll');
  if (media && media.length > 0) {
    const types = new Set(media.map((m: any) => m?.type).filter(Boolean));
    if (types.has('CALL')) return 'Call';
    if (types.has('AUDIO')) return '🎤 Voice message';
    if (types.has('IMAGE')) return '📷 Photo';
    if (types.has('VIDEO')) return '🎥 Video';
    if (types.has('FILE')) return '📎 Attachment';
    return '📎 Media';
  }
  return '';
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
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured. Sign in and try again.');
  const uid = getCurrentUserIdOrFallback();
  const author = await getUserById(uid);
  if (!author) throw new Error('User not found');
  const user = { id: author.id, name: author.name, handle: author.handle, avatar: author.avatar ?? null, label: author.label, country: author.country };
  const content = derivePreview(text, sharedPost, sharedArticle, poll, media) || text.trim() || '📎 Media';
  return sendMessageFirestore(id, user, content, {
    replyToId,
    media,
    poll,
    sharedPost,
    sharedArticle,
  });
}

export async function deleteChatMessage(id: string, messageId: string): Promise<{ id: string; messageId: string }> {
  const db = getFirestoreDb();
  if (!db) return { id, messageId };
  await deleteMessageFirestore(id, messageId);
  const messages = await getMessagesFirestore(id, { limit: 1 });
  const last = messages[messages.length - 1];
  if (last) {
    await updateConversationLastMessageFirestore(id, last.content || '📎 Media', last.author.id);
  }
  return { id, messageId };
}

export async function reactToChatMessage(id: string, messageId: string, emoji: string): Promise<void> {
  // Optional: implement reaction storage in Firestore (e.g. message doc or subcollection)
  return;
}

export async function voteOnPoll(id: string, messageId: string, pollId: string, optionId: string): Promise<void> {
  // Optional: implement poll votes in Firestore
  return;
}

export async function forwardMessage(fromId: string, messageId: string, toId: string): Promise<{ toId: string; messageId: string }> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured');
  const messages = await getMessagesFirestore(fromId, { limit: 500 });
  const source = messages.find((m) => m.id === messageId);
  if (!source) throw new Error('Message not found');
  const uid = getCurrentUserIdOrFallback();
  const author = await getUserById(uid);
  if (!author) throw new Error('User not found');
  const user = { id: author.id, name: author.name, handle: author.handle, avatar: author.avatar ?? null, label: author.label, country: author.country };
  const forwarded = await sendMessageFirestore(toId, user, '📩 ' + (source.content || 'Forwarded message'), {});
  return { toId, messageId: forwarded.id };
}

export async function createGroupChat(name: string, memberIds: string[]): Promise<string> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured. Sign in and try again.');
  const creatorId = getCurrentUserIdOrFallback();
  return createGroupConversationFirestore(creatorId, memberIds, name);
}

export async function pinConversation(id: string, pinned: boolean): Promise<{ id: string; pinned: boolean }> {
  const db = getFirestoreDb();
  if (!db) return { id, pinned };
  const uid = getCurrentUserIdOrFallback();
  await updateConversationPinFirestore(id, uid, pinned);
  return { id, pinned };
}

export async function muteConversation(id: string, muted: boolean): Promise<{ id: string; muted: boolean }> {
  const db = getFirestoreDb();
  if (!db) return { id, muted };
  const uid = getCurrentUserIdOrFallback();
  await updateConversationMuteFirestore(id, uid, muted);
  return { id, muted };
}

export async function deleteConversation(id: string): Promise<{ id: string }> {
  const db = getFirestoreDb();
  if (!db) return { id };
  await deleteConversationFirestore(id);
  return { id };
}

export async function markConversationAsRead(id: string, read: boolean): Promise<{ id: string; read: boolean }> {
  return { id, read };
}

export async function editChatMessage(id: string, messageId: string, newContent: string): Promise<ThreadMessage> {
  throw new Error('Edit message not implemented in Firestore yet');
}

export async function pinChatMessage(id: string, messageId: string, pinned: boolean): Promise<void> {
  return;
}

export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex);
  return matches ? matches.map((m) => m.substring(1)) : [];
}

export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches || [];
}

/** Get a single conversation by id (for chat screen header/info) */
export async function getConversationById(conversationId: string): Promise<Conversation | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const uid = getCurrentUserIdOrFallback();
  const rec = await getConversationByIdFirestore(conversationId);
  if (!rec) return null;
  let user: Conversation['user'];
  let members: User[] | undefined;
  if (rec.isGroup) {
    user = { id: rec.id, name: rec.groupName || 'Group', handle: '@group', avatar: null };
    const users = await Promise.all(rec.memberIds.map((id) => getUserById(id)));
    members = users.filter((u): u is NonNullable<typeof u> => u != null).map((u) => ({ id: u.id, name: u.name, handle: u.handle, avatar: u.avatar ?? null }));
  } else {
    const otherId = rec.memberIds.find((id) => id !== uid);
    const other = otherId ? await getUserById(otherId) : null;
    user = other ? { id: other.id, name: other.name, handle: other.handle, avatar: other.avatar ?? null } : { id: 'unknown', name: 'Unknown', handle: '@unknown', avatar: null };
  }
  const unreadCount = rec.unreadCount?.[uid] ?? 0;
  const pinned = rec.pinned?.[uid] ?? false;
  const muted = rec.muted?.[uid] ?? false;
  return {
    id: rec.id,
    user,
    lastMessage: rec.lastMessage,
    lastMessageTime: rec.lastMessageTime,
    unreadCount,
    isGroup: rec.isGroup,
    groupName: rec.groupName,
    members,
    pinned,
    muted,
  };
}

/** Load all conversations for the current user and map to Conversation[] (for inbox list) */
export async function getConversationsList(): Promise<Conversation[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const uid = getCurrentUserIdOrFallback();
  const records = await getConversationsFirestore(uid);
  const list: Conversation[] = [];
  for (const rec of records) {
    let user: Conversation['user'];
    let members: User[] | undefined;
    if (rec.isGroup) {
      user = { id: rec.id, name: rec.groupName || 'Group', handle: '@group', avatar: null };
      const users = await Promise.all(rec.memberIds.map((id) => getUserById(id)));
      members = users.filter((u): u is NonNullable<typeof u> => u != null).map((u) => ({ id: u.id, name: u.name, handle: u.handle, avatar: u.avatar ?? null }));
    } else {
      const otherId = rec.memberIds.find((id) => id !== uid);
      const other = otherId ? await getUserById(otherId) : null;
      user = other
        ? { id: other.id, name: other.name, handle: other.handle, avatar: other.avatar ?? null }
        : { id: 'unknown', name: 'Unknown', handle: '@unknown', avatar: null };
    }
    const unreadCount = rec.unreadCount?.[uid] ?? 0;
    const pinned = rec.pinned?.[uid] ?? false;
    const muted = rec.muted?.[uid] ?? false;
    list.push({
      id: rec.id,
      user,
      lastMessage: rec.lastMessage,
      lastMessageTime: rec.lastMessageTime,
      unreadCount,
      isGroup: rec.isGroup,
      groupName: rec.groupName,
      members,
      pinned,
      muted,
    });
  }
  return list;
}
