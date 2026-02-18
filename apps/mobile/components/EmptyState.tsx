import React from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useFadeIn } from '@/hooks/useFadeIn';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';

interface EmptyStateAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actions?: EmptyStateAction[];
}

export function EmptyState({ icon, title, message, actions }: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const fadeAnim = useFadeIn(380, 50);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '10' }]}>
          <Ionicons name={icon as any} size={48} color={colors.primary} />
        </View>
      )}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textMuted ?? colors.secondary }]}>{message}</Text>
      {actions && actions.length > 0 && (
        <View style={styles.actionsContainer}>
          {actions.map((action, index) => (
            <AnimatedPressable
              key={index}
              scale={0.96}
              style={[
                styles.actionButton,
                { shadowColor: colors.shadow ?? '#000' },
                action.variant === 'primary'
                  ? { backgroundColor: colors.primary }
                  : {
                      backgroundColor: colors.surface,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: colors.border,
                    },
              ]}
              onPress={() => {
                haptics.light();
                action.onPress();
              }}
            >
              <Text
                style={[
                  styles.actionText,
                  {
                    color: action.variant === 'primary' ? '#FFFFFF' : colors.text,
                  },
                ]}
              >
                {action.label}
              </Text>
            </AnimatedPressable>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    minHeight: 250,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontSize: Typography.base,
    textAlign: 'center',
    lineHeight: Typography.base * 1.5,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    opacity: 0.8,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  actionButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 120,
    ...Shadows.sm,
  },
  actionText: {
    fontSize: Typography.base,
    fontWeight: '600',
    textAlign: 'center',
  },
});
