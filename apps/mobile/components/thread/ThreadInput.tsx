import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Alert, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface ThreadInputProps {
  onSend: (text: string, media?: any[], replyTo?: string) => void;
  replyTo?: { id: string; author: { name: string }; content: string } | null;
  onCancelReply?: () => void;
}

export function ThreadInput({ onSend, replyTo, onCancelReply }: ThreadInputProps) {
  const [text, setText] = useState('');
  const [media, setMedia] = useState<any[]>([]);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();

  const handleSend = () => {
    if (text.trim() || media.length > 0) {
      onSend(text.trim(), media.length > 0 ? media : undefined, replyTo?.id);
      setText('');
      setMedia([]);
      onCancelReply?.();
    }
  };

  const handlePickMedia = async () => {
    try {
      haptics.light();
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
          `You can add up to ${maxMedia} media item${maxMedia > 1 ? 's' : ''} per comment. Upgrade to Pro for 10 items or Premium for 20 items.`,
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
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

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.surface,
      borderTopColor: colors.divider,
    }]}>
      {/* Reply bar - compact one-liner with clear cancel */}
      {replyTo && (
        <View style={[styles.replyBar, { borderLeftColor: colors.divider, backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
          <View style={styles.replyBarInner}>
            <View style={styles.replyBarTextWrap}>
              <Text style={[styles.replyBarLabel, { color: colors.secondary }]}>
                Replying to {replyTo.author.name}
              </Text>
              {(replyTo.content && replyTo.content.trim()) ? (
                <Text style={[styles.replyBarSnippet, { color: colors.secondary }]} numberOfLines={1}>
                  “{replyTo.content.trim()}”
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => { haptics.light(); onCancelReply?.(); }}
              style={styles.replyBarCancel}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color={colors.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Media Preview */}
      {media.length > 0 && (
        <View style={styles.mediaPreview}>
          {media.map((item, index) => (
            <View key={item.id || index} style={styles.mediaItem}>
              {item.type === 'video' ? (
                <View style={[styles.mediaThumbnail, { backgroundColor: colors.divider }]}>
                  <ExpoImage
                    source={{ uri: item.thumbnail || item.url }}
                    style={styles.mediaThumbnail}
                    contentFit="cover"
                  />
                  <View style={styles.videoOverlay}>
                    <Ionicons name="play-circle" size={32} color="#FFFFFF" />
                  </View>
                  {item.duration && (
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>
                        {Math.floor(item.duration)}s
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <ExpoImage
                  source={{ uri: item.url }}
                  style={styles.mediaThumbnail}
                  contentFit="cover"
                />
              )}
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: colors.error }]}
                onPress={() => handleRemoveMedia(index)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Input Container */}
      <View style={[styles.inputContainer, {
        backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        borderColor: colors.divider,
      }]}>
        <TouchableOpacity
          onPress={handlePickMedia}
          style={styles.attachButton}
          activeOpacity={0.7}
        >
          <Ionicons name="image-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={text}
          onChangeText={setText}
          placeholder={replyTo ? `Reply to ${replyTo.author.name}...` : "Add a comment..."}
          placeholderTextColor={colors.secondary}
          multiline
          maxLength={500}
        />
        
        <TouchableOpacity
          onPress={handleSend}
          style={[
            styles.sendButton,
            {
              backgroundColor: (text.trim() || media.length > 0) ? colors.primary : colors.divider,
              opacity: (text.trim() || media.length > 0) ? 1 : 0.5,
            }
          ]}
          disabled={!text.trim() && media.length === 0}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="arrow-up" 
            size={20} 
            color={(text.trim() || media.length > 0) ? "#FFFFFF" : colors.secondary} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        paddingBottom: Spacing.lg + 8,
      },
      android: {
        paddingBottom: Spacing.md,
      },
    }),
  },
  mediaPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  mediaItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyBar: {
    marginBottom: Spacing.sm,
    borderLeftWidth: 2,
    borderRadius: 0,
  },
  replyBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  replyBarTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  replyBarLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  replyBarSnippet: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  replyBarCancel: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs + 2,
    gap: Spacing.sm,
  },
  attachButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 100,
    paddingVertical: Platform.OS === 'ios' ? 4 : 0,
    ...Platform.select({
      ios: {
        paddingTop: 4,
      },
    }),
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
