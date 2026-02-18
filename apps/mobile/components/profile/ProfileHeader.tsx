import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { User } from '@/types/post';
import { Colors, Spacing, BorderRadius, Typography, hexToRgba } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { getProfilePageCustomization } from '@/lib/services/badgePerksService';
import { getCountryFlag } from '@/lib/utils/countryFlag';
import { FollowButton } from './FollowButton';
import { getSubscriptionTier } from '@/lib/services/subscriptionService';

const screenWidth = Dimensions.get('window').width;
// Slightly more compact dimensions to keep the profile looking clean and professional
export const BANNER_HEIGHT = 170;
const AVATAR_SIZE = 100; 
const AVATAR_OFFSET = 50; // How much avatar overlaps the banner
const USER_INFO_TOP_PADDING = Spacing.xs; // Match profile page spacing

// Helper to check if URI is a video
const isVideoUri = (uri: string | null | undefined): boolean => {
  if (!uri) return false;
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.3gp'];
  const videoMimeTypes = ['video/', 'video/mp4', 'video/quicktime', 'video/x-msvideo'];
  const lowerUri = uri.toLowerCase();
  // Check file extension
  if (videoExtensions.some(ext => lowerUri.includes(ext))) return true;
  // Check MIME type in URI (some URIs include MIME type)
  if (videoMimeTypes.some(mime => lowerUri.includes(mime))) return true;
  // Check for common video file patterns
  if (lowerUri.includes('video') && !lowerUri.includes('image')) return true;
  return false;
};

// Video Banner Component
const VideoBanner = ({ uri }: { uri: string }) => {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.play();
  });

  return (
    <>
      <VideoView
        player={player}
        style={[styles.banner, { opacity: 1 }]}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
      />
      {/* Gradient overlay for better visual depth */}
      <View style={[styles.bannerGradientOverlay, {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
      }]} />
    </>
  );
};

// Video Avatar Component
const VideoAvatar = ({ uri }: { uri: string }) => {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.play();
  });

  return (
    <View style={styles.avatarInner}>
      <VideoView
        player={player}
        style={styles.avatarImage}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
      />
    </View>
  );
};

interface ProfileHeaderProps {
  user: User & { bio?: string; banner?: string | null; occupation?: string; country?: string; joinDate?: string; contentWarning?: string | null };
  activeStatus?: boolean;
  activeStreak?: number;
  showFollowButton?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  pageCustomization?: {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
  };
} // end of interface Profileheaderprops 

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}; //end of getinitials

const formatJoinDate = (dateString?: string) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) {
    return `Joined ${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
  } else if (diffMonths > 0) {
    return `Joined ${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
  } else if (diffDays > 0) {
    return `Joined ${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return 'Joined today';
  }
}; //end of formatjoindate

export function ProfileHeader({ user, activeStatus = false, activeStreak = 0, showFollowButton = false, onFollowChange, pageCustomization: propPageCustomization }: ProfileHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const haptics = useHapticFeedback();
  const [pageCustomization, setPageCustomization] = useState<{
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    backgroundImage?: string;
  }>({});
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'pro-plus'>('free');
  const [contentWarningDismissed, setContentWarningDismissed] = useState(false);
  
  // Load subscription tier
  useEffect(() => {
    const loadTier = async () => {
      const tier = await getSubscriptionTier();
      setSubscriptionTier(tier);
    };
    loadTier();
  }, []);
  
  // Use prop customization if provided, otherwise load from storage
  // Always prefer prop over local state for live updates
  // Force re-render when prop changes by using it directly
  const effectiveCustomization = propPageCustomization || pageCustomization;
  
  // Update local state when prop changes (for cases where prop is not provided)
  useEffect(() => {
    if (propPageCustomization) {
      // Create new object reference to ensure React detects the change
      setPageCustomization({ ...propPageCustomization });
    }
  }, [propPageCustomization?.backgroundColor, propPageCustomization?.textColor, propPageCustomization?.accentColor]);
  
  // Load page customizations only if not provided as prop
  const loadPageCustomization = useCallback(() => {
    if (!propPageCustomization) {
      getProfilePageCustomization().then(setPageCustomization);
    }
  }, [propPageCustomization]);

  useEffect(() => {
    loadPageCustomization();
  }, [loadPageCustomization]);

  // Reload customizations when screen comes into focus (e.g., after editing profile)
  useFocusEffect(
    useCallback(() => {
      loadPageCustomization();
    }, [loadPageCustomization])
  );

  // Reload customizations when screen comes into focus
  useEffect(() => {
    loadPageCustomization();
  }, [loadPageCustomization]);
  
  // Get page colors with fallback to theme colors
  // ALWAYS use prop first for live updates, then fallback to local state
  const pageBackgroundColor = propPageCustomization?.backgroundColor ?? pageCustomization?.backgroundColor ?? colors.background;
  const pageTextColor = propPageCustomization?.textColor ?? pageCustomization?.textColor ?? colors.text;
  const pageAccentColor = propPageCustomization?.accentColor ?? pageCustomization?.accentColor ?? colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: pageBackgroundColor, zIndex: 30 }]}>
      {/* Banner Image/Video */}
      <View style={[styles.bannerContainer, { backgroundColor: pageBackgroundColor, zIndex: 1 }]}>
        {user.banner ? (
          isVideoUri(user.banner) ? (
            <VideoBanner uri={user.banner} />
          ) : (
            <>
              <ExpoImage
                source={{ uri: user.banner }}
                style={[styles.banner, { opacity: 1 }]}
                contentFit="cover"
                transition={200}
              />
              {/* Gradient overlay for better visual depth */}
              <View style={[styles.bannerGradientOverlay, {
                backgroundColor: colorScheme === 'dark' 
                  ? 'rgba(0, 0, 0, 0.3)' 
                  : 'rgba(0, 0, 0, 0.15)',
              }]} />
            </>
          )
        ) : (
          <View style={[styles.banner, styles.bannerPlaceholder, { 
            backgroundColor: colorScheme === 'dark' 
              ? 'rgba(29, 155, 240, 0.25)' 
              : 'rgba(29, 155, 240, 0.15)',
            opacity: 1
          }]}>
            {/* Subtle pattern overlay for placeholder */}
            <View style={[styles.bannerGradientOverlay, {
              backgroundColor: colorScheme === 'dark' 
                ? 'rgba(0, 0, 0, 0.2)' 
                : 'rgba(255, 255, 255, 0.1)',
            }]} />
          </View>
        )}
      </View>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={[styles.avatarWrapper, {
          shadowColor: colorScheme === 'dark' ? '#000' : '#000',
          ...Platform.select({
            ios: {
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
            android: {
              elevation: 8,
            },
          }),
        }]}>
          <View style={[styles.avatarBorder, {
            borderColor: pageBackgroundColor,
            backgroundColor: pageBackgroundColor,
          }]}>
            {user.avatar ? (
              isVideoUri(user.avatar) ? (
                <VideoAvatar uri={user.avatar} />
              ) : (
                <View style={styles.avatarInner}>
                  <ExpoImage
                    source={{ uri: user.avatar }}
                    style={styles.avatarImage}
                    contentFit="cover"
                    transition={200}
                  />
                </View>
              )
            ) : (
              <View style={[styles.avatarPlaceholder, {
                backgroundColor: colorScheme === 'dark'
                  ? 'rgba(29, 155, 240, 0.25)'
                  : 'rgba(29, 155, 240, 0.15)'
              }]}>
                <Text style={[styles.avatarText, { color: pageAccentColor }]}>
                  {getInitials(user?.name || 'U')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: pageTextColor }]} numberOfLines={1}>
            {user?.name || 'User'}
          </Text>
        </View>
        
        <View style={styles.handleRow}>
          <Text style={[styles.handle, { color: pageTextColor, opacity: 0.7 }]} numberOfLines={1}>
            {user?.handle || '@user'}
          </Text>
          {user?.occupation && (
            <>
              <Text style={[styles.separator, { color: pageTextColor, opacity: 0.5 }]}> · </Text>
              <Text style={[styles.occupation, { color: pageAccentColor }]} numberOfLines={1}>
                {user.occupation}
              </Text>
            </>
          )}
        </View>

        {user?.bio && (
          <View style={styles.bioContainer}>
            <Text style={[styles.bio, { color: pageTextColor }]} numberOfLines={3}>
              {user.bio}
            </Text>
          </View>
        )}

        {/* Content Warning */}
        {user?.contentWarning && !contentWarningDismissed && (
          <View style={[styles.contentWarningContainer, { 
            backgroundColor: colors.error + '12',
            borderColor: colors.error + '30',
          }]}>
            <View style={styles.contentWarningHeader}>
              <View style={[styles.contentWarningIconContainer, { backgroundColor: colors.error + '20' }]}>
                <Ionicons name="warning" size={20} color={colors.error} />
              </View>
              <View style={styles.contentWarningHeaderText}>
                <Text style={[styles.contentWarningTitle, { color: colors.error }]}>
                  Content Warning
                </Text>
                <Text style={[styles.contentWarningText, { color: pageTextColor }]}>
                  {user.contentWarning}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.contentWarningButton, { backgroundColor: colors.error }]}
              onPress={() => {
                haptics.light();
                setContentWarningDismissed(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.contentWarningButtonText}>Show Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pro+ Custom Creator Label */}
        {subscriptionTier === 'pro-plus' && user?.label && (
          <View style={[styles.creatorLabelContainer, { backgroundColor: pageAccentColor + '15' }]}>
            <Ionicons name="star" size={14} color={pageAccentColor} />
            <Text style={[styles.creatorLabel, { color: pageAccentColor }]}>
              {user.label}
            </Text>
          </View>
        )}

        {/* Join Date, Country and Active Status Row */}
        <View style={styles.metaRow}>
          {user?.joinDate && (
            <View style={styles.joinDateContainer}>
              <Ionicons name="calendar-outline" size={16} color={pageTextColor} style={{ opacity: 0.7 }} />
              <Text style={[styles.joinDate, { color: pageTextColor, opacity: 0.7 }]}>
                {formatJoinDate(user.joinDate)}
              </Text>
            </View>
          )}
          {user?.country && (
            <View style={styles.joinDateContainer}>
              {getCountryFlag(user.country) ? (
                <Text style={styles.countryFlag}>{getCountryFlag(user.country)}</Text>
              ) : (
                <Ionicons name="location-outline" size={16} color={pageTextColor} style={{ opacity: 0.7 }} />
              )}
              <Text style={[styles.joinDate, { color: pageTextColor, opacity: 0.7 }]}>
                {user.country}
              </Text>
            </View>
          )}
          {activeStatus && activeStreak > 0 && (
            <View style={[styles.streakContainer, { backgroundColor: hexToRgba(pageTextColor, 0.1) }]}>
              <Ionicons name="flame" size={14} color={pageTextColor} />
              <Text style={[styles.streakText, { color: pageTextColor }]}>
                {activeStreak} day{activeStreak !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {showFollowButton && user?.id && (
          <View style={styles.actionButtonsRow}>
            <View style={styles.followButtonContainer}>
              <FollowButton
                userId={user.id}
                onFollowChange={onFollowChange}
              />
            </View>
            <TouchableOpacity
              style={[styles.messageButton, {
                backgroundColor: colorScheme === 'dark' 
                  ? hexToRgba(pageTextColor, 0.15) 
                  : hexToRgba(pageTextColor, 0.1),
                borderWidth: 1,
                borderColor: colorScheme === 'dark' 
                  ? hexToRgba(pageTextColor, 0.3) 
                  : hexToRgba(pageTextColor, 0.2),
                shadowColor: colorScheme === 'dark' ? '#000' : '#000',
                ...Platform.select({
                  ios: {
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                  },
                  android: {
                    elevation: 2,
                  },
                }),
              }]}
              onPress={() => {
                haptics.light();
                router.push(`/chat/${user.id}` as any);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="mail-outline" size={18} color={pageTextColor} />
            </TouchableOpacity>
          </View>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    position: 'relative',
    zIndex: 30,
  },
  bannerContainer: {
    width: '100%',
    height: BANNER_HEIGHT,
    overflow: 'hidden',
    zIndex: 1,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  banner: {
    width: '100%',
    height: '100%',
    opacity: 1,
    zIndex: 1,
  },
  bannerPlaceholder: {
    opacity: 0.8,
  },
  bannerGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  avatarContainer: {
    position: 'absolute',
    top: BANNER_HEIGHT - AVATAR_OFFSET,
    left: Spacing.md,
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    zIndex: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  avatarBorder: {
    width: AVATAR_SIZE + 6,
    height: AVATAR_SIZE + 6,
    borderRadius: (AVATAR_SIZE + 6) / 2,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: 1,
  },
  userInfo: {
    paddingTop: AVATAR_OFFSET + USER_INFO_TOP_PADDING + 6,
    paddingHorizontal: Spacing.md,
    paddingBottom: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  handle: {
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.7,
    letterSpacing: -0.1,
  },
  separator: {
    fontSize: 16,
    opacity: 0.5,
    marginHorizontal: 4,
  },
  occupation: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
    opacity: 0.95,
  },
  bioContainer: {
    marginTop: Spacing.md + 2,
    marginBottom: Spacing.md,
    paddingRight: Spacing.xs,
  },
  bio: {
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: -0.1,
    opacity: 0.9,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    marginBottom: 0,
    gap: Spacing.md + 2,
    flexWrap: 'wrap',
  },
  joinDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  joinDate: {
    fontSize: 14,
    fontWeight: '400',
  },
  countryFlag: {
    fontSize: 16,
    lineHeight: 18,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  streakText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  followButtonContainer: {
    flex: 1,
  },
  messageButton: {
    width: 48,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  contentWarningContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  contentWarningHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  contentWarningIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  contentWarningHeaderText: {
    flex: 1,
    gap: Spacing.xs,
  },
  contentWarningTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  contentWarningText: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.5,
  },
  contentWarningButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: Spacing.xs,
  },
  contentWarningButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.base,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  creatorLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  creatorLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});


