import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ThemedTextProps extends TextProps {
  type?: 'title' | 'link' | 'default' | 'muted' | 'subtitle';
  children: React.ReactNode;
}

export function ThemedText({ type = 'default', style, children, ...props }: ThemedTextProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const mutedColor = (colors as Record<string, string>).textMuted ?? (colors as Record<string, string>).secondary;

  const getTextStyle = () => {
    switch (type) {
      case 'title':
        return {
          fontSize: Typography['2xl'],
          fontWeight: '700' as const,
          color: colors.text,
        };
      case 'link':
        return {
          fontSize: Typography.base,
          fontWeight: '500' as const,
          color: colors.primary,
        };
      case 'muted':
        return {
          fontSize: Typography.base,
          fontWeight: '400' as const,
          color: mutedColor,
        };
      case 'subtitle':
        return {
          fontSize: Typography.sm,
          fontWeight: '500' as const,
          color: mutedColor,
        };
      default:
        return {
          fontSize: Typography.base,
          fontWeight: '400' as const,
          color: colors.text,
        };
    }
  };

  return (
    <Text style={[getTextStyle(), style]} {...props}>
      {children}
    </Text>
  );
}

