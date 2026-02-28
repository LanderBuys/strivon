import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';

export interface FeedScreenHeaderProps {
  onSearchPress: () => void;
  onCreatePress: () => void;
  onNotificationsPress: () => void;
  unreadNotifications: number;
  /** Optional: use Animated.View and pass animated style (e.g. transform) */
  ContainerComponent?: React.ComponentType<any>;
  containerStyle?: object;
}

export function FeedScreenHeader({
  onSearchPress,
  onCreatePress,
  onNotificationsPress,
  unreadNotifications,
  ContainerComponent,
  containerStyle,
}: FeedScreenHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const Container = ContainerComponent ?? View;

  return (
    <Container
      style={[
        styles.topHeader,
        {
          backgroundColor: colors.cardBackground,
          borderBottomColor: colors.divider,
          shadowColor: colors.shadow,
          ...Shadows.sm,
        },
        containerStyle,
      ]}
      accessibilityRole="header"
    >
      <View>
        <Text style={[styles.appName, { color: colors.text }]}>Strivon</Text>
        <Text style={[styles.headerSubtitle, { color: colors.secondary }]} numberOfLines={1}>Your builder network</Text>
      </View>
      <View style={styles.headerIcons}>
        <AnimatedPressable
          scale={0.92}
          style={styles.headerIconButton}
          onPress={() => {
            haptics.light();
            onSearchPress();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Search"
          accessibilityHint="Opens search"
        >
          <Ionicons name="search-outline" size={22} color={colors.text} />
        </AnimatedPressable>
        <AnimatedPressable
          scale={0.92}
          style={styles.headerIconButton}
          onPress={() => {
            haptics.light();
            onCreatePress();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Create post"
          accessibilityHint="Opens create post screen"
        >
          <Ionicons name="create-outline" size={24} color={colors.text} />
        </AnimatedPressable>
        <AnimatedPressable
          scale={0.92}
          style={styles.headerIconButton}
          onPress={() => {
            haptics.light();
            onNotificationsPress();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={unreadNotifications > 0 ? `Notifications, ${unreadNotifications} unread` : 'Notifications'}
          accessibilityHint="Opens notifications"
        >
          <View style={styles.notificationIconContainer}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            {unreadNotifications > 0 && (
              <View
                style={[
                  styles.notificationBadge,
                  {
                    backgroundColor: colors.error || '#EF4444',
                    borderColor: colors.surface,
                  },
                ]}
              >
                <Text style={styles.notificationBadgeText}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Text>
              </View>
            )}
          </View>
        </AnimatedPressable>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.85,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerIconButton: {
    padding: Spacing.xs + 2,
    borderRadius: 20,
    minWidth: 38,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIconContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
