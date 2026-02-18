import { ThreadMessage, User } from '@/types/post';
import { mockUsers } from './users';
import { getCurrentUserIdOrFallback } from '@/lib/api/users';

const globalChatUser: User = {
  id: 'global-chat',
  name: 'Global Chat',
  handle: '@globalchat',
  avatar: null,
  label: 'Room',
};

// Helper to generate timestamps
const now = new Date();
const minutesAgo = (mins: number) => new Date(now.getTime() - mins * 60 * 1000).toISOString();
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

// Mock messages for each conversation
export const mockMessages: Record<string, ThreadMessage[]> = {
  'conv-1': [
    {
      id: 'msg-1-1',
      author: mockUsers[1], // Sarah
      content: 'Hey Alex! Are we still on for the meeting tomorrow?',
      createdAt: minutesAgo(5),
      reactions: [],
      status: 'read',
    },
    {
      id: 'msg-1-2',
      author: mockUsers[0], // Alex (current user)
      content: 'Yes, absolutely! Looking forward to it.',
      createdAt: minutesAgo(4),
      reactions: [],
      status: 'read',
    },
    {
      id: 'msg-1-3',
      author: mockUsers[1], // Sarah
      content: 'Perfect! I\'ll send you the agenda in a bit.',
      createdAt: minutesAgo(3),
      reactions: [],
      status: 'read',
    },
  ],

  'conv-2': [
    {
      id: 'msg-2-1',
      author: mockUsers[2], // Mike
      content: 'Check out this sunset!',
      createdAt: hoursAgo(2),
      reactions: [{ emoji: '❤️', count: 2, userReacted: true }],
      media: [{
        id: 'img-1',
        type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200',
        width: 800,
        height: 600,
      }],
      status: 'read',
    },
    {
      id: 'msg-2-2',
      author: mockUsers[0], // Alex
      content: 'Wow, that\'s beautiful! Where was this taken?',
      createdAt: hoursAgo(1),
      reactions: [],
      status: 'read',
    },
    {
      id: 'msg-2-3',
      author: mockUsers[2], // Mike
      content: 'At the beach near my place. You should come visit sometime!',
      createdAt: minutesAgo(15),
      reactions: [],
      status: 'read',
    },
  ],

  'conv-3': [
    {
      id: 'msg-3-1',
      author: mockUsers[3], // Emma
      content: 'Thanks for the help today! Really appreciate it 🙏',
      createdAt: hoursAgo(2),
      reactions: [],
      status: 'read',
    },
    {
      id: 'msg-3-2',
      author: mockUsers[0], // Alex
      content: 'No problem at all! Happy to help.',
      createdAt: hoursAgo(1),
      reactions: [],
      status: 'read',
    },
    {
      id: 'msg-3-3',
      author: mockUsers[3], // Emma
      content: 'Let me know if you need anything in return!',
      createdAt: hoursAgo(1),
      reactions: [],
      status: 'read',
    },
  ],

  'gc-1': [
    {
      id: 'msg-gc1-1',
      author: mockUsers[4], // David
      content: 'Hey team! Let\'s discuss the new design system.',
      createdAt: daysAgo(2),
      reactions: [],
      status: 'read',
    },
    {
      id: 'msg-gc1-2',
      author: mockUsers[5], // Lisa
      content: 'The design looks great! Let\'s finalize it this week.',
      createdAt: hoursAgo(3),
      reactions: [{ emoji: '👍', count: 3, userReacted: true }],
      status: 'read',
    },
    {
      id: 'msg-gc1-3',
      author: mockUsers[1], // Sarah
      content: 'I agree! Should we schedule a review meeting?',
      createdAt: hoursAgo(2),
      reactions: [],
      status: 'read',
    },
    {
      id: 'msg-gc1-4',
      author: mockUsers[0], // Alex
      content: 'Sounds good! How about Thursday afternoon?',
      createdAt: hoursAgo(1),
      reactions: [],
      status: 'read',
    },
    {
      id: 'msg-gc1-5',
      author: mockUsers[4], // David
      content: 'Perfect! I\'ll send out a calendar invite.',
      createdAt: minutesAgo(30),
      reactions: [],
      status: 'read',
    },
  ],

  'conv-4': [
    {
      id: 'msg-4-1',
      author: mockUsers[5], // Lisa
      content: 'Can you review the PR when you get a chance?',
      createdAt: hoursAgo(5),
      reactions: [],
      status: 'read',
    },
    {
      id: 'msg-4-2',
      author: mockUsers[0], // Alex
      content: 'Sure! I\'ll take a look this afternoon.',
      createdAt: hoursAgo(4),
      reactions: [],
      status: 'read',
    },
    {
      id: 'msg-4-3',
      author: mockUsers[5], // Lisa
      content: 'Thanks! Let me know if you have any feedback.',
      createdAt: hoursAgo(3),
      reactions: [],
      status: 'read',
    },
  ],

  'gc-2': [
    {
      id: 'msg-gc2-1',
      author: mockUsers[2], // Mike
      content: 'Team, we need to discuss the project timeline.',
      createdAt: daysAgo(1),
      reactions: [],
      status: 'read',
    },
    {
      id: 'msg-gc2-2',
      author: mockUsers[3], // Emma
      content: 'Meeting moved to 3pm',
      createdAt: hoursAgo(8),
      reactions: [],
      status: 'read',
    },
    {
      id: 'msg-gc2-3',
      author: mockUsers[4], // David
      content: 'Got it, thanks for the update!',
      createdAt: hoursAgo(7),
      reactions: [],
      status: 'read',
    },
    {
      id: 'msg-gc2-4',
      author: mockUsers[0], // Alex
      content: 'See you all at 3pm!',
      createdAt: hoursAgo(6),
      reactions: [],
      status: 'read',
    },
  ],

  'conv-5': [
    {
      id: 'msg-5-1',
      author: mockUsers[1], // Sarah
      content: '🎉 Congrats on the launch!',
      createdAt: daysAgo(1),
      reactions: [{ emoji: '🎉', count: 1, userReacted: false }],
      status: 'read',
    },
    {
      id: 'msg-5-2',
      author: mockUsers[0], // Alex
      content: 'Thank you so much! Couldn\'t have done it without the team.',
      createdAt: daysAgo(1),
      reactions: [],
      status: 'read',
    },
  ],

  'conv-6': [
    {
      id: 'msg-6-1',
      author: mockUsers[3], // Emma
      content: 'Let me know if you need anything else',
      createdAt: daysAgo(2),
      reactions: [],
      status: 'read',
    },
    {
      id: 'msg-6-2',
      author: mockUsers[0], // Alex
      content: 'Will do! Thanks again for everything.',
      createdAt: daysAgo(2),
      reactions: [],
      status: 'read',
    },
  ],

  'conv-7': [
    {
      id: 'msg-7-1',
      author: mockUsers[4], // David
      content: 'Check out this tutorial I made!',
      createdAt: daysAgo(3),
      reactions: [],
      media: [{
        id: 'vid-1',
        type: 'VIDEO',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
        width: 1280,
        height: 720,
      }],
      status: 'read',
    },
    {
      id: 'msg-7-2',
      author: mockUsers[0], // Alex
      content: 'This is amazing! Great work!',
      createdAt: daysAgo(2),
      reactions: [{ emoji: '🔥', count: 1, userReacted: true }],
      status: 'read',
    },
  ],

  'gc-3': [
    {
      id: 'msg-gc3-1',
      author: mockUsers[5], // Lisa
      content: 'Anyone up for hiking this weekend?',
      createdAt: daysAgo(5),
      reactions: [],
      status: 'read',
    },
    {
      id: 'msg-gc3-2',
      author: mockUsers[2], // Mike
      content: 'Great work everyone! 🚀',
      createdAt: daysAgo(4),
      reactions: [{ emoji: '🚀', count: 2, userReacted: false }],
      status: 'read',
    },
    {
      id: 'msg-gc3-3',
      author: mockUsers[3], // Emma
      content: 'I\'m in! What time should we meet?',
      createdAt: daysAgo(3),
      reactions: [],
      status: 'read',
    },
  ],

  'gc-global': [
    {
      id: 'msg-global-1',
      author: globalChatUser,
      content: 'Welcome to Global Chat 👋 Keep it respectful and helpful.',
      createdAt: minutesAgo(10),
      reactions: [],
      status: 'read',
    },
    {
      id: 'msg-global-2',
      author: mockUsers[2], // Mike
      content: 'Anyone building with Expo Router lately?',
      createdAt: minutesAgo(8),
      reactions: [{ emoji: '👀', count: 2, userReacted: false }],
      status: 'read',
    },
    {
      id: 'msg-global-3',
      author: mockUsers[0], // Alex (current user)
      content: 'Yep! It’s been pretty smooth. What are you working on?',
      createdAt: minutesAgo(6),
      reactions: [],
      status: 'read',
    },
    {
      id: 'msg-global-4',
      author: mockUsers[1], // Sarah
      content: 'Would love a “Today I shipped…” thread in here.',
      createdAt: minutesAgo(4),
      reactions: [{ emoji: '🔥', count: 1, userReacted: true }],
      status: 'read',
    },
  ],
};

// Get messages for a conversation ID
export function getMockMessages(conversationId: string): ThreadMessage[] {
  return mockMessages[conversationId] || [];
}



























