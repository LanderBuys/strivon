import { StyleSheet, ScrollView, View, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

export default function RefundPolicyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Refund Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <ThemedText style={[styles.lastUpdated, { color: colors.secondary }]}>Last updated: February 2025</ThemedText>

        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Subscriptions</ThemedText>
        <ThemedText style={[styles.paragraph, { color: colors.text }]}>
          Subscription charges are billed in advance. If you cancel, you retain access until the end of the current billing period. Refunds for the current period may be requested within 14 days of the charge; approval is at our discretion and subject to applicable law.
        </ThemedText>

        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>App store purchases</ThemedText>
        <ThemedText style={[styles.paragraph, { color: colors.text }]}>
          Refunds for purchases made through the Apple App Store or Google Play are governed by Apple's and Google's respective policies. Request refunds through your device's store settings or our support email.
        </ThemedText>

        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Contact</ThemedText>
        <ThemedText style={[styles.paragraph, { color: colors.text }]}>
          For refund requests or questions: support@strivon.app
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { padding: Spacing.xs },
  headerTitle: { fontSize: Typography.lg, fontWeight: '600', flex: 1, textAlign: 'center' },
  content: { flex: 1 },
  contentContainer: { padding: Spacing.lg },
  lastUpdated: { fontSize: Typography.sm, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: Typography.lg, fontWeight: '600', marginTop: Spacing.lg, marginBottom: Spacing.md },
  paragraph: { fontSize: Typography.base, lineHeight: Typography.base * 1.6, marginBottom: Spacing.md },
});
