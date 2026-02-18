import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '@/constants/theme';

export interface ProfileEditVisualAssetsProps {
  banner: string | null;
  avatar: string | null;
  name: string;
  colors: Record<string, string>;
  colorScheme: 'light' | 'dark' | null;
  isVideoUri: (uri: string | null | undefined) => boolean;
  getInitials: (name: string) => string;
  onPickBanner: () => void;
  onRemoveBanner: () => void;
  onPickAvatar: () => void;
  onRemoveAvatar: () => void;
  onVideoPress: (uri: string, type: 'avatar' | 'banner') => void;
}

export function ProfileEditVisualAssets({
  banner,
  avatar,
  name,
  colors,
  colorScheme,
  isVideoUri,
  getInitials,
  onPickBanner,
  onRemoveBanner,
  onPickAvatar,
  onRemoveAvatar,
  onVideoPress,
}: ProfileEditVisualAssetsProps) {
  return (
    <View style={styles.visualAssetsSection}>
      <View style={styles.bannerSection}>
        <View style={styles.bannerContainer}>
          {banner ? (
            <TouchableOpacity
              activeOpacity={isVideoUri(banner) ? 0.9 : 1}
              onPress={() => isVideoUri(banner) && onVideoPress(banner, 'banner')}
              disabled={!isVideoUri(banner)}
            >
              <ExpoImage
                source={{ uri: banner }}
                style={styles.banner}
                contentFit="cover"
              />
              {isVideoUri(banner) && (
                <View style={styles.videoPlayOverlay}>
                  <Ionicons name="play-circle" size={48} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.banner,
                styles.bannerPlaceholder,
                {
                  backgroundColor:
                    colorScheme === 'dark'
                      ? 'rgba(29, 155, 240, 0.2)'
                      : 'rgba(29, 155, 240, 0.1)',
                },
              ]}
            />
          )}
          <TouchableOpacity
            style={[styles.imageButton, { backgroundColor: colors.surface }]}
            onPress={banner ? onRemoveBanner : onPickBanner}
            activeOpacity={0.7}
          >
            <Ionicons
              name={banner ? 'trash-outline' : 'camera-outline'}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.avatarSection}>
        <View
          style={[
            styles.avatarContainer,
            { borderColor: colors.cardBorder, borderWidth: 4 },
          ]}
        >
          {avatar ? (
            <TouchableOpacity
              activeOpacity={isVideoUri(avatar) ? 0.9 : 1}
              onPress={() => isVideoUri(avatar) && onVideoPress(avatar, 'avatar')}
              disabled={!isVideoUri(avatar)}
              style={styles.avatarTouchable}
            >
              <ExpoImage
                source={{ uri: avatar }}
                style={styles.avatar}
                contentFit="cover"
              />
              {isVideoUri(avatar) && (
                <View style={styles.videoPlayOverlaySmall}>
                  <Ionicons name="play-circle" size={32} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarPlaceholder,
                {
                  backgroundColor:
                    colorScheme === 'dark'
                      ? 'rgba(29, 155, 240, 0.25)'
                      : 'rgba(29, 155, 240, 0.15)',
                },
              ]}
            >
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {getInitials(name || 'U')}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.avatarButton, { backgroundColor: colors.primary }]}
            onPress={avatar ? onRemoveAvatar : onPickAvatar}
            activeOpacity={0.7}
          >
            <Ionicons
              name={avatar ? 'trash-outline' : 'camera-outline'}
              size={16}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  visualAssetsSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  bannerSection: {
    marginBottom: Spacing.lg,
  },
  bannerContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    opacity: 0.5,
  },
  imageButton: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    borderRadius: 50,
    borderWidth: 4,
    padding: 2,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarTouchable: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 1,
  },
  avatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoPlayOverlaySmall: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
