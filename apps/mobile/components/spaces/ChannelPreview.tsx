import { useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, Typography } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface ChannelPreviewProps {
  channels: Array<{ id: string; name: string; unreadCount?: number; type?: 'text' | 'voice' | 'announcement' }>;
  spaceId: string;
  maxChannels?: number;
}

export function ChannelPreview({ channels, spaceId, maxChannels = 2 }: ChannelPreviewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const haptics = useHapticFeedback();

  const previewChannels = channels.slice(0, maxChannels);
  const remainingCount = Math.max(0, channels.length - maxChannels);

  const handleChannelPress = useCallback((channel: { id: string; name: string; type?: string }) => {
    haptics.selection();
    const isAnnouncementChannel = Boolean(
      channel.type === 'announcement' || String(channel.name).toLowerCase() === 'announcements'
    );
    if (isAnnouncementChannel) {
      router.push(`/space/${spaceId}/announcements`);
      return;
    }
    router.push({
      pathname: '/space/[spaceId]/channel/[channelId]',
      params: { spaceId, channelId: channel.id },
    });
  }, [router, spaceId, haptics]);

  if (channels.length === 0) {
    return null;
  }

  const totalUnread = channels.reduce((sum, ch) => sum + (ch.unreadCount || 0), 0);

  return (
    <View style={styles.container}>
      {previewChannels.map((channel) => {
        const hasUnread = channel.unreadCount && channel.unreadCount > 0;
        const isAnnouncementChannel = Boolean(
          channel.type === 'announcement' || String(channel.name).toLowerCase() === 'announcements'
        );
        return (
          <TouchableOpacity
            key={channel.id}
            style={[
              styles.channelChip,
              {
                backgroundColor: hasUnread ? colors.primary + '08' : colors.spaceBackground,
                borderColor: hasUnread ? colors.primary + '30' : colors.cardBorder,
                borderWidth: hasUnread ? 1 : StyleSheet.hairlineWidth,
              },
            ]}
            onPress={() => handleChannelPress(channel)}
            activeOpacity={0.7}>
            <IconSymbol
              name={isAnnouncementChannel ? 'megaphone-outline' : 'grid'}
              size={12}
              color={hasUnread ? colors.primary : colors.secondary}
            />
            <Text
              style={[
                styles.channelName,
                {
                  color: hasUnread ? colors.primary : colors.text,
                  fontWeight: hasUnread ? '600' : '500',
                },
              ]}
              numberOfLines={1}>
              {channel.name}
            </Text>
            {hasUnread && channel.unreadCount && channel.unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.unreadBadgeText}>
                  {channel.unreadCount > 9 ? '9+' : channel.unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
      {remainingCount > 0 && (
        <TouchableOpacity
          style={[styles.moreChannels, { backgroundColor: colors.spaceBackground, borderColor: colors.cardBorder }]}
          onPress={() => {
            // Navigate to space detail to see all channels
            router.push({
              pathname: '/space/[id]',
              params: { id: spaceId },
            });
          }}
          activeOpacity={0.7}>
          <Text style={[styles.moreText, { color: colors.secondary }]}>
            +{remainingCount}
          </Text>
          {totalUnread > 0 && (
            <View style={[styles.totalUnreadDot, { backgroundColor: colors.error }]} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  channelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs / 2,
    maxWidth: 120,
  },
  channelName: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
  unreadBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: Spacing.xs / 2,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  moreChannels: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs / 2,
    position: 'relative',
  },
  totalUnreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
});
