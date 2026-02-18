import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { ThreadMessage } from '@/types/post';

interface MessageOption {
  id: string;
  label: string;
  icon: string;
  destructive?: boolean;
  onPress: () => void;
}

interface MessageOptionsMenuProps {
  visible: boolean;
  message: ThreadMessage | null;
  isCurrentUser: boolean;
  onClose: () => void;
  onReply: (message: ThreadMessage) => void;
  /** Insert @username for the message author (e.g. from message options). */
  onMention?: (message: ThreadMessage) => void;
  onEdit?: (message: ThreadMessage) => void;
  onDelete: (message: ThreadMessage) => void;
  onForward: (message: ThreadMessage) => void;
  onCopy: (message: ThreadMessage) => void;
  onReact: (message: ThreadMessage) => void;
  onPin: (message: ThreadMessage) => void;
  /** Report/Block options for other user's messages */
  reportBlockOptions?: Array<{ text: string; style?: 'default' | 'destructive' | 'cancel'; onPress: () => void }>;
  /** When set, used instead of isCurrentUser to show Delete (e.g. mod can delete any). */
  canDeleteMessage?: (message: ThreadMessage) => boolean;
  /** Hide Pin option (e.g. in space channels). */
  hidePin?: boolean;
  /** Hide Forward option (e.g. in space channels). */
  hideForward?: boolean;
  /** Hide Reply option. */
  hideReply?: boolean;
}

export function MessageOptionsMenu({
  visible,
  message,
  isCurrentUser,
  onClose,
  onReply,
  onMention,
  onEdit,
  onDelete,
  onForward,
  onCopy,
  onReact,
  onPin,
  reportBlockOptions = [],
  canDeleteMessage,
  hidePin = false,
  hideForward = false,
  hideReply = false,
}: MessageOptionsMenuProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [slideAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  if (!message) return null;

  const hasMedia = message.media && message.media.length > 0;
  const hasText = message.content && message.content.trim().length > 0;
  const showDelete = canDeleteMessage ? canDeleteMessage(message) : isCurrentUser;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  const options: MessageOption[] = [
    ...(!hideReply
      ? [{
          id: 'reply',
          label: 'Reply',
          icon: 'arrow-back',
          onPress: () => {
            haptics.light();
            onReply(message);
            onClose();
          },
        }]
      : []),
    ...(!isCurrentUser && onMention
      ? [{
          id: 'mention',
          label: 'Mention',
          icon: 'at-outline',
          onPress: () => {
            haptics.light();
            onMention(message);
            onClose();
          },
        }]
      : []),
    {
      id: 'react',
      label: 'React',
      icon: 'happy-outline',
      onPress: () => {
        haptics.light();
        onReact(message);
        onClose();
      },
    },
    ...(isCurrentUser && hasText && !hasMedia && onEdit
      ? [{
          id: 'edit',
          label: 'Edit',
          icon: 'create-outline',
          onPress: () => {
            haptics.light();
            onEdit(message);
            onClose();
          },
        }]
      : []),
    ...(!hideForward
      ? [{
          id: 'forward',
          label: 'Forward',
          icon: 'arrow-forward',
          onPress: () => {
            haptics.light();
            onForward(message);
            onClose();
          },
        }]
      : []),
    ...(!hidePin
      ? [{
          id: 'pin',
          label: message.pinned ? 'Unpin' : 'Pin',
          icon: message.pinned ? 'pin' : 'pin-outline',
          onPress: () => {
            haptics.light();
            onPin(message);
            onClose();
          },
        }]
      : []),
    ...(hasText
      ? [{
          id: 'copy',
          label: 'Copy',
          icon: 'copy-outline',
          onPress: () => {
            haptics.light();
            onCopy(message);
            onClose();
          },
        }]
      : []),
    ...reportBlockOptions.map((opt, i) => ({
      id: `report-block-${i}`,
      label: opt.text,
      icon: opt.style === 'destructive' ? 'ban-outline' : 'flag-outline',
      destructive: opt.style === 'destructive',
      onPress: () => {
        haptics.light();
        opt.onPress();
        onClose();
      },
    })),
    ...(showDelete
      ? [{
          id: 'delete',
          label: 'Delete',
          icon: 'trash-outline',
          destructive: true,
          onPress: () => {
            haptics.medium();
            onDelete(message);
            onClose();
          },
        }]
      : []),
  ];

  const dividerBeforeIndex = options.length >= 3 ? options.length - 3 : -1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
            opacity: opacityAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Dismiss menu"
          accessibilityRole="button"
        />
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.cardBackground,
              transform: [{ translateY }],
            },
          ]}
        >
          <SafeAreaView edges={['bottom']}>
            <View style={styles.handleWrap}>
              <View style={[styles.handle, { backgroundColor: colors.secondary + '60' }]} />
            </View>

            <View style={styles.optionsList}>
              {options.map((option, index) => (
                <View key={option.id}>
                  {dividerBeforeIndex >= 0 && index === dividerBeforeIndex ? (
                    <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />
                  ) : null}
                  <Pressable
                    style={({ pressed }) => [
                      styles.option,
                      { backgroundColor: pressed ? colors.spaceBackground : 'transparent' },
                    ]}
                    onPress={option.onPress}
                    accessibilityLabel={option.label}
                    accessibilityRole="button"
                  >
                    <View style={styles.optionIconWrap}>
                      <IconSymbol
                        name={option.icon}
                        size={22}
                        color={option.destructive ? colors.error : colors.text}
                      />
                    </View>
                    <Text
                      style={[
                        styles.optionLabel,
                        {
                          color: option.destructive ? colors.error : colors.text,
                          fontWeight: option.destructive ? '600' : '500',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={[styles.cancelWrap, { backgroundColor: colors.spaceBackground }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => {
                  haptics.light();
                  onClose();
                }}
                accessibilityLabel="Cancel"
                accessibilityRole="button"
              >
                <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const ICON_SIZE = 22;
const OPTION_MIN_HEIGHT = 48;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  optionsList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.xs,
    marginHorizontal: -Spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: OPTION_MIN_HEIGHT,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    marginVertical: 2,
  },
  optionIconWrap: {
    width: ICON_SIZE + Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: Typography.base,
    flex: 1,
  },
  cancelWrap: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  cancelButton: {
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
});
