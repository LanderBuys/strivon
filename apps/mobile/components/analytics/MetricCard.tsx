import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  backgroundColor?: string;
  onPress?: () => void;
  trend?: { value: number; isPositive: boolean };
}

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  iconColor, 
  backgroundColor,
  onPress,
  trend 
}: MetricCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const cardBg = backgroundColor || colors.cardBackground;
  const iconBg = iconColor || colors.primary;
  
  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent
      style={[styles.container, { 
        backgroundColor: cardBg,
        borderColor: colors.cardBorder,
        shadowColor: colors.background,
      }, Shadows.md]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg + '15' }]}>
        <Ionicons name={icon} size={24} color={iconBg} />
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.title, { color: colors.secondary }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.secondary }]}>{subtitle}</Text>
      )}
      {trend && (
        <View style={styles.trendContainer}>
          <Ionicons 
            name={trend.isPositive ? 'trending-up' : 'trending-down'} 
            size={12} 
            color={trend.isPositive ? colors.success : colors.danger} 
          />
          <Text style={[styles.trendText, { 
            color: trend.isPositive ? colors.success : colors.danger 
          }]}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </Text>
        </View>
      )}
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
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
    marginBottom: 2,
    opacity: 0.8,
  },
  subtitle: {
    fontSize: Typography.xs,
    opacity: 0.6,
    marginTop: 2,
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

