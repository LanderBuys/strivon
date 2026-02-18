import { useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export type SpaceFilter = 'all' | 'joined' | 'trending' | string; // string for category

interface SpaceFiltersProps {
  categories: string[];
  activeFilter: SpaceFilter;
  onFilterChange: (filter: SpaceFilter) => void;
}

export function SpaceFilters({ categories, activeFilter, onFilterChange }: SpaceFiltersProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const surfaceBg = colorScheme === 'dark' ? 'rgba(255,255,255,0.06)' : colors.spaceBackground;
  const surfaceBorder = colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : colors.cardBorder;

  const handleFilterPress = useCallback((filter: SpaceFilter) => {
    haptics.light();
    onFilterChange(filter);
  }, [onFilterChange, haptics]);

  const filterOptions: Array<{ key: SpaceFilter; label: string; icon?: string }> = [
    { key: 'all', label: 'All', icon: 'grid' },
    { key: 'joined', label: 'Joined', icon: 'checkmark-circle' },
    { key: 'trending', label: 'Trending', icon: 'flame' },
    ...categories.map(cat => ({ key: cat, label: cat })),
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.cardBorder }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {filterOptions.map((option) => {
          const isActive = activeFilter === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? colors.primary : surfaceBg,
                  borderColor: isActive ? colors.primary : surfaceBorder,
                },
              ]}
              onPress={() => handleFilterPress(option.key)}
              activeOpacity={0.7}>
              {option.icon && (
                <IconSymbol
                  name={option.icon}
                  size={14}
                  color={isActive ? '#FFFFFF' : colors.secondary}
                  style={styles.filterIcon}
                />
              )}
              <Text style={[
                styles.filterText,
                { color: isActive ? '#FFFFFF' : colors.text },
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: Spacing.xs,
  },
  filterIcon: {
    marginRight: Spacing.xs / 2,
  },
  filterText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
});
