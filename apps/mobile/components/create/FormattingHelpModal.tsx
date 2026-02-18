import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface FormattingHelpModalProps {
  visible: boolean;
  onClose: () => void;
}

interface FormattingTipProps {
  icon: string;
  title: string;
  description: string;
  example: string;
  colors: any;
}

function FormattingTip({ icon, title, description, example, colors }: FormattingTipProps) {
  return (
    <View style={[styles.tipItem, { backgroundColor: colors.surface }]}>
      <View style={[styles.tipIcon, { backgroundColor: colors.tint + '15' }]}>
        <Ionicons name={icon as any} size={20} color={colors.tint} />
      </View>
      <View style={styles.tipContent}>
        <Text style={[styles.tipTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.tipDescription, { color: colors.text, opacity: 0.8 }]}>
          {description}
        </Text>
        <View style={[styles.exampleBox, { backgroundColor: colors.background, borderColor: colors.divider }]}>
          <Text style={[styles.exampleText, { color: colors.text }]}>{example}</Text>
        </View>
      </View>
    </View>
  );
}

export function FormattingHelpModal({ visible, onClose }: FormattingHelpModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();

  const handleClose = () => {
    haptics.light();
    onClose();
  };

  React.useEffect(() => {
    if (visible) {
      console.log('FormattingHelpModal is visible', { colorScheme, colors });
    }
  }, [visible, colorScheme, colors]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.overlayPressable} onPress={handleClose} />
        <View
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
        >
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.title, { color: colors.text }]}>Formatting Guide</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.contentContainer}
          >
            <Text style={[styles.intro, { color: colors.text }]}>
              Learn how to format your posts with these simple tips:
            </Text>

            <FormattingTip
              icon="link"
              title="Links"
              description="Paste or type any URL starting with http:// or https:// and it will automatically become a clickable link. No special formatting needed!"
              example="https://example.com"
              colors={colors}
            />

            <FormattingTip
              icon="at"
              title="Mentions"
              description="Type the @ symbol followed by a username to mention someone. An autocomplete menu will appear as you type to help you find users."
              example="@username"
              colors={colors}
            />

            <FormattingTip
              icon="pricetag"
              title="Hashtags"
              description="Type the # symbol followed by text to create a hashtag. Hashtag suggestions will appear as you type to help you discover popular tags."
              example="#hashtag"
              colors={colors}
            />

            <FormattingTip
              icon="text"
              title="Bold Text"
              description="Wrap any text with two asterisks (**) on each side to make it bold. The text will appear bold when your post is published."
              example="**bold text**"
              colors={colors}
            />

            <FormattingTip
              icon="text-outline"
              title="Italic Text"
              description="Wrap any text with a single asterisk (*) on each side to make it italic. The text will appear italic when your post is published."
              example="*italic text*"
              colors={colors}
            />

            <View style={[styles.noteBox, { backgroundColor: colors.tint + '10', borderColor: colors.tint + '30' }]}>
              <Ionicons name="bulb-outline" size={18} color={colors.tint} />
              <Text style={[styles.noteText, { color: colors.text }]}>
                All formatting is automatic - just type naturally and the app will detect and format your content!
              </Text>
            </View>
          </ScrollView>
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
    padding: Spacing.md,
  },
  overlayPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    height: '80%',
    maxHeight: 600,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    minHeight: 200,
  },
  contentContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  intro: {
    fontSize: 14,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  exampleBox: {
    padding: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  exampleText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '500',
  },
  noteBox: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

