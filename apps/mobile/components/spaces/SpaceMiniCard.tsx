import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Space } from '@/types/post';

export interface SpaceMiniCardProps {
  space: Space;
  accentColor?: string;
  subtitle?: string | null;
  unreadCount?: number;
  isMuted?: boolean;
  showJoinCta?: boolean;
  ctaLabel?: string;
  showName?: boolean;
  onPress: () => void;
  onPressCta?: () => void;
  hasImageError?: boolean;
  onImageError?: () => void;
}

export function SpaceMiniCard({
  space,
  accentColor,
  subtitle,
  unreadCount = 0,
  isMuted = false,
  showJoinCta = false,
  ctaLabel,
  showName = true,
  onPress,
  onPressCta,
  hasImageError = false,
  onImageError,
}: SpaceMiniCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const spaceColor = accentColor ?? space.color ?? colors.primary;
  const iconOnly = !showName;

  const getInitials = (name?: string): string => {
    if (!name || !name.trim()) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  // Abstract mock "pfp" (no faces). Used when a space doesn't have a real icon image.
  // Pick a style deterministically so different spaces get different looks.
  const avatarSeed = String(space.id || space.name || 'space');
  const hashSeed = (value: string) => {
    // Small deterministic hash (not crypto)
    let h = 0;
    for (let i = 0; i < value.length; i++) {
      h = (h * 31 + value.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  };
  const seedHash = hashSeed(avatarSeed);
  const mockStyles = ['identicon', 'shapes', 'rings'] as const; // all abstract / no faces
  const style = mockStyles[seedHash % mockStyles.length];
  const bgPalette = ['f2f3f5', 'eef2ff', 'f0fdf4', 'fff7ed', 'fdf2f8'] as const;
  const backgroundColor = bgPalette[(seedHash >> 3) % bgPalette.length];
  const mockIconUri = `https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(
    avatarSeed,
  )}&size=128&backgroundColor=${backgroundColor}`;

  const iconUri = space.iconImage || mockIconUri;
  const isGeneratedIcon = iconUri.includes('api.dicebear.com/7.x/');

  const resolvedCtaLabel =
    ctaLabel ??
    (space.isJoined ? 'Open' : space.requiresApproval ? 'Request' : 'Join');

  return (
    <TouchableOpacity
      style={[
        styles.card,
        !showName && styles.cardIconOnly,
        {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          opacity: isMuted ? 0.72 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={space.name || 'Space'}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, iconOnly && styles.iconContainerIconOnly]}>
          <View
            style={[
              styles.iconWrap,
              iconOnly && styles.iconWrapIconOnly,
              { backgroundColor: spaceColor + '15' },
            ]}
          >
            {iconUri && !hasImageError ? (
              <ExpoImage
                source={{ uri: iconUri }}
                style={styles.iconImage}
                // Space icons are often logos with padding; `contain` keeps them visually centered.
                contentFit={isGeneratedIcon ? 'cover' : 'contain'}
                contentPosition="center"
                onError={onImageError}
                cachePolicy="memory-disk"
              />
            ) : (
              <Text
                style={[
                  styles.iconText,
                  iconOnly && styles.iconTextIconOnly,
                  { color: spaceColor },
                ]}
              >
                {getInitials(space.name)}
              </Text>
            )}
          </View>

          {unreadCount > 0 && (
            <View
              style={[
                styles.unreadBadge,
                iconOnly && styles.unreadBadgeIconOnly,
                { backgroundColor: colors.error, borderColor: colors.background },
              ]}
            >
              <Text style={styles.unreadText}>{unreadCount > 99 ? '99+' : String(unreadCount)}</Text>
            </View>
          )}
        </View>
      </View>

      {showName ? (
        <>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {space.name || 'Unnamed'}
          </Text>

          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.secondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </>
      ) : null}

      {showJoinCta && (
        <TouchableOpacity
          style={[
            styles.cta,
            {
              backgroundColor: space.isJoined ? colors.spaceBackground : spaceColor,
              borderColor: colors.cardBorder,
            },
          ]}
          onPress={(e) => {
            e.stopPropagation();
            onPressCta?.();
          }}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.ctaText,
              { color: space.isJoined ? colors.text : '#FFFFFF' },
            ]}
            numberOfLines={1}
          >
            {resolvedCtaLabel}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 82,
    borderRadius: BorderRadius.lg,
    borderWidth: 0,
    paddingVertical: Spacing.xs,
    paddingHorizontal: 2,
    gap: Spacing.xs,
    position: 'relative',
    overflow: 'visible',
  },
  cardIconOnly: {
    width: 78,
    paddingVertical: 0,
    paddingHorizontal: 0,
    gap: 0,
  },
  topRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    width: 56,
    height: 56,
    overflow: 'visible',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerIconOnly: {
    width: 68,
    height: 68,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  iconWrapIconOnly: {
    width: 68,
    height: 68,
    borderRadius: 22,
  },
  iconImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  iconText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
    // Use container-height lineHeight for reliable vertical centering
    lineHeight: 56,
    textAlign: 'center',
    textAlignVertical: 'center',
    // Helps vertical centering on Android
    includeFontPadding: false,
  },
  iconTextIconOnly: {
    fontSize: 20,
    lineHeight: 68,
  },
  unreadBadge: {
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
    zIndex: 2,
  },
  unreadBadgeIconOnly: {
    // Keep badge inside the tile so it can't be clipped by the horizontal scroll view
    top: 2,
    right: 2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  muteBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: Typography.xs + 1,
    fontWeight: '800',
    letterSpacing: -0.15,
    textAlign: 'center',
    lineHeight: (Typography.xs + 1) * 1.2,
  },
  subtitle: {
    fontSize: Typography.xs,
    fontWeight: '600',
    opacity: 0.9,
    textAlign: 'center',
  },
  cta: {
    marginTop: 4,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  ctaText: {
    fontSize: Typography.xs + 1,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
});


