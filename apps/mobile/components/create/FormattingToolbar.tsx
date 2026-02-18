import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface FormattingToolbarProps {
  onBold?: () => void;
  onItalic?: () => void;
  onMention?: () => void;
  onHashtag?: () => void;
  onLink?: () => void;
}

interface FormatButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  colors: any;
}

function FormatButton({ icon, label, onPress, colors }: FormatButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: colors.background,
          borderColor: colors.divider,
        },
      ]}
      activeOpacity={0.7}
    >
      <Ionicons name={icon as any} size={18} color={colors.text} />
      <Text style={[styles.buttonLabel, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function FormattingToolbar({
  onBold,
  onItalic,
  onMention,
  onHashtag,
  onLink,
}: FormattingToolbarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.divider,
        },
      ]}
    >
      <View style={styles.toolbar}>
        {onBold && (
          <FormatButton
            icon="text"
            label="Bold"
            onPress={onBold}
            colors={colors}
          />
        )}
        {onItalic && (
          <FormatButton
            icon="text-outline"
            label="Italic"
            onPress={onItalic}
            colors={colors}
          />
        )}
        {onMention && (
          <FormatButton
            icon="at"
            label="Mention"
            onPress={onMention}
            colors={colors}
          />
        )}
        {onHashtag && (
          <FormatButton
            icon="pricetag"
            label="Hashtag"
            onPress={onHashtag}
            colors={colors}
          />
        )}
        {onLink && (
          <FormatButton
            icon="link"
            label="Link"
            onPress={onLink}
            colors={colors}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.xs,
    minHeight: 40,
  },
  buttonLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
});
