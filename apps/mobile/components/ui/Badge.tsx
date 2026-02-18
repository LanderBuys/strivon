import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface BadgeProps {
  count: number;
  max?: number;
  variant?: 'default' | 'primary' | 'error';
}

export function Badge({ count, max, variant = 'default' }: BadgeProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'error':
        return colors.error;
      default:
        return colors.secondary;
    }
  };

  const displayCount = max && count > max ? `${max}+` : count.toString();

  if (count === 0) return null;

  return (
    <View style={[styles.badge, { backgroundColor: getBackgroundColor() }]}>
      <Text style={styles.badgeText}>{displayCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: Typography.xs,
    fontWeight: '700',
  },
});


