import { useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export type SpaceSort = 'members' | 'activity' | 'newest' | 'alphabetical';

interface SpaceSortMenuProps {
  activeSort: SpaceSort;
  onSortChange: (sort: SpaceSort) => void;
  visible: boolean;
  onClose: () => void;
}

const sortOptions: Array<{ key: SpaceSort; label: string; icon: string }> = [
  { key: 'members', label: 'Most Members', icon: 'people' },
  { key: 'activity', label: 'Most Active', icon: 'pulse' },
  { key: 'newest', label: 'Newest', icon: 'time' },
  { key: 'alphabetical', label: 'Alphabetical', icon: 'textformat' },
];

export function SpaceSortMenu({ activeSort, onSortChange, visible, onClose }: SpaceSortMenuProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();

  const handleSortSelect = useCallback((sort: SpaceSort) => {
    haptics.light();
    onSortChange(sort);
    onClose();
  }, [onSortChange, onClose, haptics]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.menu, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <View style={[styles.menuHeader, { borderBottomColor: colors.cardBorder }]}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Sort Spaces</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <IconSymbol name="close" size={20} color={colors.secondary} />
            </TouchableOpacity>
          </View>
          {sortOptions.map((option) => {
            const isActive = activeSort === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.menuItem,
                  { borderBottomColor: colors.cardBorder },
                  isActive && { backgroundColor: colors.primary + '10' },
                ]}
                onPress={() => handleSortSelect(option.key)}
                activeOpacity={0.7}>
                <View style={styles.menuItemLeft}>
                  <IconSymbol
                    name={option.icon}
                    size={18}
                    color={isActive ? colors.primary : colors.secondary}
                  />
                  <Text style={[
                    styles.menuItemText,
                    { color: isActive ? colors.primary : colors.text },
                  ]}>
                    {option.label}
                  </Text>
                </View>
                {isActive && (
                  <IconSymbol name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  menu: {
    width: '100%',
    maxWidth: 320,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  menuItemText: {
    fontSize: Typography.base,
    fontWeight: '500',
  },
});
