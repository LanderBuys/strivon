import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Text, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useFadeIn } from '@/hooks/useFadeIn';
import { Animated } from 'react-native';
import { SettingsSkeleton } from '@/components/settings/SettingsSkeleton';

const PRIVACY_SETTINGS_KEY = '@strivon_privacy_settings';

interface PrivacySettings {
  profileVisibility: 'public' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  allowMessages: 'everyone' | 'following' | 'none';
  showOnlineStatus: boolean;
  showReadReceipts: boolean;
  allowTagging: boolean;
  allowReposts: boolean;
}

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    allowMessages: 'everyone',
    showOnlineStatus: true,
    showReadReceipts: true,
    allowTagging: true,
    allowReposts: true,
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
      const stored = await AsyncStorage.getItem(PRIVACY_SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: PrivacySettings) => {
    try {
      await AsyncStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      haptics.light();
      showToast('Settings saved', 'success');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      showToast('Failed to save settings', 'error');
    }
  };

  const SettingRow = ({
    title,
    subtitle,
    value,
    onValueChange,
    type = 'switch',
    options,
  }: {
    title: string;
    subtitle?: string;
    value: any;
    onValueChange: (value: any) => void;
    type?: 'switch' | 'select';
    options?: { label: string; value: any }[];
  }) => (
    <View style={[styles.settingRow, { borderBottomColor: colors.divider }]}>
      <View style={styles.settingRowContent}>
        <Text style={[styles.settingRowTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingRowSubtitle, { color: colors.secondary }]}>{subtitle}</Text>
        )}
      </View>
      {type === 'switch' ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.cardBorder, true: colors.primary + '40' }}
          thumbColor={value ? colors.primary : colors.secondary}
        />
      ) : (
        <TouchableOpacity
          style={[styles.selectButton, { borderColor: colors.cardBorder }]}
          onPress={() => {
            if (options) {
              Alert.alert(
                title,
                'Select an option',
                options.map(opt => ({
                  text: opt.label,
                  onPress: () => onValueChange(opt.value),
                }))
              );
            }
          }}
        >
          <Text style={[styles.selectText, { color: colors.text }]}>
            {options?.find(o => o.value === value)?.label || value}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.secondary} />
        </TouchableOpacity>
      )}
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <SettingsSkeleton />
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Profile</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground }]}>
            <SettingRow
              title="Profile Visibility"
              subtitle="Who can see your profile"
              value={settings.profileVisibility}
              onValueChange={(value) => saveSettings({ ...settings, profileVisibility: value })}
              type="select"
              options={[
                { label: 'Public', value: 'public' },
                { label: 'Private', value: 'private' },
              ]}
            />
            <SettingRow
              title="Show Email"
              subtitle="Display email on profile"
              value={settings.showEmail}
              onValueChange={(value) => saveSettings({ ...settings, showEmail: value })}
            />
            <SettingRow
              title="Show Phone"
              subtitle="Display phone on profile"
              value={settings.showPhone}
              onValueChange={(value) => saveSettings({ ...settings, showPhone: value })}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Messages</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground }]}>
            <SettingRow
              title="Who Can Message You"
              subtitle="Control who can send you messages"
              value={settings.allowMessages}
              onValueChange={(value) => saveSettings({ ...settings, allowMessages: value })}
              type="select"
              options={[
                { label: 'Everyone', value: 'everyone' },
                { label: 'Following Only', value: 'following' },
                { label: 'No One', value: 'none' },
              ]}
            />
            <SettingRow
              title="Show Online Status"
              subtitle="Let others see when you're online"
              value={settings.showOnlineStatus}
              onValueChange={(value) => saveSettings({ ...settings, showOnlineStatus: value })}
            />
            <SettingRow
              title="Read Receipts"
              subtitle="Show when you've read messages"
              value={settings.showReadReceipts}
              onValueChange={(value) => saveSettings({ ...settings, showReadReceipts: value })}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Content</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground }]}>
            <SettingRow
              title="Allow Tagging"
              subtitle="Let others tag you in posts"
              value={settings.allowTagging}
              onValueChange={(value) => saveSettings({ ...settings, allowTagging: value })}
            />
            <SettingRow
              title="Allow Reposts"
              subtitle="Let others repost your content"
              value={settings.allowReposts}
              onValueChange={(value) => saveSettings({ ...settings, allowReposts: value })}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground }]}>
            <TouchableOpacity
              style={[styles.blockedButton, { borderColor: colors.divider }]}
              onPress={() => {
                haptics.light();
                router.push('/settings/blocked-users');
              }}
            >
              <Ionicons name="ban-outline" size={20} color={colors.error} />
              <Text style={[styles.blockedButtonText, { color: colors.error }]}>Blocked Users</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
            </TouchableOpacity>
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingRowContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingRowTitle: {
    fontSize: Typography.base,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingRowSubtitle: {
    fontSize: Typography.sm,
    opacity: 0.7,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  selectText: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  blockedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  blockedButtonText: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: '500',
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

