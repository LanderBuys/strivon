import { getCurrentUserId } from '@/lib/firebase';
import type { User } from '@/types/post';

/** Mock user list used by notifications, conversations, mentions, search, and profile suggestions. */
export const mockUsers: User[] = [
  { id: '1', name: 'Alex Chen', handle: '@alex', avatar: 'https://i.pravatar.cc/150?img=12', label: 'Developer', bio: 'Full-stack developer passionate about React Native' },
  { id: '2', name: 'Sarah Johnson', handle: '@sarah', avatar: 'https://i.pravatar.cc/150?img=47', label: 'Designer', bio: 'UI/UX Designer creating beautiful experiences' },
  { id: '3', name: 'Mike Rodriguez', handle: '@mike', avatar: 'https://i.pravatar.cc/150?img=33', label: 'Product Manager', bio: 'Product Manager at tech startup' },
  { id: '4', name: 'Emma Wilson', handle: '@emma', avatar: 'https://i.pravatar.cc/150?img=45', label: 'Engineer', bio: 'Software engineer building scalable systems' },
  {
    id: '5',
    name: 'David Kim',
    handle: '@davidkim',
    avatar: 'https://i.pravatar.cc/150?img=13',
    label: 'Founder & CEO',
    bio: 'Founder & CEO at Strivon. Building the future of social and creator tools. Previously led product at two YC companies. Love hiking, specialty coffee, and late-night coding.',
    country: 'United States',
    banner: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800',
    occupation: 'Founder & CEO at Strivon',
    joinDate: '2021-06-12',
    contentWarning: null,
    isVerified: true,
    verifiedTier: 'premium',
  },
  { id: '6', name: 'Lisa Park', handle: '@lisa', avatar: 'https://i.pravatar.cc/150?img=32', label: 'Developer', bio: 'Mobile developer specializing in iOS and Android' },
  { id: '7', name: 'James Taylor', handle: '@james', avatar: 'https://i.pravatar.cc/150?img=15', label: 'Designer', bio: 'Creative designer and illustrator' },
  { id: '8', name: 'Maria Garcia', handle: '@maria', avatar: 'https://i.pravatar.cc/150?img=20', label: 'Engineer', bio: 'Backend engineer working on distributed systems' },
  { id: '9', name: 'Chris Anderson', handle: '@chris', avatar: 'https://i.pravatar.cc/150?img=25', label: 'Product Manager', bio: 'Product strategist and growth hacker' },
  { id: '10', name: 'Sophie Brown', handle: '@sophie', avatar: 'https://i.pravatar.cc/150?img=30', label: 'Developer', bio: 'Frontend developer and React enthusiast' },
  { id: '11', name: 'Ryan Lee', handle: '@ryan', avatar: 'https://i.pravatar.cc/150?img=35', label: 'Founder', bio: 'Building in public' },
  { id: '12', name: 'Olivia Martinez', handle: '@olivia', avatar: 'https://i.pravatar.cc/150?img=40', label: 'Designer', bio: 'Mobile & product design' },
  { id: '13', name: 'Noah Thompson', handle: '@noah', avatar: 'https://i.pravatar.cc/150?img=50', label: 'Developer', bio: 'Open source & dev tools' },
  { id: '14', name: 'Ava White', handle: '@ava', avatar: 'https://i.pravatar.cc/150?img=55', label: 'Designer', bio: 'Color theory & UI' },
  { id: '15', name: 'Jordan Blake', handle: '@jordan', avatar: 'https://i.pravatar.cc/150?img=68', label: 'Creator', bio: 'Content creator' },
  { id: '16', name: 'Sam Rivera', handle: '@sam', avatar: 'https://i.pravatar.cc/150?img=22', label: 'Photographer', bio: 'City & landscape photography' },
  { id: '17', name: 'Casey Morgan', handle: '@casey', avatar: 'https://i.pravatar.cc/150?img=48', label: 'Travel', bio: 'Travel & lifestyle' },
  { id: '18', name: 'Riley Quinn', handle: '@riley', avatar: 'https://i.pravatar.cc/150?img=44', label: 'Artist', bio: 'Digital artist' },
];

/** Get mock user by id (for posts, stories, etc.). Returns undefined if not found. */
export function getMockUserById(id: string): User | undefined {
  return mockUsers.find((u) => u.id === id);
}

/** Current signed-in user id, or '1' when not signed in. Use this instead of a constant. */
export function getCurrentUserIdOrFallback(): string {
  return getCurrentUserId() ?? '1';
}

/** @deprecated Use getCurrentUserIdOrFallback() so the real signed-in user is used. */
export const CURRENT_USER_ID = '1';

export const mockUserSpaces: string[] = [];
