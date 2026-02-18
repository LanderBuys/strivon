import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, BadgeLevel } from '@/types/badges';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface BadgeDisplayProps {
  badge: Badge;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  onPress?: () => void;
}

const SIZE_CONFIG = {
  small: { icon: 14, container: 32, fontSize: Typography.xs, padding: 2 },
  medium: { icon: 20, container: 44, fontSize: Typography.sm, padding: 3 },
  large: { icon: 28, container: 64, fontSize: Typography.base, padding: 4 },
};

export function BadgeDisplay({ badge, size = 'medium', showLabel = false, onPress }: BadgeDisplayProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const config = SIZE_CONFIG[size];

  const getRarityStyles = () => {
    // Clean, modern badge design with subtle backgrounds
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    // Use subtle background with solid border
    const bgAlpha = colorScheme === 'dark' ? 0.2 : 0.15;
    
    switch (badge.rarity) {
      case 'legendary':
        return {
          backgroundColor: hexToRgba(badge.color, bgAlpha),
          borderColor: badge.color,
          borderWidth: 2.5,
          shadowColor: badge.color,
          shadowOpacity: 0.5,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 6,
        };
      case 'epic':
        return {
          backgroundColor: hexToRgba(badge.color, bgAlpha),
          borderColor: badge.color,
          borderWidth: 2,
          shadowColor: badge.color,
          shadowOpacity: 0.4,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 5,
        };
      case 'rare':
        return {
          backgroundColor: hexToRgba(badge.color, bgAlpha),
          borderColor: badge.color,
          borderWidth: 1.5,
          shadowColor: badge.color,
          shadowOpacity: 0.3,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 1 },
          elevation: 4,
        };
      default:
        return {
          backgroundColor: hexToRgba(badge.color, bgAlpha),
          borderColor: badge.color,
          borderWidth: 1.5,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
          elevation: 3,
        };
    }
  };

  const Component = onPress ? TouchableOpacity : View;
  const rarityStyles = getRarityStyles();

  return (
    <Component
      onPress={() => {
        if (onPress) {
          haptics.light();
          onPress();
        }
      }}
      activeOpacity={onPress ? 0.8 : 1}
      style={styles.container}
    >
      <View
        style={[
          styles.badgeContainer,
          {
            width: config.container,
            height: config.container,
            padding: config.padding,
          },
          rarityStyles,
        ]}
      >
        <View style={[styles.badgeInner]}>
          <Ionicons 
            name={badge.icon as any} 
            size={config.icon} 
            color={badge.color}
            style={styles.badgeIcon}
          />
        </View>
      </View>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text 
            style={[
              styles.badgeLabel, 
              { 
                color: colors.text, 
                fontSize: config.fontSize,
                fontWeight: badge.rarity === 'legendary' || badge.rarity === 'epic' ? '700' : '600',
              }
            ]} 
            numberOfLines={1}
          >
            {badge.displayName}
            {badge.level && (
              <Text style={[styles.badgeLevel, { color: badge.color }]}> {badge.level}</Text>
            )}
          </Text>
        </View>
      )}
    </Component>
  );
}

interface BadgeListProps {
  badges: Badge[];
  maxVisible?: number;
  size?: 'small' | 'medium' | 'large';
  onBadgePress?: (badge: Badge) => void;
}

export function BadgeList({ badges, maxVisible = 5, size = 'medium', onBadgePress }: BadgeListProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const visibleBadges = badges.slice(0, maxVisible);
  const remainingCount = badges.length - maxVisible;

  return (
    <View style={styles.badgeList}>
      {visibleBadges.map((badge, index) => (
        <View key={badge.id} style={styles.badgeWrapper}>
          <BadgeDisplay
            badge={badge}
            size={size}
            onPress={onBadgePress ? () => onBadgePress(badge) : undefined}
          />
        </View>
      ))}
      {remainingCount > 0 && (
        <View style={[styles.moreBadges, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <Text style={[styles.moreBadgesText, { color: colors.secondary }]}>+{remainingCount}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.4,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 5,
      },
    }),
  },
  badgeInner: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  badgeIcon: {
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
  labelContainer: {
    marginTop: Spacing.xs + 4,
    maxWidth: 90,
    paddingHorizontal: Spacing.xs,
  },
  badgeLabel: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  badgeLevel: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeList: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  badgeWrapper: {
    marginRight: -Spacing.xs,
  },
  moreBadges: {
    minWidth: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  moreBadgesText: {
    fontSize: Typography.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

