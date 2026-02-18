import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export function useStaggeredFadeIn(count: number, delay: number = 50) {
  const anims = useRef(
    Array.from({ length: count }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = anims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * delay,
        useNativeDriver: true,
      })
    );

    Animated.stagger(delay, animations).start();
  }, [anims, delay, count]);

  return anims;
}


