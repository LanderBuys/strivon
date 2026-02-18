import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Text, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import * as Crypto from 'expo-crypto';

const TWO_FACTOR_KEY = '@strivon_2fa_enabled';
const PASSWORD_HASH_KEY = '@strivon_password_hash';

// Simple hash function for demo (in production, use bcrypt)
const hashPassword = async (password: string): Promise<string> => {
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
};

const checkPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong'; message: string } => {
  if (password.length < 8) {
    return { strength: 'weak', message: 'At least 8 characters' };
  }
  
  let score = 0;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (score <= 2) {
    return { strength: 'weak', message: 'Weak - add uppercase, numbers, or symbols' };
  } else if (score <= 4) {
    return { strength: 'medium', message: 'Medium - good password' };
  } else {
    return { strength: 'strong', message: 'Strong - excellent password' };
  }
};

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<{ strength: 'weak' | 'medium' | 'strong'; message: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    load2FAStatus();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      load2FAStatus();
    }, [])
  );

  const load2FAStatus = async () => {
    try {
      const enabled = await AsyncStorage.getItem(TWO_FACTOR_KEY);
      setTwoFactorEnabled(enabled === 'true');
    } catch (error) {
      console.error('Error loading 2FA status:', error);
    }
  };

  const handleNewPasswordChange = (password: string) => {
    setNewPassword(password);
    if (password.length > 0) {
      setPasswordStrength(checkPasswordStrength(password));
    } else {
      setPasswordStrength(null);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    if (newPassword === currentPassword) {
      showToast('New password must be different from current password', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Check current password
      const storedHash = await AsyncStorage.getItem(PASSWORD_HASH_KEY);
      if (storedHash) {
        const currentHash = await hashPassword(currentPassword);
        if (currentHash !== storedHash) {
          showToast('Current password is incorrect', 'error');
          setIsChangingPassword(false);
          return;
        }
      }

      // Hash and save new password
      const newHash = await hashPassword(newPassword);
      await AsyncStorage.setItem(PASSWORD_HASH_KEY, newHash);
      
      haptics.success();
      showToast('Password changed successfully', 'success');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStrength(null);
    } catch (error) {
      console.error('Error changing password:', error);
      showToast('Failed to change password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleEnable2FA = () => {
    haptics.medium();
    if (twoFactorEnabled) {
      // Show disable confirmation
      Alert.alert(
        'Disable Two-Factor Authentication',
        'Are you sure you want to disable two-factor authentication? This will make your account less secure.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              try {
                await AsyncStorage.removeItem(TWO_FACTOR_KEY);
                await AsyncStorage.removeItem('@strivon_2fa_secret');
                await AsyncStorage.removeItem('@strivon_2fa_backup_codes');
                setTwoFactorEnabled(false);
                haptics.success();
                showToast('Two-factor authentication disabled', 'success');
              } catch (error) {
                console.error('Error disabling 2FA:', error);
                showToast('Failed to disable 2FA', 'error');
              }
            },
          },
        ]
      );
    } else {
      router.push('/settings/two-factor');
    }
  };

  const SecurityItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightComponent,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={[styles.securityItem, { borderBottomColor: colors.divider }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.securityIcon, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name={icon as any} size={20} color={colors.primary} />
      </View>
      <View style={styles.securityContent}>
        <Text style={[styles.securityTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.securitySubtitle, { color: colors.secondary }]}>{subtitle}</Text>
        )}
      </View>
      {rightComponent && <View style={styles.securityRight}>{rightComponent}</View>}
      {onPress && <Ionicons name="chevron-forward" size={20} color={colors.secondary} />}
    </TouchableOpacity>
  );

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Password</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground }]}>
            <SecurityItem
              icon="lock-closed-outline"
              title="Change Password"
              subtitle="Update your account password"
              onPress={() => {
                haptics.light();
                setShowChangePassword(!showChangePassword);
              }}
            />
            {showChangePassword && (
              <View style={[styles.passwordForm, { borderTopColor: colors.divider }]}>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.cardBorder }]}
                  placeholder="Current Password"
                  placeholderTextColor={colors.secondary}
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  editable={!isChangingPassword}
                />
                <View>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.cardBorder }]}
                    placeholder="New Password"
                    placeholderTextColor={colors.secondary}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={handleNewPasswordChange}
                    editable={!isChangingPassword}
                  />
                  {passwordStrength && (
                    <View style={styles.strengthContainer}>
                      <View style={[
                        styles.strengthBar,
                        {
                          backgroundColor: passwordStrength.strength === 'weak' 
                            ? colors.error 
                            : passwordStrength.strength === 'medium'
                            ? '#F59E0B'
                            : '#10B981',
                          width: `${passwordStrength.strength === 'weak' ? '33%' : passwordStrength.strength === 'medium' ? '66%' : '100%'}`,
                        }
                      ]} />
                    </View>
                  )}
                  {passwordStrength && (
                    <Text style={[
                      styles.strengthText,
                      {
                        color: passwordStrength.strength === 'weak' 
                          ? colors.error 
                          : passwordStrength.strength === 'medium'
                          ? '#F59E0B'
                          : '#10B981',
                      }
                    ]}>
                      {passwordStrength.message}
                    </Text>
                  )}
                </View>
                <TextInput
                  style={[styles.input, { 
                    color: colors.text, 
                    borderColor: confirmPassword && newPassword !== confirmPassword 
                      ? colors.error 
                      : colors.cardBorder 
                  }]}
                  placeholder="Confirm New Password"
                  placeholderTextColor={colors.secondary}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!isChangingPassword}
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    Passwords do not match
                  </Text>
                )}
                <View style={styles.passwordActions}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: colors.cardBorder }]}
                    onPress={() => {
                      setShowChangePassword(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordStrength(null);
                    }}
                    disabled={isChangingPassword}
                  >
                    <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.saveButton, 
                      { 
                        backgroundColor: colors.primary,
                        opacity: isChangingPassword ? 0.6 : 1,
                      }
                    ]}
                    onPress={handleChangePassword}
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  >
                    <Text style={[styles.buttonText, styles.saveButtonText]}>
                      {isChangingPassword ? 'Changing...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Two-Factor Authentication</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground }]}>
            <SecurityItem
              icon="shield-checkmark-outline"
              title="Two-Factor Authentication"
              subtitle={twoFactorEnabled ? 'Enabled' : 'Add an extra layer of security'}
              onPress={handleEnable2FA}
              rightComponent={
                <View style={[styles.statusBadge, { backgroundColor: twoFactorEnabled ? colors.primary + '15' : colors.secondary + '15' }]}>
                  <Text style={[styles.statusText, { color: twoFactorEnabled ? colors.primary : colors.secondary }]}>
                    {twoFactorEnabled ? 'ON' : 'OFF'}
                  </Text>
                </View>
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Active Sessions</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground }]}>
            <SecurityItem
              icon="phone-portrait-outline"
              title="Active Sessions"
              subtitle="Manage devices where you're logged in"
              onPress={() => {
                haptics.light();
                router.push('/settings/active-sessions');
              }}
            />
          </View>
        </View>
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
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    opacity: 0.6,
  },
  sectionContent: {
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    overflow: 'hidden',
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  securityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: Typography.base,
    fontWeight: '500',
    marginBottom: 2,
  },
  securitySubtitle: {
    fontSize: Typography.sm,
    opacity: 0.7,
  },
  securityRight: {
    marginRight: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  passwordForm: {
    padding: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.base,
  },
  passwordActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
  strengthContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  errorText: {
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
  },
  logoutAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  logoutAllText: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: '500',
  },
});

