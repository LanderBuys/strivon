import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';

export interface AdvancedSearchFilters {
  dateRange?: 'today' | 'week' | 'month' | 'year' | 'all';
  contentType?: 'all' | 'posts' | 'questions' | 'build-logs' | 'wins' | 'collabs';
  author?: string;
  minLikes?: number;
  minComments?: number;
  sortBy?: 'relevance' | 'date' | 'popularity';
}

interface AdvancedSearchFiltersProps {
  visible: boolean;
  filters: AdvancedSearchFilters;
  onClose: () => void;
  onApply: (filters: AdvancedSearchFilters) => void;
  onReset: () => void;
}

export function AdvancedSearchFilters({
  visible,
  filters,
  onClose,
  onApply,
  onReset,
}: AdvancedSearchFiltersProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [localFilters, setLocalFilters] = useState<AdvancedSearchFilters>(filters);

  const handleApply = () => {
    haptics.success();
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    haptics.light();
    const resetFilters: AdvancedSearchFilters = {};
    setLocalFilters(resetFilters);
    onReset();
  };

  const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.secondary }]}>{title}</Text>
      {children}
    </View>
  );

  const OptionButton = ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.optionButton,
        {
          backgroundColor: selected ? colors.primary : colors.cardBackground,
          borderColor: selected ? colors.primary : colors.cardBorder,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.optionText,
          { color: selected ? '#FFFFFF' : colors.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Advanced Filters</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <FilterSection title="Date Range">
            <View style={styles.optionsRow}>
              {(['all', 'today', 'week', 'month', 'year'] as const).map((range) => (
                <OptionButton
                  key={range}
                  label={range === 'all' ? 'All Time' : range.charAt(0).toUpperCase() + range.slice(1)}
                  selected={localFilters.dateRange === range}
                  onPress={() =>
                    setLocalFilters({ ...localFilters, dateRange: range === 'all' ? undefined : range })
                  }
                />
              ))}
            </View>
          </FilterSection>

          <FilterSection title="Content Type">
            <View style={styles.optionsRow}>
              {(['all', 'posts', 'questions', 'build-logs', 'wins', 'collabs'] as const).map((type) => (
                <OptionButton
                  key={type}
                  label={type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                  selected={localFilters.contentType === type}
                  onPress={() =>
                    setLocalFilters({ ...localFilters, contentType: type === 'all' ? undefined : type })
                  }
                />
              ))}
            </View>
          </FilterSection>

          <FilterSection title="Sort By">
            <View style={styles.optionsRow}>
              {(['relevance', 'date', 'popularity'] as const).map((sort) => (
                <OptionButton
                  key={sort}
                  label={sort.charAt(0).toUpperCase() + sort.slice(1)}
                  selected={localFilters.sortBy === sort}
                  onPress={() => setLocalFilters({ ...localFilters, sortBy: sort })}
                />
              ))}
            </View>
          </FilterSection>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.divider }]}>
          <TouchableOpacity
            style={[styles.resetButton, { borderColor: colors.cardBorder }]}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Text style={[styles.resetButtonText, { color: colors.text }]}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: colors.primary }]}
            onPress={handleApply}
            activeOpacity={0.7}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  optionText: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  resetButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.base,
    fontWeight: '600',
  },
});



