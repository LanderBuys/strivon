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
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { sanitizeEmail } from '@/lib/utils/sanitize';
import { validatePassword } from '@/lib/validation/schemas';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const BG_IMAGE = require('@/assets/strivonbackgroundimage.png');

export default function SignUpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { signUp, signInWithGoogle, isFirebaseEnabled, isGoogleSignInEnabled } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState('');

  if (!isFirebaseEnabled) {
    return (
      <ErrorBoundary>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={styles.centered}>
            <Text style={[styles.errorText, { color: colors.secondary }]}>
              Sign-up is not configured. Set Firebase env vars to enable auth.
            </Text>
            <TouchableOpacity style={[styles.backLink, { marginTop: Spacing.lg }]} onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/sign-in'); }}>
              <Text style={{ color: colors.primary }}>Go back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ErrorBoundary>
    );
  }

  const handleSignUp = async () => {
    setError('');
    const e = sanitizeEmail(email);
    if (!e) {
      setError('Please enter a valid email.');
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const cred = await signUp(e, password);
      router.replace(cred.user.emailVerified ? '/complete-profile' : '/verify-email');
    } catch (err: any) {
      const message = err?.message ?? 'Sign-up failed.';
      setError(message.includes('auth/') ? mapAuthError(message) : message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.message ?? 'Google sign-in failed.';
      setError(msg === 'Sign-in was cancelled.' ? '' : msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <ImageBackground source={BG_IMAGE} style={styles.bgImage} resizeMode="cover">
        <SafeAreaView style={styles.container} edges={['top']}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.centeredContent}>
                <View style={styles.header}>
                  <TouchableOpacity
                    onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/sign-in'); }}
                    hitSlop={12}
                    style={styles.backBtn}
                    accessibilityLabel="Go back"
                  >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.title, { color: colors.text }]}>Create account</Text>
                  <Text style={[styles.subtitle, { color: colors.secondary }]}>Join Strivon</Text>
                </View>

                <View style={[styles.formCard, { backgroundColor: colors.background + 'CC' }]}>
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
            <Text style={[styles.label, { color: colors.text, marginTop: Spacing.md }]}>Password (min 8 characters)</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
              <TextInput
                style={[styles.inputInner, { color: colors.text }]}
                placeholder="••••••••"
                placeholderTextColor={colors.secondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
                autoComplete="new-password"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible((v) => !v)}
                hitSlop={12}
                style={styles.eyeButton}
                accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
              >
                <Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.secondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.label, { color: colors.text, marginTop: Spacing.md }]}>Confirm password</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
              <TextInput
                style={[styles.inputInner, { color: colors.text }]}
                placeholder="••••••••"
                placeholderTextColor={colors.secondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!confirmPasswordVisible}
                autoComplete="new-password"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setConfirmPasswordVisible((v) => !v)}
                hitSlop={12}
                style={styles.eyeButton}
                accessibilityLabel={confirmPasswordVisible ? 'Hide password' : 'Show password'}
              >
                <Ionicons name={confirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.secondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handleSignUp}
              disabled={loading || googleLoading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Sign up</Text>}
            </TouchableOpacity>
            {isGoogleSignInEnabled ? (
              <TouchableOpacity
                style={[styles.googleButton, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                onPress={handleGoogleSignIn}
                disabled={loading || googleLoading}
              >
                {googleLoading ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={20} color={colors.text} style={styles.googleIcon} />
                    <Text style={[styles.googleButtonText, { color: colors.text }]}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.secondary }]}>Already have an account? </Text>
              <Link href="/sign-in" asChild>
                <TouchableOpacity>
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>Sign in</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </ErrorBoundary>
  );
}

function mapAuthError(message: string): string {
  if (message.includes('auth/email-already-in-use')) return 'This email is already in use.';
  if (message.includes('auth/invalid-email')) return 'Please enter a valid email.';
  if (message.includes('auth/weak-password')) return 'Please choose a stronger password (min 8 characters).';
  if (message.includes('auth/network-request-failed')) return 'Network error. Check your connection.';
  return 'Sign-up failed. Please try again.';
}

const styles = StyleSheet.create({
  bgImage: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1 },
  keyboard: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  centeredContent: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  backBtn: { marginBottom: Spacing.sm, alignSelf: 'flex-start' },
  header: { marginTop: 40, marginBottom: Spacing.lg, marginLeft: 8, alignItems: 'flex-start' },
  title: { fontSize: Typography.xxl, fontWeight: '700', marginBottom: Spacing.xs, textAlign: 'left' },
  subtitle: { fontSize: Typography.base, textAlign: 'left' },
  formCard: {
    marginTop: Spacing.sm,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  form: { marginTop: 0 },
  label: { fontSize: Typography.sm, fontWeight: '600', marginBottom: Spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingRight: Spacing.xs,
  },
  inputInner: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  errorBox: { padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: Spacing.md },
  errorText: { fontSize: Typography.sm },
  primaryButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonText: { color: '#fff', fontSize: Typography.base, fontWeight: '600' },
  googleButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  googleIcon: { marginRight: Spacing.sm },
  googleButtonText: { fontSize: Typography.base, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xl },
  footerText: { fontSize: Typography.sm },
  backLink: { padding: Spacing.md },
});
