import { StyleSheet, ScrollView, View, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

export default function TermsOfServiceScreen() {
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <ThemedText style={[styles.title, { color: colors.text }]}>Terms of Service</ThemedText>
          <ThemedText style={[styles.lastUpdated, { color: colors.secondary }]}>
            Last updated: January 2024
          </ThemedText>

          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>1. Acceptance of Terms</ThemedText>
          <ThemedText style={[styles.paragraph, { color: colors.text }]}>
            By accessing and using Strivon, you accept and agree to be bound by the terms and provision of this agreement.
          </ThemedText>

          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>2. Use License</ThemedText>
          <ThemedText style={[styles.paragraph, { color: colors.text }]}>
            Permission is granted to temporarily use Strivon for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </ThemedText>
          <ThemedText style={[styles.listItem, { color: colors.text }]}>
            • Modify or copy the materials
          </ThemedText>
          <ThemedText style={[styles.listItem, { color: colors.text }]}>
            • Use the materials for any commercial purpose
          </ThemedText>
          <ThemedText style={[styles.listItem, { color: colors.text }]}>
            • Attempt to decompile or reverse engineer any software
          </ThemedText>

          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>3. User Content</ThemedText>
          <ThemedText style={[styles.paragraph, { color: colors.text }]}>
            You are responsible for all content you post on Strivon. You agree not to post content that is illegal, harmful, threatening, abusive, or violates any third-party rights.
          </ThemedText>

          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>4. Privacy</ThemedText>
          <ThemedText style={[styles.paragraph, { color: colors.text }]}>
            Your use of Strivon is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.
          </ThemedText>

          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>5. Termination</ThemedText>
          <ThemedText style={[styles.paragraph, { color: colors.text }]}>
            We may terminate or suspend your account and access to the service immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.
          </ThemedText>

          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>6. Refunds</ThemedText>
          <ThemedText style={[styles.paragraph, { color: colors.text }]}>
            Paid subscriptions and one-time purchases may be refundable in accordance with the applicable app store (Apple App Store, Google Play) refund policies. For subscription refunds, contact us at support@strivon.app within 14 days of charge. Refund policy may vary by region.
          </ThemedText>

          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>7. Contact</ThemedText>
          <ThemedText style={[styles.paragraph, { color: colors.text }]}>
            If you have any questions about these Terms of Service, please contact us at legal@strivon.app
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


