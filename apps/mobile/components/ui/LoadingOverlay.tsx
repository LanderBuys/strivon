import React from 'react';
import { View, StyleSheet, Text, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingSpinner } from './LoadingSpinner';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  fullScreen?: boolean;
  transparent?: boolean;
}

export function LoadingOverlay({ 
  visible, 
  message = 'Loading...',
  fullScreen = false,
  transparent = false 
}: LoadingOverlayProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (fullScreen) {
    return (
      <Modal
        visible={visible}
        transparent={transparent}
        animationType="fade"
        statusBarTranslucent
      >
        <SafeAreaView 
          style={[
            styles.fullScreenContainer,
            { backgroundColor: transparent ? 'rgba(0, 0, 0, 0.5)' : colors.background }
          ]}
          edges={['top', 'bottom']}
        >
          <View style={styles.content}>
            <LoadingSpinner size={50} color={colors.primary} />
            {message && (
              <Text style={[styles.message, { color: colors.text }]}>
                {message}
              </Text>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <LoadingSpinner size={50} color={colors.primary} />
        {message && (
          <Text style={[styles.message, { color: colors.text }]}>
            {message}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  message: {
    fontSize: Typography.base,
    fontWeight: '500',
    marginTop: Spacing.sm,
  },
});


