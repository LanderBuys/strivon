import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';

/** Custom notification sound (base filename; file is registered in app.config.js expo-notifications sounds). */
const NOTIFICATION_SOUND = 'notification.wav';
import { Notification, NotificationSettings } from '@/types/notification';
import { mockNotifications } from '@/lib/mocks/notificationData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockUsers } from '@/lib/mocks/users';

// When app is in foreground: suppress system notification (we show in-app banner instead).
// When app is in background: show normal system notification.
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const isForeground = AppState.currentState === 'active';
    if (isForeground) {
      return {
        shouldShowAlert: false,
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: true,
      };
    }
    return {
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

const NOTIFICATION_SETTINGS_KEY = '@strivon_notification_settings';
const EXPO_PUSH_TOKEN_KEY = '@strivon_expo_push_token';

export type InAppNotificationPayload = { id: string; title: string; body: string; link?: string };

class NotificationService {
  private pushToken: string | null = null;
  private inAppCallback: ((payload: InAppNotificationPayload) => void) | null = null;
  private settings: NotificationSettings = {
    pushEnabled: true,
    likes: true,
    comments: true,
    replies: true,
    follows: true,
    mentions: true,
    posts: true,
    spaceInvites: true,
    spaceMentions: true,
    achievements: true,
    system: true,
  };

  /**
   * Request notification permissions and register for push notifications
   */
  async initialize(): Promise<void> {
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return;
      }

      // Get push token
      const token = await this.getPushToken();
      if (token) {
        // In a real app, send this token to your backend
        console.log('Push token:', token);
      }

      // Load saved settings
      await this.loadSettings();

      // Android: create default channel with custom sound so notifications use it
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          sound: NOTIFICATION_SOUND,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      // Set up notification listeners
      this.setupListeners();
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  /**
   * Get or create Expo push token
   */
  async getPushToken(): Promise<string | null> {
    try {
      // Check if we have a cached token
      const cachedToken = await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
      if (cachedToken) {
        this.pushToken = cachedToken;
        return cachedToken;
      }

      // Get device push token
      // Note: For Expo Go, projectId is optional. For standalone builds, use Constants.expoConfig?.extra?.eas?.projectId
      // Try to get token without projectId first (works in Expo Go)
      let tokenData;
      try {
        tokenData = await Notifications.getExpoPushTokenAsync();
      } catch (error: any) {
        // If it fails, try with projectId from app.json slug
        if (error.message?.includes('projectId')) {
          console.log('Push notifications require projectId for standalone builds. Skipping token generation.');
          return null;
        }
        throw error;
      }

      this.pushToken = tokenData.data;
      
      // Cache the token
      await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, tokenData.data);
      
      return tokenData.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Set up notification listeners
   */
  private setupListeners(): void {
    // Handle notifications received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      // You can update UI here, show in-app notification, etc.
    });

    // Handle notification taps
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      const data = response.notification.request.content.data;
      
      // Handle deep linking based on notification data
      if (data?.link) {
        // Navigate to the link
        // This would typically use your navigation system
        console.log('Navigate to:', data.link);
      }
    });
  }

  /**
   * Register callback to show in-app banner when a notification is created (e.g. when app is in foreground).
   */
  setInAppNotificationCallback(callback: ((payload: InAppNotificationPayload) => void) | null): void {
    this.inAppCallback = callback;
  }

  private notifyInApp(notification: Notification): void {
    if (this.inAppCallback) {
      this.inAppCallback({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        link: notification.link,
      });
    }
  }

  /**
   * Create a new notification (in-app list + optional push). Use for mentions, reactions, etc.
   */
  createNotification(payload: Omit<Notification, 'id' | 'timestamp'>): Notification {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const notification: Notification = {
      ...payload,
      id,
      timestamp: new Date().toISOString(),
    };
    mockNotifications.unshift(notification);
    this.notifyInApp(notification);
    const link = payload.link;
    const isForeground = AppState.currentState === 'active';
    if (this.settings.pushEnabled && link && !isForeground) {
      this.sendLocalNotification(payload.title, payload.body, { link, type: payload.type }).catch(() => {});
    }
    return notification;
  }

  /**
   * Add a notification from an incoming push (so it appears in the list)
   */
  addIncomingNotification(payload: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): void {
    const link = typeof payload.data?.link === 'string' ? payload.data.link : undefined;
    const type = (payload.data?.type as Notification['type']) || 'post';
    const id = `notif-incoming-${Date.now()}`;
    const notif: Notification = {
      id,
      type,
      user: mockUsers[0],
      title: payload.title,
      body: payload.body,
      timestamp: new Date().toISOString(),
      read: false,
      link,
      metadata: payload.data as Notification['metadata'],
    };
    mockNotifications.unshift(notif);
    this.notifyInApp(notif);
  }

  /**
   * Get all notifications (mock implementation)
   */
  async getNotifications(): Promise<Notification[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...mockNotifications].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const notifications = await this.getNotifications();
    return notifications.filter(n => !n.read).length;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notification = mockNotifications.find(n => n.id === notificationId);
    if (notification) notification.read = true;
  }

  /**
   * Mark notification as unread
   */
  async markAsUnread(notificationId: string): Promise<void> {
    const notification = mockNotifications.find(n => n.id === notificationId);
    if (notification) notification.read = false;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    // In a real app, this would call your API
    mockNotifications.forEach(n => n.read = true);
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    // In a real app, this would call your API
    const index = mockNotifications.findIndex(n => n.id === notificationId);
    if (index > -1) {
      mockNotifications.splice(index, 1);
    }
  }

  /**
   * Send local notification (for testing or local triggers)
   */
  async sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    if (!this.settings.pushEnabled) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: NOTIFICATION_SOUND,
      },
      trigger: null, // Show immediately
      ...(Platform.OS === 'android' && { channelId: 'default' }),
    });
  }

  /**
   * Schedule a notification
   */
  async scheduleNotification(
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput,
    data?: Record<string, any>
  ): Promise<string> {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: NOTIFICATION_SOUND,
      },
      trigger,
      ...(Platform.OS === 'android' && { channelId: 'default' }),
    });

    return identifier;
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get notification settings
   */
  async getSettings(): Promise<NotificationSettings> {
    return { ...this.settings };
  }

  /**
   * Update notification settings
   */
  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted' && this.settings.pushEnabled;
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge count
   */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

