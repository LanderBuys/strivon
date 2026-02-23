import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { getFirebaseAuth } from '@/lib/firebase';
import { isProfileIncomplete } from '@/lib/firestore/users';
import { Ionicons } from '@expo/vector-icons';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const BG_IMAGE = require('@/assets/strivonbackgroundimage.png');

export default function VerifyEmailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, sendVerificationEmail, reloadUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [reloading, setReloading] = useState(false);
  const sentInitial = useRef(false);

  useEffect(() => {
    if (!user?.uid || user?.emailVerified || !user?.email || sentInitial.current) {
      if (user?.uid && !user?.emailVerified) setLoading(false);
      return;
    }
    sentInitial.current = true;
    setLoading(true);
    setError('');
    sendVerificationEmail()
      .then(() => {
        setSent(true);
        setError('');
      })
      .catch((e: any) => {
        const msg = e?.message ?? '';
        if (msg.includes('too-many-requests')) {
          setError('Too many attempts. Wait a minute and use Resend.');
        } else {
          setError(msg || 'Could not send. Check connection and try Resend.');
        }
      })
      .finally(() => setLoading(false));
  }, [user?.uid, user?.emailVerified, user?.email]);

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

  const goNext = async () => {
    const auth = getFirebaseAuth();
    const uid = auth?.currentUser?.uid;
    if (!uid) {
      router.replace('/(tabs)');
      return;
    }
    try {
      const incomplete = await isProfileIncomplete(uid);
      router.replace(incomplete ? '/complete-profile' : '/(tabs)');
    } catch {
      router.replace('/(tabs)');
    }
  };

  const handleVerified = async () => {
    setError('');
    setReloading(true);
    try {
      await reloadUser();
      const auth = getFirebaseAuth();
      if (auth?.currentUser?.emailVerified) {
        await goNext();
      } else {
        setError('Still not verified. Open the link in your email, then tap again.');
      }
    } catch (e: any) {
      setError(e?.message || 'Could not refresh. Try again.');
    } finally {
      setReloading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await goNext();
    } catch {
      router.replace('/(tabs)');
    }
  };

  const displayEmail = user?.email ?? 'your email';

  return (
    <ErrorBoundary>
      <ImageBackground source={BG_IMAGE} style={styles.bgImage} resizeMode="cover">
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.replace('/sign-in')}
              hitSlop={12}
              style={styles.backBtn}
              accessibilityLabel="Go back"
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Verify email</Text>
            <Text style={[styles.headerSubtitle, { color: colors.secondary }]}>
              One quick step to secure your account
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.card, { backgroundColor: colors.background + 'E0' }]}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name="mail-unread-outline" size={44} color={colors.primary} />
              </View>

              <Text style={[styles.lead, { color: colors.secondary }]}>
                We sent a verification link to:
              </Text>
              <View style={[styles.emailPill, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                <Ionicons name="mail-outline" size={18} color={colors.primary} style={styles.emailIcon} />
                <Text style={[styles.emailText, { color: colors.text }]} numberOfLines={1}>{displayEmail}</Text>
              </View>

              {loading && !sent ? (
                <View style={[styles.sendingRow, { backgroundColor: colors.primary + '12' }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.sendingText, { color: colors.primary }]}>Sending link…</Text>
                </View>
              ) : null}

              {sent && !loading && (
                <View style={[styles.badge, { backgroundColor: colors.success + '18', borderColor: colors.success + '50' }]}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={[styles.badgeText, { color: colors.success }]}>Link sent — check your inbox and spam</Text>
                </View>
              )}

              <Text style={[styles.stepsLabel, { color: colors.secondary }]}>What to do</Text>
              <View style={[styles.stepsBox, { backgroundColor: colors.inputBackground + '80', borderColor: colors.inputBorder }]}>
                <View style={styles.stepRow}>
                  <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepNumText}>1</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.text }]}>Open the email (inbox or spam)</Text>
                </View>
                <View style={styles.stepRow}>
                  <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepNumText}>2</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.text }]}>Tap the link in the email</Text>
                </View>
                <View style={styles.stepRow}>
                  <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepNumText}>3</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.text }]}>Return here and tap “I’ve verified”</Text>
                </View>
              </View>

              {error ? (
                <View style={[styles.errorBox, { backgroundColor: colors.error + '15', borderColor: colors.error + '50' }]}>
                  <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={handleVerified}
                disabled={reloading}
                activeOpacity={0.8}
              >
                {reloading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done-outline" size={22} color="#fff" style={styles.btnIcon} />
                    <Text style={styles.primaryBtnText}>I’ve verified my email</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}
                onPress={handleResend}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <>
                    <Ionicons name="refresh-outline" size={20} color={colors.primary} style={styles.btnIcon} />
                    <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>Resend email</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
                <Text style={[styles.skipText, { color: colors.secondary }]}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  bgImage: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  backBtn: { marginBottom: Spacing.sm },
  headerTitle: {
    fontSize: Typography.xxl,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    lineHeight: 20,
  },
  scrollContent: { flexGrow: 1, padding: Spacing.lg, paddingBottom: Spacing.xxl },
  card: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },
  lead: {
    fontSize: Typography.sm,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  emailIcon: { marginRight: 8 },
  emailText: { fontSize: Typography.base, flex: 1 },
  sendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  sendingText: { fontSize: Typography.sm, fontWeight: '500' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: 8,
  },
  badgeText: { fontSize: Typography.sm, fontWeight: '600' },
  stepsLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  stepsBox: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  stepNumText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  stepText: { fontSize: Typography.base, flex: 1, lineHeight: 22 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: 10,
  },
  errorText: { fontSize: Typography.sm, flex: 1, lineHeight: 20 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 54,
    marginBottom: Spacing.md,
  },
  btnIcon: { marginRight: 10 },
  primaryBtnText: { color: '#fff', fontSize: Typography.base, fontWeight: '600' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minHeight: 52,
    marginBottom: Spacing.md,
  },
  secondaryBtnText: { fontSize: Typography.base, fontWeight: '600' },
  skipBtn: { alignSelf: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
  skipText: { fontSize: Typography.sm },
});
