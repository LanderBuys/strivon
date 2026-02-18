import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { sanitizeEmail } from '@/lib/utils/sanitize';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { sendPasswordReset, isFirebaseEnabled } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  if (!isFirebaseEnabled) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.secondary }]}>Password reset is not configured.</Text>
          <TouchableOpacity style={[styles.backLink, { marginTop: Spacing.lg }]} onPress={() => router.back()}>
            <Text style={{ color: colors.primary }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSubmit = async () => {
    setError('');
    const e = sanitizeEmail(email);
    if (!e) {
      setError('Please enter a valid email.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(e);
      setSent(true);
    } catch (err: any) {
      setError(err?.message?.includes('auth/') ? 'Could not send reset email. Check the email address.' : (err?.message ?? 'Something went wrong.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Forgot password?</Text>
          <Text style={[styles.subtitle, { color: colors.secondary }]}>
            Enter your email and we'll send you a link to reset your password.
          </Text>

          {sent ? (
            <View style={[styles.successBox, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
              <Text style={[styles.successText, { color: colors.success }]}>
                Check your email for a reset link. You can close this screen.
              </Text>
              <TouchableOpacity style={styles.linkButton} onPress={() => router.back()}>
                <Text style={{ color: colors.primary }}>Back to sign in</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              {error ? (
                <View style={[styles.errorBox, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </View>
              ) : null}
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                placeholder="you@example.com"
                placeholderTextColor={colors.secondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Send reset link</Text>}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboard: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: Spacing.lg, paddingBottom: Spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  backBtn: { marginBottom: Spacing.lg },
  title: { fontSize: Typography.xxl, fontWeight: '700', marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.base, marginBottom: Spacing.xl },
  form: { marginTop: Spacing.md },
  label: { fontSize: Typography.sm, fontWeight: '600', marginBottom: Spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    marginBottom: Spacing.md,
  },
  errorBox: { padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: Spacing.md },
  errorText: { fontSize: Typography.sm },
  successBox: { padding: Spacing.lg, borderRadius: BorderRadius.md, borderWidth: 1, marginTop: Spacing.md },
  successText: { fontSize: Typography.base, marginBottom: Spacing.md },
  primaryButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonText: { color: '#fff', fontSize: Typography.base, fontWeight: '600' },
  linkButton: { marginTop: Spacing.md },
  backLink: { padding: Spacing.md },
});
