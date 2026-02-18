import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  postIds: string[];
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  coverImage?: string;
}

const COLLECTIONS_KEY = '@strivon_collections';

class CollectionService {
  /**
   * Get all collections
   */
  async getCollections(): Promise<Collection[]> {
    try {
      const stored = await AsyncStorage.getItem(COLLECTIONS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      console.error('Error loading collections:', error);
      return [];
    }
  }

  /**
   * Create a new collection
   */
  async createCollection(name: string, description?: string, isPrivate: boolean = false): Promise<Collection> {
    try {
      const collections = await this.getCollections();
      const newCollection: Collection = {
        id: `collection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        postIds: [],
        isPrivate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      collections.push(newCollection);
      await AsyncStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
      return newCollection;
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  /**
   * Update a collection
   */
  async updateCollection(collectionId: string, updates: Partial<Omit<Collection, 'id' | 'createdAt'>>): Promise<Collection> {
    try {
      const collections = await this.getCollections();
      const index = collections.findIndex(c => c.id === collectionId);
      if (index === -1) {
        throw new Error('Collection not found');
      }
      collections[index] = {
        ...collections[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
      return collections[index];
    } catch (error) {
      console.error('Error updating collection:', error);
      throw error;
    }
  }

  /**
   * Delete a collection
   */
  async deleteCollection(collectionId: string): Promise<void> {
    try {
      const collections = await this.getCollections();
      const filtered = collections.filter(c => c.id !== collectionId);
      await AsyncStorage.setItem(COLLECTIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
  }

  /**
   * Add post to collection
   */
  async addPostToCollection(collectionId: string, postId: string): Promise<void> {
    try {
      const collections = await this.getCollections();
      const collection = collections.find(c => c.id === collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }
      if (!collection.postIds.includes(postId)) {
        collection.postIds.push(postId);
        collection.updatedAt = new Date().toISOString();
        await AsyncStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
      }
    } catch (error) {
      console.error('Error adding post to collection:', error);
      throw error;
    }
  }

  /**
   * Remove post from collection
   */
  async removePostFromCollection(collectionId: string, postId: string): Promise<void> {
    try {
      const collections = await this.getCollections();
      const collection = collections.find(c => c.id === collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }
      collection.postIds = collection.postIds.filter(id => id !== postId);
      collection.updatedAt = new Date().toISOString();
      await AsyncStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
    } catch (error) {
      console.error('Error removing post from collection:', error);
      throw error;
    }
  }

  /**
   * Get collections containing a post
   */
  async getCollectionsForPost(postId: string): Promise<Collection[]> {
    try {
      const collections = await this.getCollections();
      return collections.filter(c => c.postIds.includes(postId));
    } catch (error) {
      console.error('Error getting collections for post:', error);
      return [];
    }
  }
}

export const collectionService = new CollectionService();



