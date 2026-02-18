import { StyleSheet, ScrollView, View, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <ThemedText style={[styles.title, { color: colors.text }]}>Privacy Policy</ThemedText>
          <ThemedText style={[styles.lastUpdated, { color: colors.secondary }]}>
            Last updated: January 2024
          </ThemedText>

          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>1. Information We Collect</ThemedText>
          <ThemedText style={[styles.paragraph, { color: colors.text }]}>
            We collect information that you provide directly to us, including your name, email address, profile information, and any content you post on Strivon.
          </ThemedText>

          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>2. How We Use Your Information</ThemedText>
          <ThemedText style={[styles.paragraph, { color: colors.text }]}>
            We use the information we collect to provide, maintain, and improve our services, process transactions, send you notifications, and personalize your experience.
          </ThemedText>

          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>3. Information Sharing</ThemedText>
          <ThemedText style={[styles.paragraph, { color: colors.text }]}>
            We do not sell your personal information. We may share your information only in the following circumstances:
          </ThemedText>
          <ThemedText style={[styles.listItem, { color: colors.text }]}>
            • With your consent
          </ThemedText>
          <ThemedText style={[styles.listItem, { color: colors.text }]}>
            • To comply with legal obligations
          </ThemedText>
          <ThemedText style={[styles.listItem, { color: colors.text }]}>
            • To protect our rights and safety
          </ThemedText>

          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>4. Data Security</ThemedText>
          <ThemedText style={[styles.paragraph, { color: colors.text }]}>
            We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
          </ThemedText>

          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>5. Your Rights (GDPR)</ThemedText>
          <ThemedText style={[styles.paragraph, { color: colors.text }]}>
            If you are in the European Economic Area, you have the right to access, rectify, port, erase, restrict processing, object to processing, and withdraw consent. You can request a copy of your data or account deletion in the app under Settings, or contact us at privacy@strivon.app. We will respond within 30 days.
          </ThemedText>

          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>6. Data Retention</ThemedText>
          <ThemedText style={[styles.paragraph, { color: colors.text }]}>
            We retain your data for as long as your account is active or as needed to provide services. After account deletion, we remove or anonymize your data within 30 days, except where we must retain it for legal or safety reasons.
          </ThemedText>

          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>7. Contact Us</ThemedText>
          <ThemedText style={[styles.paragraph, { color: colors.text }]}>
            If you have questions about this Privacy Policy, please contact us at privacy@strivon.app
          </ThemedText>
        </View>
      </ScrollView>
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
    fontSize: Typography.lg,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
  },
  title: {
    fontSize: Typography['2xl'],
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  lastUpdated: {
    fontSize: Typography.sm,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  paragraph: {
    fontSize: Typography.base,
    lineHeight: Typography.base * 1.6,
    marginBottom: Spacing.md,
  },
  listItem: {
    fontSize: Typography.base,
    lineHeight: Typography.base * 1.6,
    marginLeft: Spacing.md,
    marginBottom: Spacing.xs,
  },
});


