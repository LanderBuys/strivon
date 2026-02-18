import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { InboxFilterKey } from '@/lib/utils/inboxFilters';

interface ChipOption {
  key: InboxFilterKey;
  label: string;
  icon: string;
}

const OPTIONS: ChipOption[] = [
  { key: 'all', label: 'All', icon: 'grid-outline' },
  { key: 'people', label: 'People', icon: 'person-outline' },
  { key: 'groups', label: 'Groups', icon: 'people-outline' },
  { key: 'media', label: 'Media', icon: 'image-outline' },
];

export interface InboxFilterChipsProps {
  value: InboxFilterKey;
  onChange: (next: InboxFilterKey) => void;
  disabled?: boolean;
}

export function InboxFilterChips({ value, onChange, disabled }: InboxFilterChipsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {OPTIONS.map((opt) => {
          const active = opt.key === value;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.spaceBackground,
                  borderColor: active ? colors.primary : colors.cardBorder,
                  opacity: disabled ? 0.6 : 1,
                },
              ]}
              onPress={() => {
                if (disabled) return;
                haptics.light();
                onChange(opt.key);
              }}
              activeOpacity={0.75}
              disabled={disabled}
            >
              <IconSymbol
                name={opt.icon}
                size={14}
                color={active ? '#FFFFFF' : colors.secondary}
                style={styles.icon}
              />
              <Text style={[styles.text, { color: active ? '#FFFFFF' : colors.text }]}>
                {opt.label}
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
    paddingVertical: Spacing.sm + 2,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 1,
    borderRadius: BorderRadius.full,
    borderWidth: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 3,
  },
  icon: {
    opacity: 0.9,
  },
  text: {
    fontSize: Typography.sm - 1,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});


