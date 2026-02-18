import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMaxDrafts } from './subscriptionService';

export interface Draft {
  id: string;
  title?: string;
  content: string;
  tags: string[];
  media: Array<{ uri: string; type?: string; duration?: number }>;
  postType: string;
  selectedSpaces: string[];
  contentWarning?: string | null;
  poll?: {
    question: string;
    options: string[];
  };
  createdAt: string;
  updatedAt: string;
}

const DRAFTS_KEY = '@strivon_drafts';

class DraftService {
  /**
   * Get all drafts
   */
  async getDrafts(): Promise<Draft[]> {
    try {
      const stored = await AsyncStorage.getItem(DRAFTS_KEY);
      if (stored) {
        const drafts = JSON.parse(stored);
        // Sort by updatedAt descending
        return drafts.sort((a: Draft, b: Draft) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
      return [];
    } catch (error) {
      console.error('Error loading drafts:', error);
      return [];
    }
  }

  /**
   * Save a draft
   */
  async saveDraft(draft: Omit<Draft, 'id' | 'createdAt' | 'updatedAt'>): Promise<Draft> {
    try {
      const maxDrafts = await getMaxDrafts();
      
      // Check draft limit for free users
      if (maxDrafts > 0) {
        const drafts = await this.getDrafts();
        if (drafts.length >= maxDrafts) {
          throw new Error(`DRAFT_LIMIT_REACHED:${maxDrafts}`);
        }
      }

      const drafts = await this.getDrafts();
      const newDraft: Draft = {
        ...draft,
        id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      drafts.unshift(newDraft);
      await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
      return newDraft;
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    }
  }

  /**
   * Update an existing draft
   */
  async updateDraft(draftId: string, updates: Partial<Omit<Draft, 'id' | 'createdAt'>>): Promise<Draft> {
    try {
      const drafts = await this.getDrafts();
      const index = drafts.findIndex(d => d.id === draftId);
      if (index === -1) {
        throw new Error('Draft not found');
      }
      drafts[index] = {
        ...drafts[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
      return drafts[index];
    } catch (error) {
      console.error('Error updating draft:', error);
      throw error;
    }
  }

  /**
   * Delete a draft
   */
  async deleteDraft(draftId: string): Promise<void> {
    try {
      const drafts = await this.getDrafts();
      const filtered = drafts.filter(d => d.id !== draftId);
      await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting draft:', error);
      throw error;
    }
  }

  /**
   * Get a single draft by ID
   */
  async getDraft(draftId: string): Promise<Draft | null> {
    try {
      const drafts = await this.getDrafts();
      return drafts.find(d => d.id === draftId) || null;
    } catch (error) {
      console.error('Error getting draft:', error);
      return null;
    }
  }

  /**
   * Clear all drafts
   */
  async clearAllDrafts(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DRAFTS_KEY);
    } catch (error) {
      console.error('Error clearing drafts:', error);
      throw error;
    }
  }
}

export const draftService = new DraftService();



