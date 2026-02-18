import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function SpaceCardSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Shimmer animation
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    // Opacity pulse animation
    const opacity = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    shimmer.start();
    opacity.start();

    return () => {
      shimmer.stop();
      opacity.stop();
    };
  }, [shimmerAnim, opacityAnim]);

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, colorScheme === 'dark' ? 0.1 : 0.3, 0],
  });

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.cardBackground,
      borderColor: colors.cardBorder,
    }]}>
      <Animated.View
        style={[
          styles.base,
          {
            backgroundColor: colors.divider,
            opacity: opacityAnim,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.shimmer,
          {
            backgroundColor: colors.divider,
            transform: [{ translateX: shimmerTranslateX }],
            opacity: shimmerOpacity,
          },
        ]}
      />
      
      {/* Content skeleton */}
      <View style={styles.content}>
        {/* Icon/Image placeholder */}
        <View style={[styles.iconPlaceholder, { backgroundColor: colors.divider }]}>
          <Animated.View
            style={[
              styles.iconBase,
              {
                backgroundColor: colors.divider,
                opacity: opacityAnim,
              },
            ]}
          />
        </View>
        
        {/* Text content */}
        <View style={styles.textContent}>
          <View style={[styles.titleLine, { backgroundColor: colors.divider }]}>
            <Animated.View
              style={[
                styles.lineBase,
                {
                  backgroundColor: colors.divider,
                  opacity: opacityAnim,
                },
              ]}
            />
          </View>
          <View style={[styles.subtitleLine, { backgroundColor: colors.divider }]}>
            <Animated.View
              style={[
                styles.lineBase,
                {
                  backgroundColor: colors.divider,
                  opacity: opacityAnim,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 80,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    position: 'relative',
    overflow: 'hidden',
  },
  base: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '50%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    height: '100%',
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  iconBase: {
    width: '100%',
    height: '100%',
  },
  textContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  titleLine: {
    height: 14,
    borderRadius: 7,
    width: '70%',
    overflow: 'hidden',
    position: 'relative',
  },
  subtitleLine: {
    height: 12,
    borderRadius: 6,
    width: '50%',
    overflow: 'hidden',
    position: 'relative',
  },
  lineBase: {
    width: '100%',
    height: '100%',
  },
});
