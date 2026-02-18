import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  autoFocus?: boolean;
  onSubmit?: () => void;
}

export function SearchBar({ value, onChangeText, placeholder, onClear, autoFocus, onSubmit }: SearchBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  return (
    <View style={[styles.container, { 
      backgroundColor: colors.inputBackground || (colorScheme === 'dark' ? colors.surface : colors.cardBackground),
      borderColor: colors.inputBorder || colors.divider,
      shadowColor: (colors as any).shadow ?? '#000',
    }]}>
      <Ionicons name="search" size={18} color={colors.secondary} style={styles.icon} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.secondary}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        blurOnSubmit={false}
      />
      {value.length > 0 && onClear && (
        <TouchableOpacity 
          onPress={onClear} 
          style={styles.clearButton} 
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={18} color={colors.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs + 2,
    minHeight: 44,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  icon: {
    marginRight: Spacing.sm,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: Typography.base,
    padding: 0,
    margin: 0,
    fontWeight: '400',
    ...Platform.select({
      ios: {
        paddingVertical: 4,
      },
    }),
  },
  clearButton: {
    marginLeft: Spacing.xs,
    padding: Spacing.xs,
  },
});
