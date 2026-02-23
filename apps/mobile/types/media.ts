/**
 * Firestore media document and moderation pipeline types.
 * Media is uploaded to quarantine → AI scans → approved (move to public) | needs_review | rejected.
 */

import type { Timestamp } from 'firebase/firestore';

export type MediaType = 'image' | 'video';

export type MediaStatus = 'processing' | 'approved' | 'needs_review' | 'rejected';

export interface MediaStoragePaths {
  /** e.g. "quarantine/{uid}/{mediaId}/original.mp4" */
  originalPath: string;
  /** e.g. "public/{uid}/{mediaId}.mp4" (only when approved) */
  publicPath?: string;
  thumbsPath?: string;
}

export interface MediaModeration {
  csamHashMatch?: boolean;
  goreScore?: number;
  sexualScore?: number;
  flags?: string[];
  provider?: string;
  reviewedBy?: string;
  reviewedAt?: Timestamp | string;
}

export interface MediaDocument {
  ownerUid: string;
  type: MediaType;
  status: MediaStatus;
  createdAt: Timestamp | string;
  storage: MediaStoragePaths;
  moderation?: MediaModeration;
}

/** Post document fields for moderation pipeline (ownerUid, mediaId, visibility, status). */
export type PostVisibility = 'public' | 'private';

export type PostStatus = 'draft' | 'processing' | 'published' | 'rejected';

/** Optional queue collection: mediaId as doc id, reference to media. */
export interface ModerationQueueDocument {
  mediaId: string;
  createdAt: Timestamp | string;
  priority: number;
}
