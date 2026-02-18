import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export type ContentFilterType = 'all' | 'media' | 'text' | 'links';

interface ContentFiltersProps {
  activeFilter: ContentFilterType;
  onFilterChange: (filter: ContentFilterType) => void;
}

const filters: { key: ContentFilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'media', label: 'Media' },
  { key: 'text', label: 'Text' },
  { key: 'links', label: 'Links' },
];

export function ContentFilters({ activeFilter, onFilterChange }: ContentFiltersProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.surface,
      borderBottomColor: colors.divider,
    }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive
                    ? colors.primary
                    : colorScheme === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isActive ? colors.primary : colors.divider,
                },
              ]}
              onPress={() => {
                haptics.light();
                onFilterChange(filter.key);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: isActive ? '#FFFFFF' : colors.text,
                    fontWeight: isActive ? '600' : '500',
                  },
                ]}
              >
                {filter.label}
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
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: Spacing.sm,
  },
  filterText: {
    fontSize: 14,
    letterSpacing: -0.1,
  },
});
