export interface User {
  id: string;
  name: string;
  handle: string;
  avatar?: string | null;
  label?: string;
  bio?: string;
  country?: string;
}

export interface PostMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number; // For videos
}

export interface Post {
  id: string;
  author: User;
  content?: string;
  title?: string;
  createdAt: string;
  likes: number;
  saves: number;
  comments?: number;
  views?: number;
  reposts?: number;
  isReposted?: boolean;
  hashtags?: string[];
  isLiked?: boolean;
  isSaved?: boolean;
  poll?: any;
  media?: PostMedia[];
  contentWarning?: string | null; // Content warning text
  // Boost-related fields
  isBoosted?: boolean;
  boostType?: 'rewarded' | 'pro' | 'pro-plus';
  reachImprovement?: number; // Percentage improvement (e.g., 18 for 18%)
  baseReach?: number; // Base reach before boost
}

export interface Space {
  id: string;
  name: string;
  description: string;
  icon?: string;
  iconImage?: string;
  color?: string;
  category?: string;
  memberCount: number;
  banner?: string;
  channels: Array<{ id: string; name: string; description?: string; unreadCount?: number; type?: 'text' | 'voice' | 'announcement' }>;
  isJoined?: boolean;
  isTrending?: boolean;
  isFeatured?: boolean;
  unreadCount?: number;
  lastActivityAt?: string;
  onlineMembers?: number;
  isMuted?: boolean;
  isVerified?: boolean; // Professional/verified space badge
  isOfficial?: boolean; // Official/company space
  // Enhanced features
  rules?: string[];
  guidelines?: string;
  tags?: string[];
  createdAt?: string;
  ownerId?: string;
  memberRole?: 'owner' | 'admin' | 'moderator' | 'member';
  permissions?: {
    canPost?: boolean;
    canCreateChannels?: boolean;
    canInvite?: boolean;
    canModerate?: boolean;
  };
  pinnedPosts?: string[]; // Post IDs
  pinnedResources?: Array<{
    id: string;
    title: string;
    url?: string;
    description?: string;
    type: 'link' | 'document' | 'video' | 'other';
  }>;
  upcomingEvents?: SpaceEvent[];
  analytics?: {
    postsCount?: number;
    activeMembers?: number;
    growthRate?: number;
    engagementRate?: number;
  };
  inviteCode?: string;
  isPrivate?: boolean;
  requiresApproval?: boolean;
  pendingRequestsCount?: number;
  hasPendingRequest?: boolean; // User has a pending request
}

export interface SpaceEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  isOnline?: boolean;
  meetingUrl?: string;
  attendees?: string[]; // User IDs
  maxAttendees?: number;
  createdBy: string; // User ID
  createdAt: string;
}

export interface SpaceMember {
  id: string;
  user: User;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface JoinRequest {
  id: string;
  userId: string;
  user: User;
  spaceId: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters?: string[]; // User IDs who voted for this option
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  expiresAt?: string; // Optional expiration date
  allowMultiple?: boolean; // Allow users to vote for multiple options
  userVotes?: string[]; // Options the current user has voted for
}

/** Minimal post payload when a post is shared into a chat */
export interface SharedPostPayload {
  postId: string;
  author: User;
  title?: string;
  content?: string;
  media?: PostMedia[];
}

/** Minimal article payload when a news article is shared into a chat */
export interface SharedArticlePayload {
  articleId: string;
  title: string;
  description?: string;
  source: string;
  sourceUrl?: string;
  imageUrl?: string;
}

export interface ThreadMessage {
  id: string;
  author: User;
  content: string;
  createdAt: string;
  editedAt?: string;
  reactions?: Array<{ emoji: string; count: number; userReacted?: boolean }>;
  replyTo?: string;
  media?: any[];
  poll?: Poll;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  pinned?: boolean;
  mentions?: string[]; // User IDs mentioned in the message
  /** When set, this message is a shared post; render as post card */
  sharedPost?: SharedPostPayload;
  /** When set, this message is a shared article; render as article card */
  sharedArticle?: SharedArticlePayload;
}

export enum PostType {
  CONTENT = 'CONTENT',
  QUESTION = 'QUESTION',
  BUILD_LOG = 'BUILD_LOG',
  COLLAB = 'COLLAB',
  WIN_LOSS = 'WIN_LOSS',
  // Aliases used by some UI components
  WIN = 'WIN',
  LOSS = 'LOSS',
  COLLABORATION = 'COLLABORATION',
}

/** Text overlay on a story (position as percentage 0–100 for scaling) */
export interface StoryTextOverlay {
  id: string;
  type: 'text';
  text: string;
  position: { xPercent: number; yPercent: number };
  fontSize: number;
  color: string;
  fontWeight?: 'normal' | 'bold';
}

/** Sticker/emoji overlay on a story */
export interface StoryStickerOverlay {
  id: string;
  type: 'sticker';
  emoji: string;
  position: { xPercent: number; yPercent: number };
  fontSize: number; // scale (e.g. 32)
}

export type StoryOverlay = StoryTextOverlay | StoryStickerOverlay;

export interface StoryMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
}

/** Minimal viewer info for "who viewed" list */
export interface StoryViewer {
  id: string;
  name: string;
  handle?: string;
  avatar?: string | null;
  viewedAt?: string; // ISO date for "Viewed 5m ago"
}

export interface Story {
  id: string;
  author: User;
  /** @deprecated use media.url */
  mediaUrl?: string;
  /** @deprecated use media.type */
  mediaType?: 'image' | 'video';
  media?: StoryMedia;
  overlays?: StoryOverlay[];
  createdAt: string;
  expiresAt: string;
  isViewed?: boolean;
  isOwn?: boolean;
  views?: number;
  /** Who viewed this story (for own stories) */
  viewers?: StoryViewer[];
}


