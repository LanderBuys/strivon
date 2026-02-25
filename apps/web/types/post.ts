export interface User {
  id: string;
  name: string;
  handle: string;
  avatar?: string | null;
  label?: string;
  bio?: string;
  country?: string;
  banner?: string | null;
  occupation?: string;
  joinDate?: string;
  isVerified?: boolean;
  verifiedTier?: "pro" | "premium";
}

export interface PostMedia {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
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
  isLiked?: boolean;
  isSaved?: boolean;
  media?: PostMedia[];
  hashtags?: string[];
  status?: "draft" | "processing" | "published" | "rejected";
}

export interface Space {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  category?: string;
  memberCount: number;
  banner?: string;
  channels: Array<{ id: string; name: string }>;
  isJoined?: boolean;
  isTrending?: boolean;
  ownerId?: string;
}
