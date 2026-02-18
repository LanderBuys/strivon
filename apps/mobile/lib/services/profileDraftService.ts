import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProfileDraft {
  id: string;
  name: string;
  handle: string;
  bio: string;
  occupation: string;
  country: string;
  avatar: string | null;
  banner: string | null;
  contentWarning?: string | null;
  customCreatorLabel?: string;
  createdAt: string;
  updatedAt: string;
}

const PROFILE_DRAFT_KEY = '@strivon_profile_draft';

class ProfileDraftService {
  /**
   * Get the current profile draft
   */
  async getDraft(): Promise<ProfileDraft | null> {
    try {
      const stored = await AsyncStorage.getItem(PROFILE_DRAFT_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('Error loading profile draft:', error);
      return null;
    }
  }

  /**
   * Save a profile draft (only one draft at a time)
   */
  async saveDraft(draft: Omit<ProfileDraft, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProfileDraft> {
    try {
      const existingDraft = await this.getDraft();
      const newDraft: ProfileDraft = {
        ...draft,
        id: existingDraft?.id || `profile-draft-${Date.now()}`,
        createdAt: existingDraft?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(newDraft));
      return newDraft;
    } catch (error) {
      console.error('Error saving profile draft:', error);
      throw error;
    }
  }

  /**
   * Delete the profile draft
   */
  async deleteDraft(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PROFILE_DRAFT_KEY);
    } catch (error) {
      console.error('Error deleting profile draft:', error);
      throw error;
    }
  }

  /**
   * Check if there's an unsaved draft
   */
  async hasDraft(): Promise<boolean> {
    const draft = await this.getDraft();
    return draft !== null;
  }
}

export const profileDraftService = new ProfileDraftService();
