import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, sendVerificationEmail, reloadUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [reloading, setReloading] = useState(false);

  const handleResend = async () => {
    setError('');
    setLoading(true);
    try {
      await sendVerificationEmail();
      setSent(true);
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('too-many-requests')) {
        setError('Please wait about a minute before requesting another email.');
      } else {
        setError(msg || 'Could not send email. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = async () => {
    setError('');
    setReloading(true);
    try {
      await reloadUser();
      router.replace('/(tabs)');
    } catch {
      setError('Could not refresh. Try again or skip for now.');
    } finally {
      setReloading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="mail-open-outline" size={48} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Verify your email</Text>
        <Text style={[styles.subtitle, { color: colors.secondary }]}>
          We sent a verification link to {user?.email ?? 'your email'}. Open the link to verify your account.
        </Text>
        {sent && (
          <View style={[styles.successBox, { backgroundColor: colors.success + '20' }]}>
            <Text style={[styles.successText, { color: colors.success }]}>Verification email sent again.</Text>
          </View>
        )}
        {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={handleResend}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Resend verification email</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={handleVerified}
          disabled={reloading}
        >
          {reloading ? <ActivityIndicator color={colors.primary} /> : <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>I've verified my email</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.skip} onPress={() => router.replace('/(tabs)')}>
          <Text style={{ color: colors.secondary }}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: Spacing.lg, justifyContent: 'center', alignItems: 'center' },
  iconWrap: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl },
  title: { fontSize: Typography.xxl, fontWeight: '700', marginBottom: Spacing.sm, textAlign: 'center' },
  subtitle: { fontSize: Typography.base, textAlign: 'center', marginBottom: Spacing.xl, paddingHorizontal: Spacing.lg },
  successBox: { padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.md },
  successText: { fontSize: Typography.sm },
  errorText: { fontSize: Typography.sm, marginBottom: Spacing.md },
  primaryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    minWidth: 240,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonText: { color: '#fff', fontSize: Typography.base, fontWeight: '600' },
  secondaryButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    minWidth: 240,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 52,
  },
  secondaryButtonText: { fontSize: Typography.base, fontWeight: '600' },
  skip: { marginTop: Spacing.lg },
});
