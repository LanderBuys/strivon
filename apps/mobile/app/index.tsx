import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { shouldShowOnboarding } from './onboarding';
import { useAuth } from '@/contexts/AuthContext';
import { isProfileIncomplete } from '@/lib/firestore/users';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEntranceAnimation } from '@/hooks/useEntranceAnimation';

export default function InitialRedirect() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, loading: authLoading, isFirebaseEnabled } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (authLoading) return;
      if (!mounted) return;
      // Require login when Firebase is enabled — no anonymous access
      if (isFirebaseEnabled && !user) {
        router.replace('/sign-in');
        setChecking(false);
        return;
      }
      // If Firebase is not configured, allow through (dev fallback)
      if (!isFirebaseEnabled) {
        try {
          const showOnboarding = await shouldShowOnboarding();
          if (!mounted) return;
          if (showOnboarding) router.replace('/onboarding');
          else router.replace('/(tabs)');
        } catch {
          if (mounted) router.replace('/(tabs)');
        }
        setChecking(false);
        return;
      }
      try {
        const showOnboarding = await shouldShowOnboarding();
        if (!mounted) return;
        if (showOnboarding) {
          router.replace('/onboarding');
          setChecking(false);
          return;
        }
        if (!user.emailVerified) {
          router.replace('/verify-email');
          setChecking(false);
          return;
        }
        const profileIncomplete = await isProfileIncomplete(user.uid);
        if (!mounted) return;
        if (profileIncomplete) {
          router.replace('/complete-profile');
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
