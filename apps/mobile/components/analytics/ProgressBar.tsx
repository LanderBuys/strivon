import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ label, value, max, color, showPercentage = true }: ProgressBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const barColor = color || colors.primary;
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {showPercentage && (
          <Text style={[styles.percentage, { color: colors.secondary }]}>
            {percentage.toFixed(0)}%
          </Text>
        )}
      </View>
      <View style={[styles.track, { backgroundColor: colors.spaceBackground }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
      <View style={styles.footer}>
        <Text style={[styles.value, { color: colors.text }]}>{value.toLocaleString()}</Text>
        <Text style={[styles.max, { color: colors.secondary }]}>/ {max.toLocaleString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  percentage: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: Typography.base,
    fontWeight: '700',
  },
  max: {
    fontSize: Typography.xs,
    marginLeft: 4,
    opacity: 0.7,
  },
});

