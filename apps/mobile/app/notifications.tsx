import { useState, useCallback, useMemo, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  StyleSheet,
  FlatList,
  View,
  RefreshControl,
  TouchableOpacity,
  Text,
  Pressable,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Notification } from '@/types/notification';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import {
  getNotifications,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/lib/api/notifications';
import { formatRelativeTime } from '@/lib/utils/time';
import { EmptyState } from '@/components/EmptyState';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/** Resolve the route to open when tapping a notification (link or from metadata). */
function getNotificationDestination(notification: Notification): string | null {
  if (notification.link) {
    return notification.link;
  }
  const meta = notification.metadata;
  if (meta?.conversationId) {
    return `/chat/${meta.conversationId}`;
  }
  if (meta?.postId) {
    return `/thread/${meta.postId}`;
  }
  if (meta?.spaceId) {
    return `/space/${meta.spaceId}`;
  }
  if (notification.user?.id) {
    return `/profile/${notification.user.id}`;
  }
  return null;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'like':
      return 'heart';
    case 'comment':
      return 'chatbubble-outline';
    case 'reply':
      return 'return-down-back-outline';
    case 'follow':
      return 'person-add-outline';
    case 'mention':
      return 'at-outline';
    case 'reaction':
      return 'heart-outline';
    case 'post':
      return 'document-text-outline';
    case 'space_invite':
    case 'space_mention':
      return 'people-outline';
    case 'achievement':
      return 'trophy-outline';
    default:
      return 'notifications-outline';
  }
};

const getNotificationColor = (_type: Notification['type'], colors: typeof Colors.light) => {
  return colors.primary;
};

type FilterTab = 'all' | 'unread';

interface NotificationItemProps {
  notification: Notification;
  colors: typeof Colors.light;
  onPress: (n: Notification) => void;
  onLongPress: (n: Notification) => void;
}

function NotificationItem({ notification, colors, onPress, onLongPress }: NotificationItemProps) {
  const iconName = getNotificationIcon(notification.type);
  const iconColor = getNotificationColor(notification.type, colors);
  const isDark = colors.background === '#0C0C0E';

  return (
    <Pressable
      onPress={() => onPress(notification)}
      onLongPress={() => onLongPress(notification)}
      style={({ pressed }) => [
        styles.notificationItem,
        {
          backgroundColor: colors.surface,
          opacity: pressed ? 0.9 : 1,
          borderColor: colors.divider,
        },
        !notification.read && {
          backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.04)'
            : 'rgba(0, 0, 0, 0.03)',
        },
      ]}
    >
      <View style={styles.notificationContent}>
        <View style={styles.avatarContainer}>
          {notification.user?.avatar ? (
            <View style={styles.avatarWrapper}>
              <ExpoImage
                source={{ uri: notification.user.avatar }}
                style={styles.avatar}
              />
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: iconColor, borderColor: colors.surface },
                ]}
              >
                <Ionicons name={iconName as any} size={11} color="#FFFFFF" />
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              <Ionicons name={iconName as any} size={22} color={iconColor} />
            </View>
          )}
        </View>

        <View style={styles.textContainer}>
          <View style={styles.itemHeaderRow}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                  fontWeight: !notification.read ? '600' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            {!notification.read && (
              <View style={[styles.unreadIndicator, { backgroundColor: iconColor }]} />
            )}
          </View>
          <Text
            style={[styles.body, { color: (colors as any).textMuted ?? colors.secondary }]}
            numberOfLines={2}
          >
            {notification.body}
          </Text>
          <Text style={[styles.timestamp, { color: colors.secondary }]}>
            {formatRelativeTime(notification.timestamp)}
          </Text>
        </View>

        {getNotificationDestination(notification) && (
          <View style={styles.actionIndicator}>
            <Ionicons name="chevron-forward" size={18} color={colors.secondary} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const haptics = useHapticFeedback();
  const { toast, showToast, hideToast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [actionSheet, setActionSheet] = useState<{
    notification: Notification;
    options: Array<{
      text: string;
      onPress: () => void;
      style?: 'default' | 'destructive' | 'cancel';
    }>;
  } | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    return notifications;
  }, [notifications, filter]);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    if (unreadCount === 0) return;
    try {
      haptics.light();
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showToast('All marked as read', 'success');
    } catch (error) {
      console.error('Error marking all as read:', error);
      showToast('Something went wrong', 'error');
    }
  }, [unreadCount, haptics, showToast]);

  const handleNotificationPress = useCallback(
    async (notification: Notification) => {
      haptics.light();

      if (!notification.read) {
        try {
          await markNotificationAsRead(notification.id);
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notification.id ? { ...n, read: true } : n
            )
          );
        } catch (error) {
          console.error('Error marking as read:', error);
        }
      }

      const destination = getNotificationDestination(notification);
      if (destination) {
        router.replace(destination as any);
      }
    },
    [router, haptics]
  );

  const handleNotificationLongPress = useCallback(
    (notification: Notification) => {
      haptics.medium();
      type ActionOption = { text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' };
      const options: ActionOption[] = [
        ...(notification.read
          ? [
              {
                text: 'Mark as unread',
                onPress: async () => {
                  setActionSheet(null);
                  try {
                    await markNotificationAsUnread(notification.id);
                    setNotifications((prev) =>
                      prev.map((n) =>
                        n.id === notification.id ? { ...n, read: false } : n
                      )
                    );
                    showToast('Marked as unread', 'success');
                  } catch {
                    showToast('Something went wrong', 'error');
                  }
                },
                style: 'default' as const,
              },
            ]
          : [
              {
                text: 'Mark as read',
                onPress: async () => {
                  setActionSheet(null);
                  try {
                    await markNotificationAsRead(notification.id);
                    setNotifications((prev) =>
                      prev.map((n) =>
                        n.id === notification.id ? { ...n, read: true } : n
                      )
                    );
                    showToast('Marked as read', 'success');
                  } catch {
                    showToast('Something went wrong', 'error');
                  }
                },
                style: 'default' as const,
              },
            ]),
        {
          text: 'Delete',
          onPress: async () => {
            setActionSheet(null);
            try {
              await deleteNotification(notification.id);
              setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
              showToast('Notification deleted', 'success');
            } catch {
              showToast('Failed to delete', 'error');
            }
          },
          style: 'destructive' as const,
        },
        { text: 'Cancel', onPress: () => setActionSheet(null), style: 'cancel' as const },
      ];
      setActionSheet({ notification, options });
    },
    [haptics, showToast]
  );

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.divider,
          ...Shadows.sm,
          shadowColor: (colors as any).shadow ?? '#000',
        },
      ]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View
              style={[
                styles.unreadBadge,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            style={styles.markAllButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.markAllText, { color: colors.primary }]}>
              Mark all read
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.markAllPlaceholder} />
        )}
      </View>

      {/* Filter tabs */}
      <View style={[styles.filterRow, { borderTopColor: colors.divider }]}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'all' && {
              backgroundColor: colors.primary + '18',
              borderColor: colors.primary,
            },
          ]}
          onPress={() => {
            haptics.light();
            setFilter('all');
          }}
        >
          <Text
            style={[
              styles.filterTabText,
              {
                color: filter === 'all' ? colors.primary : colors.secondary,
                fontWeight: filter === 'all' ? '600' : '500',
              },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'unread' && {
              backgroundColor: colors.primary + '18',
              borderColor: colors.primary,
            },
          ]}
          onPress={() => {
            haptics.light();
            setFilter('unread');
          }}
        >
          <Text
            style={[
              styles.filterTabText,
              {
                color: filter === 'unread' ? colors.primary : colors.secondary,
                fontWeight: filter === 'unread' ? '600' : '500',
              },
            ]}
          >
            Unread
          </Text>
          {unreadCount > 0 && (
            <View
              style={[
                styles.filterBadge,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.filterBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="notifications-outline"
      title={filter === 'unread' ? 'No unread notifications' : 'No notifications'}
      message={
        filter === 'unread'
          ? "You're all caught up!"
          : "You're all caught up! New notifications will appear here."
      }
    />
  );

  if (loading) {
    return (
      <ErrorBoundary>
        <SafeAreaView
          style={[styles.container, { backgroundColor: colors.background }]}
          edges={['top']}
        >
          {renderHeader()}
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.secondary }]}>
              Loading notifications...
            </Text>
          </View>
        </SafeAreaView>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        {renderHeader()}
        <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            colors={colors}
            onPress={handleNotificationPress}
            onLongPress={handleNotificationLongPress}
          />
        )}
        contentContainerStyle={
          filteredNotifications.length === 0
            ? styles.emptyContainer
            : styles.listContent
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.divider }]} />
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Action Sheet */}
      <Modal
        visible={!!actionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setActionSheet(null)}
      >
        <View style={styles.actionSheetOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setActionSheet(null)}
          />
          <View
            style={[
              styles.actionSheetContainer,
              {
                backgroundColor: colors.surface,
                ...Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 12,
                  },
                  android: { elevation: 16 },
                }),
              },
            ]}
          >
            {actionSheet && (
              <>
                <View style={styles.actionSheetHeader}>
                  <Text style={[styles.actionSheetTitle, { color: colors.text }]}>
                    Notification
                  </Text>
                  <Text
                    style={[styles.actionSheetMessage, { color: colors.secondary }]}
                    numberOfLines={2}
                  >
                    {actionSheet.notification.title}
                  </Text>
                </View>
                <View style={[styles.actionSheetDivider, { backgroundColor: colors.divider }]} />
                <View style={styles.actionSheetOptions}>
                  {actionSheet.options.map((option, index) => {
                    const isDestructive = option.style === 'destructive';
                    const isCancel = option.style === 'cancel';
                    const showDivider = index > 0 && !isDestructive;
                    return (
                      <View key={index}>
                        {showDivider && (
                          <View
                            style={[
                              styles.actionSheetDivider,
                              { backgroundColor: colors.divider },
                            ]}
                          />
                        )}
                        {isDestructive && index > 0 && (
                          <View
                            style={[
                              styles.actionSheetDivider,
                              {
                                backgroundColor: colors.divider,
                                marginTop: Spacing.sm,
                              },
                            ]}
                          />
                        )}
                        <TouchableOpacity
                          style={[
                            styles.actionSheetOption,
                            index === actionSheet.options.length - 1 &&
                              styles.actionSheetOptionLast,
                          ]}
                          onPress={() => {
                            haptics.light();
                            option.onPress();
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.actionSheetOptionText,
                              {
                                color: isDestructive
                                  ? colors.error
                                  : isCancel
                                    ? colors.secondary
                                    : colors.primary,
                                fontWeight: isCancel ? '500' : '600',
                              },
                            ]}
                          >
                            {option.text}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.sm,
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.md,
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  unreadBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  markAllButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  markAllText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  markAllPlaceholder: {
    width: 80,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.xs,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  filterTabText: {
    fontSize: Typography.sm,
  },
  filterBadge: {
    marginLeft: Spacing.xs,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.xxl,
  },
  loadingText: {
    fontSize: Typography.sm,
    marginTop: Spacing.md,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  listContent: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  notificationItem: {
    marginHorizontal: 0,
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    ...Shadows.sm,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    ...Shadows.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    paddingTop: 2,
    minWidth: 0,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: Spacing.xs,
  },
  title: {
    fontSize: Typography.base,
    flex: 1,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: Typography.sm,
    lineHeight: 20,
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  timestamp: {
    fontSize: Typography.xs,
    fontWeight: '400',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionIndicator: {
    paddingLeft: Spacing.sm,
    paddingTop: 2,
    justifyContent: 'center',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 64,
    marginRight: Spacing.md,
  },
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
    maxHeight: '80%',
  },
  actionSheetHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  actionSheetTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  actionSheetMessage: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.5,
  },
  actionSheetDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.sm,
  },
  actionSheetOptions: {
    paddingHorizontal: Spacing.md,
  },
  actionSheetOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  actionSheetOptionLast: {
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
  actionSheetOptionText: {
    fontSize: Typography.base,
    textAlign: 'center',
  },
});
