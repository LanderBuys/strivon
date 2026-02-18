import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useTheme } from '@/contexts/ThemeContext';

type ThemeMode = 'light' | 'dark' | 'system';

export default function AppearanceSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const { themeMode, setThemeMode } = useTheme();
  const { toast, showToast, hideToast } = useToast();

  const handleThemeChange = async (mode: ThemeMode) => {
    try {
      await setThemeMode(mode);
      haptics.light();
      showToast('Theme preference saved', 'success');
    } catch (error) {
      console.error('Error saving theme preference:', error);
      showToast('Failed to save theme preference', 'error');
    }
  };

  const ThemeOption = ({
    mode,
    title,
    subtitle,
    icon,
  }: {
    mode: ThemeMode;
    title: string;
    subtitle: string;
    icon: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.themeOption,
        {
          backgroundColor: colors.cardBackground,
          borderColor: themeMode === mode ? colors.primary : colors.cardBorder,
        },
      ]}
      onPress={() => handleThemeChange(mode)}
      activeOpacity={0.7}
    >
      <View style={[styles.themeIcon, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name={icon as any} size={24} color={colors.primary} />
      </View>
      <View style={styles.themeContent}>
        <Text style={[styles.themeTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.themeSubtitle, { color: colors.secondary }]}>{subtitle}</Text>
      </View>
      {themeMode === mode && (
        <View style={[styles.checkIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Appearance</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Theme</Text>
          <View style={styles.themeOptions}>
            <ThemeOption
              mode="light"
              title="Light"
              subtitle="Always use light theme"
              icon="sunny-outline"
            />
            <ThemeOption
              mode="dark"
              title="Dark"
              subtitle="Always use dark theme"
              icon="moon-outline"
            />
            <ThemeOption
              mode="system"
              title="System"
              subtitle="Follow device settings"
              icon="phone-portrait-outline"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Current Theme</Text>
          <View style={[styles.currentTheme, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.currentThemeContent}>
              <Ionicons
                name={colorScheme === 'dark' ? 'moon' : 'sunny'}
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.currentThemeText, { color: colors.text }]}>
                {colorScheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
            <Text style={[styles.currentThemeSubtext, { color: colors.secondary }]}>
              {themeMode === 'system'
                ? 'Following system preference'
                : themeMode === 'dark'
                ? 'Dark mode enabled'
                : 'Light mode enabled'}
            </Text>
          </View>
        </View>
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
  themeOptions: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.md,
  },
  themeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeContent: {
    flex: 1,
  },
  themeTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  themeSubtitle: {
    fontSize: Typography.sm,
    opacity: 0.7,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentTheme: {
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  currentThemeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  currentThemeText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  currentThemeSubtext: {
    fontSize: Typography.sm,
    marginLeft: 28,
  },
});

