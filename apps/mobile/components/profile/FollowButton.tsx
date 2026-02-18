import { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { followUser, unfollowUser, isFollowing } from '@/lib/api/users';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';

interface FollowButtonProps {
  userId: string;
  onFollowChange?: (isFollowing: boolean) => void;
  variant?: 'default' | 'outline';
}

export function FollowButton({ userId, onFollowChange, variant = 'default' }: FollowButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const currentUserId = useCurrentUserId();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadFollowStatus();
  }, [userId]);

  const loadFollowStatus = async () => {
    try {
      const status = await isFollowing(currentUserId, userId);
      setFollowing(status);
    } catch (error) {
      console.error('Error loading follow status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (actionLoading || userId === currentUserId) return;
    
    setActionLoading(true);
    haptics.light();

    try {
      if (following) {
        await unfollowUser(currentUserId, userId);
        setFollowing(false);
        onFollowChange?.(false);
        haptics.success();
      } else {
        await followUser(currentUserId, userId);
        setFollowing(true);
        onFollowChange?.(true);
        haptics.success();
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      haptics.error();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.button, styles.buttonLoading, { backgroundColor: colors.secondary + '40' }]}>
        <ActivityIndicator size="small" color={colors.text} />
      </View>
    );
  }

  if (userId === currentUserId) {
    return null; // Don't show follow button for own profile
  }

  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isOutline && styles.buttonOutline,
        following
          ? {
              backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              borderWidth: 1,
              borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
            }
          : {
              backgroundColor: colors.primary,
            },
        actionLoading && styles.buttonDisabled,
      ]}
      onPress={handleToggleFollow}
      disabled={actionLoading}
      activeOpacity={0.8}
    >
      {actionLoading ? (
        <ActivityIndicator size="small" color={following ? colors.text : '#FFFFFF'} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            isOutline && styles.buttonTextCompact,
            {
              color: following ? colors.text : '#FFFFFF',
              fontWeight: '600',
            },
          ]}
        >
          {following ? 'Following' : 'Follow'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: Spacing.lg + 4,
    paddingVertical: Spacing.xs + 2,
    borderRadius: 18,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  // More compact button used in lists (followers, following, search, suggestions)
  buttonOutline: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    minHeight: 30,
    flex: 0,
    alignSelf: 'flex-start',
  },
  buttonLoading: {
    minHeight: 36,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  buttonTextCompact: {
    fontSize: 13,
  },
});

