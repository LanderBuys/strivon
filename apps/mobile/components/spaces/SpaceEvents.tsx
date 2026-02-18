import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SpaceEvent } from '@/types/post';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from '@/lib/utils/time';

interface SpaceEventsProps {
  spaceId: string;
  events?: SpaceEvent[];
  onEventPress?: (event: SpaceEvent) => void;
}

export function SpaceEvents({ spaceId, events = [], onEventPress }: SpaceEventsProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();

  const upcomingEvents = events.filter(
    event => new Date(event.startTime) > new Date()
  ).sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const handleEventPress = useCallback((event: SpaceEvent) => {
    haptics.light();
    if (onEventPress) {
      onEventPress(event);
    }
  }, [onEventPress, haptics]);

  const renderEvent = useCallback(({ item: event }: { item: SpaceEvent }) => {
    const startDate = new Date(event.startTime);
    const isToday = startDate.toDateString() === new Date().toDateString();
    const isThisWeek = startDate.getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;

    return (
      <TouchableOpacity
        style={[styles.eventItem, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
        onPress={() => handleEventPress(event)}
        activeOpacity={0.7}
      >
        <View style={[styles.eventIcon, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="calendar" size={20} color={colors.primary} />
        </View>
        <View style={styles.eventContent}>
          <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
            {event.title}
          </Text>
          {event.description && (
            <Text style={[styles.eventDescription, { color: colors.secondary }]} numberOfLines={1}>
              {event.description}
            </Text>
          )}
          <View style={styles.eventMeta}>
            <View style={styles.eventMetaItem}>
              <Ionicons name="time-outline" size={12} color={colors.secondary} />
              <Text style={[styles.eventMetaText, { color: colors.secondary }]}>
                {isToday
                  ? `Today at ${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                  : isThisWeek
                  ? startDate.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })
                  : startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </Text>
            </View>
            {event.isOnline ? (
              <View style={styles.eventMetaItem}>
                <Ionicons name="videocam-outline" size={12} color={colors.primary} />
                <Text style={[styles.eventMetaText, { color: colors.primary }]}>Online</Text>
              </View>
            ) : event.location ? (
              <View style={styles.eventMetaItem}>
                <Ionicons name="location-outline" size={12} color={colors.secondary} />
                <Text style={[styles.eventMetaText, { color: colors.secondary }]} numberOfLines={1}>
                  {event.location}
                </Text>
              </View>
            ) : null}
          </View>
          {event.attendees && event.attendees.length > 0 && (
            <View style={styles.attendees}>
              <Text style={[styles.attendeesText, { color: colors.secondary }]}>
                {event.attendees.length} {event.maxAttendees ? `/${event.maxAttendees}` : ''} attending
              </Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
      </TouchableOpacity>
    );
  }, [colors, handleEventPress]);

  if (upcomingEvents.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={32} color={colors.secondary} style={{ opacity: 0.3 }} />
        <Text style={[styles.emptyText, { color: colors.secondary }]}>No upcoming events</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="calendar" size={18} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Upcoming Events</Text>
        <Text style={[styles.count, { color: colors.secondary }]}>{upcomingEvents.length}</Text>
      </View>
      <FlatList
        data={upcomingEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
      />
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
  title: {
    fontSize: Typography.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  count: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  eventDescription: {
    fontSize: Typography.sm,
    marginBottom: Spacing.xs,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventMetaText: {
    fontSize: Typography.xs,
  },
  attendees: {
    marginTop: Spacing.xs,
  },
  attendeesText: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sm,
    marginTop: Spacing.sm,
  },
});



