import { User } from '@/types/post';
import { mockUsers } from './users';

export interface Conversation {
  id: string;
  user: User;
  lastMessage: string;
  lastMessageTime: string; // ISO timestamp
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
  members?: User[];
  pinned: boolean;
  muted: boolean;
}

// Generate timestamps for variety
const now = new Date();
const minutesAgo = (mins: number) => new Date(now.getTime() - mins * 60 * 1000).toISOString();
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

const globalChatUser: User = {
  id: 'global-chat',
  name: 'Global Chat',
  handle: '@globalchat',
  avatar: null,
  label: 'Room',
};

export const mockConversations: Conversation[] = [
  {
    id: 'gc-global',
    user: globalChatUser,
    lastMessage: 'Welcome to Global Chat 👋',
    lastMessageTime: minutesAgo(1),
    unreadCount: 0,
    isGroup: true,
    groupName: 'Global Chat',
    members: mockUsers,
    pinned: false,
    muted: false,
  },
  {
    id: 'conv-1',
    user: mockUsers[1], // Sarah Johnson
    lastMessage: 'Hey! Are we still on for the meeting tomorrow?',
    lastMessageTime: minutesAgo(5),
    unreadCount: 2,
    isGroup: false,
    pinned: true,
    muted: false,
  },
  {
    id: 'conv-2',
    user: mockUsers[2], // Mike Rodriguez
    lastMessage: '📸 Photo',
    lastMessageTime: minutesAgo(15),
    unreadCount: 0,
    isGroup: false,
    pinned: false,
    muted: false,
  },
  {
    id: 'conv-3',
    user: mockUsers[3], // Emma Wilson
    lastMessage: 'Thanks for the help today! Really appreciate it 🙏',
    lastMessageTime: hoursAgo(2),
    unreadCount: 1,
    isGroup: false,
    pinned: false,
    muted: true,
  },
  {
    id: 'gc-1',
    user: mockUsers[4], // David Kim (primary for group)
    lastMessage: 'Lisa: The design looks great! Let\'s finalize it this week.',
    lastMessageTime: hoursAgo(3),
    unreadCount: 5,
    isGroup: true,
    groupName: 'Design Team',
    members: [mockUsers[4], mockUsers[5], mockUsers[1], mockUsers[0]], // David, Lisa, Sarah, Alex (current user)
    pinned: true,
    muted: false,
  },
  {
    id: 'conv-4',
    user: mockUsers[5], // Lisa Anderson
    lastMessage: 'Can you review the PR when you get a chance?',
    lastMessageTime: hoursAgo(5),
    unreadCount: 0,
    isGroup: false,
    pinned: false,
    muted: false,
  },
  {
    id: 'gc-2',
    user: mockUsers[2], // Mike (primary for group)
    lastMessage: 'Emma: Meeting moved to 3pm',
    lastMessageTime: hoursAgo(8),
    unreadCount: 12,
    isGroup: true,
    groupName: 'Project Alpha',
    members: [mockUsers[2], mockUsers[3], mockUsers[4], mockUsers[0]], // Mike, Emma, David, Alex
    pinned: false,
    muted: false,
  },
  {
    id: 'conv-5',
    user: mockUsers[1], // Sarah Johnson (different conversation)
    lastMessage: '🎉 Congrats on the launch!',
    lastMessageTime: daysAgo(1),
    unreadCount: 0,
    isGroup: false,
    pinned: false,
    muted: false,
  },
  {
    id: 'conv-6',
    user: mockUsers[3], // Emma Wilson (different conversation)
    lastMessage: 'Let me know if you need anything else',
    lastMessageTime: daysAgo(2),
    unreadCount: 0,
    isGroup: false,
    pinned: false,
    muted: false,
  },
  {
    id: 'conv-7',
    user: mockUsers[4], // David Kim
    lastMessage: '📹 Video',
    lastMessageTime: daysAgo(3),
    unreadCount: 0,
    isGroup: false,
    pinned: false,
    muted: false,
  },
  {
    id: 'gc-3',
    user: mockUsers[5], // Lisa (primary for group)
    lastMessage: 'Mike: Great work everyone! 🚀',
    lastMessageTime: daysAgo(4),
    unreadCount: 0,
    isGroup: true,
    groupName: 'Weekend Plans',
    members: [mockUsers[5], mockUsers[2], mockUsers[3], mockUsers[0]], // Lisa, Mike, Emma, Alex
    pinned: false,
    muted: true,
  },
];