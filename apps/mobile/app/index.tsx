import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { shouldShowOnboarding } from './onboarding';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEntranceAnimation } from '@/hooks/useEntranceAnimation';

const requireAuth = Constants.expoConfig?.extra?.requireAuth === true;

export default function InitialRedirect() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, loading: authLoading, isFirebaseEnabled } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (requireAuth && isFirebaseEnabled) {
        if (authLoading) return;
        if (!mounted) return;
        if (!user) {
          router.replace('/sign-in');
          setChecking(false);
          return;
        }
      }
      try {
        const showOnboarding = await shouldShowOnboarding();
        if (!mounted) return;
        if (showOnboarding) {
          router.replace('/onboarding');
        } else {
          router.replace('/(tabs)');
        }
      } catch {
        if (mounted) router.replace('/(tabs)');
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => { mounted = false; };
  }, [router, user, authLoading, isFirebaseEnabled]);

  const { opacity, scale } = useEntranceAnimation(320, 0);

  if (!checking) return null;
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
