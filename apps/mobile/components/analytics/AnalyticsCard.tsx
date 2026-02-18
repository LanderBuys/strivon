import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  trend?: { value: number; isPositive: boolean };
  color?: string;
}

export function AnalyticsCard({ title, value, icon, trend, color }: AnalyticsCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const cardColor = color || colors.primary;

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.cardBackground,
      borderColor: colors.cardBorder,
      shadowColor: colors.background,
    }, Shadows.md]}>
      <View style={[styles.iconContainer, { backgroundColor: cardColor + '15' }]}>
        <Ionicons name={icon} size={24} color={cardColor} />
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.title, { color: colors.secondary }]}>{title}</Text>
      {trend && (
        <View style={styles.trendContainer}>
          <Ionicons 
            name={trend.isPositive ? 'trending-up' : 'trending-down'} 
            size={14} 
            color={trend.isPositive ? colors.success : colors.danger} 
          />
          <Text style={[styles.trendText, { 
            color: trend.isPositive ? colors.success : colors.danger 
          }]}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: '47%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  value: {
    fontSize: Typography['2xl'],
    fontWeight: '700',
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: '500',
    marginBottom: Spacing.xs,
    opacity: 0.8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 4,
  },
  trendText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
});


