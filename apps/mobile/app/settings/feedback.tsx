import { useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Text, TextInput, KeyboardAvoidingView, Platform, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import { sanitizeText } from '@/lib/utils/sanitize';
import { analyticsService } from '@/lib/services/analyticsService';

const FEEDBACK_EMAIL = 'feedback@strivon.app';

export default function FeedbackScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    const trimmed = sanitizeText(message, 2000);
    if (!trimmed) {
      Alert.alert('Feedback', 'Please enter your message.');
      return;
    }
    setSending(true);
    analyticsService.trackEvent('feedback_submitted', { length: trimmed.length });
    const mailto = `mailto:${FEEDBACK_EMAIL}?subject=Strivon%20Feedback&body=${encodeURIComponent(trimmed)}`;
    Linking.openURL(mailto).then(() => {
      setSending(false);
      haptics.success();
      Alert.alert('Thank you', 'Your feedback has been opened in your email app. Send the email to submit.');
      router.back();
    }).catch(() => {
      setSending(false);
      Alert.alert('Error', 'Could not open email app.');
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Send Feedback</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, { color: colors.secondary }]}>
            Suggestions, bug reports, or anything you'd like us to know.
          </Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
            placeholder="Your feedback..."
            placeholderTextColor={colors.secondary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={2000}
            editable={!sending}
          />
          <Text style={[styles.hint, { color: colors.secondary }]}>{message.length} / 2000</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleSend}
            disabled={sending}
          >
            <Text style={styles.buttonText}>{sending ? 'Opening...' : 'Open in email'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboard: { flex: 1 },
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
  scroll: { flex: 1 },
  content: { padding: Spacing.lg },
  label: { fontSize: Typography.sm, marginBottom: Spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.base,
    minHeight: 140,
    marginBottom: Spacing.xs,
  },
  hint: { fontSize: Typography.xs, marginBottom: Spacing.lg },
  button: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontSize: Typography.base, fontWeight: '600' },
});
