import { mockPosts } from '@/lib/mocks/posts';
import { getBadgePerks, applyVisibilityBoost } from '@/lib/services/badgePerksService';
import { getUserBadges } from '@/lib/services/badgeService';
import { Post, PostMedia, SharedPostPayload } from '@/types/post';
import { getUserById, getFollowing, getCurrentUserIdOrFallback } from './users';
import { getUserMetrics } from '@/lib/services/userMetricsService';
import { getSubscriptionTier } from '@/lib/services/subscriptionService';
import { isPostBoosted } from '@/lib/services/boostService';
import { isPostPremiumBoosted } from '@/lib/services/premiumBoostService';
import { getFirestoreDb } from '@/lib/firebase';
import { getFeedPostsFirestore, getPostByIdFirestore, createPostFirestore, likePostFirestore, savePostFirestore } from '@/lib/firestore/posts';
import { uploadMediaToQuarantine } from '@/lib/services/mediaUploadService';

export async function getFeedPosts(
  tab: string, 
  page: number, 
  limit: number,
  sort?: 'newest' | 'popular' | 'trending',
  filter?: 'all' | 'media' | 'text' | 'links'
) {
  const db = getFirestoreDb();
  if (!db) return { data: [], hasMore: false };
  const uid = getCurrentUserIdOrFallback();
  const result = await getFeedPostsFirestore(tab, page, limit, uid);
  if (filter && filter !== 'all') {
    result.data = result.data.filter(post => {
      if (filter === 'media' && post.media && post.media.length > 0) return true;
      if (filter === 'text' && (!post.media || post.media.length === 0)) return true;
      if (filter === 'links' && post.content && post.content.includes('http')) return true;
      return false;
    });
  }
  return result;
}

export async function getPostById(id: string) {
  const db = getFirestoreDb();
  if (!db) return null;
  return getPostByIdFirestore(id);
}

export async function createPost(data: any, onMediaProgress?: (progress: number) => void): Promise<Post> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured. Sign in and try again.');
  const currentUser = await getUserById(getCurrentUserIdOrFallback());
  if (!currentUser) throw new Error('User not found');

  const rawMedia = data.media || [];
  let mediaId: string | undefined;
  let mediaForPost: PostMedia[] | undefined;

  if (rawMedia.length > 0) {
    // Moderation pipeline: upload first item to quarantine, create media doc, post as processing until approved
    const first = rawMedia[0];
    const mediaType = (first.type === 'video' ? 'video' : 'image') as 'image' | 'video';
    const { mediaId: mid } = await uploadMediaToQuarantine(first.uri, mediaType, onMediaProgress);
    mediaId = mid;
    // Post gets no public media URLs yet; backend will set post.media when approved
    mediaForPost = [];
  } else {
    mediaForPost = undefined;
  }

  const author = {
    id: currentUser.id,
    name: currentUser.name,
    handle: currentUser.handle,
    avatar: currentUser.avatar ?? null,
    label: currentUser.label,
    country: currentUser.country,
  };
  return createPostFirestore(author, {
    content: data.content || '',
    title: data.title,
    media: mediaForPost,
    mediaId,
    poll: data.poll,
    contentWarning: data.contentWarning || null,
    hashtags: Array.isArray(data.tags) ? data.tags : undefined,
  });
}

// Track voting in progress to prevent race conditions
const votingInProgress = new Map<string, boolean>();

export async function votePoll(postId: string, optionId: string) {
  // Check if a vote is already in progress for this post
  if (votingInProgress.get(postId)) {
    // Wait a bit and check the current state
    await new Promise(resolve => setTimeout(resolve, 100));
    const post = mockPosts.find(p => p.id === postId);
    if (post && post.poll) {
      return {
        ...post.poll,
        options: post.poll.options.map((opt: any) => ({ ...opt })),
      };
    }
  }
  
  // Mark voting as in progress
  votingInProgress.set(postId, true);
  
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Find the post in mockPosts
    const post = mockPosts.find(p => p.id === postId);
    if (!post || !post.poll) {
      throw new Error('Post or poll not found');
    }
    
    // Store the current user vote BEFORE any processing (atomic check)
    const currentUserVote = post.poll.userVote;
    
    // If optionId is empty, remove the vote
    if (!optionId) {
      if (currentUserVote) {
        const previousOption = post.poll.options.find((opt: any) => opt.id === currentUserVote);
        if (previousOption) {
          previousOption.votes = Math.max(0, (previousOption.votes || 0) - 1);
        }
        post.poll.userVote = undefined;
        // Recalculate totalVotes from options to ensure accuracy
        post.poll.totalVotes = post.poll.options.reduce((sum: number, opt: any) => sum + (opt.votes || 0), 0);
      }
      // Return a deep copy
      return {
        ...post.poll,
        options: post.poll.options.map((opt: any) => ({ ...opt })),
      };
    }
    
    // If user is trying to vote on the same option they already voted on, do nothing
    if (currentUserVote === optionId) {
      // Return a deep copy of current state
      return {
        ...post.poll,
        options: post.poll.options.map((opt: any) => ({ ...opt })),
      };
    }
    
    // Check if user already voted on a different option
    if (currentUserVote) {
      // Remove previous vote
      const previousOption = post.poll.options.find((opt: any) => opt.id === currentUserVote);
      if (previousOption) {
        previousOption.votes = Math.max(0, (previousOption.votes || 0) - 1);
      }
    }
    
    // Add new vote
    const selectedOption = post.poll.options.find((opt: any) => opt.id === optionId);
    if (selectedOption) {
      selectedOption.votes = (selectedOption.votes || 0) + 1;
      post.poll.userVote = optionId;
    }
    
    // Recalculate totalVotes from options to ensure accuracy (one user = one vote)
    post.poll.totalVotes = post.poll.options.reduce((sum: number, opt: any) => sum + (opt.votes || 0), 0);
    
    // Return a deep copy to avoid mutations
    return {
      ...post.poll,
      options: post.poll.options.map((opt: any) => ({ ...opt })),
    };
  } finally {
    // Always clear the voting in progress flag
    votingInProgress.delete(postId);
  }
}

/** Persist like toggle so it survives refresh and is consistent across app. */
export async function likePost(postId: string): Promise<{ isLiked: boolean; likes: number }> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured');
  const uid = getCurrentUserIdOrFallback();
  const post = await getPostById(postId);
  if (!post) throw new Error('Post not found');
  const newLikes = await likePostFirestore(postId, uid);
  return { isLiked: !post.isLiked, likes: newLikes };
}

/** Persist save toggle so it survives refresh. */
export async function savePost(postId: string): Promise<{ isSaved: boolean; saves: number }> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured');
  const uid = getCurrentUserIdOrFallback();
  const post = await getPostById(postId);
  if (!post) throw new Error('Post not found');
  const newSaves = await savePostFirestore(postId, uid);
  return { isSaved: !post.isSaved, saves: newSaves };
}

/** Return current comment count (increment is done in Firestore when sending a thread message). */
export async function incrementPostCommentCount(postId: string): Promise<number> {
  const post = await getPostById(postId);
  return post ? (post.comments ?? 0) : 0;
}

// In-app sharing functions
export interface ShareTarget {
  id: string;
  name: string;
  type: 'user' | 'space';
  avatar?: string;
  /** True when this user is in the current user's following list */
  isFollowing?: boolean;
}

export async function getShareTargets(): Promise<ShareTarget[]> {
  const followingUsers = await getFollowing(getCurrentUserIdOrFallback());
  return followingUsers
    .filter((user) => user && user.id && user.name)
    .map((user) => ({
      id: user.id,
      name: user.name,
      type: 'user' as const,
      avatar: user.avatar || undefined,
      isFollowing: true,
    }));
}

export async function sharePost(postId: string, targetIds: string[]): Promise<void> {
  const post = await getPostById(postId);
  if (!post) throw new Error('Post not found');
  
  // Import chat API to send messages
  const { sendChatMessage } = await import('./chat');

  const sharedPostPayload: SharedPostPayload = {
    postId: post.id,
    author: post.author,
    title: post.title,
    content: post.content,
    media: post.media,
  };

  const { getConversationIdForUser } = await import('./chat');

  for (const targetId of targetIds) {
    try {
      const conversationId = await getConversationIdForUser(targetId);
      if (!conversationId) {
        console.warn(`No conversation found for user ${targetId}, skipping`);
        continue;
      }
      await sendChatMessage(
        conversationId,
        '📎 Shared a post',
        undefined, // no raw media; card uses sharedPost.media
        undefined, // replyToId
        undefined, // poll
        sharedPostPayload
      );
    } catch (error) {
      console.error(`Error sharing post to ${targetId}:`, error);
      throw error; // Surface so UI can show failure
    }
  }
  
  // Update share count (if we track it)
  // In a real app, you'd update this on the backend
  console.log(`Shared post ${postId} to ${targetIds.length} recipient(s)`);
}


