import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Space } from '@/types/post';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getSpaceInitials, formatMemberCount, formatLastActive } from '@/lib/utils/spaceUtils';

export interface CommunitySpaceCardProps {
  space: Space;
  hasPendingRequest: boolean;
  hasImageError: boolean;
  onPress: (space: Space) => void;
  onLongPress: (space: Space) => void;
  onJoinPress: (spaceId: string) => void;
  onLeavePress: (spaceId: string) => void;
  onImageError: (spaceId: string) => void;
}

export function CommunitySpaceCard({
  space,
  hasPendingRequest,
  hasImageError,
  onPress,
  onLongPress,
  onJoinPress,
  onLeavePress,
  onImageError,
}: CommunitySpaceCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const spaceColor = space.color || colors.primary;
  const isJoined = space.isJoined ?? false;
  const hasUnread = ((space.unreadCount ?? 0) > 0) || false;
  const requiresApproval = Boolean(space.requiresApproval && !isJoined);
  const unreadCount = typeof space.unreadCount === 'number' ? space.unreadCount : 0;

  const handleJoinOrLeave = () => {
    if (isJoined) {
      onLeavePress(space.id);
    } else {
      onJoinPress(space.id);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: isJoined ? colors.primary + '30' : colors.cardBorder,
          borderWidth: isJoined ? 1.5 : StyleSheet.hairlineWidth,
          opacity: space.isMuted ? 0.7 : 1,
        },
      ]}
      onPress={() => onPress(space)}
      onLongPress={() => onLongPress(space)}
      activeOpacity={0.6}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <View style={styles.iconContainer}>
            {space.iconImage && !hasImageError ? (
              <ExpoImage
                source={{ uri: space.iconImage }}
                style={styles.icon}
                contentFit="cover"
                onError={() => onImageError(space.id)}
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[styles.icon, styles.iconPlaceholder, { backgroundColor: spaceColor + '40' }]}>
                <Text style={[styles.iconText, { color: spaceColor, fontWeight: '900' }]}>
                  {getSpaceInitials(space.name)}
                </Text>
              </View>
            )}
            {unreadCount > 0 && (
              <View style={[styles.spaceUnreadBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.spaceUnreadText}>
                  {unreadCount > 99 ? '99+' : String(unreadCount)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.cardInfo}>
            <View style={styles.cardHeader}>
              <View style={styles.nameRow}>
                <Text
                  style={[styles.name, { color: colors.text, fontWeight: hasUnread ? '700' : '600' }]}
                  numberOfLines={1}
                >
                  {space.name || 'Unnamed Space'}
                </Text>
                {Boolean(hasUnread) && (
                  <View style={[styles.unreadDot, { backgroundColor: colors.error }]} />
                )}
              </View>
              <View style={styles.badgesRow}>
                {Boolean(space.isVerified) && (
                  <View style={[styles.verifiedBadge, { backgroundColor: '#1D9BF0' }]}>
                    <IconSymbol name="checkmark" size={8} color="#FFFFFF" />
                  </View>
                )}
                {Boolean(space.isOfficial) && (
                  <View style={[styles.officialBadge, { backgroundColor: '#10B981' }]}>
                    <IconSymbol name="shield-checkmark" size={8} color="#FFFFFF" />
                  </View>
                )}
                {Boolean(isJoined) && (
                  <View style={[styles.joinedIndicator, { backgroundColor: colors.primary }]}>
                    <IconSymbol name="checkmark-circle" size={8} color="#FFFFFF" />
                  </View>
                )}
              </View>
            </View>

            {Boolean(space.description) && (
              <Text style={[styles.description, { color: colors.secondary }]} numberOfLines={2}>
                {String(space.description)}
              </Text>
            )}

            {Boolean(space.category?.trim()) && (
              <View style={[styles.categoryBadge, { backgroundColor: spaceColor + '12' }]}>
                <Text style={[styles.categoryBadgeText, { color: spaceColor }]}>
                  {String(space.category)}
                </Text>
              </View>
            )}

            <View style={styles.meta}>
              <View style={[styles.metaItem, { backgroundColor: colors.spaceBackground }]}>
                <IconSymbol name="people-outline" size={12} color={colors.primary} />
                <Text style={[styles.metaText, { color: colors.text }]}>
                  {space.memberCount != null ? formatMemberCount(space.memberCount) : '0'}
                </Text>
              </View>
              {space.channels?.length ? (
                <View style={[styles.metaItem, { backgroundColor: colors.spaceBackground }]}>
                  <IconSymbol name="grid-outline" size={12} color={colors.primary} />
                  <Text style={[styles.metaText, { color: colors.text }]}>
                    {String(space.channels.length)} channels
                  </Text>
                </View>
              ) : null}
              {typeof space.onlineMembers === 'number' && space.onlineMembers > 0 ? (
                <View style={[styles.metaItem, { backgroundColor: colors.spaceBackground }]}>
                  <View style={[styles.onlineDot, { backgroundColor: '#4ADE80' }]} />
                  <Text style={[styles.metaText, { color: colors.text }]}>
                    {String(space.onlineMembers)} online
                  </Text>
                </View>
              ) : null}
              {formatLastActive(space.lastActivityAt) ? (
                <View style={[styles.metaItem, { backgroundColor: colors.spaceBackground }]}>
                  <IconSymbol name="time-outline" size={12} color={colors.secondary} />
                  <Text style={[styles.metaText, { color: colors.secondary }]}>
                    {formatLastActive(space.lastActivityAt)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.joinButton,
            {
              backgroundColor: isJoined
                ? 'transparent'
                : hasPendingRequest
                  ? colors.secondary + '40'
                  : colors.primary,
              borderColor: isJoined ? colors.cardBorder : 'transparent',
              borderWidth: isJoined ? StyleSheet.hairlineWidth : 0,
              opacity: hasPendingRequest ? 0.6 : 1,
            },
          ]}
          onPress={(e) => {
            e.stopPropagation();
            handleJoinOrLeave();
          }}
          disabled={hasPendingRequest}
          activeOpacity={0.8}
        >
          {!isJoined && !hasPendingRequest && (
            <IconSymbol name="add" size={12} color="#FFFFFF" style={styles.joinButtonIcon} />
          )}
          {hasPendingRequest && (
            <IconSymbol name="time-outline" size={12} color={colors.secondary} style={styles.joinButtonIcon} />
          )}
          <Text
            style={[
              styles.joinButtonText,
              {
                color: isJoined ? colors.text : hasPendingRequest ? colors.secondary : '#FFFFFF',
                fontWeight: isJoined ? '500' : '600',
              },
            ]}
          >
            {isJoined
              ? 'Joined'
              : hasPendingRequest
                ? 'Pending'
                : requiresApproval
                  ? 'Request'
                  : 'Join'}
          </Text>
          {isJoined && (
            <IconSymbol name="checkmark" size={12} color={colors.primary} style={styles.joinButtonIcon} />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    position: 'relative',
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
    }),
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingTop: Spacing.md + 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconContainer: {
    marginRight: Spacing.md,
    position: 'relative',
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  spaceUnreadBadge: {
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
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  spaceUnreadText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  cardInfo: { flex: 1 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.xs / 2,
  },
  name: {
    fontSize: Typography.base,
    fontWeight: '600',
    flex: 1,
    letterSpacing: -0.2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  officialBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  joinedIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.4,
    marginBottom: Spacing.sm,
    opacity: 0.7,
    fontWeight: '400',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  categoryBadgeText: {
    fontSize: Typography.xs - 1,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  metaText: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginLeft: Spacing.sm,
    minWidth: 70,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  },
  joinButtonIcon: { marginHorizontal: 0 },
  joinButtonText: {
    fontSize: Typography.xs + 1,
    letterSpacing: -0.1,
  },
});
