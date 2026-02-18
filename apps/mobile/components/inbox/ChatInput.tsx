import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Modal, Alert, Text, Pressable, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, Typography } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { PollCreateModal } from './PollCreateModal';
import { MentionAutocomplete } from '@/components/create/MentionAutocomplete';

export interface ChatInputRef {
  insertText: (text: string) => void;
}

interface ChatInputProps {
  onSend: (text: string, media?: any[], poll?: any) => void;
  placeholder?: string;
  hasBackground?: boolean;
  onImagePress?: (image: any) => void;
  onVideoPress?: (video: any) => void;
  onDocumentPress?: (document: any) => void;
  onVoicePress?: (audio: any) => void;
  initialValue?: string;
  onCancel?: () => void;
  onTyping?: () => void;
  /** Called when draft text changes (e.g. for persistence). Debounced. */
  onDraftChange?: (text: string) => void;
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(function ChatInput({ 
  onSend, 
  placeholder = 'Message...',
  hasBackground = false,
  onImagePress,
  onVideoPress,
  onDocumentPress,
  onVoicePress,
  initialValue,
  onCancel,
  onTyping,
  onDraftChange,
}, ref) {
  const [text, setText] = useState(initialValue || '');
  const [showPollModal, setShowPollModal] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const draftTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(ref, () => ({
    insertText(t: string) {
      setText(prev => prev + t);
    },
  }), []);

  // Update text when initialValue changes (for editing)
  useEffect(() => {
    if (initialValue !== undefined) {
      setText(initialValue);
    }
  }, [initialValue]);

  // Debounced draft callback
  useEffect(() => {
    if (!onDraftChange) return;
    if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    draftTimeoutRef.current = setTimeout(() => {
      onDraftChange(text);
      draftTimeoutRef.current = null;
    }, 500);
    return () => {
      if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    };
  }, [text, onDraftChange]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const hasText = text.trim().length > 0;
  const isDark = (colorScheme ?? 'light') === 'dark';

  const surfaceBg = hasBackground
    ? (isDark ? 'rgba(0,0,0,0.62)' : 'rgba(255,255,255,0.78)')
    : colors.cardBackground;

  const controlBg = hasBackground
    ? (isDark ? 'rgba(0,0,0,0.40)' : 'rgba(255,255,255,0.92)')
    : colors.spaceBackground;

  const controlBorder = hasBackground
    ? (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.10)')
    : colors.cardBorder;

  // Execute pending action when modal is dismissed (works on all platforms)
  useEffect(() => {
    if (!showAttachmentMenu && pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      // Use InteractionManager to ensure modal is fully dismissed
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          action();
        }, 100);
      });
    }
  }, [showAttachmentMenu]);

  const handleModalDismiss = () => {
    if (pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      // Use InteractionManager to ensure modal is fully dismissed
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          action();
        }, 100);
      });
    }
  };

  const handleSend = () => {
    if (text.trim()) {
      haptics.light();
      onSend(text.trim());
      setText('');
    }
  };


  const handlePickMedia = async () => {
    haptics.light();
    
    const executePick = async () => {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'We need access to your photos and videos to send media.');
          return;
        }

        const { getMaxMediaItems, getMaxVideoDuration } = await import('@/lib/services/subscriptionService');
        const maxMedia = await getMaxMediaItems();
        const maxVideo = await getMaxVideoDuration();

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsMultipleSelection: true,
          quality: 0.85,
          allowsEditing: false,
          selectionLimit: maxMedia,
          ...(maxVideo > 0 && { videoMaxDuration: maxVideo }),
        });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        haptics.success();
        
        const mediaItems = result.assets.map((asset, index) => {
          const isVideo = asset.type === 'video';
          return {
            id: isVideo ? `vid-${Date.now()}-${index}` : `img-${Date.now()}-${index}`,
            type: isVideo ? 'VIDEO' : 'IMAGE',
            url: asset.uri,
            thumbnail: asset.uri,
            width: asset.width || 0,
            height: asset.height || 0,
            ...(isVideo && { duration: asset.duration || 0 }),
          };
        });
        
        // Handle multiple media items
        if (mediaItems.length === 1) {
          const item = mediaItems[0];
          const asset = result.assets[0];
          
          if (item.type === 'VIDEO') {
            if (onVideoPress) {
              onVideoPress({
                uri: asset.uri,
                width: asset.width || 0,
                height: asset.height || 0,
                duration: asset.duration || 0,
              });
            } else {
              onSend('', [item]);
            }
          } else {
            if (onImagePress) {
              onImagePress({
                uri: asset.uri,
                width: asset.width || 0,
                height: asset.height || 0,
              });
            } else {
              onSend('', [item]);
            }
          }
        } else {
          // Send multiple items
          onSend('', mediaItems);
        }
      }
      } catch (error) {
        console.error('Error picking media:', error);
        Alert.alert('Error', 'Failed to pick media');
      }
    };
    
    pendingActionRef.current = executePick;
    setShowAttachmentMenu(false);
  };

  const handleTakePhoto = async () => {
    haptics.light();
    
    const executeCamera = async () => {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'We need access to your camera to take photos and videos.');
          return;
        }

        const { getMaxVideoDuration } = await import('@/lib/services/subscriptionService');
        const maxVideo = await getMaxVideoDuration();

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          quality: 0.85,
          allowsEditing: false,
          ...(maxVideo > 0 && { videoMaxDuration: maxVideo }),
        });
    
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        haptics.success();
        
        const isVideo = asset.type === 'video';
        const mediaItem = {
          id: isVideo ? `vid-${Date.now()}` : `img-${Date.now()}`,
          type: isVideo ? 'VIDEO' : 'IMAGE',
          url: asset.uri,
          thumbnail: asset.uri,
          width: asset.width || 0,
          height: asset.height || 0,
          ...(isVideo && { duration: asset.duration || 0 }),
        };
        
        if (isVideo) {
          if (onVideoPress) {
            onVideoPress({
              uri: asset.uri,
              width: asset.width || 0,
              height: asset.height || 0,
              duration: asset.duration || 0,
            });
          } else {
            onSend('', [mediaItem]);
          }
        } else {
          if (onImagePress) {
            onImagePress({
              uri: asset.uri,
              width: asset.width || 0,
              height: asset.height || 0,
            });
          } else {
            onSend('', [mediaItem]);
          }
        }
      }
      } catch (error) {
        console.error('Error taking photo/video:', error);
        Alert.alert('Error', 'Failed to capture media');
      }
    };
    
    pendingActionRef.current = executeCamera;
    setShowAttachmentMenu(false);
  };

  const handlePickDocument = async () => {
    haptics.light();

    const executePick = async () => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          multiple: true,
          copyToCacheDirectory: true,
        });

        if (result.canceled) return;
        if (!result.assets || result.assets.length === 0) return;

        haptics.success();

        // If consumer provided a document handler, send each doc through it
        if (onDocumentPress) {
          result.assets.forEach((asset) => {
            onDocumentPress({
              uri: asset.uri,
              name: asset.name,
              mimeType: asset.mimeType,
              size: asset.size,
            });
          });
          return;
        }

        // Fallback: send as FILE attachments via onSend
        const fileItems = result.assets.map((asset, index) => ({
          id: `doc-${Date.now()}-${index}`,
          type: 'FILE',
          url: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType,
          size: asset.size,
        }));

        onSend('', fileItems);
      } catch (error) {
        console.error('Error picking document:', error);
        Alert.alert('Error', 'Failed to pick a document');
      }
    };

    pendingActionRef.current = executePick;
    setShowAttachmentMenu(false);
  };

  const handleAttachmentPress = () => {
    haptics.light();
    setShowAttachmentMenu(true);
  };

  const attachmentOptions = [
    {
      id: 'media',
      icon: 'images-outline',
      title: 'Photo',
      onPress: handlePickMedia,
      color: '#4CAF50',
      gradient: ['#4CAF50', '#45A049'],
    },
    {
      id: 'camera',
      icon: 'camera-outline',
      title: 'Camera',
      onPress: handleTakePhoto,
      color: '#2196F3',
      gradient: ['#2196F3', '#1976D2'],
    },
    {
      id: 'voice',
      icon: 'mic-outline',
      title: 'Voice',
      onPress: () => {
        setShowAttachmentMenu(false);
        // Use pendingActionRef to ensure modal is fully dismissed before opening voice recorder
        pendingActionRef.current = () => {
          if (onVoicePress) {
            onVoicePress({});
          }
        };
      },
      color: '#9C27B0',
      gradient: ['#9C27B0', '#7B1FA2'],
    },
    {
      id: 'document',
      icon: 'document-outline',
      title: 'Document',
      onPress: handlePickDocument,
      color: '#FF9800',
      gradient: ['#FF9800', '#F57C00'],
    },
    {
      id: 'poll',
      icon: 'bar-chart-outline',
      title: 'Poll',
      onPress: () => {
        setShowAttachmentMenu(false);
        setShowPollModal(true);
      },
      color: '#E91E63',
      gradient: ['#E91E63', '#C2185B'],
    },
  ];

  const handleSelectMention = (user: { handle: string; name: string }) => {
    const atIndex = text.lastIndexOf('@');
    const newText = atIndex >= 0
      ? text.slice(0, atIndex) + `@${user.handle.replace('@', '')} `
      : text + `@${user.handle.replace('@', '')} `;
    setText(newText);
    setShowMentions(false);
    haptics.light();
  };

  return (
    <>
      <View 
        style={[
          styles.container, 
          { 
            backgroundColor: surfaceBg,
            borderTopColor: controlBorder,
          }
        ]}>
        <MentionAutocomplete
          visible={showMentions}
          query={mentionQuery}
          onSelect={handleSelectMention}
        />
        <View style={styles.attachButtonsRow}>
          <TouchableOpacity
            onPress={handleAttachmentPress}
            style={[
              styles.attachButton,
              {
                backgroundColor: controlBg,
                borderColor: controlBorder,
                ...Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 4,
                  },
                  android: {
                    elevation: 1,
                  },
                }),
              },
            ]}
            activeOpacity={0.75}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="More options"
          >
            <IconSymbol name="add" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View 
          style={[
            styles.inputContainer,
            {
              backgroundColor: controlBg,
              borderColor: controlBorder,
              borderWidth: StyleSheet.hairlineWidth,
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 2,
                },
              }),
            }
          ]}>
          <TextInput
            style={[
              styles.input,
              { 
                color: colors.text,
              }
            ]}
            value={text}
            onChangeText={(t) => {
              setText(t);
              onTyping?.();
              const match = t.match(/@(\w*)$/);
              if (match) {
                setShowMentions(true);
                setMentionQuery(match[1] || '');
              } else {
                setShowMentions(false);
              }
            }}
            placeholder={placeholder}
            placeholderTextColor={colors.secondary}
            multiline
            maxLength={2000}
          />
        </View>
        <TouchableOpacity
          onPress={handleSend}
          disabled={!hasText}
          style={[
            styles.sendButton,
            {
              backgroundColor: hasText ? colors.primary : controlBg,
              borderColor: hasText ? 'transparent' : controlBorder,
              borderWidth: StyleSheet.hairlineWidth,
              opacity: hasText ? 1 : 0.75,
              ...Platform.select({
                ios: {
                  shadowColor: hasText ? colors.primary : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: hasText ? 0.25 : 0.06,
                  shadowRadius: hasText ? 6 : 4,
                },
                android: {
                  elevation: hasText ? 4 : 1,
                },
              }),
            }
          ]}
          activeOpacity={0.75}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <IconSymbol 
            name={hasText ? "send" : "send-outline"}
            size={20}
            color={hasText ? "#FFFFFF" : colors.secondary}
          />
        </TouchableOpacity>
      </View>

      {/* Attachment Menu Modal */}
      <Modal
        visible={showAttachmentMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttachmentMenu(false)}
        onDismiss={handleModalDismiss}>
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowAttachmentMenu(false)}>
          <Pressable 
            style={[
              styles.attachmentMenu,
              {
                backgroundColor: colors.cardBackground,
                ...Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                  },
                  android: {
                    elevation: 8,
                  },
                }),
              }
            ]}
            onPress={(e) => e.stopPropagation()}>
            <SafeAreaView edges={['bottom']}>
              <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)' }]} />
              
              <View style={styles.menuHeader}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Send Media</Text>
              </View>
              
              <View style={styles.optionsContainer}>
                {attachmentOptions.map((option, index) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.attachmentOption,
                      { backgroundColor: colors.spaceBackground },
                    ]}
                    onPress={() => {
                      if (typeof option.onPress === 'function') {
                        option.onPress();
                      }
                    }}
                    activeOpacity={0.7}>
                    <View style={[styles.attachmentIcon, { backgroundColor: option.color + '15' }]}>
                      <IconSymbol name={option.icon} size={22} color={option.color} />
                    </View>
                    <Text style={[styles.attachmentTitle, { color: colors.text }]}>
                      {option.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.cancelButtonContainer, { borderTopColor: colors.divider }]}>
                <TouchableOpacity
                  onPress={() => setShowAttachmentMenu(false)}
                  style={[styles.cancelButton, { backgroundColor: colors.spaceBackground }]}
                  activeOpacity={0.7}>
                  <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>

      <PollCreateModal
        visible={showPollModal}
        onClose={() => setShowPollModal(false)}
        onCreate={(question, options) => {
          const poll = {
            id: `poll-${Date.now()}`,
            question,
            options: options.map((opt, index) => ({
              id: `opt-${Date.now()}-${index}`,
              text: opt,
              votes: 0,
              voters: [],
            })),
            totalVotes: 0,
            userVotes: [],
          };
          onSend('', undefined, poll);
        }}
      />
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm + 2,
    ...Platform.select({
      ios: {
        paddingBottom: Spacing.md + 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  attachButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  inputContainer: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 0,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: Spacing.md + 4,
    paddingVertical: Spacing.sm + 2,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: Typography.base,
    lineHeight: Typography.base * 1.4,
    padding: 0,
    margin: 0,
    textAlignVertical: 'center',
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  attachmentMenu: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignSelf: 'center',
    marginTop: Spacing.sm + 2,
    marginBottom: Spacing.md,
  },
  menuHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  menuTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  optionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
    gap: Spacing.xs,
    flexWrap: 'nowrap',
  },
  attachmentOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs - 2,
    gap: 4,
    borderRadius: 12,
    minWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
      },
    }),
  },
  attachmentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  attachmentTextContainer: {
    alignItems: 'center',
  },
  attachmentTitle: {
    fontSize: Typography.sm,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  attachmentSubtitle: {
    fontSize: Typography.xs,
    fontWeight: '400',
    opacity: 0.7,
    letterSpacing: -0.05,
    textAlign: 'center',
  },
  cancelButtonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
      },
    }),
  },
  cancelText: {
    fontSize: Typography.base,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
