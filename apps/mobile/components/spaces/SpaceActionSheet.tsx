import { useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Space } from '@/types/post';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface SpaceActionSheetProps {
  visible: boolean;
  space: Space | null;
  onClose: () => void;
  onJoin?: (spaceId: string) => void;
  onLeave?: (spaceId: string) => void;
  onViewDetails?: (spaceId: string) => void;
  onMute?: (spaceId: string) => void;
}

export function SpaceActionSheet({
  visible,
  space,
  onClose,
  onJoin,
  onLeave,
  onViewDetails,
  onMute,
}: SpaceActionSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const surfaceBg = colorScheme === 'dark' ? 'rgba(255,255,255,0.06)' : colors.spaceBackground;

  const handleAction = useCallback((action: () => void) => {
    haptics.medium();
    action();
    onClose();
  }, [haptics, onClose]);

  if (!space) return null;

  const isJoined = space.isJoined;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.handle, { backgroundColor: colors.cardBorder }]} />
          
          <View style={styles.header}>
            <View style={styles.spaceInfo}>
              <Text style={[styles.spaceName, { color: colors.text }]} numberOfLines={1}>
                {space.name}
              </Text>
              <Text style={[styles.spaceMeta, { color: colors.secondary }]}>
                {space.memberCount.toLocaleString()} members
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            {isJoined ? (
              <>
                {onViewDetails && (
                  <TouchableOpacity
                    style={[styles.actionItem, { borderBottomColor: colors.cardBorder }]}
                    onPress={() => handleAction(() => onViewDetails(space.id))}
                    activeOpacity={0.7}>
                    <IconSymbol name="information-circle" size={20} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.text }]}>View Details</Text>
                  </TouchableOpacity>
                )}
                {onMute && (
                  <TouchableOpacity
                    style={[styles.actionItem, { borderBottomColor: colors.cardBorder }]}
                    onPress={() => handleAction(() => onMute(space.id))}
                    activeOpacity={0.7}>
                    <IconSymbol name="notifications-off" size={20} color={colors.secondary} />
                    <Text style={[styles.actionText, { color: colors.text }]}>Mute Notifications</Text>
                  </TouchableOpacity>
                )}
                {onLeave && (
                  <TouchableOpacity
                    style={[styles.actionItem, styles.destructiveAction]}
                    onPress={() => handleAction(() => onLeave(space.id))}
                    activeOpacity={0.7}>
                    <IconSymbol name="remove-circle" size={20} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Leave Space</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              onJoin && (
                <TouchableOpacity
                  style={[styles.actionItem]}
                  onPress={() => handleAction(() => onJoin(space.id))}
                  activeOpacity={0.7}>
                  <IconSymbol name="add-circle" size={20} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>Join Space</Text>
                </TouchableOpacity>
              )
            )}
          </View>

          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: surfaceBg, borderColor: colors.cardBorder }]}
            onPress={onClose}
            activeOpacity={0.7}>
            <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: Spacing.xl,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  spaceInfo: {
    alignItems: 'center',
  },
  spaceName: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs / 2,
  },
  spaceMeta: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  actions: {
    paddingVertical: Spacing.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  destructiveAction: {
    borderBottomWidth: 0,
  },
  actionText: {
    fontSize: Typography.base,
    fontWeight: '500',
    flex: 1,
  },
  cancelButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  cancelText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
});
