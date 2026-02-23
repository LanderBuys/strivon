import { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Text, Switch, Alert, RefreshControl, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '@/lib/services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SettingsSkeleton } from '@/components/settings/SettingsSkeleton';
import { useEntranceAnimation } from '@/hooks/useEntranceAnimation';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
  showArrow?: boolean;
}

function SettingItem({ icon, title, subtitle, onPress, rightComponent, showArrow = true }: SettingItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.settingItem, { borderBottomColor: colors.divider }]}
        onPress={() => {
          if (onPress) {
            haptics.light();
            onPress();
          }
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={!onPress}
        accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
        accessibilityRole="button"
      >
      <View style={[styles.settingIcon, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name={icon as any} size={20} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: (colors as any).textMuted ?? colors.secondary }]}>{subtitle}</Text>
        )}
      </View>
      {rightComponent && <View style={styles.settingRight}>{rightComponent}</View>}
      {showArrow && onPress && (
        <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
      )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const { opacity, scale } = useEntranceAnimation(260, 0);
  const { signOut, isFirebaseEnabled, isAuthenticated } = useAuth();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await loadSettings();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSettings();
    setRefreshing(false);
    haptics.light();
  };

  const loadSettings = async () => {
    try {
      const settings = await notificationService.getSettings();
      setPushEnabled(settings.pushEnabled);
      const enabled = await notificationService.areNotificationsEnabled();
      setNotificationsEnabled(enabled);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };


  const handleTogglePush = async (value: boolean) => {
    try {
      await notificationService.updateSettings({ pushEnabled: value });
      setPushEnabled(value);
      haptics.light();
      showToast(value ? 'Push notifications enabled' : 'Push notifications disabled', 'success');
    } catch (error) {
      console.error('Error updating push settings:', error);
      showToast('Failed to update settings', 'error');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear cached content (feed, search history, drafts, etc.). Your account settings, privacy, and preferences will be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const keysToKeep = new Set([
                '@strivon_notification_settings',
                '@strivon_expo_push_token',
                '@strivon_onboarding_completed',
                '@strivon_privacy_settings',
                '@strivon_content_filters',
                '@strivon_blocked_users',
                '@strivon_password_hash',
                '@strivon_active_sessions',
                '@strivon_current_session_id',
                '@strivon_user_id',
                '@strivon_user_metrics',
                '@strivon_join_date',
                '@strivon_theme_preference',
                '@strivon_subscription',
                '@strivon_onboarding_completed',
              ]);
              const keepPrefixes = ['@strivon_2fa_', '@strivon_profile_', '@strivon_post_card_'];
              const keysToRemove = keys.filter((key) => {
                if (keysToKeep.has(key)) return false;
                if (keepPrefixes.some((p) => key.startsWith(p))) return false;
                return true;
              });
              await AsyncStorage.multiRemove(keysToRemove);
              haptics.success();
              showToast('Cache cleared successfully', 'success');
            } catch (error) {
              showToast('Failed to clear cache', 'error');
            }
          },
        },
      ]
    );
  };


  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity
            onPress={() => { haptics.light(); router.back(); }}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Back"
            accessibilityRole="button">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {loading ? (
          <SettingsSkeleton />
        ) : (
          <Animated.View style={{ opacity, transform: [{ scale }] }}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: (colors as any).textMuted ?? colors.secondary }]}>Account</Text>
          <View style={[
            styles.sectionContent, 
            { backgroundColor: colors.cardBackground },
            colorScheme === 'light' && { borderColor: colors.cardBorder, ...styles.sectionContentLight }
          ]}>
            <SettingItem
              icon="person-outline"
              title="Edit Profile"
              subtitle="Name, bio, avatar, and more"
              onPress={() => { haptics.light(); router.push('/(tabs)/profile'); }}
            />
            <SettingItem
              icon="people-outline"
              title="Privacy"
              subtitle="Control who can see your content"
              onPress={() => router.push('/settings/privacy')}
            />
            <SettingItem
              icon="shield-checkmark-outline"
              title="Security"
              subtitle="Password, two-factor authentication"
              onPress={() => router.push('/settings/security')}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: (colors as any).textMuted ?? colors.secondary }]}>Notifications</Text>
          <View style={[
            styles.sectionContent, 
            { backgroundColor: colors.cardBackground },
            colorScheme === 'light' && { borderColor: colors.cardBorder, ...styles.sectionContentLight }
          ]}>
            <SettingItem
              icon="notifications-outline"
              title="Push Notifications"
              subtitle="Receive push notifications"
              rightComponent={
                <Switch
                  value={pushEnabled}
                  onValueChange={handleTogglePush}
                  trackColor={{ false: colors.cardBorder, true: colors.primary + '40' }}
                  thumbColor={pushEnabled ? colors.primary : colors.secondary}
                />
              }
              showArrow={false}
            />
            <SettingItem
              icon="settings-outline"
              title="Notification Settings"
              subtitle="Customize notification types"
              onPress={() => router.push('/settings/notifications')}
            />
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: (colors as any).textMuted ?? colors.secondary }]}>Content</Text>
          <View style={[
            styles.sectionContent, 
            { backgroundColor: colors.cardBackground },
            colorScheme === 'light' && { borderColor: colors.cardBorder, ...styles.sectionContentLight }
          ]}>
            <SettingItem
              icon="filter-outline"
              title="Content Filters"
              subtitle="Mute keywords, users, spaces"
              onPress={() => router.push('/settings/content-filters')}
            />
          </View>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: (colors as any).textMuted ?? colors.secondary }]}>App</Text>
          <View style={[
            styles.sectionContent, 
            { backgroundColor: colors.cardBackground },
            colorScheme === 'light' && { borderColor: colors.cardBorder, ...styles.sectionContentLight }
          ]}>
            <SettingItem
              icon="color-palette-outline"
              title="Appearance"
              subtitle={colorScheme === 'dark' ? 'Dark mode' : 'Light mode'}
              onPress={() => router.push('/settings/appearance')}
            />
            <SettingItem
              icon="trash-outline"
              title="Clear Cache"
              subtitle="Free up storage space"
              onPress={handleClearCache}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: (colors as any).textMuted ?? colors.secondary }]}>Support</Text>
          <View style={[
            styles.sectionContent, 
            { backgroundColor: colors.cardBackground },
            colorScheme === 'light' && { borderColor: colors.cardBorder, ...styles.sectionContentLight }
          ]}>
            <SettingItem
              icon="flag-outline"
              title="Report queue"
              subtitle="Review reported content — remove or keep"
              onPress={() => router.push('/settings/report-queue')}
            />
            <SettingItem
              icon="help-circle-outline"
              title="Help Center"
              onPress={() => router.push('/settings/help')}
            />
            <SettingItem
              icon="chatbubble-ellipses-outline"
              title="Send Feedback"
              subtitle="Suggestions and bug reports"
              onPress={() => router.push('/settings/feedback')}
            />
            <SettingItem
              icon="document-text-outline"
              title="Terms of Service"
              onPress={() => router.push('/settings/terms')}
            />
            <SettingItem
              icon="lock-closed-outline"
              title="Privacy Policy"
              onPress={() => router.push('/settings/privacy-policy')}
            />
            <SettingItem
              icon="card-outline"
              title="Refund Policy"
              onPress={() => router.push('/settings/refund-policy')}
            />
            <SettingItem
              icon="star-outline"
              title="Subscription Info"
              subtitle="Learn about plans and features"
              onPress={() => router.push('/settings/subscription-info')}
            />
            <SettingItem
              icon="trophy-outline"
              title="Badges"
              subtitle="View all available badges"
              onPress={() => router.push('/settings/badges')}
            />
            <SettingItem
              icon="information-circle-outline"
              title="About"
              subtitle="Version 2.0.0"
              onPress={() => {
                Alert.alert('Strivon', 'Version 2.0.0\nA modern social platform for entrepreneurs, builders, and creators.');
              }}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={[
            styles.sectionContent, 
            { backgroundColor: colors.cardBackground },
            colorScheme === 'light' && { borderColor: colors.cardBorder, ...styles.sectionContentLight }
          ]}>
            <SettingItem
              icon="download-outline"
              title="Export my data"
              subtitle="GDPR: get a copy of your data"
              onPress={() => {
                Alert.alert(
                  'Export Data',
                  'To request a copy of your data, email us at privacy@strivon.app with the subject "Data export request". We will respond within 30 days.'
                );
              }}
            />
            <SettingItem
              icon="trash-outline"
              title="Delete account"
              subtitle="Permanently remove account and data"
              onPress={() => {
                Alert.alert(
                  'Delete Account',
                  'To permanently delete your account and data, contact us at privacy@strivon.app with the subject "Account deletion". This action cannot be undone.'
                );
              }}
            />
            {isFirebaseEnabled && isAuthenticated && (
            <SettingItem
              icon="log-out-outline"
              title="Sign Out"
              onPress={() => {
                Alert.alert(
                  'Sign Out',
                  'Are you sure you want to sign out?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Sign Out',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await signOut();
                          await AsyncStorage.multiRemove([
                            '@strivon_auth_token',
                            '@strivon_user_data',
                          ]);
                          haptics.success();
                          showToast('Signed out', 'success');
                          router.replace('/');
                        } catch (error: any) {
                          showToast(error?.message ?? 'Failed to sign out', 'error');
                        }
                      },
                    },
                  ]
                );
              }}
            />
            )}
            {isFirebaseEnabled && !isAuthenticated && (
            <SettingItem
              icon="log-in-outline"
              title="Sign In"
              onPress={() => router.push('/sign-in')}
            />
            )}
          </View>
        </View>
          </Animated.View>
        )}
      </ScrollView>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    opacity: 0.6,
  },
  sectionContent: {
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    overflow: 'hidden',
  },
  sectionContentLight: {
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingVertical: Spacing.md + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  settingSubtitle: {
    fontSize: Typography.sm,
    opacity: 0.65,
    lineHeight: Typography.sm * 1.3,
  },
  settingRight: {
    marginRight: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.sm,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: Typography.xs,
    fontWeight: '700',
  },
});


