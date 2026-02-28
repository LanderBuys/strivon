import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, AppState, StyleSheet, Platform } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { notificationService, type InAppNotificationPayload } from '@/lib/services/notificationService';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { Colors } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useOffline } from '@/hooks/useOffline';
import '@/lib/i18n';

const IN_APP_BANNER_AUTO_DISMISS_MS = 4500;

const AUTH_ROUTES = new Set(['sign-in', 'sign-up', 'forgot-password', 'onboarding']);

function LayoutContent() {
  const offline = useOffline();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const { user, loading: authLoading, isFirebaseEnabled } = useAuth();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const [inAppNotification, setInAppNotification] = useState<InAppNotificationPayload | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // When app opens or restores a route: if not logged in, always go to sign-in (don't show complete-profile etc.)
  useEffect(() => {
    if (authLoading || !isFirebaseEnabled || user) return;
    const segs = segments as string[];
    const first = segs[0];
    const isIndex = !segs.length || first === 'index';
    if (isIndex || (first && AUTH_ROUTES.has(first))) return;
    router.replace('/sign-in');
  }, [authLoading, isFirebaseEnabled, user, segments]);

  const dismissInApp = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setInAppNotification(null);
  }, []);

  const showInAppBanner = useCallback((payload: InAppNotificationPayload) => {
    if (appStateRef.current !== 'active') return;
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setInAppNotification(payload);
    dismissTimerRef.current = setTimeout(() => {
      dismissTimerRef.current = null;
      setInAppNotification(null);
    }, IN_APP_BANNER_AUTO_DISMISS_MS);
  }, []);

  useEffect(() => {
    notificationService.setInAppNotificationCallback(showInAppBanner);
    return () => notificationService.setInAppNotificationCallback(null);
  }, [showInAppBanner]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    notificationService.initialize();

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      const content = notification.request.content;
      notificationService.addIncomingNotification({
        title: content.title || 'Notification',
        body: content.body || '',
        data: (content.data as Record<string, unknown>) || {},
      });
      notificationService.getUnreadCount().then((count) => {
        notificationService.setBadgeCount(count);
      });
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { link?: string } | undefined;
      if (data?.link) {
        setTimeout(() => router.push(data.link as any), 100);
      }
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as { link?: string } | undefined;
      if (data?.link) {
        setTimeout(() => router.push(data.link as any), 300);
      }
    });

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, []);

  const colors = Colors[colorScheme ?? 'light'];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'default',
        }}
      />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <OfflineBanner visible={offline} />
      {inAppNotification && (
        <Pressable
          style={[styles.inAppBanner, { top: insets.top + 8, backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
          onPress={() => {
            dismissInApp();
            if (inAppNotification.link) {
              setTimeout(() => router.push(inAppNotification.link as any), 50);
            }
          }}
        >
          <Text style={[styles.inAppBannerTitle, { color: colors.text }]} numberOfLines={1}>
            {inAppNotification.title}
          </Text>
          <Text style={[styles.inAppBannerBody, { color: colors.secondary }]} numberOfLines={2}>
            {inAppNotification.body}
          </Text>
        </Pressable>
      )}
    </>
  );
}

export default function RootLayout() {
  try {
    return (
      <ErrorBoundary>
        <AuthProvider>
          <SubscriptionProvider>
          <ThemeProvider>
            <NavigationThemeProvider value={useColorScheme() === 'dark' ? DarkTheme : DefaultTheme}>
              <LayoutContent />
            </NavigationThemeProvider>
          </ThemeProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('RootLayout error:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error loading app: {String(error)}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  inAppBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  inAppBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  inAppBannerBody: {
    fontSize: 13,
  },
});
