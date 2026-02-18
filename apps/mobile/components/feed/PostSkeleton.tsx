import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function PostSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
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
    outputRange: [0, 0.3, 0],
  });

  const SkeletonItem = ({ style, width }: { style?: any; width?: number | string }) => (
    <View style={[styles.skeletonWrapper, style, { width }]}>
      <Animated.View
        style={[
          styles.skeletonBase,
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
            transform: [{ translateX: shimmerTranslateX }],
            opacity: shimmerOpacity,
          },
        ]}
      />
    </View>
  );

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.surface,
      borderColor: colors.divider,
    }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.skeletonWrapper, styles.avatar]}>
          <Animated.View
            style={[
              styles.skeletonBase,
              styles.avatar,
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
                transform: [{ translateX: shimmerTranslateX }],
                opacity: shimmerOpacity,
              },
            ]}
          />
        </View>
        <View style={styles.headerContent}>
          <SkeletonItem width={120} style={styles.line} />
          <SkeletonItem width={80} style={[styles.line, { marginTop: 8 }]} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <SkeletonItem width="100%" style={styles.line} />
        <SkeletonItem width="90%" style={[styles.line, { marginTop: 8 }]} />
        <SkeletonItem width="75%" style={[styles.line, { marginTop: 8 }]} />
      </View>

      {/* Media placeholder */}
      <View style={[styles.skeletonWrapper, styles.media]}>
        <Animated.View
          style={[
            styles.skeletonBase,
            styles.media,
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
              transform: [{ translateX: shimmerTranslateX }],
              opacity: shimmerOpacity,
            },
          ]}
        />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <SkeletonItem width={60} style={styles.actionButton} />
        <SkeletonItem width={60} style={styles.actionButton} />
        <SkeletonItem width={60} style={styles.actionButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderRadius: 16,
    marginVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: Spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  skeletonWrapper: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 6,
  },
  skeletonBase: {
    width: '100%',
    height: '100%',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: '50%',
  },
  line: {
    height: 12,
    borderRadius: 6,
  },
  content: {
    marginBottom: Spacing.md,
  },
  media: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  actionButton: {
    height: 24,
    borderRadius: 12,
  },
});

