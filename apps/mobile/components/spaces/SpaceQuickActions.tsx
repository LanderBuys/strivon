import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

type QuickActionKey = 'create' | 'requests' | 'trending' | 'joined';

export interface SpaceQuickActionsProps {
  joinedCount: number;
  trendingCount: number;
  pendingRequestsCount: number;
  activeKey?: QuickActionKey;
  onPressCreate: () => void;
  onPressRequests: () => void;
  onPressTrending: () => void;
  onPressJoined: () => void;
}

export function SpaceQuickActions({
  joinedCount,
  trendingCount,
  pendingRequestsCount,
  activeKey,
  onPressCreate,
  onPressRequests,
  onPressTrending,
  onPressJoined,
}: SpaceQuickActionsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();

  const renderChip = (
    key: QuickActionKey,
    label: string,
    icon: string,
    count: number | null,
    onPress: () => void,
    accentColor?: string
  ) => {
    const isActive = activeKey === key;
    const chipAccent = accentColor ?? colors.primary;

    return (
      <TouchableOpacity
        key={key}
        style={[
          styles.chip,
          {
            backgroundColor: isActive ? chipAccent : colors.spaceBackground,
            borderColor: isActive ? chipAccent : colors.cardBorder,
          },
        ]}
        onPress={() => {
          haptics.light();
          onPress();
        }}
        activeOpacity={0.7}
      >
        <IconSymbol
          name={icon}
          size={14}
          color={isActive ? '#FFFFFF' : colors.secondary}
          style={styles.chipIcon}
        />
        <Text style={[styles.chipText, { color: isActive ? '#FFFFFF' : colors.text }]} numberOfLines={1}>
          {label}
        </Text>
        {typeof count === 'number' && count > 0 && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : chipAccent + '20',
                borderColor: isActive ? 'rgba(255,255,255,0.35)' : chipAccent + '35',
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: isActive ? '#FFFFFF' : chipAccent }]}>
              {count > 99 ? '99+' : String(count)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.cardBorder }]}>
      <View style={styles.row}>
        {renderChip('create', 'Create', 'add', null, onPressCreate, colors.primary)}
        {renderChip('requests', 'Requests', 'time-outline', pendingRequestsCount, onPressRequests, colors.secondary)}
        {renderChip('trending', 'Trending', 'flame-outline', trendingCount, onPressTrending, colors.error)}
        {renderChip('joined', 'Joined', 'checkmark-circle', joinedCount, onPressJoined, colors.primary)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    flex: 1,
    justifyContent: 'center',
  },
  chipIcon: {
    opacity: 0.9,
  },
  chipText: {
    fontSize: Typography.xs + 1,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  badge: {
    minWidth: 22,
    height: 18,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginLeft: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});


