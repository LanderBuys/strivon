import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface NewsCardSkeletonProps {
  featured?: boolean;
}

export function NewsCardSkeleton({ featured }: NewsCardSkeletonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const skeletonBg = { backgroundColor: colors.surface };

  if (featured) {
    return (
      <Animated.View style={[styles.card, styles.cardFeatured, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, opacity: pulseAnim }]}>
        <View style={[styles.featuredImageSkeleton, skeletonBg]} />
        <View style={styles.featuredActionsSkeleton}>
          <View style={[styles.actionSkeleton, skeletonBg]} />
          <View style={[styles.actionSkeleton, skeletonBg]} />
          <View style={[styles.actionSkeleton, skeletonBg]} />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, opacity: pulseAnim }]}>
      {/* Image skeleton */}
      <View style={[styles.imageSkeleton, skeletonBg]} />

      {/* Content skeleton */}
      <View style={styles.content}>
        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={[styles.skeletonLine, styles.sourceSkeleton, skeletonBg]} />
          <View style={[styles.skeletonLine, styles.timeSkeleton, skeletonBg]} />
        </View>

        {/* Title skeleton */}
        <View style={[styles.skeletonLine, styles.titleSkeleton, skeletonBg]} />
        <View style={[styles.skeletonLine, styles.titleSkeleton2, skeletonBg]} />

        {/* Description skeleton */}
        <View style={[styles.skeletonLine, styles.descriptionSkeleton, skeletonBg]} />
        <View style={[styles.skeletonLine, styles.descriptionSkeleton2, skeletonBg]} />

        {/* Tags skeleton */}
        <View style={styles.tagsSkeleton}>
          <View style={[styles.tagSkeleton, skeletonBg]} />
          <View style={[styles.tagSkeleton, skeletonBg]} />
        </View>

        {/* Actions skeleton */}
        <View style={styles.actionsSkeleton}>
          <View style={[styles.actionSkeleton, skeletonBg]} />
          <View style={[styles.actionSkeleton, skeletonBg]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  cardFeatured: {
    marginHorizontal: 0,
    marginBottom: Spacing.md,
  },
  imageSkeleton: {
    width: '100%',
    height: 200,
  },
  featuredImageSkeleton: {
    width: '100%',
    height: 260,
  },
  featuredActionsSkeleton: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  content: {
    padding: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  skeletonLine: {
    borderRadius: 4,
    height: 12,
  },
  sourceSkeleton: {
    width: 80,
  },
  timeSkeleton: {
    width: 60,
  },
  titleSkeleton: {
    width: '90%',
    height: 16,
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  titleSkeleton2: {
    width: '70%',
    height: 16,
    marginBottom: Spacing.sm,
  },
  descriptionSkeleton: {
    width: '100%',
    height: 12,
    marginBottom: Spacing.xs,
  },
  descriptionSkeleton2: {
    width: '85%',
    height: 12,
    marginBottom: Spacing.sm,
  },
  tagsSkeleton: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tagSkeleton: {
    width: 60,
    height: 20,
    borderRadius: BorderRadius.sm,
  },
  actionsSkeleton: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  actionSkeleton: {
    width: 50,
    height: 12,
    borderRadius: 4,
  },
});
