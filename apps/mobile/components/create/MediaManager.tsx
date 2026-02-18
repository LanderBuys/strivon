import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MEDIA_SIZE = (SCREEN_WIDTH - Spacing.md * 3) / 2;

interface MediaManagerProps {
  media: Array<{ uri: string; type?: string; duration?: number }>;
  onRemove: (index: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

export function MediaManager({ media, onRemove }: MediaManagerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (media.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Media ({media.length}/10)
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mediaList}
      >
        {media.map((item, index) => (
          <View key={index} style={styles.mediaItem}>
            <View style={[styles.mediaPreview, { backgroundColor: colors.background }]}>
              {item.type === 'video' ? (
                <View style={styles.videoContainer}>
                  <Ionicons name="videocam" size={32} color={colors.secondary} />
                  {item.duration && (
                    <View style={[styles.durationBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                      <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <Image source={{ uri: item.uri }} style={styles.image} resizeMode="cover" />
              )}
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: colors.error }]}
                onPress={() => onRemove(index)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.mediaIndex, { color: colors.secondary }]}>
              {index + 1}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  mediaList: {
    gap: Spacing.sm,
  },
  mediaItem: {
    marginRight: Spacing.sm,
  },
  mediaPreview: {
    width: MEDIA_SIZE,
    height: MEDIA_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: Spacing.xs,
    right: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaIndex: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: Spacing.xs / 2,
    fontWeight: '500',
  },
});
