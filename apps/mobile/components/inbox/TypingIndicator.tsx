import { View, StyleSheet, Animated, Text } from 'react-native';
import { useEffect, useRef } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing } from '@/constants/theme';

export interface TypingIndicatorProps {
  /** Avatar URL of the person typing */
  avatar?: string | null;
  /** Display name of the person typing */
  name?: string;
}

export function TypingIndicator({ avatar, name }: TypingIndicatorProps = {}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animations = [
      animate(dot1, 0),
      animate(dot2, 200),
      animate(dot3, 400),
    ];

    animations.forEach(anim => anim.start());

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, [dot1, dot2, dot3]);

  const dot1Opacity = dot1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });
  const dot1Scale = dot1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.15],
  });

  const dot2Opacity = dot2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });
  const dot2Scale = dot2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.15],
  });

  const dot3Opacity = dot3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });
  const dot3Scale = dot3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.15],
  });

  return (
    <View style={styles.container}>
      {avatar != null || name ? (
        <View style={[styles.avatarWrapper, { backgroundColor: colors.cardBorder + '30' }]}>
          {avatar ? (
            <ExpoImage source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary + '30' }]}>
              <Text style={[styles.avatarInitial, { color: colors.primary }]} numberOfLines={1}>
                {name ? name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
        </View>
      ) : null}
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <Animated.View 
          style={[
            styles.dot, 
            { 
              backgroundColor: colors.secondary,
              opacity: dot1Opacity,
              transform: [{ scale: dot1Scale }],
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.dot, 
            { 
              backgroundColor: colors.secondary,
              opacity: dot2Opacity,
              transform: [{ scale: dot2Scale }],
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.dot, 
            { 
              backgroundColor: colors.secondary,
              opacity: dot3Opacity,
              transform: [{ scale: dot3Scale }],
            }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.xs,
    gap: 8,
  },
  avatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '600',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
