import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export function useFadeIn(duration: number = 300, delay: number = 0) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, duration, delay]);

  return fadeAnim;
}


