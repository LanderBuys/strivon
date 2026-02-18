import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Returns opacity and scale animated values for a gentle entrance (fade in + slight scale up).
 * Use for modals, sheets, or screen content to feel more polished.
 */
export function useEntranceAnimation(duration: number = 280, delay: number = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, duration, delay]);

  return { opacity, scale };
}
