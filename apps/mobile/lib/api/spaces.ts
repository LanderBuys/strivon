import { Space, SpaceMember, SpaceEvent, Post, JoinRequest } from '@/types/post';
import { getFirestoreDb } from '@/lib/firebase';
import { getCurrentUserIdOrFallback } from './users';
import {
  getSpacesFirestore,
  getSpaceByIdFirestore,
  createSpaceFirestore,
  updateSpaceFirestore,
  joinSpaceFirestore,
  leaveSpaceFirestore,
  getSpaceMembersFirestore,
} from '@/lib/firestore/spaces';
import { mockSpaces as mockSpacesList } from '@/lib/mocks/spaces';

const MOCK_SPACE_ICON_VERSION = 'v3';

function hashSeed(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getMockSpaceIconImage(space: Pick<Space, 'id' | 'name'>) {
  const avatarSeed = `${space.id || space.name || 'space'}-${MOCK_SPACE_ICON_VERSION}`;
  const seedHash = hashSeed(avatarSeed);
  const styles = ['identicon', 'shapes', 'rings'] as const;
  const style = styles[seedHash % styles.length];
  const bgPalette = ['f2f3f5', 'eef2ff', 'f0fdf4', 'fff7ed', 'fdf2f8'] as const;
  const backgroundColor = bgPalette[(seedHash >> 3) % bgPalette.length];
  return `https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(
    avatarSeed,
  )}&size=256&backgroundColor=${backgroundColor}`;
}

const SPACES_PAGE_SIZE = 20;

function getMockSpacesWithIcons(): Space[] {
  return mockSpacesList.map((s) => ({
    ...s,
    iconImage: s.iconImage || getMockSpaceIconImage({ id: s.id, name: s.name }),
  }));
}

export async function getSpaces(): Promise<Space[]> {
  const db = getFirestoreDb();
  if (db) {
    const uid = getCurrentUserIdOrFallback();
    const spaces = await getSpacesFirestore(uid);
    if (spaces.length > 0) {
      return spaces.map((s) => ({
        ...s,
        iconImage: s.iconImage || getMockSpaceIconImage({ id: s.id, name: s.name }),
      }));
    }
  }
  return getMockSpacesWithIcons();
}

export interface GetSpacesPageResult {
  spaces: Space[];
  hasMore: boolean;
}

export async function getSpacesPaginated(offset: number, limit: number = SPACES_PAGE_SIZE): Promise<GetSpacesPageResult> {
  const all = await getSpaces();
  const end = offset + limit;
  return { spaces: all.slice(offset, end), hasMore: end < all.length };
}

export async function getSpaceById(id: string): Promise<Space | null> {
  const db = getFirestoreDb();
  const fromMock = mockSpacesList.find((s) => s.id === id) ?? null;
  const withIcon = fromMock ? { ...fromMock, iconImage: fromMock.iconImage || getMockSpaceIconImage({ id: fromMock.id, name: fromMock.name }) } : null;
  if (!db) return withIcon;
  const uid = getCurrentUserIdOrFallback();
  const space = await getSpaceByIdFirestore(id, uid);
  if (space) return { ...space, iconImage: space.iconImage || getMockSpaceIconImage({ id: space.id, name: space.name }) };
  return withIcon;
}

export async function joinSpace(id: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured. Sign in and try again.');
  await joinSpaceFirestore(id, getCurrentUserIdOrFallback());
}

export async function leaveSpace(id: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured. Sign in and try again.');
  await leaveSpaceFirestore(id, getCurrentUserIdOrFallback());
}

// Join requests: Firestore collection spaceJoinRequests can be added later; for now return empty / no-op
const _mockJoinRequests: JoinRequest[] = [];

export async function requestToJoinSpace(spaceId: string, message?: string): Promise<JoinRequest> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured');
  const uid = getCurrentUserIdOrFallback();
  const user = await import('@/lib/api/users').then((m) => m.getUserById(uid));
  if (!user) throw new Error('User not found');
  const newRequest: JoinRequest = {
    id: `request-${Date.now()}`,
    userId: uid,
    user: { id: user.id, name: user.name, handle: user.handle, avatar: user.avatar ?? null },
    spaceId,
    message: message?.trim(),
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };
  _mockJoinRequests.push(newRequest);
  return newRequest;
}

export async function getJoinRequests(spaceId: string): Promise<JoinRequest[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  return _mockJoinRequests.filter((r) => r.spaceId === spaceId && r.status === 'pending');
}

export async function approveJoinRequest(requestId: string): Promise<void> {
  const r = _mockJoinRequests.find((x) => x.id === requestId);
  if (r) r.status = 'approved';
}

export async function rejectJoinRequest(requestId: string): Promise<void> {
  const r = _mockJoinRequests.find((x) => x.id === requestId);
  if (r) r.status = 'rejected';
}


export async function getUserJoinRequest(spaceId: string, userId: string): Promise<JoinRequest | null> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return _mockJoinRequests.find((r) => r.spaceId === spaceId && r.userId === userId && r.status === 'pending') || null;
}

/** Returns space IDs for which the current user has a pending join request. Single call instead of N per-space. */
export async function getMyPendingJoinRequestIds(userId: string): Promise<string[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return _mockJoinRequests
    .filter((r) => r.userId === userId && r.status === 'pending')
    .map((r) => r.spaceId);
}

// Moderation functions
export async function kickMember(spaceId: string, memberId: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300));
  // In real app, this would remove the member from the space
  console.log(`Kicked member ${memberId} from space ${spaceId}`);
}

export async function banMember(spaceId: string, memberId: string, reason?: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300));
  // In real app, this would ban the member and prevent them from rejoining
  console.log(`Banned member ${memberId} from space ${spaceId}${reason ? `: ${reason}` : ''}`);
}

export async function updateMemberRole(spaceId: string, memberId: string, role: 'admin' | 'moderator' | 'member'): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300));
  // In real app, this would update the member's role
  console.log(`Updated member ${memberId} role to ${role} in space ${spaceId}`);
}

export async function canModerate(spaceId: string, userId: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 100));
  const space = await getSpaceById(spaceId);
  if (!space) return false;
  
  // Check if user is owner
  if (space.ownerId === userId) return true;
  
  // Check memberRole if space has it set
  if (space.memberRole === 'owner' || space.memberRole === 'admin' || space.memberRole === 'moderator') {
    return true;
  }
  
  return false;
}

export interface CreateSpaceData {
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
  banner?: string;
  iconImage?: string;
  channels?: Array<{ name: string; description?: string }>;
  isPrivate?: boolean;
  requiresApproval?: boolean;
  rules?: string[];
  guidelines?: string;
  tags?: string[];
  /** Location-based space: e.g. "Berlin Builders", "Texas Founders". */
  country?: string;
  state?: string;
  city?: string;
}

export async function createSpace(data: CreateSpaceData): Promise<Space> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured. Sign in and try again.');
  const ownerId = getCurrentUserIdOrFallback();
  const space = await createSpaceFirestore(ownerId, {
    name: data.name,
    description: data.description,
    category: data.category,
    color: data.color,
    banner: data.banner,
    iconImage: data.iconImage,
    channels: data.channels,
    isPrivate: data.isPrivate,
    requiresApproval: data.requiresApproval,
    rules: data.rules,
    guidelines: data.guidelines,
    tags: data.tags,
    country: data.country,
    state: data.state,
    city: data.city,
  });
  return { ...space, iconImage: space.iconImage || getMockSpaceIconImage({ id: space.id, name: space.name }) };
}

export async function updateSpace(id: string, data: Partial<CreateSpaceData>): Promise<Space | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const uid = getCurrentUserIdOrFallback();
  const existing = await getSpaceById(id);
  if (!existing || existing.ownerId !== uid) return null;
  const updated = await updateSpaceFirestore(id, uid, uid, {
    name: data.name,
    description: data.description,
    category: data.category,
    color: data.color,
    iconImage: data.iconImage,
    banner: data.banner,
    isPrivate: data.isPrivate,
    requiresApproval: data.requiresApproval,
    rules: data.rules,
    guidelines: data.guidelines,
    tags: data.tags,
    country: data.country,
    state: data.state,
    city: data.city,
  });
  if (!updated) return null;
  return { ...updated, iconImage: updated.iconImage || getMockSpaceIconImage({ id: updated.id, name: updated.name }) };
}

export type PinnedResource = NonNullable<Space['pinnedResources']>[number];

export async function addSpaceResource(
  spaceId: string,
  payload: { title: string; url: string; description?: string; type?: PinnedResource['type'] }
): Promise<Space | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const space = await getSpaceById(spaceId);
  if (!space || space.ownerId !== getCurrentUserIdOrFallback()) return null;
  const raw = payload.url.trim();
  const normalizedUrl = raw.startsWith('file://') ? raw : (raw.match(/^https?:\/\//i) ? raw : `https://${raw}`);
  const newResource: PinnedResource = {
    id: `resource-${spaceId}-${Date.now()}`,
    title: payload.title.trim(),
    url: normalizedUrl,
    description: payload.description?.trim() || undefined,
    type: payload.type ?? 'link',
  };
  const pinnedResources = [...(space.pinnedResources || []), newResource];
  return updateSpace(spaceId, { pinnedResources } as any);
}

export async function removeSpaceResource(spaceId: string, resourceId: string): Promise<Space | null> {
  const space = await getSpaceById(spaceId);
  if (!space || space.ownerId !== getCurrentUserIdOrFallback()) return null;
  const pinnedResources = (space.pinnedResources || []).filter((r) => r.id !== resourceId);
  return updateSpace(spaceId, { pinnedResources } as any);
}

// New enhanced API functions

export async function getSpaceMembers(spaceId: string): Promise<SpaceMember[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  return getSpaceMembersFirestore(spaceId);
}

export async function getSpacePosts(spaceId: string, page: number = 1, limit: number = 20): Promise<{ data: Post[]; hasMore: boolean }> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const { getFeedPosts } = await import('./posts');
  // Get posts and filter by space (in real app, this would be a space-specific query)
  const response = await getFeedPosts('for-you', page, limit);
  return response;
}

export async function getSpaceEvents(spaceId: string): Promise<SpaceEvent[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return [
    {
      id: 'event-1',
      title: 'React Native Meetup',
      description: 'Monthly meetup to discuss React Native updates and best practices',
      startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      location: 'San Francisco, CA',
      isOnline: false,
      attendees: ['user-1', 'user-2', 'user-3'],
      maxAttendees: 50,
      createdBy: 'user-1',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    },
    {
      id: 'event-2',
      title: 'Expo Workshop',
      description: 'Learn how to build apps with Expo',
      startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
      isOnline: true,
      meetingUrl: 'https://meet.example.com/expo-workshop',
      attendees: ['user-1', 'user-4'],
      maxAttendees: 100,
      createdBy: 'user-2',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
  ];
}

export async function createSpaceEvent(spaceId: string, event: Omit<SpaceEvent, 'id' | 'createdAt' | 'createdBy'>): Promise<SpaceEvent> {
  return {
    id: `event-${Date.now()}`,
    ...event,
    createdBy: getCurrentUserIdOrFallback(),
    createdAt: new Date().toISOString(),
  };
}

export async function joinSpaceEvent(spaceId: string, eventId: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300));
  // In real app, this would update the event attendees
}

export async function inviteToSpace(spaceId: string, userIds: string[]): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300));
  // In real app, this would send invitations
}

export async function getSpaceInviteCode(spaceId: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return `INVITE-${spaceId.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export async function joinSpaceByInviteCode(inviteCode: string): Promise<Space | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  // Extract space ID from invite code (simplified)
  const spaceId = inviteCode.split('-')[1]?.toLowerCase();
  if (spaceId) {
    return getSpaceById(spaceId);
  }
  return null;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'text' | 'voice' | 'announcement';
  order?: number;
}

export async function createChannel(spaceId: string, channel: Omit<Channel, 'id'>): Promise<Channel | null> {
  const space = await getSpaceById(spaceId);
  if (!space || space.ownerId !== getCurrentUserIdOrFallback()) return null;
  const newChannel: Channel = {
    id: `${spaceId}-${Date.now()}`,
    ...channel,
    order: space.channels.length,
  };
  const updated = await updateSpace(spaceId, { channels: [...space.channels, newChannel] } as any);
  return updated ? newChannel : null;
}

export async function updateChannel(spaceId: string, channelId: string, updates: Partial<Channel>): Promise<Channel | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const space = await getSpaceById(spaceId);
  if (!space) return null;
  
  const channel = space.channels.find(c => c.id === channelId);
  if (!channel) return null;
  
  return {
    ...channel,
    ...updates,
  } as Channel;
}

export async function deleteChannel(spaceId: string, channelId: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const space = await getSpaceById(spaceId);
  if (!space) return false;
  
  // In real app, this would remove the channel from the space
  return true;
}

export interface ModerationLog {
  id: string;
  type: 'message_deleted' | 'member_kicked' | 'member_banned' | 'member_promoted' | 'member_demoted' | 'channel_created' | 'channel_deleted';
  actionBy: string;
  targetUser?: string;
  targetMessage?: string;
  targetChannel?: string;
  reason?: string;
  timestamp: string;
}

export async function getModerationLogs(spaceId: string, limit: number = 50): Promise<ModerationLog[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock moderation logs
  return [
    {
      id: 'log-1',
      type: 'message_deleted',
      actionBy: '1',
      targetMessage: 'msg-123',
      reason: 'Spam',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'log-2',
      type: 'member_kicked',
      actionBy: '1',
      targetUser: 'user-2',
      reason: 'Violation of rules',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ];
}


