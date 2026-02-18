import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  PanResponder, 
  Modal,
  Alert,
  Platform
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Conversation } from '@/lib/mocks/notifications';
import { Colors, Spacing, Typography, hexToRgba } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useReportBlock } from '@/hooks/useReportBlock';
import { formatRelativeTime } from '@/lib/utils/time';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
  onPin?: () => void;
  onMute?: () => void;
  onDelete?: () => void;
}

export function ConversationItem({ 
  conversation, 
  onPress, 
  onPin, 
  onMute, 
  onDelete
}: ConversationItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const currentUserId = useCurrentUserId();
  const { getReportBlockOptions } = useReportBlock();
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);
  const reportBlockOpts = !conversation.isGroup && conversation.user?.id && conversation.user.id !== currentUserId && conversation.user.id !== '1'
    ? getReportBlockOptions({
        id: conversation.user.id,
        name: conversation.user.name,
        handle: conversation.user.handle,
        avatar: conversation.user.avatar,
      })
    : [];
  
  const translateX = useRef(new Animated.Value(0)).current;
  const swipeStartX = useRef(0);
  const maxSwipe = 124;

  const closeSwipe = () => {
    setIsSwipeOpen(false);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 110,
      friction: 10,
    }).start();
  };

  const openSwipe = () => {
    setIsSwipeOpen(true);
    Animated.spring(translateX, {
      toValue: -maxSwipe,
      useNativeDriver: true,
      tension: 110,
      friction: 10,
    }).start();
  };

  const confirmDelete = () => {
    haptics.medium();
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            haptics.medium();
            onDelete?.();
          },
        },
      ]
    );
  };

  const panResponder = useRef(
    PanResponder.create({
      // IMPORTANT: don't steal taps/long-presses; only activate on a clear horizontal swipe.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        // Allow swipe-left to open delete. If already open, allow swipe-right to close.
        return Math.abs(dy) < 12 && (dx < -12 || (isSwipeOpen && dx > 12));
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dy) < 12 && (dx < -12 || (isSwipeOpen && dx > 12));
      },
      onPanResponderGrant: () => {
        translateX.stopAnimation((value) => {
          swipeStartX.current = typeof value === 'number' ? value : 0;
        });
      },
      onPanResponderMove: (_, gestureState) => {
        const next = swipeStartX.current + gestureState.dx;
        const dx = Math.max(-maxSwipe, Math.min(0, next));
        translateX.setValue(dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const next = swipeStartX.current + gestureState.dx;
        const x = Math.max(-maxSwipe, Math.min(0, next));
        const openThreshold = -maxSwipe * 0.45;
        if (x <= openThreshold) openSwipe();
        else closeSwipe();
      },
    })
  ).current;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLongPress = () => {
    haptics.medium();
    closeSwipe();
    setShowActionMenu(true);
  };

  const handleAction = (action: () => void) => {
    setShowActionMenu(false);
    action();
  };

  const displayName = conversation.isGroup 
    ? (conversation.groupName || 'Group Chat')
    : conversation.user.name;

  const lastMessagePreview = conversation.lastMessage.length > 72
    ? conversation.lastMessage.substring(0, 72).trim() + '...'
    : conversation.lastMessage;

  const hasMedia = conversation.lastMessage.includes('📸') || 
                   conversation.lastMessage.includes('📹') ||
                   conversation.lastMessage.includes('Photo') ||
                   conversation.lastMessage.includes('Video');
  const isUnread = (conversation.unreadCount || 0) > 0;

  return (
    <>
      <View style={styles.swipeRow}>
        {/* Background action (revealed on left swipe) */}
        <View style={[styles.deleteBg, { backgroundColor: colors.error }]}>
          <View style={styles.deleteActions}>
            <TouchableOpacity
              style={[styles.actionCircle, styles.cancelCircle]}
              onPress={() => {
                haptics.light();
                closeSwipe();
              }}
              activeOpacity={0.8}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCircle, styles.deleteCircle]}
              onPress={() => {
                closeSwipe();
                confirmDelete();
              }}
              activeOpacity={0.8}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Delete conversation"
            >
              <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Foreground row */}
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateX }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={[styles.content, { 
              backgroundColor: colors.background,
              borderBottomColor: colors.divider,
            }]}
            onPress={() => {
              if (isSwipeOpen) {
                closeSwipe();
                return;
              }
              onPress();
            }}
            onLongPress={handleLongPress}
            // Don't fade content on press (it reveals the red delete background underneath).
            activeOpacity={1}
          >
          <View style={styles.avatarContainer}>
            {conversation.isGroup ? (
              <View style={[
                styles.avatar, 
                { 
                  backgroundColor: hexToRgba(colors.primary, 0.1),
                }
              ]}>
                <Ionicons name="people" size={22} color={hexToRgba(colors.primary, 0.8)} />
              </View>
            ) : (
              <>
                {conversation.user.avatar ? (
                  <ExpoImage
                    source={{ uri: conversation.user.avatar }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[
                    styles.avatar, 
                    { 
                      backgroundColor: hexToRgba(colors.primary, 0.1),
                    }
                  ]}>
                    <Text style={[styles.avatarText, { color: hexToRgba(colors.primary, 0.8), fontWeight: '600' }]}>
                      {getInitials(conversation.user.name)}
                    </Text>
                  </View>
                )}
              </>
            )}
            {isUnread && (
              <View style={[styles.onlineIndicator, { 
                backgroundColor: '#4CAF50',
                borderColor: colors.surface,
                borderWidth: 2,
              }]} />
            )}
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <View style={styles.nameContainer}>
                <View style={styles.nameRow}>
                  <Text 
                    style={[styles.name, { color: colors.text, fontWeight: isUnread ? '600' : '500' }]} 
                    numberOfLines={1}
                  >
                    {displayName}
                  </Text>
                  {conversation.pinned && (
                    <Ionicons 
                      name="bookmark" 
                      size={12} 
                      color={colors.secondary} 
                      style={styles.pinIcon}
                    />
                  )}
                </View>
              </View>
              <View style={styles.rightMeta}>
                <Text style={[styles.timestamp, { color: isUnread ? colors.text : colors.secondary, opacity: isUnread ? 0.8 : 0.65 }]}>
                  {formatRelativeTime(conversation.lastMessageTime)}
                </Text>
                {isUnread && (
                  <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.unreadText}>
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.messageRow}>
              {conversation.muted && (
                <Ionicons 
                  name="volume-mute" 
                  size={11} 
                  color={colors.secondary} 
                  style={styles.icon}
                />
              )}
              {hasMedia && (
                <Ionicons 
                  name={conversation.lastMessage.includes('Video') ? 'videocam' : 'image'} 
                  size={11} 
                  color={colors.secondary} 
                  style={styles.icon}
                />
              )}
              <Text 
                style={[styles.messagePreview, { color: isUnread ? colors.text : colors.secondary }]} 
                numberOfLines={2}
              >
                {lastMessagePreview}
              </Text>
            </View>
          </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Modal
        visible={showActionMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionMenu(false)}
        >
          <View style={[styles.actionMenu, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => handleAction(() => onPin?.())}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={conversation.pinned ? 'pin' : 'pin-outline'} 
                size={20} 
                color={colors.text} 
              />
              <Text style={[styles.actionText, { color: colors.text }]}>
                {conversation.pinned ? 'Unpin' : 'Pin'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => handleAction(() => onMute?.())}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={conversation.muted ? 'volume-high' : 'volume-mute-outline'} 
                size={20} 
                color={colors.text} 
              />
              <Text style={[styles.actionText, { color: colors.text }]}>
                {conversation.muted ? 'Unmute' : 'Mute'}
              </Text>
            </TouchableOpacity>

            {reportBlockOpts.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={styles.actionItem}
                onPress={() => handleAction(opt.onPress)}
                activeOpacity={0.7}
              >
                <Ionicons name={opt.style === 'destructive' ? 'ban-outline' : 'flag-outline'} size={20} color={opt.style === 'destructive' ? colors.error : colors.text} />
                <Text style={[styles.actionText, { color: opt.style === 'destructive' ? colors.error : colors.text }]}>{opt.text}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setShowActionMenu(false);
                closeSwipe();
                Alert.alert(
                  'Delete Conversation',
                  'Are you sure you want to delete this conversation?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Delete', 
                      style: 'destructive',
                      onPress: () => {
                        haptics.medium();
                        onDelete?.();
                      }
                    },
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.actionText, { color: colors.error }]}>
                Delete
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowActionMenu(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelText, { color: colors.secondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  swipeRow: {
    position: 'relative',
    overflow: 'hidden',
  },
  deleteBg: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: Spacing.lg,
  },
  deleteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelCircle: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  deleteCircle: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  container: {
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 76,
    position: 'relative',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md + 4,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    ...Platform.select({
      ios: {
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  avatarText: {
    fontSize: Typography.sm + 1,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  nameContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pinIcon: {
    opacity: 0.6,
    marginLeft: 4,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  rightMeta: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    gap: 6,
    marginLeft: Spacing.sm,
    minWidth: 56,
  },
  name: {
    fontSize: Typography.base,
    fontWeight: '500',
    letterSpacing: -0.2,
    lineHeight: Typography.base * 1.28,
  },
  timestamp: {
    fontSize: Typography.xs,
    fontWeight: '600',
    opacity: 0.75,
    letterSpacing: 0.05,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
    minHeight: 20,
  },
  icon: {
    opacity: 0.65,
  },
  messagePreview: {
    fontSize: Typography.sm,
    flex: 1,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.15,
    opacity: 0.8,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: Typography.xs - 1,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionMenu: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.md + 4,
    paddingBottom: Spacing.lg + 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    gap: Spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.xs,
    marginHorizontal: Spacing.lg,
  },
  actionText: {
    fontSize: Typography.base,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: Typography.base,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
