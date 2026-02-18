import { ThreadMessage } from '@/types/post';
import { mockUsers } from '@/lib/mocks/users';

// In-memory store so reactions persist across reloads in the mock app.
const channelMessagesStore: Record<string, ThreadMessage[]> = {};
const channelKey = (spaceId: string, channelId: string) => `${spaceId}:${channelId}`;

// Generate mock messages for channels
const generateMockMessages = (channelId: string): ThreadMessage[] => {
  const messages: ThreadMessage[] = [];
  const now = Date.now();
  
  // Different message sets for different channels
  const messageTemplates: Record<string, string[]> = {
    'general': [
      'Hey everyone! Welcome to the space 🎉',
      'This is a great community!',
      'Anyone working on something cool?',
      'Just joined, excited to be here!',
      'What are you all building?',
      'Love the energy in this space!',
    ],
    'announcements': [
      'New feature update coming next week!',
      'We hit 10k members! 🎊',
      'Community guidelines have been updated',
      'Thanks for all the feedback!',
    ],
    'random': [
      'Anyone else watching that new show?',
      'Coffee break time ☕',
      'What\'s everyone up to this weekend?',
      'Just discovered this cool tool!',
      'Weekend vibes 🌟',
    ],
    'help': [
      'How do I create a new space?',
      'Can someone help with the API?',
      'Is there a way to customize notifications?',
      'Thanks for the help!',
    ],
    'showcase': [
      'Just launched my new app! Check it out 🚀',
      'Here\'s a project I\'ve been working on',
      'Would love feedback on this design',
      'Sharing my latest creation!',
    ],
    'expo': [
      'Expo SDK 50 is amazing!',
      'Anyone using Expo Router?',
      'EAS Build is so convenient',
      'Love the new Expo features',
    ],
    'performance': [
      'Optimized my app and got 60fps!',
      'Performance tips anyone?',
      'Memory leaks are the worst',
      'Just improved my render times',
    ],
    'ui-ux': [
      'This design system is beautiful',
      'Anyone have UX best practices?',
      'Love this color palette',
      'Accessibility is so important',
    ],
    'inspiration': [
      'Check out this amazing design!',
      'So much inspiration here',
      'This UI is incredible',
      'Love seeing everyone\'s work',
    ],
    'feedback': [
      'Could I get some feedback?',
      'What do you think of this?',
      'Any suggestions?',
      'Thanks for the feedback!',
    ],
    'tools': [
      'Just discovered this amazing tool',
      'What tools are you using?',
      'This plugin is a game changer',
      'Tool recommendations?',
    ],
  };

  const templates = messageTemplates[channelId] || messageTemplates['general'];
  const users = mockUsers;
  
  // Generate 8-15 messages per channel
  const messageCount = 8 + Math.floor(Math.random() * 8);
  
  for (let i = 0; i < messageCount; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const templateIndex = i % templates.length;
    const content = templates[templateIndex];
    
    // Messages get older as we go back
    const minutesAgo = (messageCount - i) * (5 + Math.floor(Math.random() * 15));
    const createdAt = new Date(now - minutesAgo * 60 * 1000).toISOString();
    
    // Some messages have reactions
    const reactions = Math.random() > 0.7 ? [
      { emoji: '👍', count: Math.floor(Math.random() * 5) + 1, userReacted: Math.random() > 0.5 },
      ...(Math.random() > 0.8 ? [{ emoji: '❤️', count: Math.floor(Math.random() * 3) + 1, userReacted: false }] : []),
    ] : [];
    
    messages.push({
      id: `msg-${channelId}-${i}`,
      author: user,
      content,
      createdAt,
      reactions,
      status: 'read' as const,
    });
  }
  
  return messages.sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};

export async function getChannelMessages(spaceId: string, channelId: string): Promise<ThreadMessage[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const key = channelKey(spaceId, channelId);
  if (channelMessagesStore[key]) {
    return channelMessagesStore[key]!;
  }
  
  // Get channel name from space
  const { getSpaceById } = await import('./spaces');
  const space = await getSpaceById(spaceId);
  const channel = space?.channels.find(c => c.id === channelId);
  const channelName = channel?.name || 'general';
  
  const generated = generateMockMessages(channelName);
  channelMessagesStore[key] = generated;
  return generated;
}

export async function sendChannelMessage(spaceId: string, channelId: string, content: string, userId: string): Promise<ThreadMessage> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  const user = mockUsers.find(u => u.id === userId) || mockUsers[0];
  const msg: ThreadMessage = { 
    id: `msg-${Date.now()}`, 
    content, 
    createdAt: new Date().toISOString(), 
    author: user, 
    reactions: [],
    status: 'sent',
  };

  const key = channelKey(spaceId, channelId);
  if (!channelMessagesStore[key]) {
    channelMessagesStore[key] = [];
  }
  channelMessagesStore[key]!.push(msg);

  return msg;
}

export async function reactToChannelMessage(spaceId: string, channelId: string, messageId: string, emoji: string) {
  const key = channelKey(spaceId, channelId);
  const list = channelMessagesStore[key];
  if (!list) return {};

  const message = list.find(m => m.id === messageId);
  if (!message) return {};

  if (!message.reactions) message.reactions = [];
  const existing = message.reactions.find(r => r.emoji === emoji);
  if (existing) {
    // Toggle behavior:
    // - If current user already reacted with this emoji: remove their reaction (decrement).
    // - Otherwise: add their reaction (increment).
    if (existing.userReacted) {
      existing.count = Math.max(0, (existing.count || 0) - 1);
      existing.userReacted = false;
      if (existing.count <= 0) {
        message.reactions = message.reactions.filter(r => r.emoji !== emoji);
      }
    } else {
      existing.count = (existing.count || 0) + 1;
      existing.userReacted = true;
    }
  } else {
    message.reactions.push({ emoji, count: 1, userReacted: true });
  }
  return {};
}

export async function deleteChannelMessage(spaceId: string, channelId: string, messageId: string, userId?: string) {
  await new Promise(resolve => setTimeout(resolve, 300));
  // In real app, this would check permissions and delete the message
  console.log(`Deleted message ${messageId} from channel ${channelId} in space ${spaceId}`);
  return {};
}

export async function editChannelMessage(spaceId: string, channelId: string, messageId: string, newContent: string): Promise<ThreadMessage | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  // In real app, this would update the message content
  const user = mockUsers[0];
  return {
    id: messageId,
    content: newContent,
    createdAt: new Date().toISOString(),
    editedAt: new Date().toISOString(),
    author: user,
    reactions: [],
    status: 'read',
  };
}


