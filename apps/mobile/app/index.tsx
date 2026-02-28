import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { LoadingScreen } from '@/components/LoadingScreen';
import { shouldShowOnboarding } from './onboarding';
import { useAuth } from '@/contexts/AuthContext';
import { isProfileIncomplete } from '@/lib/firestore/users';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function InitialRedirect() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, loading: authLoading, isFirebaseEnabled } = useAuth();
  const [checking, setChecking] = useState(true);
  const [signInImageReady, setSignInImageReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (authLoading) return;
      if (!mounted) return;
      if (isFirebaseEnabled && !user) {
        // Wait for sign-in background image to load so we only show one loading screen
        if (signInImageReady) {
          router.replace('/sign-in?preloaded=1');
          setChecking(false);
        }
        return;
      }
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
        if (!user) return;
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
  }, [router, user, authLoading, isFirebaseEnabled, signInImageReady]);

  // When we need to go to sign-in, preload the background image first so we only show one loading screen
  const needSignIn = isFirebaseEnabled && !user && !authLoading;
  useEffect(() => {
    if (!needSignIn) return;
    setSignInImageReady(false);
    const fallback = setTimeout(() => setSignInImageReady(true), 2500);
    return () => clearTimeout(fallback);
  }, [needSignIn]);

  if (!checking && !needSignIn) return null;
  return (
    <View style={StyleSheet.absoluteFill}>
      {needSignIn ? (
        <>
          <ExpoImage
            source={require('@/assets/strivonbackgroundimage.png')}
            style={[StyleSheet.absoluteFillObject, { opacity: 0 }]}
            onLoad={() => setSignInImageReady(true)}
          />
          <LoadingScreen message="Loading" animated />
        </>
      ) : (
        <View style={[styles.minimalLoader, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  minimalLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

