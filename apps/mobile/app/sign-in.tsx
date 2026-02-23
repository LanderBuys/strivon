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
import { ErrorBoundary } from '@/components/ErrorBoundary';

const BG_IMAGE = require('@/assets/strivonbackgroundimage.png');

export default function SignInScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { signIn, signInWithGoogle, isFirebaseEnabled, isGoogleSignInEnabled } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');

  if (!isFirebaseEnabled) {
    return (
      <ErrorBoundary>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={styles.centered}>
            <Text style={[styles.errorText, { color: colors.secondary }]}>
              Sign-in is not configured. Set Firebase env vars to enable auth.
            </Text>
            <TouchableOpacity style={[styles.backLink, { marginTop: Spacing.lg }]} onPress={() => router.replace('/')}>
              <Text style={{ color: colors.primary }}>Go back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ErrorBoundary>
    );
  }

  const handleSignIn = async () => {
    setError('');
    const e = sanitizeEmail(email);
    if (!e) {
      setError('Please enter a valid email.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(e, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      const message = err?.message ?? 'Sign-in failed. Check your email and password.';
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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboard}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.centeredContent}>
                <View style={styles.header}>
                  <Text style={[styles.title, { color: colors.text }]}>Sign in</Text>
                  <Text style={[styles.subtitle, { color: colors.secondary }]}>Welcome back to Strivon</Text>
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
                    <Text style={[styles.label, { color: colors.text, marginTop: Spacing.md }]}>Password</Text>
                    <View style={[styles.inputRow, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                      <TextInput
                        style={[styles.inputInner, { color: colors.text }]}
                        placeholder="••••••••"
                        placeholderTextColor={colors.secondary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!passwordVisible}
                        autoComplete="password"
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
                    <TouchableOpacity
                      style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                      onPress={handleSignIn}
                      disabled={loading || googleLoading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Sign in</Text>
                      )}
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
                    <Link href="/forgot-password" asChild>
                      <TouchableOpacity style={styles.linkButton}>
                        <Text style={{ color: colors.primary }}>Forgot password?</Text>
                      </TouchableOpacity>
                    </Link>
                    <View style={styles.footer}>
                      <Text style={[styles.footerText, { color: colors.secondary }]}>Don't have an account? </Text>
                      <Link href="/sign-up" asChild>
                        <TouchableOpacity>
                          <Text style={{ color: colors.primary, fontWeight: '600' }}>Sign up</Text>
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
  if (message.includes('auth/user-not-found') || message.includes('auth/wrong-password')) return 'Invalid email or password.';
  if (message.includes('auth/invalid-email')) return 'Please enter a valid email.';
  if (message.includes('auth/too-many-requests')) return 'Too many attempts. Try again later.';
  if (message.includes('auth/network-request-failed')) return 'Network error. Check your connection.';
  return 'Sign-in failed. Please try again.';
}

const styles = StyleSheet.create({
  bgImage: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1 },
  keyboard: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 140,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  centeredContent: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginLeft: 14,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  header: { marginBottom: Spacing.lg, marginLeft: 8, alignItems: 'flex-start' },
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
  errorBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
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
  linkButton: { marginTop: Spacing.md, alignItems: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xl },
  footerText: { fontSize: Typography.sm },
  backLink: { padding: Spacing.md },
});
