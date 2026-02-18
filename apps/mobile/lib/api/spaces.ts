import { Space, SpaceMember, SpaceEvent, Post, JoinRequest } from '@/types/post';
import { getFirestoreDb } from '@/lib/firebase';
import { getCurrentUserIdOrFallback } from './users';
import {
  getSpacesFirestore,
  getSpaceByIdFirestore,
  createSpaceFirestore,
  joinSpaceFirestore,
  leaveSpaceFirestore,
  getSpaceMembersFirestore,
} from '@/lib/firestore/spaces';

const MOCK_SPACE_ICON_VERSION = 'v3';

function hashSeed(value: string) {
  // Small deterministic hash (not crypto)
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getMockSpaceIconImage(space: Pick<Space, 'id' | 'name'>) {
  const avatarSeed = `${space.id || space.name || 'space'}-${MOCK_SPACE_ICON_VERSION}`;
  const seedHash = hashSeed(avatarSeed);
  const styles = ['identicon', 'shapes', 'rings'] as const; // abstract / no faces
  const style = styles[seedHash % styles.length];
  const bgPalette = ['f2f3f5', 'eef2ff', 'f0fdf4', 'fff7ed', 'fdf2f8'] as const;
  const backgroundColor = bgPalette[(seedHash >> 3) % bgPalette.length];
  return `https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(
    avatarSeed,
  )}&size=256&backgroundColor=${backgroundColor}`;
}

const mockSpaces: Space[] = [
  {
    id: '1',
    name: 'React Native',
    description: 'Discuss React Native development and share tips',
    memberCount: 1250,
    category: 'Development',
    color: '#61DAFB',
    icon: '⚛️',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(),
    ownerId: 'user-1',
    isVerified: true,
    isOfficial: true,
    tags: ['react-native', 'mobile', 'javascript', 'expo'],
    rules: [
      'Be respectful and kind to all members',
      'No spam or self-promotion without permission',
      'Search before asking questions',
      'Use appropriate channels for topics',
    ],
    guidelines: 'This is a community for React Native developers. Share your projects, ask questions, and help others learn.',
    pinnedResources: [
      {
        id: 'res-1',
        title: 'React Native Documentation',
        url: 'https://reactnative.dev',
        description: 'Official React Native documentation',
        type: 'link',
      },
      {
        id: 'res-2',
        title: 'Expo Documentation',
        url: 'https://docs.expo.dev',
        description: 'Complete Expo guide',
        type: 'link',
      },
    ],
    analytics: {
      postsCount: 3420,
      activeMembers: 890,
      growthRate: 12.5,
      engagementRate: 68.2,
    },
    channels: [
      { id: '1-1', name: 'general', description: 'General React Native discussions', type: 'text' },
      { id: '1-2', name: 'help', description: 'Get help with your React Native projects', type: 'text' },
      { id: '1-3', name: 'showcase', description: 'Show off your React Native apps', type: 'text' },
      { id: '1-4', name: 'expo', description: 'Expo-specific discussions', type: 'text' },
      { id: '1-5', name: 'performance', description: 'Performance optimization tips', type: 'text' },
      { id: '1-6', name: 'announcements', description: 'Important announcements', type: 'announcement' },
    ],
  },
  {
    id: '2',
    name: 'Startups',
    description: 'Startup discussions, fundraising, and entrepreneurship',
    memberCount: 890,
    category: 'Business',
    color: '#FF6B6B',
    icon: '🚀',
    channels: [
      { id: '2-1', name: 'general', description: 'General startup discussions' },
      { id: '2-2', name: 'fundraising', description: 'Fundraising and investment talks' },
      { id: '2-3', name: 'growth', description: 'Growth strategies and tactics' },
      { id: '2-4', name: 'pitch-deck', description: 'Share and review pitch decks' },
    ],
  },
  {
    id: '3',
    name: 'Design',
    description: 'Design inspiration, UI/UX tips, and creative discussions',
    memberCount: 2100,
    category: 'Creative',
    color: '#9B59B6',
    icon: '🎨',
    channels: [
      { id: '3-1', name: 'general', description: 'General design discussions' },
      { id: '3-2', name: 'ui-ux', description: 'UI/UX design best practices' },
      { id: '3-3', name: 'inspiration', description: 'Share design inspiration' },
      { id: '3-4', name: 'feedback', description: 'Get feedback on your designs' },
      { id: '3-5', name: 'tools', description: 'Design tools and resources' },
      { id: '3-6', name: 'figma', description: 'Figma tips and tricks' },
    ],
  },
  {
    id: '4',
    name: 'AI & ML',
    description: 'Artificial Intelligence and Machine Learning discussions',
    memberCount: 1500,
    category: 'Technology',
    color: '#3498DB',
    icon: '🤖',
    channels: [
      { id: '4-1', name: 'general', description: 'General AI/ML discussions' },
      { id: '4-2', name: 'research', description: 'Latest research papers and findings' },
      { id: '4-3', name: 'projects', description: 'Share your AI/ML projects' },
      { id: '4-4', name: 'tools', description: 'AI tools and frameworks' },
      { id: '4-5', name: 'chatgpt', description: 'ChatGPT and LLM discussions' },
    ],
  },
  {
    id: '5',
    name: 'Web Development',
    description: 'Web development community for developers',
    memberCount: 980,
    category: 'Development',
    color: '#E74C3C',
    icon: '🌐',
    channels: [
      { id: '5-1', name: 'general', description: 'General web dev discussions' },
      { id: '5-2', name: 'frontend', description: 'Frontend development talks' },
      { id: '5-3', name: 'backend', description: 'Backend development discussions' },
      { id: '5-4', name: 'react', description: 'React.js community' },
      { id: '5-5', name: 'nextjs', description: 'Next.js discussions' },
    ],
  },
  {
    id: '6',
    name: 'TypeScript',
    description: 'TypeScript programming language discussions',
    memberCount: 750,
    category: 'Development',
    color: '#3178C6',
    icon: '📘',
    channels: [
      { id: '6-1', name: 'general', description: 'General TypeScript discussions' },
      { id: '6-2', name: 'help', description: 'Get help with TypeScript' },
      { id: '6-3', name: 'advanced', description: 'Advanced TypeScript patterns' },
      { id: '6-4', name: 'types', description: 'Type system discussions' },
    ],
  },
  {
    id: '7',
    name: 'Product Management',
    description: 'Product management best practices and insights',
    memberCount: 1200,
    category: 'Business',
    color: '#F39C12',
    icon: '📊',
    channels: [
      { id: '7-1', name: 'general', description: 'General PM discussions' },
      { id: '7-2', name: 'strategy', description: 'Product strategy talks' },
      { id: '7-3', name: 'metrics', description: 'Product metrics and analytics' },
      { id: '7-4', name: 'roadmap', description: 'Roadmap planning discussions' },
    ],
  },
  {
    id: '8',
    name: 'Mobile Development',
    description: 'iOS and Android development community',
    memberCount: 1100,
    category: 'Development',
    color: '#27AE60',
    icon: '📱',
    channels: [
      { id: '8-1', name: 'general', description: 'General mobile dev discussions' },
      { id: '8-2', name: 'ios', description: 'iOS development (Swift, SwiftUI)' },
      { id: '8-3', name: 'android', description: 'Android development (Kotlin, Jetpack)' },
      { id: '8-4', name: 'react-native', description: 'React Native mobile apps' },
      { id: '8-5', name: 'flutter', description: 'Flutter development' },
    ],
  },
  {
    id: '9',
    name: 'Open Source',
    description: 'Open source projects and contributions',
    memberCount: 1800,
    category: 'Community',
    color: '#16A085',
    icon: '💚',
    channels: [
      { id: '9-1', name: 'general', description: 'General open source discussions' },
      { id: '9-2', name: 'projects', description: 'Share your open source projects' },
      { id: '9-3', name: 'contributing', description: 'Find projects to contribute to' },
      { id: '9-4', name: 'maintainers', description: 'For project maintainers' },
    ],
  },
  {
    id: '10',
    name: 'DevOps',
    description: 'DevOps, CI/CD, and infrastructure discussions',
    memberCount: 950,
    category: 'Technology',
    color: '#E67E22',
    icon: '⚙️',
    channels: [
      { id: '10-1', name: 'general', description: 'General DevOps discussions' },
      { id: '10-2', name: 'docker', description: 'Docker and containerization' },
      { id: '10-3', name: 'kubernetes', description: 'Kubernetes and orchestration' },
      { id: '10-4', name: 'cicd', description: 'CI/CD pipelines and automation' },
      { id: '10-5', name: 'cloud', description: 'Cloud infrastructure (AWS, GCP, Azure)' },
    ],
  },
  {
    id: 'my-space-1',
    name: 'My Trading Hub',
    description: 'A community for traders to share strategies, discuss markets, and help each other make money',
    memberCount: 1,
    category: 'Trading',
    color: '#1D9BF0',
    createdAt: new Date().toISOString(),
    ownerId: '1',
    isVerified: false,
    isOfficial: false,
    tags: ['trading', 'stocks', 'forex', 'money-making'],
    rules: [
      'Share real strategies and insights',
      'No spam or fake promises',
      'Be respectful to all members',
      'Help others learn and grow',
    ],
    guidelines: 'Welcome to My Trading Hub! This is your space to discuss trading strategies, share wins, learn from losses, and build wealth together. Let\'s make money!',
    pinnedResources: [
      {
        id: 'res-my-1',
        title: 'Trading Basics Guide',
        url: 'https://www.investopedia.com/trading',
        description: 'Learn the fundamentals of trading',
        type: 'link',
      },
    ],
    analytics: {
      postsCount: 0,
      activeMembers: 1,
      growthRate: 0,
      engagementRate: 0,
    },
    channels: [
      { id: 'my-1', name: 'general', description: 'General trading discussions', type: 'text' },
      { id: 'my-2', name: 'stock-market', description: 'Stock market analysis and picks', type: 'text' },
      { id: 'my-3', name: 'forex', description: 'Forex trading strategies', type: 'text' },
      { id: 'my-4', name: 'crypto', description: 'Cryptocurrency trading', type: 'text' },
      { id: 'my-5', name: 'wins', description: 'Share your trading wins', type: 'text' },
      { id: 'my-6', name: 'announcements', description: 'Important announcements', type: 'announcement' },
    ],
    isPrivate: false,
    requiresApproval: false,
    isJoined: true,
    memberRole: 'owner',
  },
];

// Ensure every mock space has a non-face icon image.
mockSpaces.forEach((s) => {
  s.iconImage = getMockSpaceIconImage(s);
  s.icon = undefined;
});

const SPACES_PAGE_SIZE = 20;

export async function getSpaces() {
  const db = getFirestoreDb();
  if (db) {
    const uid = getCurrentUserIdOrFallback();
    const firestoreSpaces = await getSpacesFirestore(uid);
    if (firestoreSpaces.length > 0) return firestoreSpaces;
  }
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockSpaces;
}

export interface GetSpacesPageResult {
  spaces: Space[];
  hasMore: boolean;
}

export async function getSpacesPaginated(offset: number, limit: number = SPACES_PAGE_SIZE): Promise<GetSpacesPageResult> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const end = offset + limit;
  const spaces = mockSpaces.slice(offset, end);
  return { spaces, hasMore: end < mockSpaces.length };
}

export async function getSpaceById(id: string) {
  const db = getFirestoreDb();
  if (db) {
    const uid = getCurrentUserIdOrFallback();
    const space = await getSpaceByIdFirestore(id, uid);
    if (space) return space;
  }
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockSpaces.find((s) => s.id === id) || null;
}

// Mock join requests storage
const mockJoinRequests: JoinRequest[] = [];

export async function joinSpace(id: string) {
  const db = getFirestoreDb();
  if (db) {
    await joinSpaceFirestore(id, getCurrentUserIdOrFallback());
    return {};
  }
  await new Promise(resolve => setTimeout(resolve, 300));
  return {};
}

export async function leaveSpace(id: string) {
  const db = getFirestoreDb();
  if (db) {
    await leaveSpaceFirestore(id, getCurrentUserIdOrFallback());
    return {};
  }
  await new Promise(resolve => setTimeout(resolve, 300));
  return {};
}

export async function requestToJoinSpace(spaceId: string, message?: string): Promise<JoinRequest> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const { mockUsers } = await import('@/lib/mocks/users');
  
  const newRequest: JoinRequest = {
    id: `request-${Date.now()}`,
    userId: mockUsers[0].id,
    user: mockUsers[0],
    spaceId,
    message: message?.trim(),
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };
  
  mockJoinRequests.push(newRequest);
  return newRequest;
}

export async function getJoinRequests(spaceId: string): Promise<JoinRequest[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockJoinRequests.filter(r => r.spaceId === spaceId && r.status === 'pending');
}

export async function approveJoinRequest(requestId: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const request = mockJoinRequests.find(r => r.id === requestId);
  if (request) {
    request.status = 'approved';
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = 'user-1'; // Mock owner ID
  }
}

export async function rejectJoinRequest(requestId: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const request = mockJoinRequests.find(r => r.id === requestId);
  if (request) {
    request.status = 'rejected';
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = 'user-1'; // Mock owner ID
  }
}

export async function getUserJoinRequest(spaceId: string, userId: string): Promise<JoinRequest | null> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockJoinRequests.find(r => r.spaceId === spaceId && r.userId === userId && r.status === 'pending') || null;
}

/** Returns space IDs for which the current user has a pending join request. Single call instead of N per-space. */
export async function getMyPendingJoinRequestIds(userId: string): Promise<string[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockJoinRequests
    .filter(r => r.userId === userId && r.status === 'pending')
    .map(r => r.spaceId);
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
}

export async function createSpace(data: CreateSpaceData): Promise<Space> {
  const db = getFirestoreDb();
  const ownerId = getCurrentUserIdOrFallback();
  if (db) {
    return createSpaceFirestore(ownerId, {
      name: data.name,
      description: data.description,
      category: data.category,
      color: data.color,
      channels: data.channels,
      isPrivate: data.isPrivate,
      requiresApproval: data.requiresApproval,
      rules: data.rules,
      guidelines: data.guidelines,
      tags: data.tags,
    });
  }
  await new Promise(resolve => setTimeout(resolve, 500));
  const newId = String(mockSpaces.length + 1);
  const channels = data.channels && data.channels.length > 0
    ? data.channels.map((ch, index) => ({
        id: `${newId}-${index + 1}`,
        name: ch.name,
        description: ch.description,
      }))
    : [{ id: `${newId}-1`, name: 'general', description: 'General discussions' }];
  const newSpace: Space = {
    id: newId,
    name: data.name.trim(),
    description: data.description?.trim() || '',
    category: data.category,
    icon: undefined,
    iconImage: data.iconImage || getMockSpaceIconImage({ id: newId, name: data.name.trim() }),
    color: data.color || '#1D9BF0',
    banner: data.banner,
    memberCount: 1,
    channels,
    isPrivate: data.isPrivate || false,
    requiresApproval: data.requiresApproval || false,
    rules: data.rules && data.rules.length > 0 ? data.rules : undefined,
    guidelines: data.guidelines?.trim() || undefined,
    tags: data.tags && data.tags.length > 0 ? data.tags : undefined,
    createdAt: new Date().toISOString(),
    ownerId: ownerId,
  };
  mockSpaces.push(newSpace);
  return newSpace;
}

export async function updateSpace(id: string, data: Partial<CreateSpaceData>): Promise<Space | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Find space in mock data
  const spaceIndex = mockSpaces.findIndex(s => s.id === id);
  if (spaceIndex === -1) {
    return null;
  }
  
  const existingSpace = mockSpaces[spaceIndex];
  
  // Update the space
  const updatedSpace: Space = {
    ...existingSpace,
    name: data.name?.trim() || existingSpace.name,
    description: data.description?.trim() !== undefined ? data.description.trim() : existingSpace.description,
    category: data.category !== undefined ? data.category : existingSpace.category,
    icon: data.icon !== undefined ? data.icon : existingSpace.icon,
    iconImage: data.iconImage !== undefined ? data.iconImage : existingSpace.iconImage,
    color: data.color || existingSpace.color,
    banner: data.banner !== undefined ? data.banner : existingSpace.banner,
    isPrivate: data.isPrivate !== undefined ? data.isPrivate : existingSpace.isPrivate,
    requiresApproval: data.requiresApproval !== undefined ? data.requiresApproval : existingSpace.requiresApproval,
    rules: data.rules !== undefined ? data.rules : existingSpace.rules,
    guidelines: data.guidelines !== undefined ? data.guidelines : existingSpace.guidelines,
    tags: data.tags !== undefined ? data.tags : existingSpace.tags,
  };
  
  // If iconImage is set, clear icon, and vice versa
  if (updatedSpace.iconImage) {
    updatedSpace.icon = undefined;
  } else if (updatedSpace.icon) {
    updatedSpace.iconImage = undefined;
  }
  
  // Replace in array
  mockSpaces[spaceIndex] = updatedSpace;
  
  return updatedSpace;
}

export type PinnedResource = NonNullable<Space['pinnedResources']>[number];

export async function addSpaceResource(
  spaceId: string,
  payload: { title: string; url: string; description?: string; type?: PinnedResource['type'] }
): Promise<Space | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const spaceIndex = mockSpaces.findIndex(s => s.id === spaceId);
  if (spaceIndex === -1) return null;
  const space = mockSpaces[spaceIndex];
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
  const updatedSpace: Space = { ...space, pinnedResources };
  mockSpaces[spaceIndex] = updatedSpace;
  return updatedSpace;
}

export async function removeSpaceResource(spaceId: string, resourceId: string): Promise<Space | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const spaceIndex = mockSpaces.findIndex(s => s.id === spaceId);
  if (spaceIndex === -1) return null;
  const space = mockSpaces[spaceIndex];
  const pinnedResources = (space.pinnedResources || []).filter(r => r.id !== resourceId);
  const updatedSpace: Space = { ...space, pinnedResources };
  mockSpaces[spaceIndex] = updatedSpace;
  return updatedSpace;
}

// New enhanced API functions

export async function getSpaceMembers(spaceId: string): Promise<SpaceMember[]> {
  const db = getFirestoreDb();
  if (db) return getSpaceMembersFirestore(spaceId);
  await new Promise(resolve => setTimeout(resolve, 300));
  const { mockUsers } = await import('@/lib/mocks/users');
  return mockUsers.slice(0, 20).map((user, index) => ({
    id: `member-${user.id}`,
    user,
    role: index === 0 ? 'owner' : index < 3 ? 'admin' : index < 6 ? 'moderator' : 'member',
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (30 - index)).toISOString(),
    isOnline: Math.random() > 0.6,
    lastSeen: new Date(Date.now() - 1000 * 60 * (Math.random() * 60)).toISOString(),
  }));
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
  await new Promise(resolve => setTimeout(resolve, 500));
  const { mockUsers } = await import('@/lib/mocks/users');
  
  return {
    id: `event-${Date.now()}`,
    ...event,
    createdBy: mockUsers[0].id,
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
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const spaceIndex = mockSpaces.findIndex(s => s.id === spaceId);
  if (spaceIndex === -1) return null;
  
  const space = mockSpaces[spaceIndex];
  const newChannel: Channel = {
    id: `${spaceId}-${Date.now()}`,
    ...channel,
    order: space.channels.length,
  };
  
  // Add channel to space
  mockSpaces[spaceIndex] = {
    ...space,
    channels: [...space.channels, newChannel],
  };
  
  return newChannel;
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


