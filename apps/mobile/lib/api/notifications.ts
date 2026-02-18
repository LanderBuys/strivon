import { Notification, NotificationSettings } from '@/types/notification';
import { notificationService } from '@/lib/services/notificationService';

/**
 * Get all notifications
 */
export async function getNotifications(): Promise<Notification[]> {
  return await notificationService.getNotifications();
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<number> {
  return await notificationService.getUnreadCount();
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  return await notificationService.markAsRead(notificationId);
}

/**
 * Mark notification as unread
 */
export async function markNotificationAsUnread(notificationId: string): Promise<void> {
  return await notificationService.markAsUnread(notificationId);
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  return await notificationService.markAllAsRead();
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  return await notificationService.deleteNotification(notificationId);
}

/**
 * Get notification settings
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  return await notificationService.getSettings();
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>
): Promise<void> {
  return await notificationService.updateSettings(settings);
}

