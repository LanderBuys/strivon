import AsyncStorage from '@react-native-async-storage/async-storage';
import { Post } from '@/types/post';
import { createPost } from '@/lib/api/posts';
import { getSubscriptionTier } from './subscriptionService';

const SCHEDULED_POSTS_KEY = '@strivon_scheduled_posts';

export interface ScheduledPost {
  id: string;
  postData: any;
  scheduledFor: string; // ISO date string
  createdAt: string;
  status: 'pending' | 'published' | 'failed';
}

export interface ScheduledPostsList {
  posts: ScheduledPost[];
}

/**
 * Save a scheduled post
 */
export async function saveScheduledPost(postData: any, scheduledFor: Date): Promise<ScheduledPost> {
  const scheduledPost: ScheduledPost = {
    id: `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    postData,
    scheduledFor: scheduledFor.toISOString(),
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  try {
    const stored = await AsyncStorage.getItem(SCHEDULED_POSTS_KEY);
    const list: ScheduledPostsList = stored ? JSON.parse(stored) : { posts: [] };
    list.posts.push(scheduledPost);
    // Sort by scheduled time
    list.posts.sort((a, b) => 
      new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    );
    await AsyncStorage.setItem(SCHEDULED_POSTS_KEY, JSON.stringify(list));
    return scheduledPost;
  } catch (error) {
    console.error('Error saving scheduled post:', error);
    throw error;
  }
}

/**
 * Get all scheduled posts
 */
export async function getScheduledPosts(): Promise<ScheduledPost[]> {
  try {
    const stored = await AsyncStorage.getItem(SCHEDULED_POSTS_KEY);
    if (!stored) return [];
    const list: ScheduledPostsList = JSON.parse(stored);
    return list.posts.filter(p => p.status === 'pending');
  } catch (error) {
    console.error('Error loading scheduled posts:', error);
    return [];
  }
}

/**
 * Check and publish scheduled posts that are due
 */
export async function checkAndPublishScheduledPosts(): Promise<void> {
  try {
    const scheduled = await getScheduledPosts();
    const now = new Date();
    
    for (const scheduledPost of scheduled) {
      const scheduledTime = new Date(scheduledPost.scheduledFor);
      if (scheduledTime <= now && scheduledPost.status === 'pending') {
        try {
          await createPost(scheduledPost.postData);
          await updateScheduledPostStatus(scheduledPost.id, 'published');
        } catch (error) {
          console.error('Error publishing scheduled post:', error);
          await updateScheduledPostStatus(scheduledPost.id, 'failed');
        }
      }
    }
  } catch (error) {
    console.error('Error checking scheduled posts:', error);
  }
}

/**
 * Update scheduled post status
 */
async function updateScheduledPostStatus(id: string, status: ScheduledPost['status']): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(SCHEDULED_POSTS_KEY);
    if (!stored) return;
    const list: ScheduledPostsList = JSON.parse(stored);
    const post = list.posts.find(p => p.id === id);
    if (post) {
      post.status = status;
      await AsyncStorage.setItem(SCHEDULED_POSTS_KEY, JSON.stringify(list));
    }
  } catch (error) {
    console.error('Error updating scheduled post status:', error);
  }
}

/**
 * Delete a scheduled post
 */
export async function deleteScheduledPost(id: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(SCHEDULED_POSTS_KEY);
    if (!stored) return;
    const list: ScheduledPostsList = JSON.parse(stored);
    list.posts = list.posts.filter(p => p.id !== id);
    await AsyncStorage.setItem(SCHEDULED_POSTS_KEY, JSON.stringify(list));
  } catch (error) {
    console.error('Error deleting scheduled post:', error);
    throw error;
  }
}

/**
 * Check if user can use advanced scheduling (queue for Pro+)
 */
export async function canUseAdvancedScheduling(): Promise<boolean> {
  const tier = await getSubscriptionTier();
  return tier === 'premium';
}
