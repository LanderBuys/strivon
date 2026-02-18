import { User } from './post';

export type NotificationType = 
  | 'like' 
  | 'comment' 
  | 'reply' 
  | 'follow' 
  | 'mention' 
  | 'reaction'
  | 'post' 
  | 'space_invite'
  | 'space_mention'
  | 'achievement'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  user?: User;
  title: string;
  body: string;
  timestamp: string; // ISO timestamp
  read: boolean;
  link?: string; // Deep link to related content
  image?: string;
  metadata?: {
    postId?: string;
    commentId?: string;
    spaceId?: string;
    conversationId?: string;
    messageId?: string;
    achievementId?: string;
  };
}

export interface NotificationSettings {
  pushEnabled: boolean;
  likes: boolean;
  comments: boolean;
  replies: boolean;
  follows: boolean;
  mentions: boolean;
  posts: boolean;
  spaceInvites: boolean;
  spaceMentions: boolean;
  achievements: boolean;
  system: boolean;
}

