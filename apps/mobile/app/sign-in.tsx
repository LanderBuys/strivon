import { useState, useEffect } from 'react';
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
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { isProfileIncomplete } from '@/lib/firestore/users';
import { Ionicons } from '@expo/vector-icons';
import { sanitizeEmail } from '@/lib/utils/sanitize';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function SignInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ preloaded?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, signIn, signInWithGoogle, signInWithApple, isFirebaseEnabled } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [backgroundLoaded, setBackgroundLoaded] = useState(params.preloaded === '1');
  const [loadingExiting, setLoadingExiting] = useState(false);

  const handleBackgroundLoad = () => {
    setBackgroundLoaded(true);
    setLoadingExiting(true);
  };

  // If already signed in (e.g. sent here from index because profile incomplete), go to complete-profile or tabs
  useEffect(() => {
    if (!isFirebaseEnabled || !user?.uid) return;
    let mounted = true;
    isProfileIncomplete(user.uid).then((incomplete) => {
      if (!mounted) return;
      router.replace(incomplete ? '/complete-profile' : '/(tabs)');
    });
    return () => { mounted = false; };
  }, [isFirebaseEnabled, user?.uid, router]);

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
      const cred = await signIn(e, password);
      const uid = cred?.user?.uid;
      if (uid) {
        const incomplete = await isProfileIncomplete(uid);
        router.replace(incomplete ? '/complete-profile' : '/(tabs)');
      } else {
        router.replace('/(tabs)');
      }
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

  const handleAppleSignIn = async () => {
    setError('');
    setAppleLoading(true);
    try {
      await signInWithApple();
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.message ?? 'Apple sign-in failed.';
      setError(msg === 'Sign-in was cancelled.' ? '' : msg);
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ExpoImage
          source={require('@/assets/strivonbackgroundimage.png')}
          style={styles.backgroundImage}
          contentFit="cover"
          transition={0}
          onLoad={handleBackgroundLoad}
        />
        {(!backgroundLoaded || loadingExiting) && (
          <View style={StyleSheet.absoluteFill}>
            <LoadingScreen animated visible={!backgroundLoaded} onExitComplete={() => setLoadingExiting(false)} />
          </View>
        )}
        {backgroundLoaded && (
        <SafeAreaView
          style={[
            styles.container,
            loadingExiting && styles.formHidden,
          ]}
          edges={['top']}
          pointerEvents={loadingExiting ? 'none' : 'auto'}
        >
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
                    <TouchableOpacity
                      style={[styles.googleButton, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                      onPress={handleGoogleSignIn}
                      disabled={loading || googleLoading || appleLoading}
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
                    {Platform.OS === 'ios' && (
                      <TouchableOpacity
                        style={[styles.googleButton, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                        onPress={handleAppleSignIn}
                        disabled={loading || googleLoading || appleLoading}
                      >
                        {appleLoading ? (
                          <ActivityIndicator color={colors.text} />
                        ) : (
                          <>
                            <Ionicons name="logo-apple" size={20} color={colors.text} style={styles.googleIcon} />
                            <Text style={[styles.googleButtonText, { color: colors.text }]}>Continue with Apple</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
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
        )}
      </View>
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
  screen: { flex: 1 },
  formHidden: { opacity: 0 },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  container: { flex: 1 },
  keyboard: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  centeredContent: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    alignItems: 'center',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  header: { marginTop: -72, marginBottom: Spacing.lg, alignItems: 'center' },
  title: { fontSize: Typography.xxl, fontWeight: '700', marginBottom: Spacing.xs, textAlign: 'center' },
  subtitle: { fontSize: Typography.base, textAlign: 'center' },
  formCard: {
    alignSelf: 'stretch',
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
