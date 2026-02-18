import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface SuggestedUser {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  bio?: string;
  followers?: number;
}

interface SuggestedUserCardProps {
  user: SuggestedUser;
  onFollow?: (userId: string) => void;
  onDismiss?: (userId: string) => void;
}

export function SuggestedUserCard({ user, onFollow, onDismiss }: SuggestedUserCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [isFollowing, setIsFollowing] = React.useState(false);

  const handleFollow = () => {
    haptics.light();
    setIsFollowing(!isFollowing);
    onFollow?.(user.id);
  };

  const handleDismiss = () => {
    haptics.light();
    onDismiss?.(user.id);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.surface,
      borderColor: colors.divider,
    }]}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Suggested for you</Text>
        <TouchableOpacity
          onPress={handleDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.6}
        >
          <Ionicons name="close" size={18} color={colors.secondary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.userInfo}>
        <View style={[styles.avatarWrapper, { borderColor: colors.border }]}>
          <View style={[styles.avatar, {
            backgroundColor: user.avatar 
              ? 'transparent' 
              : colorScheme === 'dark' 
                ? 'rgba(29, 155, 240, 0.25)' 
                : 'rgba(29, 155, 240, 0.15)'
          }]}>
            {user.avatar ? (
              <ExpoImage
                source={{ uri: user.avatar }}
                style={styles.avatarImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {getInitials(user.name)}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
            {user.name}
          </Text>
          <Text style={[styles.userHandle, { color: colors.secondary }]} numberOfLines={1}>
            {user.handle}
          </Text>
          {user.bio && (
            <Text style={[styles.userBio, { color: colors.secondary }]} numberOfLines={2}>
              {user.bio}
            </Text>
          )}
          {user.followers !== undefined && (
            <Text style={[styles.followerCount, { color: colors.secondary }]}>
              {user.followers > 1000 
                ? `${(user.followers / 1000).toFixed(1)}K followers`
                : `${user.followers} followers`}
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.followButton,
          {
            backgroundColor: isFollowing 
              ? colorScheme === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.05)'
              : colors.primary,
            borderColor: isFollowing ? colors.divider : colors.primary,
          }
        ]}
        onPress={handleFollow}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.followButtonText,
          { color: isFollowing ? colors.text : '#FFFFFF' }
        ]}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  userInfo: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  avatarWrapper: {
    marginRight: Spacing.md,
    borderRadius: 30,
    borderWidth: 2,
    padding: 3,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  userHandle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.xs,
    opacity: 0.7,
  },
  userBio: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.xs,
    opacity: 0.8,
  },
  followerCount: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.6,
  },
  followButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  followButtonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
