import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';

interface BoostConversionModalProps {
  visible: boolean;
  reachImprovement: number; // Percentage (e.g., 18 for 18%)
  onClose: () => void;
  onUpgrade?: () => void;
}

export function BoostConversionModal({
  visible,
  reachImprovement,
  onClose,
  onUpgrade,
}: BoostConversionModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Navigate to subscription page
      router.push('/settings/subscription-info');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.cardBackground }]}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={colors.secondary} />
          </TouchableOpacity>

          {/* Success icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="trending-up" size={48} color={colors.primary} />
          </View>

          {/* Main message */}
          <Text style={[styles.mainMessage, { color: colors.text }]}>
            This post reached{' '}
            <Text style={[styles.highlight, { color: colors.primary }]}>
              {reachImprovement}% more people
            </Text>
          </Text>

          {/* Upgrade message */}
          <View style={styles.upgradeSection}>
            <Text style={[styles.upgradeMessage, { color: colors.text }]}>
              With Pro, you get{' '}
              <Text style={[styles.bold, { color: colors.text }]}>
                10 boosts every month
              </Text>
              {' '}— no ads.
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.cardBorder }]}
              onPress={onClose}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.secondary }]}>
                Maybe Later
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handleUpgrade}
            >
              <Text style={[styles.primaryButtonText, { color: '#FFFFFF' }]}>
                Upgrade to Pro
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.xs,
    zIndex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  mainMessage: {
    fontSize: Typography.xl + 2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: Typography.xl * 1.4,
  },
  highlight: {
    fontWeight: '800',
  },
  upgradeSection: {
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  upgradeMessage: {
    fontSize: Typography.base + 1,
    textAlign: 'center',
    lineHeight: Typography.base * 1.6,
  },
  bold: {
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: Typography.base,
    fontWeight: '700',
  },
});
