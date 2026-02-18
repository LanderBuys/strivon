import { useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Space } from '@/types/post';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, Typography } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Image as ExpoImage } from 'expo-image';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { getSpaceInitials } from '@/lib/utils/spaceUtils';

interface SpaceIconBarProps {
  spaces: Space[];
  activeSpaceId?: string;
  onSpacePress?: (space: Space) => void;
}

export function SpaceIconBar({ spaces, activeSpaceId, onSpacePress }: SpaceIconBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const haptics = useHapticFeedback();

  const handleSpacePress = useCallback((space: Space) => {
    haptics.selection();
    if (onSpacePress) {
      onSpacePress(space);
    } else {
      router.push({
        pathname: '/space/[id]',
        params: { id: space.id },
      });
    }
  }, [router, haptics, onSpacePress]);

  const handleDiscoverPress = useCallback(() => {
    haptics.light();
    // Scroll to top or show all spaces - this will be handled by parent
  }, [haptics]);

  const formatActivityTime = useCallback((lastActivityAt?: string) => {
    if (!lastActivityAt) return null;
    const now = new Date();
    const activity = new Date(lastActivityAt);
    const diffMs = now.getTime() - activity.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  }, []);

  const joinedSpaces = spaces.filter(s => s.isJoined);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.cardBorder }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Discover Button */}
        <TouchableOpacity
          style={[styles.discoverButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
          onPress={handleDiscoverPress}
          activeOpacity={0.7}>
          <IconSymbol name="compass" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Space Icons */}
        {joinedSpaces.map((space) => {
          const isActive = activeSpaceId === space.id;
          const spaceColor = space.color || colors.primary;
          const hasUnread = (space as any).unreadCount && (space as any).unreadCount > 0;
          const activityTime = formatActivityTime(space.lastActivityAt);
          const isRecentlyActive = activityTime && (activityTime === 'now' || activityTime.endsWith('m') && parseInt(activityTime) < 30);

          return (
            <TouchableOpacity
              key={space.id}
              style={styles.spaceIconWrapper}
              onPress={() => handleSpacePress(space)}
              activeOpacity={0.7}>
              <View
                style={[
                  styles.spaceIcon,
                  {
                    backgroundColor: isActive ? colors.primary + '15' : colors.cardBackground,
                    borderColor: isActive ? colors.primary : colors.cardBorder,
                    borderWidth: isActive ? 2 : StyleSheet.hairlineWidth,
                  },
                ]}>
                {space.iconImage ? (
                  <ExpoImage
                    source={{ uri: space.iconImage }}
                    style={styles.iconImage}
                    contentFit="cover"
                    onError={() => {
                      // Image failed to load
                    }}
                  />
                ) : (
                  <View style={[styles.iconPlaceholder, { backgroundColor: spaceColor + '20' }]}>
                    <Text style={[styles.iconText, { color: spaceColor }]}>
                      {getSpaceInitials(space.name)}
                    </Text>
                  </View>
                )}
                {Boolean(hasUnread) && (
                  <View style={[styles.unreadBadge, { backgroundColor: colors.error }]}>
                    {(space as any).unreadCount > 9 ? (
                      <Text style={styles.unreadBadgeText}>9+</Text>
                    ) : (
                      <Text style={styles.unreadBadgeText}>{String((space as any).unreadCount || 0)}</Text>
                    )}
                  </View>
                )}
                {Boolean(isActive) && (
                  <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
                )}
                {isRecentlyActive && !hasUnread && (
                  <View style={[styles.activityDot, { backgroundColor: '#4ADE80' }]} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: 0,
    paddingBottom: Spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  discoverButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: Spacing.xs,
  },
  spaceIconWrapper: {
    marginRight: Spacing.xs,
  },
  spaceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  iconImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  iconPlaceholder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 44,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    left: -2,
    top: '50%',
    marginTop: -8,
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  activityDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
