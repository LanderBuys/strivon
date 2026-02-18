import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView, Text, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface NewsCommentInputProps {
  onSend: (text: string, media?: any[], replyTo?: string) => void;
  replyTo?: { id: string; author: { name: string }; content: string } | null;
  onCancelReply?: () => void;
  placeholder?: string;
}

export function NewsCommentInput({ 
  onSend, 
  replyTo, 
  onCancelReply,
  placeholder = 'Add a comment...'
}: NewsCommentInputProps) {
  const [text, setText] = useState('');
  const [media, setMedia] = useState<any[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const isDark = (colorScheme ?? 'light') === 'dark';


  const handleSend = () => {
    if (text.trim() || media.length > 0) {
      haptics.medium();
      onSend(text.trim(), media.length > 0 ? media : undefined, replyTo?.id);
      setText('');
      setMedia([]);
      onCancelReply?.();
    }
  };

  const handlePickMedia = async () => {
    haptics.light();
    
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos and videos to add media to your comment.');
        return;
      }

      const { getMaxMediaItems, getMaxVideoDuration } = await import('@/lib/services/subscriptionService');
      const maxMedia = await getMaxMediaItems();
      const maxVideo = await getMaxVideoDuration();

      if (media.length >= maxMedia) {
        Alert.alert(
          'Media Limit Reached',
          `You can add up to ${maxMedia} media item${maxMedia > 1 ? 's' : ''} per comment. Upgrade to Pro for 10 items or Pro+ for 20 items.`,
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.85,
        selectionLimit: maxMedia - media.length,
        ...(maxVideo > 0 && { videoMaxDuration: maxVideo }),
      });
      
      if (!result.canceled && result.assets) {
        haptics.success();
        const newMedia = result.assets.map(asset => ({
          id: `media-${Date.now()}-${Math.random()}`,
          type: asset.type === 'video' ? 'video' : 'image',
          url: asset.uri,
          thumbnail: asset.uri,
          width: asset.width || 0,
          height: asset.height || 0,
          duration: asset.duration ?? undefined,
        }));
        setMedia(prev => [...prev, ...newMedia]);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media');
    }
  };


  const handleRemoveMedia = (index: number) => {
    haptics.light();
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const canSend = text.trim().length > 0 || media.length > 0;
  const charCount = text.length;
  const maxLength = 1000;
  const isNearLimit = charCount > maxLength * 0.9;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {replyTo && (
        <View style={[styles.replyBar, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
          <View style={styles.replyBarContent}>
            <Ionicons name="arrow-undo" size={14} color={colors.primary} />
            <Text style={[styles.replyBarText, { color: colors.text }]} numberOfLines={1}>
              Replying to {replyTo.author.name}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onCancelReply}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Ionicons name="close" size={18} color={colors.secondary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.divider }]}>
        {/* Media Preview */}
        {media.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.mediaPreview}
            contentContainerStyle={styles.mediaPreviewContent}
          >
            {media.map((item, index) => (
              <View key={item.id} style={styles.mediaItem}>
                {item.type === 'video' ? (
                  <View style={[styles.mediaThumbnail, { backgroundColor: colors.inputBackground }]}>
                    <ExpoImage
                      source={{ uri: item.thumbnail || item.url }}
                      style={styles.mediaImage}
                      contentFit="cover"
                    />
                    <View style={styles.videoOverlay}>
                      <Ionicons name="play-circle" size={24} color="#FFFFFF" />
                    </View>
                    {item.duration && (
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>
                          {Math.floor(item.duration)}s
                        </Text>
                      </View>
                    )}
                  </View>
                ) : item.type === 'audio' ? (
                  <View style={[styles.audioContainer, { backgroundColor: colors.inputBackground }]}>
                    <Ionicons name="musical-notes" size={24} color={colors.primary} />
                    <Text style={[styles.audioDuration, { color: colors.text }]}>
                      {item.duration ? `${Math.floor(item.duration)}s` : 'Audio'}
                    </Text>
                  </View>
                ) : item.type === 'document' ? (
                  <View style={[styles.documentContainer, { backgroundColor: colors.inputBackground }]}>
                    <Ionicons name="document" size={24} color={colors.primary} />
                    <Text style={[styles.documentName, { color: colors.text }]} numberOfLines={1}>
                      {item.name || 'Document'}
                    </Text>
                  </View>
                ) : (
                  <ExpoImage
                    source={{ uri: item.url }}
                    style={styles.mediaImage}
                    contentFit="cover"
                  />
                )}
                <TouchableOpacity
                  style={[styles.removeMediaButton, { backgroundColor: colors.error }]}
                  onPress={() => handleRemoveMedia(index)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.inputRow}>
          <View style={[
            styles.inputContainer, 
            { 
              backgroundColor: isFocused ? colors.background : colors.inputBackground,
              borderColor: isFocused ? colors.primary : colors.inputBorder,
              borderWidth: isFocused ? 1.5 : StyleSheet.hairlineWidth,
            }
          ]}>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={handlePickMedia}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="images-outline" size={20} color={colors.secondary} />
            </TouchableOpacity>
            
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={placeholder}
              placeholderTextColor={colors.secondary}
              value={text}
              onChangeText={setText}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              multiline
              maxLength={maxLength}
              textAlignVertical="center"
            />
            {charCount > 0 && (
              <View style={styles.charCountContainer}>
                <Text style={[
                  styles.charCount,
                  { 
                    color: isNearLimit ? colors.error : colors.secondary,
                    fontWeight: isNearLimit ? '600' : '400',
                  }
                ]}>
                  {charCount}/{maxLength}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: canSend ? colors.primary : colors.secondary + '30',
                opacity: canSend ? 1 : 0.5,
                transform: [{ scale: canSend ? 1 : 0.9 }],
              },
            ]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.7}
          >
            <Ionicons
              name="send"
              size={18}
              color={canSend ? '#FFFFFF' : colors.secondary}
            />
          </TouchableOpacity>
        </View>
      </View>


    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? Spacing.md : Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  replyBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  replyBarText: {
    fontSize: Typography.xs,
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs,
    gap: Spacing.xs,
    minHeight: 44,
  },
  mediaButton: {
    padding: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: Typography.sm,
    maxHeight: 100,
    paddingVertical: Spacing.xs,
    minHeight: 24,
  },
  charCountContainer: {
    alignSelf: 'flex-end',
    paddingBottom: 2,
  },
  charCount: {
    fontSize: Typography.xs,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  mediaPreview: {
    maxHeight: 100,
    marginBottom: Spacing.sm,
    marginHorizontal: -Spacing.md,
  },
  mediaPreviewContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  mediaItem: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  audioDuration: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  documentContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.xs,
  },
  documentName: {
    fontSize: Typography.xs,
    fontWeight: '500',
    textAlign: 'center',
  },
  audioPreviewContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  audioPreviewText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  documentPreviewContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: Spacing.xs,
  },
  documentPreviewText: {
    fontSize: Typography.xs,
    fontWeight: '500',
    textAlign: 'center',
  },
});
