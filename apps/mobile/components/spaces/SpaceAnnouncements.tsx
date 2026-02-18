import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Space } from '@/types/post';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from '@/lib/utils/time';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { getSpaceAnnouncements, SpaceAnnouncement } from '@/lib/services/spaceAnnouncementService';

interface SpaceAnnouncementsProps {
  space: Space;
  onAnnouncementPress?: (announcement: SpaceAnnouncement) => void;
}

export function SpaceAnnouncements({ space, onAnnouncementPress }: SpaceAnnouncementsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const router = useRouter();
  const currentUserId = useCurrentUserId();

  const isOwner = Boolean(
    space.ownerId &&
      (space.ownerId === currentUserId || space.ownerId === `user-${currentUserId}`)
  );

  const [announcements, setAnnouncements] = useState<SpaceAnnouncement[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getSpaceAnnouncements(space.id);
      setAnnouncements(list);
    } finally {
      setLoading(false);
    }
  }, [space.id]);

  useFocusEffect(
    useCallback(() => {
      reload();
      return () => {};
    }, [reload])
  );

  // On the space screen we only show a single preview item.
  const visibleAnnouncements = useMemo(() => announcements.slice(0, 1), [announcements]);

  const renderAnnouncement = useCallback((announcement: SpaceAnnouncement) => (
    // Preview row
    <TouchableOpacity
      key={announcement.id}
      style={[styles.announcementItem, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
      onPress={() => {
        haptics.light();
        onAnnouncementPress?.(announcement);
        router.push(`/space/${space.id}/announcements`);
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.announcementIcon, { backgroundColor: colors.error + '15' }]}>
        <Ionicons name="megaphone" size={18} color={colors.error} />
      </View>
      <View style={styles.announcementContent}>
        <View style={styles.announcementHeader}>
          <Text style={[styles.announcementTitle, { color: colors.text }]} numberOfLines={1}>
            {announcement.title}
          </Text>
        </View>
        <Text style={[styles.announcementDescription, { color: colors.secondary }]} numberOfLines={2}>
          {announcement.body || (announcement.media && announcement.media.length > 0 ? 'Media' : '')}
        </Text>
      </View>
      <View style={styles.announcementRight}>
        {announcement.media && announcement.media.length > 0 ? (
          <View style={[styles.mediaHint, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
            <Ionicons name="images-outline" size={12} color={colors.primary} />
            <Text style={[styles.mediaHintText, { color: colors.primary }]}>{announcement.media.length}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={colors.secondary} />
        <Text style={[styles.announcementTime, { color: colors.secondary }]}>
          {formatDistanceToNow(announcement.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  ), [colors, haptics, onAnnouncementPress, router, space.id]);

  // Always show the section so users can discover it, even when empty.

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="megaphone" size={18} color={colors.error} />
        <Text style={[styles.title, { color: colors.text }]}>Announcements</Text>
        {loading && <ActivityIndicator size="small" color={colors.secondary} style={styles.loadingSpinner} />}
        {isOwner && (
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              router.push(
                `/space/${space.id}/announcement-compose`
              );
            }}
            activeOpacity={0.7}
            style={styles.viewAllButton}
          >
            <Text style={[styles.viewAllText, { color: colors.primary }]}>Post</Text>
          </TouchableOpacity>
        )}
        {!isOwner && (
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              router.push(`/space/${space.id}/announcements`);
            }}
            activeOpacity={0.7}
            style={styles.viewAllButton}
          >
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View</Text>
          </TouchableOpacity>
        )}
      </View>

      {visibleAnnouncements.length === 0 ? (
        <View style={[styles.emptyOwnerCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <View style={[styles.announcementIcon, { backgroundColor: colors.error + '15' }]}>
            <Ionicons name="megaphone" size={18} color={colors.error} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.announcementTitle, { color: colors.text }]} numberOfLines={1}>
              No announcements yet
            </Text>
            <Text style={[styles.announcementDescription, { color: colors.secondary }]} numberOfLines={2}>
              {isOwner ? 'Post an update for your members.' : 'Check back later for updates.'}
            </Text>
          </View>
          {isOwner ? (
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                router.push(`/space/${space.id}/announcement-compose`);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>Post</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                router.push(`/space/${space.id}/announcements`);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.listContent}>
          {visibleAnnouncements.map(renderAnnouncement)}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  loadingSpinner: {
    marginLeft: Spacing.xs,
  },
  viewAllButton: {
    marginLeft: 'auto',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  viewAllText: {
    fontSize: Typography.sm,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  announcementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  announcementIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementContent: {
    flex: 1,
  },
  announcementRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  mediaHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  mediaHintText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  announcementTitle: {
    fontSize: Typography.sm,
    fontWeight: '800',
    letterSpacing: -0.2,
    flex: 1,
    textAlign: 'left',
  },
  announcementBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  announcementBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  announcementDescription: {
    fontSize: Typography.xs,
    marginBottom: Spacing.xs,
    lineHeight: Typography.xs * 1.45,
    fontWeight: '600',
    opacity: 0.9,
  },
  announcementTime: {
    fontSize: Typography.xs,
  },
  emptyOwnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
    marginHorizontal: Spacing.md,
  },
});



