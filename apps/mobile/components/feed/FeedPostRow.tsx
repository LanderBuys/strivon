import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const ENTER_DURATION = 320;
const STAGGER_MS = 45;
const SLIDE_Y = 14;
const MIN_OPACITY = 0;

interface FeedPostRowProps {
  index: number;
  children: React.ReactNode;
  /** Slightly dim seen posts so new content stands out */
  isSeen?: boolean;
  /** When true, show immediately with no enter animation (e.g. after tab/sort change to avoid glitchy wave) */
  skipEnterAnimation?: boolean;
}

const SEEN_OPACITY = 0.92;

/**
 * Wraps a feed post with a subtle enter animation: fade in + slide up, staggered by index.
 * Use skipEnterAnimation when replacing the whole list (tab switch) for a smooth update.
 */
export const FeedPostRow = React.memo(function FeedPostRow({ index, children, isSeen, skipEnterAnimation }: FeedPostRowProps) {
  const targetOpacity = isSeen ? SEEN_OPACITY : 1;
  const opacity = useRef(new Animated.Value(skipEnterAnimation ? targetOpacity : MIN_OPACITY)).current;
  const translateY = useRef(new Animated.Value(skipEnterAnimation ? 0 : SLIDE_Y)).current;
  const hasEnteredRef = useRef(skipEnterAnimation);

  useEffect(() => {
    if (skipEnterAnimation) {
      opacity.setValue(targetOpacity);
      translateY.setValue(0);
      hasEnteredRef.current = true;
      return;
    }
    const delay = Math.min(index * STAGGER_MS, 180);
    const timer = setTimeout(() => {
      hasEnteredRef.current = true;
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: targetOpacity,
          duration: ENTER_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: ENTER_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [index, opacity, translateY, isSeen, skipEnterAnimation, targetOpacity]);

  useEffect(() => {
    if (skipEnterAnimation) return;
    if (!hasEnteredRef.current) return;
    Animated.timing(opacity, {
      toValue: isSeen ? SEEN_OPACITY : 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isSeen, opacity, skipEnterAnimation]);

  return (
    <Animated.View
      style={[styles.wrapper, { opacity, transform: [{ translateY }] }]}
      collapsable={false}
    >
      {children}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 0,
  },
});
