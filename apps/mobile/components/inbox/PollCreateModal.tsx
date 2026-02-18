import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface PollCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (question: string, options: string[]) => void;
}

export function PollCreateModal({ visible, onClose, onCreate }: PollCreateModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
      haptics.light();
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      haptics.light();
    }
  };

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
  };

  const handleCreate = () => {
    const trimmedQuestion = question.trim();
    const validOptions = options.filter(opt => opt.trim().length > 0);

    if (!trimmedQuestion) {
      Alert.alert('Error', 'Please enter a question for your poll');
      return;
    }

    if (validOptions.length < 2) {
      Alert.alert('Error', 'Please add at least 2 options');
      return;
    }

    haptics.success();
    onCreate(trimmedQuestion, validOptions);
    setQuestion('');
    setOptions(['', '']);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
            <SafeAreaView edges={['bottom']}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Create Poll</Text>
                <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                  <IconSymbol name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.content} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={keyboardVisible ? styles.contentKeyboardVisible : undefined}
              >
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.text }]}>Question</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  }]}
                  placeholder="Ask a question..."
                  placeholderTextColor={colors.secondary}
                  value={question}
                  onChangeText={setQuestion}
                  multiline
                  maxLength={200}
                />
              </View>

              <View style={styles.section}>
                <View style={styles.optionsHeader}>
                  <Text style={[styles.label, { color: colors.text }]}>Options</Text>
                  {options.length < 10 && (
                    <TouchableOpacity
                      onPress={handleAddOption}
                      style={[styles.addButton, { backgroundColor: colors.primary + '15' }]}
                      activeOpacity={0.7}
                    >
                      <IconSymbol name="add" size={18} color={colors.primary} />
                      <Text style={[styles.addButtonText, { color: colors.primary }]}>Add</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {options.map((option, index) => (
                  <View key={index} style={styles.optionRow}>
                    <TextInput
                      style={[styles.optionInput, {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.inputBorder,
                        color: colors.text,
                      }]}
                      placeholder={`Option ${index + 1}`}
                      placeholderTextColor={colors.secondary}
                      value={option}
                      onChangeText={(text) => handleOptionChange(index, text)}
                      maxLength={100}
                    />
                    {options.length > 2 && (
                      <TouchableOpacity
                        onPress={() => handleRemoveOption(index)}
                        style={styles.removeButton}
                        activeOpacity={0.7}
                      >
                        <IconSymbol name="close" size={18} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: colors.divider }]}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.cancelButton, { backgroundColor: colors.spaceBackground }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreate}
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                activeOpacity={0.7}
              >
                <Text style={styles.createText}>Create Poll</Text>
              </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </View>
      </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  contentKeyboardVisible: {
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.base,
    minHeight: 44,
    maxHeight: 100,
  },
  optionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  optionInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.base,
    minHeight: 44,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
