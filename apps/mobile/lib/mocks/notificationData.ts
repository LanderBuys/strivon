import { Notification } from '@/types/notification';
import { mockUsers } from './users';

// Generate timestamps for variety
const now = new Date();
const minutesAgo = (mins: number) => new Date(now.getTime() - mins * 60 * 1000).toISOString();
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

export const mockNotifications: Notification[] = [
  // Test: chat mention – tap opens DM
  {
    id: 'test-notif-chat-mention-1',
    type: 'mention',
    user: mockUsers[1],
    title: 'Sarah Johnson mentioned you',
    body: 'mentioned you in a chat',
    timestamp: minutesAgo(1),
    read: false,
    link: '/chat/conv-1',
    metadata: { conversationId: 'conv-1' },
  },
  // Test: reaction – tap opens DM
  {
    id: 'test-notif-reaction-1',
    type: 'reaction',
    user: mockUsers[2],
    title: 'Mike Rodriguez',
    body: 'reacted to your message',
    timestamp: minutesAgo(3),
    read: false,
    link: '/chat/conv-2',
    metadata: { conversationId: 'conv-2', messageId: 'msg-conv-2-1' },
  },
  // Test: chat mention (read) – tap opens another chat
  {
    id: 'test-notif-chat-mention-2',
    type: 'mention',
    user: mockUsers[3],
    title: 'Emma Wilson mentioned you',
    body: 'mentioned you in a chat',
    timestamp: minutesAgo(10),
    read: true,
    link: '/chat/conv-3',
    metadata: { conversationId: 'conv-3' },
  },
  // Test: reaction (read)
  {
    id: 'test-notif-reaction-2',
    type: 'reaction',
    user: mockUsers[4],
    title: 'David Kim',
    body: 'reacted to your message',
    timestamp: minutesAgo(20),
    read: true,
    link: '/chat/conv-4',
    metadata: { conversationId: 'conv-4', messageId: 'msg-conv-4-1' },
  },
  {
    id: 'notif-1',
    type: 'like',
    user: mockUsers[1], // Sarah Johnson
    title: 'Sarah Johnson liked your post',
    body: 'Your post "Building a new feature" received a like',
    timestamp: minutesAgo(2),
    read: false,
    link: '/thread/post-1',
    metadata: { postId: 'post-1' },
  },
  {
    id: 'notif-2',
    type: 'comment',
    user: mockUsers[2], // Mike Rodriguez
    title: 'Mike Rodriguez commented on your post',
    body: 'Great work! This looks amazing.',
    timestamp: minutesAgo(15),
    read: false,
    link: '/thread/post-2',
    metadata: { postId: 'post-2', commentId: 'comment-1' },
  },
  {
    id: 'notif-3',
    type: 'follow',
    user: mockUsers[3], // Emma Wilson
    title: 'Emma Wilson started following you',
    body: 'Emma Wilson is now following your journey',
    timestamp: hoursAgo(1),
    read: false,
    link: '/profile/3',
  },
  {
    id: 'notif-4',
    type: 'reply',
    user: mockUsers[4], // David Kim
    title: 'David Kim replied to your comment',
    body: 'Thanks for the feedback! I\'ll look into that.',
    timestamp: hoursAgo(2),
    read: true,
    link: '/thread/post-3',
    metadata: { postId: 'post-3', commentId: 'comment-2' },
  },
  {
    id: 'notif-5',
    type: 'mention',
    user: mockUsers[5], // Lisa Anderson
    title: 'Lisa Anderson mentioned you',
    body: 'Lisa mentioned you in a post: "Working with @alex on this project"',
    timestamp: hoursAgo(3),
    read: false,
    link: '/thread/post-4',
    metadata: { postId: 'post-4' },
  },
  {
    id: 'notif-6',
    type: 'space_invite',
    user: mockUsers[1], // Sarah Johnson
    title: 'Invitation to join "Design Team"',
    body: 'Sarah Johnson invited you to join the Design Team space',
    timestamp: hoursAgo(4),
    read: false,
    link: '/space/space-1',
    metadata: { spaceId: 'space-1' },
  },
  {
    id: 'notif-7',
    type: 'achievement',
    user: undefined,
    title: 'Achievement Unlocked! 🎉',
    body: 'You\'ve reached 100 followers! Keep building!',
    timestamp: hoursAgo(5),
    read: true,
    link: '/achievements',
    metadata: { achievementId: 'ach-1' },
  },
  {
    id: 'notif-8',
    type: 'post',
    user: mockUsers[2], // Mike Rodriguez
    title: 'Mike Rodriguez shared a new post',
    body: 'Check out my latest build log',
    timestamp: hoursAgo(6),
    read: true,
    link: '/thread/post-5',
    metadata: { postId: 'post-5' },
  },
  {
    id: 'notif-9',
    type: 'like',
    user: mockUsers[3], // Emma Wilson
    title: 'Emma Wilson and 5 others liked your post',
    body: 'Your post "Weekly update" received 6 likes',
    timestamp: hoursAgo(8),
    read: true,
    link: '/thread/post-6',
    metadata: { postId: 'post-6' },
  },
  {
    id: 'notif-10',
    type: 'space_mention',
    user: mockUsers[4], // David Kim
    title: 'You were mentioned in Design Team',
    body: 'David mentioned you in the Design Team space',
    timestamp: daysAgo(1),
    read: true,
    link: '/space/space-1/channel/channel-1',
    metadata: { spaceId: 'space-1' },
  },
  {
    id: 'notif-11',
    type: 'comment',
    user: mockUsers[5], // Lisa Anderson
    title: 'Lisa Anderson commented on your post',
    body: 'This is exactly what I needed!',
    timestamp: daysAgo(1),
    read: true,
    link: '/thread/post-7',
    metadata: { postId: 'post-7', commentId: 'comment-3' },
  },
  {
    id: 'notif-12',
    type: 'follow',
    user: mockUsers[1], // Sarah Johnson
    title: 'Sarah Johnson and 3 others started following you',
    body: 'You gained 4 new followers',
    timestamp: daysAgo(2),
    read: true,
    link: '/(tabs)/profile',
  },
];

