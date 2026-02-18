import { User } from './post';

export type NewsCategory = 'all' | 'investing' | 'trading' | 'startups' | 'tech' | 'finance' | 'markets';

export type StockVote = 'long' | 'short' | null;

import { Poll } from './post';

export interface NewsComment {
  id: string;
  author: User;
  content: string;
  createdAt: string;
  editedAt?: string;
  likes: number;
  isLiked?: boolean;
  replyTo?: string; // Comment ID this is replying to
  replies?: NewsComment[];
  reactions?: Array<{ emoji: string; count: number; userReacted?: boolean }>;
  media?: Array<{
    id: string;
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
    thumbnail?: string;
    width?: number;
    height?: number;
    duration?: number;
    name?: string;
    mimeType?: string;
    size?: number;
  }>;
  poll?: Poll;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  source: string;
  sourceUrl?: string;
  author?: string;
  imageUrl?: string;
  category: NewsCategory;
  publishedAt: string;
  tags?: string[];
  views: number;
  shares: number;
  comments?: number;
  isSaved?: boolean;
  isShared?: boolean;
  // Stock voting
  longVotes?: number;
  shortVotes?: number;
  userVote?: StockVote;
  isStockRelated?: boolean; // Auto-detected based on content
}
