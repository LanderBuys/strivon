import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, hexToRgba } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface ProfileStatsProps {
  followers: number;
  following: number;
  posts: number;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
  onPostsPress?: () => void;
  loading?: boolean;
  textColor?: string;
  accentColor?: string;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export function ProfileStats({ 
  followers, 
  following, 
  posts, 
  onFollowersPress,
  onFollowingPress,
  onPostsPress,
  loading = false,
  textColor,
  accentColor
}: ProfileStatsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  
  const effectiveTextColor = textColor || colors.text;
  const effectiveAccentColor = accentColor || colors.primary;
  // Use text color with low opacity for dividers to match the theme
  const dividerColor = textColor ? hexToRgba(textColor, 0.15) : colors.divider;

  const handlePress = (callback?: () => void) => {
    if (callback) {
      haptics.light();
      callback();
    }
  };

  const StatItem = ({
    value,
    label,
    onPress,
  }: {
    value: number;
    label: string;
    onPress?: () => void;
  }) => {
    const displayValue = loading ? '...' : formatNumber(value);
    const accessibilityLabel = onPress
      ? `${displayValue} ${label.toLowerCase()}, double tap to open`
      : undefined;
    const Component = onPress ? TouchableOpacity : View;
    return (
      <Component
        style={styles.stat}
        onPress={() => handlePress(onPress)}
        activeOpacity={onPress ? 0.6 : 1}
        disabled={!onPress || loading}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={onPress ? 'button' : undefined}
      >
        <Text style={[styles.number, { color: effectiveTextColor }]}>
          {displayValue}
        </Text>
        <Text style={[styles.label, { color: effectiveTextColor, opacity: 0.6 }]}>
          {label}
        </Text>
      </Component>
    );
  };

  return (
    <View style={[styles.container, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: dividerColor }]}>
      <StatItem 
        value={posts} 
        label="Posts" 
        onPress={onPostsPress}
      />
      <View style={[styles.separator, { backgroundColor: dividerColor }]} />
      <StatItem 
        value={followers} 
        label="Followers" 
        onPress={onFollowersPress}
      />
      <View style={[styles.separator, { backgroundColor: dividerColor }]} />
      <StatItem 
        value={following} 
        label="Following" 
        onPress={onFollowingPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    minHeight: 52,
  },
  separator: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    marginHorizontal: Spacing.xs,
  },
  number: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
});


