import { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Platform, Dimensions, Easing, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Image as ExpoImage } from 'expo-image';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoCallScreenProps {
  visible: boolean;
  isIncoming: boolean;
  caller?: {
    id: string;
    name: string;
    avatar?: string;
  };
  participants?: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  isGroupCall?: boolean;
  activeSpeakerId?: string;
  localParticipantId?: string;
  onAccept?: () => void;
  onDecline: () => void;
  onEnd: () => void;
  onToggleMute?: () => void;
  onToggleSpeaker?: () => void;
  onToggleVideo?: () => void;
  onToggleCamera?: () => void;
  onDurationChange?: (duration: number) => void;
  callDuration?: number;
  isMuted?: boolean;
  isSpeakerOn?: boolean;
  isVideoOn?: boolean;
  isCameraOn?: boolean;
}

export function VideoCallScreen({
  visible,
  isIncoming,
  caller,
  participants,
  isGroupCall,
  activeSpeakerId,
  localParticipantId,
  onAccept,
  onDecline,
  onEnd,
  onToggleMute,
  onToggleSpeaker,
  onToggleVideo,
  onToggleCamera,
  onDurationChange,
  callDuration = 0,
  isMuted = false,
  isSpeakerOn = false,
  isVideoOn = true,
  isCameraOn = true,
}: VideoCallScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const insets = useSafeAreaInsets();
  const [duration, setDuration] = useState(callDuration);
  const [showControls, setShowControls] = useState(true);
  const [topBarHeight, setTopBarHeight] = useState(0);
  const [controlsInteractionTick, setControlsInteractionTick] = useState(0);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'spotlight'>('spotlight');
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const [spotlightLocked, setSpotlightLocked] = useState(false);
  const lastTapRef = useRef<number>(0);
  const singleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const localVideoTop = useRef(new Animated.Value(0)).current;
  const topBarTranslateY = useRef(new Animated.Value(-100)).current;
  const controlsTranslateY = useRef(new Animated.Value(100)).current;
  const onDurationChangeRef = useRef(onDurationChange);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const durationRef = useRef(callDuration);
  const hideTokenRef = useRef(0);
  const controlsVisibleRef = useRef(true);
  const pendingShowAnimRef = useRef(false);

  const isCompact = SCREEN_WIDTH < 380 || SCREEN_HEIGHT < 720;
  const pipW = Math.round(Math.min(112, Math.max(76, SCREEN_WIDTH * 0.23)));
  const pipH = Math.round(Math.min(152, Math.max(104, pipW * 1.32)));
  const pipR = Math.round(Math.min(20, Math.max(14, pipW * 0.18)));
  const controlsGap = isCompact ? Spacing.sm + 2 : Spacing.md + 2;
  const controlsPadX = isCompact ? Spacing.md : Spacing.lg;
  const secondarySize = isCompact ? 40 : 44;
  const primarySize = isCompact ? 48 : 52;
  const secondaryRadius = Math.round(secondarySize / 2);
  const primaryRadius = Math.round(primarySize / 2);
  const secondaryIconSize = isCompact ? 18 : 20;
  const primaryIconSize = isCompact ? 22 : 24;

  const callParticipants = useMemo(() => {
    if (participants && participants.length > 0) return participants;
    if (caller) return [{ id: caller.id, name: caller.name, avatar: caller.avatar }];
    return [];
  }, [participants, caller?.id, caller?.name, caller?.avatar]);

  const isGroup = useMemo(() => {
    return typeof isGroupCall === 'boolean' ? isGroupCall : callParticipants.length > 1;
  }, [isGroupCall, callParticipants.length]);

  const visibleParticipants = useMemo(() => {
    if (!isGroup) return callParticipants;
    if (!localParticipantId) return callParticipants;
    const withoutLocal = callParticipants.filter(p => p.id !== localParticipantId);
    return withoutLocal.length > 0 ? withoutLocal : callParticipants;
  }, [callParticipants, isGroup, localParticipantId]);

  const firstVisibleId = visibleParticipants[0]?.id;

  const activeSpeaker = useMemo(() => {
    if (!isGroup) return undefined;
    if (!activeSpeakerId) return undefined;
    return callParticipants.find(p => p.id === activeSpeakerId);
  }, [isGroup, activeSpeakerId, callParticipants]);

  const focusedParticipant = useMemo(() => {
    if (!isGroup) return undefined;
    if (layoutMode !== 'spotlight') return undefined;
    const focusedId = spotlightId || activeSpeakerId || firstVisibleId;
    if (!focusedId) return undefined;
    return visibleParticipants.find(p => p.id === focusedId);
  }, [isGroup, layoutMode, spotlightId, activeSpeakerId, firstVisibleId, visibleParticipants]);

  const headerTitle = isGroup ? (caller?.name || 'Group call') : (caller?.name || 'Unknown');
  const headerSubtitle = isGroup
    ? (layoutMode === 'grid'
        ? 'Grid view'
        : `Spotlight: ${focusedParticipant?.name || '—'}`)
    : 'Video call';

  const headerAvatarUri = !isGroup ? caller?.avatar : (layoutMode === 'spotlight' ? focusedParticipant?.avatar : undefined);
  const headerAvatarName = !isGroup
    ? (caller?.name || 'U')
    : (layoutMode === 'spotlight' ? (focusedParticipant?.name || caller?.name || 'U') : (caller?.name || 'U'));

  const participantCount = isGroup ? callParticipants.length : 0;

  useEffect(() => {
    if (!visible) return;
    if (!isGroup) return;
    // Default to grid on open for group calls (most expected behavior).
    setLayoutMode('grid');
    setSpotlightLocked(false);
    setSpotlightId(null);
  }, [visible, isGroup]);

  const clearControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
  };

  const stopControlAnimations = () => {
    controlsOpacity.stopAnimation();
    topBarTranslateY.stopAnimation();
    controlsTranslateY.stopAnimation();
    localVideoTop.stopAnimation();
  };

  const computeHeaderOffset = () => {
    const basePipTop = insets.top + Spacing.md;
    const headerH = topBarHeight || 92;
    return Math.min(140, Math.max(0, headerH - basePipTop + Spacing.sm));
  };

  const getTopBarHiddenY = () => {
    // Hide exactly by its measured height (fallback to a safe estimate).
    const fallback = insets.top + 84;
    return -Math.max(topBarHeight || 0, fallback);
  };

  const requestShowControls = () => {
    // Cancel any pending hide, stop animations, and prepare "hidden" start state.
    hideTokenRef.current += 1;
    clearControlsTimeout();
    stopControlAnimations();

    controlsVisibleRef.current = true;
    pendingShowAnimRef.current = true;
    controlsOpacity.setValue(0);
    topBarTranslateY.setValue(getTopBarHiddenY());
    controlsTranslateY.setValue(100);
    localVideoTop.setValue(0);
    setShowControls(true);
    setControlsInteractionTick((t) => t + 1);
  };

  const animateShowControls = () => {
    const headerOffset = computeHeaderOffset();
    Animated.parallel([
      Animated.timing(controlsOpacity, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(localVideoTop, {
        toValue: headerOffset,
        tension: 50,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.spring(topBarTranslateY, {
        toValue: 0,
        tension: 50,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.spring(controlsTranslateY, {
        toValue: 0,
        tension: 50,
        friction: 11,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateHideControls = (token: number) => {
    Animated.parallel([
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 260,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(topBarTranslateY, {
        toValue: getTopBarHiddenY(),
        duration: 240,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(controlsTranslateY, {
        toValue: 100,
        duration: 240,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(localVideoTop, {
        toValue: 0,
        tension: 50,
        friction: 11,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (hideTokenRef.current === token) {
        setShowControls(false);
      }
    });
  };

  // Keep refs updated
  useEffect(() => {
    onDurationChangeRef.current = onDurationChange;
  }, [onDurationChange]);

  useEffect(() => {
    durationRef.current = callDuration;
    setDuration(callDuration);
  }, [callDuration]);

  useEffect(() => {
    if (visible && !isIncoming) {
      durationRef.current = callDuration;
      setDuration(callDuration);
      
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Start new interval - update state and callback separately
      intervalRef.current = setInterval(() => {
        durationRef.current += 1;
        const newDuration = durationRef.current;
        
        // Update state for display
        setDuration(newDuration);
        
        // Call callback in next tick to avoid render conflicts
        requestAnimationFrame(() => {
          onDurationChangeRef.current?.(newDuration);
        });
      }, 1000);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else if (!visible) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      durationRef.current = 0;
      setDuration(0);
    }
  }, [visible, isIncoming]);

  useEffect(() => {
    if (visible && isIncoming) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [visible, isIncoming, pulseAnim]);

  useEffect(() => {
    if (visible) {
      // Fresh open: reset state + animate in once to avoid flicker/glitches.
      setShowControls(true);
      controlsVisibleRef.current = true;
      pendingShowAnimRef.current = true;

      fadeAnim.setValue(0);
      controlsOpacity.setValue(0);
      topBarTranslateY.setValue(getTopBarHiddenY());
      controlsTranslateY.setValue(100);
      localVideoTop.setValue(0);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // Kick the controls animation on the next frame so layout is stable.
      requestAnimationFrame(() => {
        stopControlAnimations();
        animateShowControls();
        setControlsInteractionTick((t) => t + 1);
      });
    } else {
      fadeAnim.setValue(0);
      topBarTranslateY.setValue(getTopBarHiddenY());
      controlsTranslateY.setValue(100);
      localVideoTop.setValue(0);
      controlsOpacity.setValue(1);
      controlsVisibleRef.current = true;
      pendingShowAnimRef.current = false;
    }
  }, [visible, fadeAnim, topBarTranslateY, controlsTranslateY, localVideoTop, topBarHeight, insets.top]);

  useEffect(() => {
    if (!visible || isIncoming || !showControls) {
      clearControlsTimeout();
      return;
    }

    // Only auto-hide when controls are actually visible.
    if (!controlsVisibleRef.current) {
      clearControlsTimeout();
      return;
    }

    clearControlsTimeout();
    controlsTimeoutRef.current = setTimeout(() => {
      // Mark as hidden immediately so a tap during fade-out shows controls again.
      controlsVisibleRef.current = false;
      const token = ++hideTokenRef.current;
      stopControlAnimations();
      animateHideControls(token);
    }, 6000);

    return () => {
      clearControlsTimeout();
    };
  }, [visible, isIncoming, showControls, controlsInteractionTick]);

  useEffect(() => {
    if (!showControls) return;
    if (!pendingShowAnimRef.current) return;

    // Only animate-in on explicit "show" (open/tap), not on header re-measure.
    pendingShowAnimRef.current = false;
    controlsVisibleRef.current = true;
    stopControlAnimations();
    animateShowControls();
  }, [showControls]);

  useEffect(() => {
    // If the header height changes after layout, ONLY adjust the PiP offset (no full re-animate).
    if (!showControls || !controlsVisibleRef.current) return;
    Animated.spring(localVideoTop, {
      toValue: computeHeaderOffset(),
      tension: 50,
      friction: 11,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topBarHeight, insets.top]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = () => {
    haptics.success();
    onAccept?.();
  };

  const handleDecline = () => {
    haptics.light();
    onDecline();
  };

  const handleEnd = () => {
    haptics.medium();
    onEnd();
  };

  const handleBackgroundPress = () => {
    // In group spotlight mode, double-tap should bring back grid view.
    const enableDoubleTapToGrid = isGroup && isVideoOn && layoutMode === 'spotlight';
    const DOUBLE_TAP_DELAY = 260;

    if (!enableDoubleTapToGrid) {
      handleScreenTap();
      return;
    }

    const now = Date.now();
    const isDoubleTap = lastTapRef.current > 0 && (now - lastTapRef.current) < DOUBLE_TAP_DELAY;

    if (isDoubleTap) {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      lastTapRef.current = 0;

      setLayoutMode('grid');
      setSpotlightLocked(false);
      setSpotlightId(null);
      setControlsInteractionTick((t) => t + 1);
      return;
    }

    lastTapRef.current = now;

    // If controls are hidden, show them immediately (responsiveness),
    // but still allow the second tap to trigger the grid.
    if (!showControls) {
      handleScreenTap();
      if (singleTapTimeoutRef.current) clearTimeout(singleTapTimeoutRef.current);
      singleTapTimeoutRef.current = setTimeout(() => {
        singleTapTimeoutRef.current = null;
        lastTapRef.current = 0;
      }, DOUBLE_TAP_DELAY);
      return;
    }

    // Controls are visible: delay the single-tap toggle so a double-tap can override it.
    if (singleTapTimeoutRef.current) clearTimeout(singleTapTimeoutRef.current);
    singleTapTimeoutRef.current = setTimeout(() => {
      singleTapTimeoutRef.current = null;
      lastTapRef.current = 0;
      handleScreenTap();
    }, DOUBLE_TAP_DELAY);
  };

  useEffect(() => {
    return () => {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
    };
  }, []);

  const handleScreenTap = () => {
    const isActuallyVisible = showControls && controlsVisibleRef.current;

    clearControlsTimeout();
    // Invalidate any pending hide completion and stop ongoing animations.
    hideTokenRef.current += 1;
    stopControlAnimations();

    if (isActuallyVisible) {
      // Tap again should close controls.
      controlsVisibleRef.current = false;
      const token = ++hideTokenRef.current;
      animateHideControls(token);
      return;
    }

    // Otherwise, show controls.
    if (!showControls) {
      requestShowControls();
    } else {
      controlsVisibleRef.current = true;
      pendingShowAnimRef.current = true;
      controlsOpacity.setValue(0);
      topBarTranslateY.setValue(getTopBarHiddenY());
      controlsTranslateY.setValue(100);
      localVideoTop.setValue(0);
      animateShowControls();
      setControlsInteractionTick((t) => t + 1);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      // Avoid double-fade (Modal + fadeAnim) which can cause flicker on open.
      animationType="none"
      statusBarTranslucent
      onRequestClose={isIncoming ? handleDecline : handleEnd}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Remote Video (Full Screen) */}
        <View style={styles.remoteVideo}>
          {/* Base background (keep subtle so grid/spotlight is always visible) */}
          {(!isGroup || !isVideoOn) && (caller?.avatar || headerAvatarUri) ? (
            <ExpoImage
              source={{ uri: ((isGroup ? headerAvatarUri : caller?.avatar) as string) }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={['#06060A', '#0A0B12', '#0A1020']}
              style={StyleSheet.absoluteFill}
            />
          )}

          {!isVideoOn && (
            <View style={[StyleSheet.absoluteFill, styles.videoOffOverlay]}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {headerAvatarName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                </Text>
              </View>
              <Text style={[styles.callerName, { color: '#FFFFFF' }]}>
                {headerTitle}
              </Text>
            </View>
          )}
        </View>

        {/* Background tap target (toggle controls). */}
        {!isIncoming && (
          <TouchableOpacity
            style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
            activeOpacity={1}
            onPress={handleBackgroundPress}
          />
        )}

        {/* Group call layout (must render ABOVE background + tap target) */}
        {isGroup && isVideoOn && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                zIndex: 2,
                // Grid needs padding so tiles don't sit under header/controls.
                // Spotlight should stay BIG: minimal padding and thumbnails float on top.
                paddingTop:
                  layoutMode === 'grid'
                    ? insets.top + (isCompact ? 72 : 86)
                    : insets.top + (isCompact ? 16 : 18),
                paddingBottom:
                  layoutMode === 'grid'
                    ? insets.bottom + (isCompact ? 150 : 170)
                    : insets.bottom + (isCompact ? 16 : 18),
                paddingHorizontal: Spacing.md,
              },
            ]}
            pointerEvents="box-none"
          >
                {layoutMode === 'grid' ? (
              <View style={styles.gridWrap} pointerEvents="box-none">
                {visibleParticipants.map((p) => {
                    const isActive = !!(activeSpeaker && activeSpeaker.id === p.id);
                  return (
                    <TouchableOpacity
                      key={p.id}
                      activeOpacity={0.9}
                      style={[styles.gridTile, isActive && styles.activeTile]}
                      onPress={() => {
                        // If controls are hidden, first show them (don’t “lose” the tap).
                        if (!showControls || !controlsVisibleRef.current) {
                          handleScreenTap();
                          return;
                        }
                        setLayoutMode('spotlight');
                        setSpotlightId(p.id);
                        setSpotlightLocked(true);
                        setControlsInteractionTick((t) => t + 1);
                      }}
                    >
                      {p.avatar ? (
                        <ExpoImage source={{ uri: p.avatar }} style={StyleSheet.absoluteFill} contentFit="cover" />
                      ) : (
                        <View style={[StyleSheet.absoluteFill, styles.tileFallback, { backgroundColor: colors.primary + '33' }]}>
                          <Text style={styles.tileInitials}>
                            {p.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.tileNamePill}>
                        <Text style={styles.tileName} numberOfLines={1}>
                          {p.name || 'Unknown'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              (() => {
                  const focusedId = spotlightId || activeSpeakerId || firstVisibleId;
                  const focused = focusedId ? visibleParticipants.find(p => p.id === focusedId) : undefined;
                const others = focused ? visibleParticipants.filter(p => p.id !== focused.id) : visibleParticipants;
                  const activeId = activeSpeaker?.id;

                return (
                  <View style={styles.spotlightWrap} pointerEvents="box-none">
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={handleBackgroundPress}
                      style={[styles.spotlightTile, focused?.id && activeId === focused.id && styles.activeTile]}
                    >
                      {focused?.avatar ? (
                        <ExpoImage source={{ uri: focused.avatar }} style={StyleSheet.absoluteFill} contentFit="cover" />
                      ) : (
                        <View style={[StyleSheet.absoluteFill, styles.tileFallback, { backgroundColor: colors.primary + '33' }]}>
                          <Text style={styles.tileInitials}>
                            {focused?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.tileNamePill}>
                        <Text style={styles.tileName} numberOfLines={1}>
                          {focused?.name || 'Unknown'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Thumbnails moved under local PiP camera (rendered separately) */}
                  </View>
                );
              })()
            )}
          </View>
        )}

        {/* Local Video (Picture in Picture) */}
        {!isIncoming && isCameraOn && (
          <View
            style={[
              styles.localVideoOuter,
              {
                top: insets.top + Spacing.md,
                right: Spacing.lg,
                width: pipW,
                height: pipH,
              },
            ]}
          >
            <Animated.View style={{ transform: [{ translateY: localVideoTop }] }}>
              <View style={[styles.localVideo, { borderRadius: pipR }]}>
                <TouchableOpacity
                  style={StyleSheet.absoluteFill}
                  activeOpacity={0.9}
                  onPress={handleScreenTap}
                >
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor: colors.spaceBackground,
                        justifyContent: 'center',
                        alignItems: 'center',
                      },
                    ]}
                  >
                    <IconSymbol name="person" size={24} color={colors.secondary} />
                  </View>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        )}

        {/* Group spotlight thumbnails UNDER local PiP camera */}
        {isGroup && isVideoOn && layoutMode === 'spotlight' && (() => {
          const focusedId = spotlightId || activeSpeakerId || firstVisibleId;
          const focused = focusedId ? visibleParticipants.find(p => p.id === focusedId) : undefined;
          const others = focused ? visibleParticipants.filter(p => p.id !== focused.id) : visibleParticipants;
          const activeId = activeSpeaker?.id;
          if (others.length === 0) return null;

          return (
            <View
              style={[
                styles.pipThumbsOuter,
                {
                  top: insets.top + Spacing.md + pipH + Spacing.sm,
                  right: Spacing.lg,
                  width: pipW,
                },
              ]}
              pointerEvents="box-none"
            >
              <Animated.View style={{ transform: [{ translateY: localVideoTop }] }}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.pipThumbsContent}
                >
                  {others.map((p) => {
                    const isActive = !!(activeId && activeId === p.id);
                    return (
                      <TouchableOpacity
                        key={p.id}
                        activeOpacity={0.9}
                        style={[
                          styles.pipThumbTile,
                          { height: Math.round(pipW * 0.78), borderRadius: Math.max(12, Math.round(pipR * 0.85)) },
                          isActive && styles.activeThumbTile,
                        ]}
                        onPress={() => {
                          // If controls are hidden, first show them.
                          if (!showControls || !controlsVisibleRef.current) {
                            handleScreenTap();
                            return;
                          }
                          setSpotlightId(p.id);
                          setSpotlightLocked(true);
                          setControlsInteractionTick((t) => t + 1);
                        }}
                      >
                        {p.avatar ? (
                          <ExpoImage source={{ uri: p.avatar }} style={StyleSheet.absoluteFill} contentFit="cover" />
                        ) : (
                          <View style={[StyleSheet.absoluteFill, styles.tileFallback, { backgroundColor: colors.primary + '33' }]}>
                            <Text style={styles.thumbInitials}>
                              {p.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </Animated.View>
            </View>
          );
        })()}

        {/* Top Info Bar */}
        {showControls && (
          <View style={styles.topBarOuter} pointerEvents="box-none">
            <Animated.View style={{ opacity: controlsOpacity, transform: [{ translateY: topBarTranslateY }] }}>
              <View
                style={[
                  styles.topBar,
                  {
                    // Use insets directly to avoid SafeAreaView re-layout jumps in translucent modals.
                    paddingTop: insets.top + (Spacing.xs + 2),
                  },
                ]}
                onLayout={(e) => {
                  const h = e?.nativeEvent?.layout?.height ?? 0;
                  if (h > 0 && Math.abs(h - topBarHeight) > 1) setTopBarHeight(h);
                }}
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.92)', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0.25)', 'transparent']}
                  locations={[0, 0.3, 0.6, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.topBarContent}>
                  <View style={styles.callInfo}>
                  {isIncoming ? (
                    <>
                      <View style={styles.nameRow}>
                        <Animated.View style={[styles.statusIndicator, { transform: [{ scale: pulseAnim }] }]}>
                          <View style={styles.statusDot} />
                        </Animated.View>
                        <Text style={[styles.callerNameTop, { color: '#FFFFFF' }]}>
                          {caller?.name || 'Unknown'}
                        </Text>
                      </View>
                      <Text style={[styles.incomingText, { color: 'rgba(255,255,255,0.9)' }]}>
                        Incoming video call
                      </Text>
                    </>
                  ) : (
                    <>
                      <View style={styles.topBarRow}>
                        <View style={styles.topBarLeft}>
                          <View style={styles.identityRow}>
                            <View style={styles.avatarMiniWrap}>
                              {headerAvatarUri ? (
                                <ExpoImage
                                  source={{ uri: headerAvatarUri }}
                                  style={styles.avatarMini}
                                  contentFit="cover"
                                />
                              ) : (
                                <View style={[styles.avatarMiniFallback, { backgroundColor: colors.primary }]}>
                                  <Text style={styles.avatarMiniText}>
                                    {headerAvatarName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.identityText}>
                              <Text
                                style={[styles.callerNameTop, styles.callerNameTopRow, { color: '#FFFFFF' }]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {headerTitle}
                              </Text>
                              <Text style={styles.callSubtitle} numberOfLines={1}>
                                {headerSubtitle}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.topBarRight}>
                          <View style={styles.topBarBadges}>
                            {isGroup && !isIncoming && (
                              <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => {
                                  setLayoutMode((m) => {
                                    if (m === 'grid') {
                                      // Enter spotlight, default to current focus/first participant.
                                      setSpotlightLocked(false);
                                      setSpotlightId((prev) => prev || activeSpeakerId || firstVisibleId || null);
                                      return 'spotlight';
                                    }
                                    // Back to grid
                                    setSpotlightLocked(false);
                                    setSpotlightId(null);
                                    return 'grid';
                                  });
                                  setControlsInteractionTick((t) => t + 1);
                                }}
                                style={styles.layoutToggle}
                              >
                                <IconSymbol
                                  name={layoutMode === 'grid' ? 'person-outline' : 'grid-outline'}
                                  size={16}
                                  color="rgba(255,255,255,0.95)"
                                />
                              </TouchableOpacity>
                            )}
                            {isGroup && (
                              <View style={styles.countBadge}>
                                <IconSymbol name="people" size={14} color="rgba(255,255,255,0.95)" />
                                <Text style={styles.countText}>{participantCount}</Text>
                              </View>
                            )}
                            <View style={styles.durationBadge}>
                              <View style={styles.durationIconContainer}>
                                <IconSymbol name="videocam" size={14} color="rgba(255,255,255,0.95)" />
                              </View>
                              <Text style={[styles.callDuration, { color: '#FFFFFF' }]}>
                                {formatDuration(duration)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </>
                  )}
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
        )}

        {/* Controls Overlay */}
        {showControls && (
          <View style={styles.controlsOuter} pointerEvents="box-none">
            <Animated.View style={{ opacity: controlsOpacity, transform: [{ translateY: controlsTranslateY }] }}>
              <View style={styles.controlsOverlay}>
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.9)']}
                  locations={[0, 0.4, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                <SafeAreaView edges={['bottom']} style={styles.safeAreaBottom}>
                  {isIncoming ? (
                    <View style={[styles.controlsRow, { gap: controlsGap, paddingHorizontal: controlsPadX }]}>
                  <TouchableOpacity
                    style={[
                      styles.controlButton,
                      styles.declineButton,
                      { width: primarySize, height: primarySize, borderRadius: primaryRadius },
                    ]}
                    onPress={handleDecline}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#EF4444', '#DC2626', '#B91C1C']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.buttonGradient}
                    >
                      <IconSymbol name="close" size={primaryIconSize} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.controlButton,
                      styles.acceptButton,
                      { width: primarySize, height: primarySize, borderRadius: primaryRadius },
                    ]}
                    onPress={handleAccept}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669', '#047857']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.buttonGradient}
                    >
                      <IconSymbol name="videocam" size={primaryIconSize} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.controlsWrapper}>
                      <View style={[styles.controlsRow, { gap: controlsGap, paddingHorizontal: controlsPadX }]}>
                    <TouchableOpacity
                      style={[
                        styles.controlButton,
                        styles.secondaryButton,
                        { 
                          backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.55)' : 'rgba(255,255,255,0.2)',
                          borderColor: isMuted ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255,255,255,0.35)',
                          width: secondarySize,
                          height: secondarySize,
                          borderRadius: secondaryRadius,
                        },
                      ]}
                      onPress={() => {
                        setControlsInteractionTick((t) => t + 1);
                        onToggleMute?.();
                      }}
                      activeOpacity={0.7}
                    >
                      <IconSymbol 
                        name={isMuted ? "mic-off" : "mic"} 
                        size={secondaryIconSize} 
                        color="#FFFFFF" 
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.controlButton,
                        styles.secondaryButton,
                        { 
                          backgroundColor: isVideoOn ? 'rgba(255,255,255,0.2)' : 'rgba(239, 68, 68, 0.55)',
                          borderColor: isVideoOn ? 'rgba(255,255,255,0.35)' : 'rgba(239, 68, 68, 0.4)',
                          width: secondarySize,
                          height: secondarySize,
                          borderRadius: secondaryRadius,
                        },
                      ]}
                      onPress={() => {
                        setControlsInteractionTick((t) => t + 1);
                        onToggleVideo?.();
                      }}
                      activeOpacity={0.7}
                    >
                      <IconSymbol 
                        name={isVideoOn ? "videocam" : "videocam-off"} 
                        size={secondaryIconSize} 
                        color="#FFFFFF" 
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.controlButton,
                        styles.endButton,
                        { width: primarySize, height: primarySize, borderRadius: primaryRadius },
                      ]}
                      onPress={handleEnd}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={['#EF4444', '#DC2626', '#B91C1C']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.buttonGradient}
                      >
                        <IconSymbol name="call" size={primaryIconSize} color="#FFFFFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.controlButton,
                        styles.secondaryButton,
                        { 
                          backgroundColor: isCameraOn ? 'rgba(255,255,255,0.2)' : 'rgba(239, 68, 68, 0.55)',
                          borderColor: isCameraOn ? 'rgba(255,255,255,0.35)' : 'rgba(239, 68, 68, 0.4)',
                          width: secondarySize,
                          height: secondarySize,
                          borderRadius: secondaryRadius,
                        },
                      ]}
                      onPress={() => {
                        setControlsInteractionTick((t) => t + 1);
                        onToggleCamera?.();
                      }}
                      activeOpacity={0.7}
                    >
                      <IconSymbol 
                        name="camera-reverse" 
                        size={secondaryIconSize} 
                        color="#FFFFFF" 
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.controlButton,
                        styles.secondaryButton,
                        { 
                          backgroundColor: isSpeakerOn ? 'rgba(16, 185, 129, 0.45)' : 'rgba(255,255,255,0.2)',
                          borderColor: isSpeakerOn ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255,255,255,0.35)',
                          width: secondarySize,
                          height: secondarySize,
                          borderRadius: secondaryRadius,
                        },
                      ]}
                      onPress={() => {
                        setControlsInteractionTick((t) => t + 1);
                        onToggleSpeaker?.();
                      }}
                      activeOpacity={0.7}
                    >
                      <IconSymbol 
                        name={isSpeakerOn ? "volume-high" : "volume-low"} 
                        size={secondaryIconSize} 
                        color="#FFFFFF" 
                      />
                    </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </SafeAreaView>
              </View>
            </Animated.View>
          </View>
        )}

        {/* Tap-to-toggle is handled by the background tap target above. */}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  gridTile: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - Spacing.sm) / 2,
    aspectRatio: 3 / 4,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.35)',
    // Keep border width constant to avoid "size jumping" when active state changes.
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  activeTile: {
    borderColor: 'rgba(16, 185, 129, 0.65)',
  },
  spotlightWrap: {
    flex: 1,
  },
  spotlightTile: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.35)',
    // Keep border width constant to avoid "size jumping" when active state changes.
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  thumbnailStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xs,
  },
  thumbnailStripContent: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  thumbTile: {
    width: 68,
    height: 90,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.35)',
    // Keep border width constant to avoid "size jumping" when active state changes.
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  activeThumbTile: {
    borderColor: 'rgba(16, 185, 129, 0.65)',
  },
  pipThumbsOuter: {
    position: 'absolute',
    zIndex: 6,
  },
  pipThumbsContent: {
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  pipThumbTile: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  tileFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileInitials: {
    color: '#FFFFFF',
    fontSize: Typography['2xl'],
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  thumbInitials: {
    color: '#FFFFFF',
    fontSize: Typography.base + 2,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tileNamePill: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tileName: {
    color: '#FFFFFF',
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  localVideoOuter: {
    position: 'absolute',
    zIndex: 5,
  },
  localVideo: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.6)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  videoOffOverlay: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    marginBottom: Spacing.lg + 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3.5,
    borderColor: 'rgba(255,255,255,0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  avatarText: {
    fontSize: Typography['3xl'] + 4,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2.5,
  },
  topBarOuter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm + 4,
    paddingBottom: Spacing.md + 6,
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  topBarLeft: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  topBarRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  topBarBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  layoutToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  countText: {
    color: '#FFFFFF',
    fontSize: Typography.sm,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.3,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    width: '100%',
  },
  avatarMiniWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  avatarMini: {
    width: '100%',
    height: '100%',
  },
  avatarMiniFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 12,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
  },
  callSubtitle: {
    marginTop: 2,
    fontSize: Typography.sm,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.2,
  },
  callInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xs + 2,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
    }),
  },
  callerNameTop: {
    fontSize: Typography.xl + 4,
    fontWeight: '700',
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: Spacing.xs + 2,
  },
  callerNameTopRow: {
    marginBottom: 0,
    fontSize: Typography.xl + 2,
  },
  incomingText: {
    fontSize: Typography.base,
    fontWeight: '500',
    letterSpacing: 0.2,
    opacity: 0.9,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  durationRow: {
    marginTop: Spacing.xs + 2,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.xs + 4,
    borderRadius: 14,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  durationIconContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callDuration: {
    fontSize: Typography.base + 2,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.8,
  },
  controlsOuter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  controlsOverlay: {},
  safeAreaBottom: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl + 16,
  },
  controlsWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.65,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
    }),
  },
  declineButton: {
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
    }),
  },
  endButton: {
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
    }),
  },
  secondaryButton: {
  },
  callerName: {
    fontSize: Typography.xl + 2,
    fontWeight: '700',
    marginTop: Spacing.md + 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: -0.3,
  },
});
