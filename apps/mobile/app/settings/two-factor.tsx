import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Text, TextInput, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import * as Crypto from 'expo-crypto';

const TWO_FACTOR_KEY = '@strivon_2fa_enabled';
const TWO_FACTOR_SECRET_KEY = '@strivon_2fa_secret';
const TWO_FACTOR_BACKUP_CODES_KEY = '@strivon_2fa_backup_codes';

// Base32 alphabet for encoding
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Generate random base32 secret using expo-crypto
const generateSecret = async (): Promise<string> => {
  try {
    // Generate random bytes using expo-crypto
    // getRandomBytesAsync returns a Uint8Array
    const randomBytes = await Crypto.getRandomBytesAsync(20);
    let secret = '';
    for (let i = 0; i < randomBytes.length; i += 5) {
      let value = 0;
      for (let j = 0; j < 5 && i + j < randomBytes.length; j++) {
        value = (value << 8) | randomBytes[i + j];
      }
      for (let k = 0; k < 8 && i * 8 / 5 + k < 32; k++) {
        secret += BASE32_ALPHABET[(value >> (35 - k * 5)) & 0x1f];
      }
    }
    return secret.substring(0, 32);
  } catch (error) {
    console.error('Error generating secret:', error);
    // Fallback: use timestamp and random number
    const fallback = Date.now().toString(36) + Math.random().toString(36).substring(2);
    return fallback.substring(0, 32).toUpperCase().replace(/[^A-Z2-7]/g, 'A').padEnd(32, 'A');
  }
};

// Generate backup codes
const generateBackupCodes = (): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
};

// Base32 decode
const base32Decode = (str: string): Uint8Array => {
  str = str.toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = new Uint8Array(Math.ceil((str.length * 5) / 8));
  
  for (let i = 0; i < str.length; i++) {
    const charIndex = BASE32_ALPHABET.indexOf(str[i]);
    if (charIndex === -1) continue;
    value = (value << 5) | charIndex;
    bits += 5;
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return output.slice(0, index);
};

// Simple TOTP implementation using expo-crypto
const generateTOTP = async (secret: string, timeStep: number = Math.floor(Date.now() / 1000 / 30)): Promise<string> => {
  try {
    // Create a deterministic code based on secret and time step
    const combined = secret + timeStep.toString();
    const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, combined);
    
    // Extract 6 digits from hash
    // Use first 8 hex chars to get a number, then mod 1000000
    const hashNum = parseInt(hash.substring(0, 8), 16);
    const code = hashNum % 1000000;
    return code.toString().padStart(6, '0');
  } catch (error) {
    console.error('Error generating TOTP:', error);
    // Fallback: simple hash
    const combined = secret + timeStep.toString();
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const code = Math.abs(hash) % 1000000;
    return code.toString().padStart(6, '0');
  }
};

// Verify TOTP code (check current and previous/next time steps for clock skew)
const verifyTOTP = async (secret: string, code: string): Promise<boolean> => {
  const timeStep = Math.floor(Date.now() / 1000 / 30);
  // Check current, previous, and next time steps (allow 30 second clock skew)
  for (let offset = -1; offset <= 1; offset++) {
    const totp = await generateTOTP(secret, timeStep + offset);
    if (totp === code) {
      return true;
    }
  }
  return false;
};

export default function TwoFactorSetupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [verificationCode, setVerificationCode] = useState('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    initialize2FA();
  }, []);

  const initialize2FA = async () => {
    try {
      // Check if 2FA is already enabled
      const enabled = await AsyncStorage.getItem(TWO_FACTOR_KEY);
      if (enabled === 'true') {
        // Load existing secret for verification
        const existingSecret = await AsyncStorage.getItem(TWO_FACTOR_SECRET_KEY);
        if (existingSecret) {
          setSecret(existingSecret);
          return;
        }
      }
      
      // Generate new secret
      const newSecret = await generateSecret();
      setSecret(newSecret);
    } catch (error) {
      console.error('Error initializing 2FA:', error);
      showToast('Failed to initialize 2FA setup', 'error');
    }
  };

  const handleEnable2FA = async () => {
    if (!verificationCode.trim()) {
      showToast('Please enter the verification code', 'error');
      return;
    }

    if (verificationCode.length !== 6) {
      showToast('Verification code must be 6 digits', 'error');
      return;
    }

    if (!secret) {
      showToast('Secret not generated. Please refresh the page.', 'error');
      return;
    }

    setIsVerifying(true);
    try {
      // Verify the TOTP code
      const isValid = await verifyTOTP(secret, verificationCode);
      
      if (!isValid) {
        showToast('Invalid verification code. Please try again.', 'error');
        setIsVerifying(false);
        return;
      }

      // Generate backup codes
      const codes = generateBackupCodes();
      setBackupCodes(codes);

      // Save 2FA settings
      await AsyncStorage.setItem(TWO_FACTOR_KEY, 'true');
      await AsyncStorage.setItem(TWO_FACTOR_SECRET_KEY, secret);
      await AsyncStorage.setItem(TWO_FACTOR_BACKUP_CODES_KEY, JSON.stringify(codes));
      
      haptics.success();
      setShowBackupCodes(true);
      showToast('Two-factor authentication enabled', 'success');
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      showToast('Failed to enable two-factor authentication', 'error');
      setIsVerifying(false);
    }
  };

  const handleCopySecret = async () => {
    try {
      await Clipboard.setStringAsync(secret);
      haptics.light();
      showToast('Secret key copied to clipboard', 'success');
    } catch (error) {
      Alert.alert('Secret Key', `Your secret key: ${secret}\n\nSave this in a secure location.`, [
        { text: 'OK' },
      ]);
      haptics.light();
    }
  };

  const handleCopyBackupCode = async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
      haptics.light();
      showToast('Backup code copied', 'success');
    } catch (error) {
      haptics.light();
    }
  };

  const handleDone = () => {
    router.back();
  };

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Two-Factor Authentication</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={[styles.infoBox, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>Add an extra layer of security</Text>
            <Text style={[styles.infoText, { color: colors.secondary }]}>
              Two-factor authentication helps protect your account by requiring a code from your authenticator app in addition to your password.
            </Text>
          </View>
        </View>

        {!showBackupCodes ? (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Step 1: Get Your Secret Key</Text>
              <View style={[styles.secretCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                <View style={styles.secretHeader}>
                  <Ionicons name="key-outline" size={20} color={colors.primary} />
                  <Text style={[styles.secretLabel, { color: colors.text }]}>Secret Key</Text>
                  <TouchableOpacity
                    onPress={() => setShowSecret(!showSecret)}
                    style={styles.eyeButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons 
                      name={showSecret ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color={colors.secondary} 
                    />
                  </TouchableOpacity>
                </View>
                {showSecret ? (
                  <View style={styles.secretDisplay}>
                    <Text style={[styles.secretKeyText, { color: colors.text }]} selectable>
                      {secret}
                    </Text>
                    <TouchableOpacity
                      onPress={handleCopySecret}
                      style={[styles.copySecretButton, { backgroundColor: colors.primary }]}
                    >
                      <Ionicons name="copy-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.copySecretText}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.secretHidden, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.secretHiddenText, { color: colors.secondary }]}>
                      ••••••••••••••••••••••••••••••••
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowSecret(true)}
                      style={[styles.revealButton, { borderColor: colors.cardBorder }]}
                    >
                      <Text style={[styles.revealButtonText, { color: colors.primary }]}>Reveal</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <View style={[styles.instructionsBox, { backgroundColor: colors.primary + '10' }]}>
                  <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                  <View style={styles.instructionsText}>
                    <Text style={[styles.instructionTitle, { color: colors.text }]}>
                      How to add to your authenticator app:
                    </Text>
                    <Text style={[styles.instructionStep, { color: colors.secondary }]}>
                      1. Open your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
                    </Text>
                    <Text style={[styles.instructionStep, { color: colors.secondary }]}>
                      2. Tap "Add account" or the + button
                    </Text>
                    <Text style={[styles.instructionStep, { color: colors.secondary }]}>
                      3. Choose "Enter a setup key" or "Manual entry"
                    </Text>
                    <Text style={[styles.instructionStep, { color: colors.secondary }]}>
                      4. Enter account name: <Text style={{ fontWeight: '600' }}>Strivon</Text>
                    </Text>
                    <Text style={[styles.instructionStep, { color: colors.secondary }]}>
                      5. Paste the secret key above
                    </Text>
                    <Text style={[styles.instructionStep, { color: colors.secondary }]}>
                      6. Tap "Add" or "Save"
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.section}>
            <View style={[styles.infoBox, { backgroundColor: '#10B98115' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={[styles.infoTitle, { color: colors.text }]}>2FA Enabled Successfully!</Text>
              <Text style={[styles.infoText, { color: colors.secondary }]}>
                Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
              </Text>
            </View>
          </View>
        )}

        {!showBackupCodes ? (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Step 2: Verify Code</Text>
              <View style={[styles.verifyContainer, { backgroundColor: colors.cardBackground }]}>
                <TextInput
                  style={[styles.codeInput, { color: colors.text, borderColor: colors.cardBorder }]}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor={colors.secondary}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  editable={!isVerifying}
                />
                <TouchableOpacity
                  onPress={handleEnable2FA}
                  style={[
                    styles.enableButton, 
                    { 
                      backgroundColor: colors.primary,
                      opacity: verificationCode.length !== 6 || isVerifying ? 0.6 : 1,
                    }
                  ]}
                  disabled={verificationCode.length !== 6 || isVerifying}
                >
                  <Text style={styles.enableButtonText}>
                    {isVerifying ? 'Verifying...' : 'Enable 2FA'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Backup Codes</Text>
            <View style={[styles.backupCodesContainer, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.backupCodesHint, { color: colors.secondary }]}>
                Each code can only be used once. Store them securely.
              </Text>
              <View style={styles.backupCodesGrid}>
                {backupCodes.map((code, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.backupCodeItem, { borderColor: colors.cardBorder }]}
                    onPress={() => handleCopyBackupCode(code)}
                  >
                    <Text style={[styles.backupCodeText, { color: colors.text }]}>{code}</Text>
                    <Ionicons name="copy-outline" size={16} color={colors.secondary} />
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                onPress={handleDone}
                style={[styles.doneButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
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
    fontSize: Typography.xl,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
    opacity: 0.6,
  },
  infoBox: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoText: {
    fontSize: Typography.sm,
    textAlign: 'center',
    lineHeight: Typography.sm * 1.5,
    marginTop: Spacing.xs,
  },
  secretCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  secretHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  secretLabel: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  secretDisplay: {
    gap: Spacing.sm,
  },
  secretKeyText: {
    fontSize: Typography.base,
    fontFamily: 'monospace',
    fontWeight: '600',
    padding: Spacing.md,
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.sm,
    textAlign: 'center',
    letterSpacing: 1,
  },
  copySecretButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  copySecretText: {
    color: '#FFFFFF',
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  secretHidden: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  secretHiddenText: {
    fontSize: Typography.base,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  revealButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  revealButtonText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  instructionsBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  instructionsText: {
    flex: 1,
    gap: Spacing.xs,
  },
  instructionTitle: {
    fontSize: Typography.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  instructionStep: {
    fontSize: Typography.xs,
    lineHeight: Typography.xs * 1.5,
  },
  verifyContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  codeInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.xl,
    textAlign: 'center',
    letterSpacing: 8,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  enableButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.base,
    fontWeight: '600',
  },
  backupCodesContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  backupCodesHint: {
    fontSize: Typography.sm,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  backupCodesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  backupCodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minWidth: '45%',
    gap: Spacing.xs,
  },
  backupCodeText: {
    fontSize: Typography.sm,
    fontFamily: 'monospace',
    fontWeight: '600',
    flex: 1,
  },
  doneButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.base,
    fontWeight: '600',
  },
});

