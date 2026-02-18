import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, Typography } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export interface SpaceSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
}

export function SpaceSearchBar({ value, onChangeText, onClear, placeholder = 'Search spaces...' }: SpaceSearchBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const surfaceBg = colorScheme === 'dark' ? 'rgba(255,255,255,0.06)' : colors.spaceBackground;
  const surfaceBorder = colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : colors.cardBorder;

  return (
    <View style={[styles.container, { backgroundColor: surfaceBg, borderColor: surfaceBorder }]}>
      <IconSymbol name="search" size={18} color={colors.secondary} style={styles.icon} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.secondary}
      />
      {value.length > 0 && onClear && (
        <TouchableOpacity onPress={onClear} activeOpacity={0.7} style={styles.clearButton}>
          <IconSymbol name="close-circle" size={18} color={colors.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  clearButton: {
    marginLeft: Spacing.xs,
    padding: Spacing.xs / 2,
  },
});
