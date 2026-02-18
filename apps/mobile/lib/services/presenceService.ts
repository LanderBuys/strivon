import AsyncStorage from '@react-native-async-storage/async-storage';
import { realtimeService } from './realtimeService';

const PRESENCE_KEY = '@strivon_user_presence';
const PRESENCE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen: string;
}

class PresenceService {
  private presenceCache: Map<string, UserPresence> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize presence service
   */
  async initialize(): Promise<void> {
    // Update own presence
    await this.updateOwnPresence(true);
    
    // Set up periodic presence updates
    this.updateInterval = setInterval(() => {
      this.updateOwnPresence(true);
    }, 30000); // Update every 30 seconds

    // Listen to app state changes
    // In a real app, you'd use AppState from react-native
  }

  /**
   * Update own presence status
   */
  async updateOwnPresence(isOnline: boolean): Promise<void> {
    try {
      const presence: UserPresence = {
        userId: '1', // Current user ID - in real app, get from auth
        isOnline,
        lastSeen: new Date().toISOString(),
      };

      await AsyncStorage.setItem(PRESENCE_KEY, JSON.stringify(presence));
      realtimeService.updatePresence(isOnline);
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }

  /**
   * Get user presence
   */
  async getUserPresence(userId: string): Promise<UserPresence | null> {
    // Check cache first
    if (this.presenceCache.has(userId)) {
      return this.presenceCache.get(userId) || null;
    }

    // In real app, fetch from API
    // For now, return mock data
    return {
      userId,
      isOnline: Math.random() > 0.5,
      lastSeen: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    };
  }

  /**
   * Subscribe to presence updates for a user
   */
  subscribeToPresence(userId: string, callback: (presence: UserPresence) => void): () => void {
    return realtimeService.subscribeToPresence(userId, (data) => {
      const presence: UserPresence = {
        userId,
        isOnline: data.isOnline,
        lastSeen: data.lastSeen || new Date().toISOString(),
      };
      this.presenceCache.set(userId, presence);
      callback(presence);
    });
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export const presenceService = new PresenceService();



