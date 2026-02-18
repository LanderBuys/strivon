import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { StoryTextOverlay, StoryStickerOverlay, StoryOverlay } from '@/types/post';
import { getStoryExpirationHours } from '@/lib/services/subscriptionService';
import { createStory } from '@/lib/api/stories';
import { getPendingStoryMedia } from '@/lib/services/pendingStoryStore';

const TEXT_COLORS = ['#FFFFFF', '#000000', '#FF3B30', '#34C759', '#007AFF', '#FF9500', '#AF52DE', '#FFFF00'];
const STICKER_EMOJIS = ['🔥', '❤️', '😂', '😍', '👍', '✨', '💯', '🎉', '🙌', '⭐', '💪', '👋'];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function generateId() {
  return `overlay-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function StoryVideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
    </View>
  );
}

export default function CreateStoryEditorScreen() {
  const params = useLocalSearchParams<{ uri?: string; type?: string }>();
  const router = useRouter();
  const haptics = useHapticFeedback();
  const insets = useSafeAreaInsets();

  const [media, setMedia] = useState<{ uri: string; type: string } | null>(() => {
    const pending = getPendingStoryMedia();
    if (pending) return pending;
    if (params.uri) return { uri: params.uri, type: params.type ?? 'image' };
    return null;
  });

  const uri = media?.uri ?? null;
  const type = media?.type ?? 'image';
  const isVideo = type === 'video';

  const [overlays, setOverlays] = useState<StoryOverlay[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [textColor, setTextColor] = useState(TEXT_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [expirationHours, setExpirationHours] = useState(24);

  useEffect(() => {
    getStoryExpirationHours().then(setExpirationHours);
  }, []);

  const selectedOverlay = overlays.find((o) => o.id === selectedId);
  const textOverlays = overlays.filter((o): o is StoryTextOverlay => o.type === 'text');
  const stickerOverlays = overlays.filter((o): o is StoryStickerOverlay => o.type === 'sticker');
  const isTextSelected = selectedOverlay?.type === 'text';
  const isStickerSelected = selectedOverlay?.type === 'sticker';

  const handleAddText = useCallback(() => {
    haptics.light();
    const placeholder = 'Tap to type';
    const newOverlay: StoryTextOverlay = {
      id: generateId(),
      type: 'text',
      text: placeholder,
      position: { xPercent: 50, yPercent: 50 },
      fontSize: 28,
      color: textColor,
      fontWeight: 'normal',
    };
    setOverlays((prev) => [...prev, newOverlay]);
    setSelectedId(newOverlay.id);
    setEditingText(placeholder);
  }, [textColor, haptics]);

  const handleAddSticker = useCallback((emoji: string) => {
    haptics.light();
    const newOverlay: StoryStickerOverlay = {
      id: generateId(),
      type: 'sticker',
      emoji,
      position: { xPercent: 50, yPercent: 50 },
      fontSize: 48,
    };
    setOverlays((prev) => [...prev, newOverlay]);
    setSelectedId(newOverlay.id);
  }, [haptics]);

  const handleUpdateSelected = useCallback(
    (updates: Partial<StoryTextOverlay> | Partial<StoryStickerOverlay>) => {
      if (!selectedId) return;
      setOverlays((prev) => prev.map((o) => (o.id === selectedId ? { ...o, ...updates } as StoryOverlay : o)));
    },
    [selectedId]
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedId) {
      haptics.light();
      setOverlays((prev) => prev.filter((o) => o.id !== selectedId));
      setSelectedId(null);
      setEditingText('');
    }
  }, [selectedId, haptics]);

  const handleDeselect = useCallback(() => {
    setSelectedId(null);
    setEditingText('');
  }, []);

  const handleShare = useCallback(async () => {
    if (!uri) return;
    setLoading(true);
    try {
      const normalizedOverlays: StoryOverlay[] = overlays.map((o) => {
        if (o.type === 'text') return { ...o, text: (o.text || '').trim() || ' ' };
        return o;
      });
      const newStory = await createStory({
        media: { uri, type: type || 'image' },
        expirationHours,
        overlays: normalizedOverlays,
      });
      haptics.success();
      router.replace(`/story/${newStory.id}`);
    } catch (error) {
      console.error('Error creating story:', error);
      Alert.alert('Couldn’t post', error instanceof Error ? error.message : 'Try again.', [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  }, [uri, type, expirationHours, overlays, haptics, router]);

  if (!uri) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={56} color="#888" />
          <Text style={styles.emptyText}>No photo or video</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.back()}>
            <Text style={styles.emptyBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']} />
      {/* Full-screen media */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleDeselect}>
        {isVideo ? (
          <StoryVideoPreview uri={uri} />
        ) : (
          <ExpoImage source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        )}
      </Pressable>

      {/* Overlays - full screen coordinates */}
      {textOverlays.map((overlay) => (
        <DraggableOverlay
          key={overlay.id}
          containerWidth={SCREEN_WIDTH}
          containerHeight={SCREEN_HEIGHT}
          xPercent={overlay.position.xPercent}
          yPercent={overlay.position.yPercent}
          isSelected={overlay.id === selectedId}
          onSelect={() => {
            setSelectedId(overlay.id);
            setEditingText(overlay.text);
          }}
          onMove={(xPercent, yPercent) => handleUpdateSelected({ position: { xPercent, yPercent } })}
          onLongPress={handleDeleteSelected}
        >
          <Text
            style={[
              styles.textOverlay,
              {
                fontSize: overlay.fontSize,
                color: overlay.color,
                fontWeight: overlay.fontWeight === 'bold' ? 'bold' : 'normal',
              },
            ]}
            numberOfLines={5}
          >
            {overlay.text || ' '}
          </Text>
        </DraggableOverlay>
      ))}
      {stickerOverlays.map((overlay) => (
        <DraggableOverlay
          key={overlay.id}
          containerWidth={SCREEN_WIDTH}
          containerHeight={SCREEN_HEIGHT}
          xPercent={overlay.position.xPercent}
          yPercent={overlay.position.yPercent}
          isSelected={overlay.id === selectedId}
          onSelect={() => setSelectedId(overlay.id)}
          onMove={(xPercent, yPercent) => handleUpdateSelected({ position: { xPercent, yPercent } })}
          onLongPress={handleDeleteSelected}
        >
          <Text style={[styles.stickerOverlay, { fontSize: overlay.fontSize }]}>{overlay.emoji}</Text>
        </DraggableOverlay>
      ))}

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.topBtn} hitSlop={16}>
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Story</Text>
        <TouchableOpacity
          onPress={handleShare}
          disabled={loading}
          style={[styles.shareBtn, loading && styles.shareBtnDisabled]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.shareBtnText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Right-side tools (Instagram-style) */}
      <View style={[styles.rightTools, { top: insets.top + 80 }]}>
        {!selectedId && (
          <>
            <TouchableOpacity style={styles.rightToolBtn} onPress={handleAddText} activeOpacity={0.8}>
              <View style={styles.rightToolIconWrap}>
                <Text style={styles.rightToolAa}>Aa</Text>
              </View>
              <Text style={styles.rightToolLabel}>Text</Text>
            </TouchableOpacity>
            <View style={styles.stickerRow}>
              {STICKER_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.stickerBtn}
                  onPress={() => handleAddSticker(emoji)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.stickerEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      {/* Bottom bar - only when text or sticker selected */}
      {(isTextSelected || isStickerSelected) && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.bottomWrap}
          keyboardVerticalOffset={0}
        >
          <View style={[styles.bottomBar, { paddingBottom: Spacing.lg + insets.bottom }]}>
            {isTextSelected && selectedOverlay?.type === 'text' && (
              <>
                <View style={styles.colorRow}>
                  {TEXT_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.colorDot, { backgroundColor: c }, textColor === c && styles.colorDotSelected]}
                      onPress={() => {
                        setTextColor(c);
                        handleUpdateSelected({ color: c });
                      }}
                    />
                  ))}
                </View>
                <View style={styles.editRow}>
                  <TouchableOpacity
                    style={[styles.boldBtn, selectedOverlay.fontWeight === 'bold' && styles.boldBtnActive]}
                    onPress={() => {
                      const next = selectedOverlay.fontWeight === 'bold' ? 'normal' : 'bold';
                      handleUpdateSelected({ fontWeight: next });
                    }}
                  >
                    <Text style={styles.boldBtnText}>B</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.textInput}
                    value={editingText}
                    onChangeText={(t) => {
                      setEditingText(t);
                      handleUpdateSelected({ text: t });
                    }}
                    placeholder="Type something..."
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    autoCapitalize="sentences"
                  />
                  <TouchableOpacity onPress={handleDeleteSelected} style={styles.delBtn}>
                    <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {isStickerSelected && (
              <TouchableOpacity style={styles.removeStickerBtn} onPress={handleDeleteSelected}>
                <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
                <Text style={styles.removeStickerLabel}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

interface DraggableOverlayProps {
  containerWidth: number;
  containerHeight: number;
  xPercent: number;
  yPercent: number;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (xPercent: number, yPercent: number) => void;
  onLongPress: () => void;
  children: React.ReactNode;
}

function DraggableOverlay({
  containerWidth,
  containerHeight,
  xPercent,
  yPercent,
  isSelected,
  onSelect,
  onMove,
  onLongPress,
  children,
}: DraggableOverlayProps) {
  const x = (xPercent / 100) * containerWidth;
  const y = (yPercent / 100) * containerHeight;
  const [layout, setLayout] = useState({ w: 60, h: 30 });
  const startRef = useRef({ xPercent, yPercent });
  const didMoveRef = useRef(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const leftAnim = useRef(new Animated.Value(x - layout.w / 2)).current;
  const topAnim = useRef(new Animated.Value(y - layout.h / 2)).current;

  // Keep base position and translate in sync with props; zero translate when position updates (e.g. after release)
  useLayoutEffect(() => {
    const baseLeft = x - layout.w / 2;
    const baseTop = y - layout.h / 2;
    leftAnim.setValue(baseLeft);
    topAnim.setValue(baseTop);
    translateX.setValue(0);
    translateY.setValue(0);
  }, [x, y, layout.w, layout.h]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startRef.current = { xPercent, yPercent };
        didMoveRef.current = false;
        translateX.setValue(0);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        if (g.dx * g.dx + g.dy * g.dy > 25) didMoveRef.current = true;
        translateX.setValue(g.dx);
        translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        const nx = Math.max(0, Math.min(100, startRef.current.xPercent + (g.dx / containerWidth) * 100));
        const ny = Math.max(0, Math.min(100, startRef.current.yPercent + (g.dy / containerHeight) * 100));
        onMove(nx, ny);
        if (!didMoveRef.current && Math.abs(g.dx) < 3 && Math.abs(g.dy) < 3) onSelect();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.draggableWrap,
        {
          left: leftAnim,
          top: topAnim,
          borderWidth: isSelected ? 2 : 0,
          borderColor: '#FFF',
          transform: [{ translateX }, { translateY }],
        },
      ]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setLayout({ w: width, h: height });
      }}
      {...pan.panHandlers}
    >
      <TouchableOpacity activeOpacity={1} onLongPress={onLongPress} style={styles.draggableInner}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  safe: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 10,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 18,
    marginTop: Spacing.md,
  },
  emptyBtn: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  emptyBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    zIndex: 20,
  },
  topBtn: {
    padding: Spacing.xs,
  },
  topTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  shareBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    minWidth: 72,
    alignItems: 'center',
  },
  shareBtnDisabled: {
    opacity: 0.7,
  },
  shareBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  rightTools: {
    position: 'absolute',
    right: Spacing.sm,
    zIndex: 20,
    alignItems: 'center',
    gap: Spacing.lg,
  },
  rightToolBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  rightToolIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  rightToolAa: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  rightToolLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '500',
  },
  stickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.sm,
  },
  stickerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerEmoji: {
    fontSize: 22,
  },
  bottomWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  bottomBar: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.7)',
    gap: Spacing.sm,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: '#FFF',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  boldBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  boldBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  boldBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: 16,
    color: '#FFF',
    maxHeight: 44,
  },
  delBtn: {
    padding: Spacing.sm,
  },
  removeStickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  removeStickerLabel: {
    color: '#FF6B6B',
    fontSize: 15,
    fontWeight: '600',
  },
  draggableWrap: {
    position: 'absolute',
    borderRadius: 8,
    padding: 6,
    minWidth: 44,
    minHeight: 36,
    zIndex: 5,
  },
  draggableInner: {
    flex: 1,
  },
  textOverlay: {
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    includeFontPadding: false,
  },
  stickerOverlay: {
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
