import type { Space } from '@/types/post';

/** Mock spaces shown when Firestore is not configured (e.g. dev/demo). */
export const mockSpaces: Space[] = [
  { id: 'space-1', name: 'React Native', description: 'React Native development community. Share apps, tips, and libraries.', memberCount: 1250, channels: [{ id: 's1-1', name: 'general' }, { id: 's1-2', name: 'showcase' }, { id: 's1-3', name: 'help' }], isJoined: true, category: 'Development', ownerId: '1' },
  { id: 'space-2', name: 'Startups', description: 'Startup discussions, fundraising, and entrepreneurship.', memberCount: 890, channels: [{ id: 's2-1', name: 'general' }, { id: 's2-2', name: 'pitch-feedback' }], isJoined: true, category: 'Business', ownerId: '5' },
  { id: 'space-3', name: 'Design', description: 'Design inspiration, UI/UX tips, and design systems.', memberCount: 2100, channels: [{ id: 's3-1', name: 'general' }, { id: 's3-2', name: 'inspiration' }, { id: 's3-3', name: 'feedback' }], isJoined: false, category: 'Design', ownerId: '2' },
  { id: 'space-4', name: 'AI & ML', description: 'Artificial Intelligence and Machine Learning discussions.', memberCount: 1500, channels: [{ id: 's4-1', name: 'general' }, { id: 's4-2', name: 'papers' }], isJoined: true, category: 'Tech', ownerId: '4' },
  { id: 'space-5', name: 'Web Development', description: 'Web development: frontend, backend, and full-stack.', memberCount: 980, channels: [{ id: 's5-1', name: 'general' }], isJoined: false, category: 'Development', ownerId: '8' },
  { id: 'space-6', name: 'Mobile Development', description: 'iOS, Android, and cross-platform mobile app development.', memberCount: 1100, channels: [{ id: 's6-1', name: 'general' }, { id: 's6-2', name: 'ios' }, { id: 's6-3', name: 'android' }], isJoined: true, category: 'Development', ownerId: '6' },
  { id: 'space-7', name: 'Product Management', description: 'Product management best practices and frameworks.', memberCount: 1200, channels: [{ id: 's7-1', name: 'general' }], isJoined: false, category: 'Business', ownerId: '3' },
  { id: 'space-8', name: 'Marketing', description: 'Marketing strategies, growth, and content.', memberCount: 850, channels: [{ id: 's8-1', name: 'general' }], isJoined: false, category: 'Marketing', ownerId: '9' },
  { id: 'space-9', name: 'Build in Public', description: 'Share your journey building products in public.', memberCount: 2400, channels: [{ id: 's9-1', name: 'general' }, { id: 's9-2', name: 'wins' }, { id: 's9-3', name: 'updates' }], isJoined: true, category: 'Community', ownerId: '11' },
  { id: 'space-10', name: 'Open Source', description: 'Open source projects, contributions, and maintainers.', memberCount: 1650, channels: [{ id: 's10-1', name: 'general' }, { id: 's10-2', name: 'showcase' }], isJoined: false, category: 'Development', ownerId: '13' },
];
