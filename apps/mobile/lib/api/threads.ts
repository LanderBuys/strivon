import { ThreadMessage } from '@/types/post';
import { mockUsers } from '@/lib/mocks/users';

// Helper to generate timestamps
const now = new Date();
const minutesAgo = (mins: number) => new Date(now.getTime() - mins * 60 * 1000).toISOString();
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

// Mock thread messages for each post
const mockThreadMessages: Record<string, ThreadMessage[]> = {
  '1': [
    {
      id: 'thread-1-1',
      author: mockUsers[1], // Sarah
      content: 'This looks amazing! Can\'t wait to try it out. 🎉',
      createdAt: minutesAgo(25),
      reactions: [{ emoji: '❤️', count: 3, userReacted: false }, { emoji: '🔥', count: 2, userReacted: true }],
    },
    {
      id: 'thread-1-2',
      author: mockUsers[2], // Mike
      content: 'Great work! What tech stack did you use?',
      createdAt: minutesAgo(20),
      reactions: [],
    },
    {
      id: 'thread-1-3',
      author: mockUsers[0], // Alex (post author)
      content: 'Thanks! Built with React Native and TypeScript. The performance improvements are significant!',
      createdAt: minutesAgo(15),
      reactions: [{ emoji: '👍', count: 5, userReacted: true }],
    },
    {
      id: 'thread-1-4',
      author: mockUsers[3], // Emma
      content: 'Would love to see a tutorial on this! Any plans?',
      createdAt: minutesAgo(10),
      reactions: [],
    },
    {
      id: 'thread-1-5',
      author: mockUsers[4], // David
      content: 'This is exactly what I needed for my project. Thanks for sharing!',
      createdAt: minutesAgo(5),
      reactions: [{ emoji: '🙏', count: 1, userReacted: false }],
    },
  ],
  '2': [
    {
      id: 'thread-2-1',
      author: mockUsers[0], // Alex
      content: 'The color palette is really well thought out. What was your inspiration?',
      createdAt: hoursAgo(1),
      reactions: [{ emoji: '❤️', count: 2, userReacted: true }],
    },
    {
      id: 'thread-2-2',
      author: mockUsers[2], // Sarah (post author)
      content: 'Thanks! I drew inspiration from nature and modern minimalism. The goal was to create something timeless.',
      createdAt: minutesAgo(50),
      reactions: [{ emoji: '✨', count: 4, userReacted: false }],
    },
    {
      id: 'thread-2-3',
      author: mockUsers[5], // Lisa
      content: 'Love the typography choices! Very clean and readable.',
      createdAt: minutesAgo(40),
      reactions: [],
    },
  ],
  '3': [
    {
      id: 'thread-3-1',
      author: mockUsers[1], // Sarah
      content: 'For me, it\'s balancing user needs with technical constraints. Always a challenge!',
      createdAt: hoursAgo(4),
      reactions: [{ emoji: '👍', count: 8, userReacted: true }],
    },
    {
      id: 'thread-3-2',
      author: mockUsers[3], // Emma
      content: 'Communication with stakeholders is my biggest challenge. Getting everyone aligned is tough.',
      createdAt: hoursAgo(3),
      reactions: [{ emoji: '💯', count: 5, userReacted: false }],
    },
    {
      id: 'thread-3-3',
      author: mockUsers[4], // David
      content: 'Time management and prioritization. There\'s always more to build than time allows.',
      createdAt: hoursAgo(2),
      reactions: [{ emoji: '😅', count: 3, userReacted: true }],
    },
    {
      id: 'thread-3-4',
      author: mockUsers[5], // Lisa
      content: 'For me it\'s staying updated with all the new tools and frameworks. The ecosystem moves so fast!',
      createdAt: hoursAgo(1),
      reactions: [{ emoji: '🚀', count: 6, userReacted: false }],
    },
  ],
};

// Generate default messages for posts without specific mock data
function generateDefaultMessages(postId: string): ThreadMessage[] {
  const messageCount = Math.floor(Math.random() * 5) + 2; // 2-6 messages
  const messages: ThreadMessage[] = [];
  
  for (let i = 0; i < messageCount; i++) {
    const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
    const timeAgo = Math.floor(Math.random() * 24) + 1; // 1-24 hours ago
    
    messages.push({
      id: `thread-${postId}-${i + 1}`,
      author: randomUser,
      content: [
        'Great post! Really insightful.',
        'Thanks for sharing this!',
        'This is exactly what I was looking for.',
        'Love the approach you took here.',
        'Can you elaborate on this point?',
        'This helped me a lot, thank you!',
        'Interesting perspective!',
        'Looking forward to more content like this.',
      ][Math.floor(Math.random() * 8)],
      createdAt: hoursAgo(timeAgo),
      reactions: Math.random() > 0.5 ? [{ emoji: '❤️', count: Math.floor(Math.random() * 5) + 1, userReacted: Math.random() > 0.7 }] : [],
    });
  }
  
  return messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function getThreadMessages(postId: string): Promise<ThreadMessage[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return mockThreadMessages[postId] || generateDefaultMessages(postId);
}

export async function sendThreadMessage(postId: string, content: string, media?: any[], replyTo?: string) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return { 
    id: `thread-${postId}-${Date.now()}`, 
    content, 
    createdAt: new Date().toISOString(), 
    author: { id: 'current-user', name: 'You', handle: '@you' }, 
    reactions: [],
    media: media,
    replyTo: replyTo,
  };
}

export async function reactToMessage(messageId: string, emoji: string) {
  return {};
}


