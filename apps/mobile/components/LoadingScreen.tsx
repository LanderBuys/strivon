import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const ENTRANCE_DURATION = 560;
const EXIT_DURATION = 300;
const STAGGER_MS = 90;

const easeOutCubic = Easing.bezier(0.33, 1, 0.68, 1);
const easeOutQuart = Easing.bezier(0.25, 1, 0.5, 1);

interface LoadingScreenProps {
  /** Optional short message under the spinner */
  message?: string;
  /** Animate in on mount */
  animated?: boolean;
  /** When false, run exit then onExitComplete */
  visible?: boolean;
  onExitComplete?: () => void;
}

export function LoadingScreen({
  message,
  animated = true,
  visible = true,
  onExitComplete,
}: LoadingScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isExiting, setIsExiting] = useState(false);

  const opacity = useRef(new Animated.Value(animated && visible ? 0 : 1)).current;
  const scale = useRef(new Animated.Value(animated && visible ? 0.9 : 1)).current;
  const brandOpacity = useRef(new Animated.Value(animated && visible ? 0 : 1)).current;
  const brandY = useRef(new Animated.Value(animated && visible ? 20 : 0)).current;
  const ringOpacity = useRef(new Animated.Value(animated && visible ? 0 : 1)).current;
  const ringY = useRef(new Animated.Value(animated && visible ? 16 : 0)).current;
  const messageOpacity = useRef(new Animated.Value(animated && visible ? 0 : 1)).current;
  const messageY = useRef(new Animated.Value(animated && visible ? 12 : 0)).current;

  const bar1 = useRef(new Animated.Value(0)).current;
  const bar2 = useRef(new Animated.Value(0)).current;
  const bar3 = useRef(new Animated.Value(0)).current;
  const prevVisible = useRef(visible);
  const exitDone = useRef(false);

  useEffect(() => {
    const duration = 520;
    const delay = 160;
    const createPulse = (anim: Animated.Value, startDelay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(startDelay),
          Animated.timing(anim, {
            toValue: 1,
            duration: duration / 2,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: duration / 2,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      );
    const a1 = createPulse(bar1, 0);
    const a2 = createPulse(bar2, delay);
    const a3 = createPulse(bar3, delay * 2);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [bar1, bar2, bar3]);

  const dotScale = (anim: Animated.Value) =>
    anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const scale1 = dotScale(bar1);
  const scale2 = dotScale(bar2);
  const scale3 = dotScale(bar3);

  useEffect(() => {
    if (!animated || !visible) return;
    const t = ENTRANCE_DURATION;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: t, easing: easeOutCubic, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: t, easing: easeOutQuart, useNativeDriver: true }),
      Animated.timing(brandOpacity, { toValue: 1, duration: t - 180, delay: 0, easing: easeOutCubic, useNativeDriver: true }),
      Animated.timing(brandY, { toValue: 0, duration: t - 180, delay: 0, easing: easeOutQuart, useNativeDriver: true }),
      Animated.timing(ringOpacity, { toValue: 1, duration: t - 180, delay: STAGGER_MS, easing: easeOutCubic, useNativeDriver: true }),
      Animated.timing(ringY, { toValue: 0, duration: t - 180, delay: STAGGER_MS, easing: easeOutQuart, useNativeDriver: true }),
      Animated.timing(messageOpacity, { toValue: 1, duration: t - 180, delay: STAGGER_MS * 2, easing: easeOutCubic, useNativeDriver: true }),
      Animated.timing(messageY, { toValue: 0, duration: t - 180, delay: STAGGER_MS * 2, easing: easeOutQuart, useNativeDriver: true }),
    ]).start();
  }, [animated, visible, opacity, scale, brandOpacity, brandY, ringOpacity, ringY, messageOpacity, messageY]);

  useEffect(() => {
    if (prevVisible.current === true && visible === false && !exitDone.current) {
      prevVisible.current = false;
      setIsExiting(true);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: EXIT_DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.92, duration: EXIT_DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start(() => {
        exitDone.current = true;
        onExitComplete?.();
      });
    }
    if (visible) prevVisible.current = true;
  }, [visible, opacity, scale, onExitComplete]);

  const quoteColor = colors.textMuted;
  const dotColor = colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} pointerEvents={isExiting ? 'none' : 'auto'}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <Animated.View style={[styles.brandBlock, { opacity: brandOpacity, transform: [{ translateY: brandY }] }]}>
          <Text style={[styles.brand, { color: colors.text }]}>Strivon</Text>
          <View style={styles.quoteWrap}>
            <View style={[styles.quoteLine, { backgroundColor: quoteColor }]} />
            <Text style={[styles.quote, { color: quoteColor }]}>Build what matters.</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.loaderWrap, { opacity: ringOpacity, transform: [{ translateY: ringY }] }]}>
          <Animated.View style={[styles.dot, { backgroundColor: dotColor, transform: [{ scale: scale1 }] }]} />
          <Animated.View style={[styles.dot, { backgroundColor: dotColor, transform: [{ scale: scale2 }] }]} />
          <Animated.View style={[styles.dot, { backgroundColor: dotColor, transform: [{ scale: scale3 }] }]} />
        </Animated.View>

        {message ? (
          <Animated.View style={{ opacity: messageOpacity, transform: [{ translateY: messageY }] }}>
            <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBlock: {
    alignItems: 'center',
    width: '100%',
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  quoteWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: Spacing.md,
  },
  quoteLine: {
    width: 32,
    height: 1.5,
    borderRadius: 1,
    marginBottom: Spacing.md,
  },
  quote: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  loaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  message: {
    fontSize: Typography.xs,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
