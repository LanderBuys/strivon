import { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface EmojiPickerProps {
  visible: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  selectedEmojis?: string[];
}

export function EmojiPicker({ visible, onClose, onEmojiSelect, selectedEmojis = [] }: EmojiPickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [slideAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));

  const emojis = [
    '👍', '❤️', '😂', '🔥', '👏', '🎉', 
    '😮', '😢', '😡', '🤔', '👀', '💯',
    '🙌', '😍', '🤯', '😊', '🥳', '😎',
    '🤝', '💪', '✨', '🎯', '🚀', '💡'
  ];
  
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  const handleEmojiSelect = (emoji: string) => {
    haptics.light();
    onEmojiSelect(emoji);
    onClose();
  };
  
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: opacityAnim,
            backgroundColor: colors.overlay,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.picker,
            {
              backgroundColor: colors.cardBackground,
              transform: [{ translateY }],
            },
          ]}
        >
          <SafeAreaView edges={['bottom']}>
            <View style={[styles.handle, { backgroundColor: colors.divider }]} />
            
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Add Reaction</Text>
            </View>

            <View style={styles.grid}>
              {emojis.map((emoji, index) => (
                (() => {
                  const selected = selectedEmojis.includes(emoji);
                  return (
                <TouchableOpacity
                  key={`${emoji}-${index}`}
                  onPress={() => handleEmojiSelect(emoji)}
                  style={[
                    styles.emojiButton,
                    {
                      backgroundColor: selected ? (colors.primary + '14') : colors.background,
                      borderColor: selected ? (colors.primary + '40') : colors.divider,
                    },
                  ]}
                  activeOpacity={0.6}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
                  );
                })()
              ))}
            </View>

            <TouchableOpacity
              onPress={() => {
                haptics.light();
                onClose();
              }}
              style={[styles.closeButton, { borderTopColor: colors.divider }]}
              activeOpacity={0.6}
            >
              <Text style={[styles.closeText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    // backgroundColor will be set dynamically based on theme
  },
  picker: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: Colors.light.background,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    justifyContent: 'space-between',
  },
  emojiButton: {
    width: '12.5%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  emoji: {
    fontSize: 28,
  },
  closeButton: {
    paddingVertical: Spacing.md + 4,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.xs,
  },
  closeText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
});
