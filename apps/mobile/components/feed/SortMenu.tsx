import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { ContentFilterType } from './ContentFilters';

export type SortOption = 'newest' | 'popular' | 'trending';

/** Feed reach: local (same state), my country, or global. */
export type LocationScope = 'local' | 'my_country' | 'global';

interface SortMenuProps {
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  activeFilter?: ContentFilterType;
  onFilterChange?: (filter: ContentFilterType) => void;
  /** Location scope for feed: show Local / My country / Global. */
  locationScope?: LocationScope;
  onLocationScopeChange?: (scope: LocationScope) => void;
  visible: boolean;
  onClose: () => void;
}

const sortOptions: { key: SortOption; label: string; icon: string }[] = [
  { key: 'newest', label: 'Newest', icon: 'time-outline' },
  { key: 'popular', label: 'Popular', icon: 'flame-outline' },
  { key: 'trending', label: 'Trending', icon: 'trending-up-outline' },
];

const filterOptions: { key: ContentFilterType; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'grid-outline' },
  { key: 'media', label: 'Media', icon: 'image-outline' },
  { key: 'text', label: 'Text', icon: 'document-text-outline' },
  { key: 'links', label: 'Links', icon: 'link-outline' },
];

const locationScopeOptions: { key: LocationScope; label: string; icon: string }[] = [
  { key: 'global', label: 'Global', icon: 'globe-outline' },
  { key: 'my_country', label: 'My country', icon: 'flag-outline' },
  { key: 'local', label: 'Local', icon: 'location-outline' },
];

export function SortMenu({
  activeSort,
  onSortChange,
  activeFilter,
  onFilterChange,
  locationScope = 'global',
  onLocationScopeChange,
  visible,
  onClose,
}: SortMenuProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();

  const handleSortSelect = (sort: SortOption) => {
    haptics.light();
    onSortChange(sort);
    onClose();
  };

  const handleFilterSelect = (filter: ContentFilterType) => {
    haptics.light();
    onFilterChange?.(filter);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.menu, { backgroundColor: colors.surface }]}>
          {activeFilter !== undefined && onFilterChange && (
            <>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Filter by</Text>
              {filterOptions.map((option) => {
                const isActive = activeFilter === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.menuItem,
                      isActive && { backgroundColor: colorScheme === 'dark' ? 'rgba(29, 155, 240, 0.15)' : 'rgba(29, 155, 240, 0.08)' },
                    ]}
                    onPress={() => handleFilterSelect(option.key)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={isActive ? colors.primary : colors.secondary}
                      style={styles.menuIcon}
                    />
                    <Text
                      style={[
                        styles.menuItemText,
                        {
                          color: isActive ? colors.primary : colors.text,
                          fontWeight: isActive ? '600' : '400',
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            </>
          )}
          {onLocationScopeChange && (
            <>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Show</Text>
              {locationScopeOptions.map((option) => {
                const isActive = locationScope === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.menuItem,
                      isActive && { backgroundColor: colorScheme === 'dark' ? 'rgba(29, 155, 240, 0.15)' : 'rgba(29, 155, 240, 0.08)' },
                    ]}
                    onPress={() => {
                      haptics.light();
                      onLocationScopeChange(option.key);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={isActive ? colors.primary : colors.secondary}
                      style={styles.menuIcon}
                    />
                    <Text
                      style={[
                        styles.menuItemText,
                        {
                          color: isActive ? colors.primary : colors.text,
                          fontWeight: isActive ? '600' : '400',
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            </>
          )}
          <Text style={[styles.menuTitle, { color: colors.text }]}>Sort by</Text>
          {sortOptions.map((option) => {
            const isActive = activeSort === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.menuItem,
                  isActive && { backgroundColor: colorScheme === 'dark' ? 'rgba(29, 155, 240, 0.15)' : 'rgba(29, 155, 240, 0.08)' },
                ]}
                onPress={() => handleSortSelect(option.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color={isActive ? colors.primary : colors.secondary}
                  style={styles.menuIcon}
                />
                <Text
                  style={[
                    styles.menuItemText,
                    {
                      color: isActive ? colors.primary : colors.text,
                      fontWeight: isActive ? '600' : '400',
                    },
                  ]}
                >
                  {option.label}
                </Text>
                {isActive && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    // backgroundColor will be set dynamically based on theme
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    width: 280,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  menuTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.divider,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  menuIcon: {
    marginRight: Spacing.md,
  },
  menuItemText: {
    flex: 1,
    fontSize: Typography.base,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.sm,
  },
});
