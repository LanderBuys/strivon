import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export interface ProfileEmptyStateAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

interface ProfileEmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actions?: ProfileEmptyStateAction[];
  /** Use profile page colors so empty state matches the profile */
  textColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  cardBackgroundColor?: string;
}

export function ProfileEmptyState({
  icon = 'document-text-outline',
  title,
  message,
  actions = [],
  textColor,
  secondaryColor,
  accentColor,
  backgroundColor,
}: ProfileEmptyStateProps) {
  const haptics = useHapticFeedback();
  const text = textColor ?? '#1C1C1E';
  const secondary = secondaryColor ?? '#5C5C6D';
  const accent = accentColor ?? '#2563EB';
  const pageBg = backgroundColor ?? 'transparent';

  return (
    <View style={[styles.wrapper, { backgroundColor: pageBg }]}>
      <View style={[styles.iconWrap, { backgroundColor: accent + '12' }]}>
        <Ionicons name={icon as any} size={32} color={accent} />
      </View>
      <Text style={[styles.title, { color: text }]}>{title}</Text>
      <Text style={[styles.message, { color: secondary }]}>{message}</Text>
      {actions.length > 0 && (
        <View style={styles.actions}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.button,
                action.variant === 'primary'
                  ? { backgroundColor: accent }
                  : { backgroundColor: 'transparent', borderWidth: 1, borderColor: secondary + '50' },
              ]}
              onPress={() => {
                haptics.light();
                action.onPress();
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: action.variant === 'primary' ? '#FFFFFF' : secondary },
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    minHeight: 220,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.4,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    minWidth: 100,
  },
  buttonText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
});
