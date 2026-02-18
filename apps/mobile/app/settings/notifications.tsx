import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Text, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '@/lib/services/notificationService';
import { NotificationSettings } from '@/types/notification';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useFadeIn } from '@/hooks/useFadeIn';
import { Animated } from 'react-native';
import { SettingsSkeleton } from '@/components/settings/SettingsSkeleton';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    likes: true,
    comments: true,
    replies: true,
    follows: true,
    mentions: true,
    posts: true,
    spaceInvites: true,
    spaceMentions: true,
    achievements: true,
    system: true,
  });
  const [loading, setLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast();
  const fadeAnim = useFadeIn(200);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const loaded = await notificationService.getSettings();
      setSettings(loaded);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationSettings, value: boolean) => {
    try {
      const newSettings = { ...settings, [key]: value };
      await notificationService.updateSettings(newSettings);
      setSettings(newSettings);
      haptics.light();
      showToast('Settings updated', 'success');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      showToast('Failed to update settings', 'error');
    }
  };

  const NotificationRow = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={[styles.notificationRow, { borderBottomColor: colors.divider }]}>
      <View style={[styles.notificationIcon, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name={icon as any} size={20} color={colors.primary} />
      </View>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.notificationSubtitle, { color: colors.secondary }]}>{subtitle}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.cardBorder, true: colors.primary + '40' }}
        thumbColor={value ? colors.primary : colors.secondary}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notification Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <SettingsSkeleton />
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Push Notifications</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground }]}>
            <NotificationRow
              icon="notifications-outline"
              title="Push Notifications"
              subtitle="Enable all push notifications"
              value={settings.pushEnabled}
              onValueChange={(value) => handleToggle('pushEnabled', value)}
            />
          </View>
        </View>

        {settings.pushEnabled && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Interactions</Text>
              <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground }]}>
                <NotificationRow
                  icon="heart-outline"
                  title="Likes"
                  subtitle="When someone likes your post"
                  value={settings.likes}
                  onValueChange={(value) => handleToggle('likes', value)}
                />
                <NotificationRow
                  icon="chatbubble-outline"
                  title="Comments"
                  subtitle="When someone comments on your post"
                  value={settings.comments}
                  onValueChange={(value) => handleToggle('comments', value)}
                />
                <NotificationRow
                  icon="return-down-forward-outline"
                  title="Replies"
                  subtitle="When someone replies to your comment"
                  value={settings.replies}
                  onValueChange={(value) => handleToggle('replies', value)}
                />
                <NotificationRow
                  icon="person-add-outline"
                  title="Follows"
                  subtitle="When someone follows you"
                  value={settings.follows}
                  onValueChange={(value) => handleToggle('follows', value)}
                />
                <NotificationRow
                  icon="at-outline"
                  title="Mentions"
                  subtitle="When someone mentions you"
                  value={settings.mentions}
                  onValueChange={(value) => handleToggle('mentions', value)}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Content</Text>
              <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground }]}>
                <NotificationRow
                  icon="newspaper-outline"
                  title="New Posts"
                  subtitle="From people you follow"
                  value={settings.posts}
                  onValueChange={(value) => handleToggle('posts', value)}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Spaces</Text>
              <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground }]}>
                <NotificationRow
                  icon="mail-outline"
                  title="Space Invites"
                  subtitle="When you're invited to a space"
                  value={settings.spaceInvites}
                  onValueChange={(value) => handleToggle('spaceInvites', value)}
                />
                <NotificationRow
                  icon="at-outline"
                  title="Space Mentions"
                  subtitle="When mentioned in a space"
                  value={settings.spaceMentions}
                  onValueChange={(value) => handleToggle('spaceMentions', value)}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Other</Text>
              <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground }]}>
                <NotificationRow
                  icon="trophy-outline"
                  title="Achievements"
                  subtitle="When you unlock achievements"
                  value={settings.achievements}
                  onValueChange={(value) => handleToggle('achievements', value)}
                />
                <NotificationRow
                  icon="settings-outline"
                  title="System"
                  subtitle="App updates and important notices"
                  value={settings.system}
                  onValueChange={(value) => handleToggle('system', value)}
                />
              </View>
            </View>
          </>
        )}
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
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
    marginTop: Spacing.lg,
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
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: Typography.base,
    fontWeight: '500',
    marginBottom: 2,
  },
  notificationSubtitle: {
    fontSize: Typography.sm,
    opacity: 0.7,
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
});

