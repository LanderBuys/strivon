import { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ActivityIndicator, Dimensions, Modal, StatusBar, Platform } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import { useOnScreen } from '@/hooks/useOnScreen';
import { Image as ExpoImage } from 'expo-image';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoPlayerProps {
  uri: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  autoplay?: boolean;
  showControls?: boolean;
  onPress?: () => void;
  /** When false (e.g. other feed tab is visible), pause and mute to avoid bleed-through audio */
  isFeedVisible?: boolean;
}

export function VideoPlayer({
  uri,
  thumbnail,
  width,
  height,
  autoplay = false,
  showControls = true,
  onPress,
  isFeedVisible = true,
}: VideoPlayerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const containerRef = useRef<View>(null!);
  
  const aspectRatio = width && height ? width / height : 16 / 9;
  const videoWidth = width || SCREEN_WIDTH - Spacing.lg * 2;
  const videoHeight = height || videoWidth / aspectRatio;

  const isVisible = useOnScreen(containerRef, 0.5);

  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    player.muted = false;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const singleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressBarRef = useRef<View>(null!);

  // When feed tab is not visible (e.g. user switched to other tab), pause and mute immediately
  useEffect(() => {
    if (!isFeedVisible) {
      try {
        player.pause();
        player.muted = true;
      } catch {
        // ignore
      }
    } else {
      try {
        player.muted = isMuted;
      } catch {
        // ignore
      }
    }
  }, [isFeedVisible, player, isMuted]);

  // Handle visibility-based autoplay (only when this feed tab is visible)
  useEffect(() => {
    if (isFullscreen || !isFeedVisible) {
      if (!isFeedVisible) {
        try {
          player.pause();
        } catch {
          // ignore
        }
      }
      return;
    }

    const timer = setTimeout(() => {
      try {
        if (autoplay && isVisible) {
          player.play();
        } else if (!isVisible) {
          player.pause();
        }
      } catch (error) {
        // Silently handle
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [autoplay, isVisible, player, isFullscreen, isFeedVisible]);

  // Handle mute state
  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }
    };
  }, []);

  // Update position and status
  useEffect(() => {
    const updatePosition = () => {
      try {
        if (player) {
          setIsPlaying(player.playing || false);
          if (player.duration) {
            setDuration(player.duration / 1000);
          }
          if (player.currentTime !== undefined && player.currentTime !== null) {
            setPosition(player.currentTime / 1000);
          }
          if (player.playing && showThumbnail) {
            setShowThumbnail(false);
          }
          setIsLoading(false);
        }
      } catch (error) {
        // Silently handle
      }
    };

    updatePosition();
    const interval = setInterval(updatePosition, 500);

    return () => clearInterval(interval);
  }, [player, showThumbnail]);

  const handlePlayPause = () => {
    haptics.medium();
    try {
      if (player.playing) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.play();
        setIsPlaying(true);
        setShowThumbnail(false);
      }
      setShowControlsOverlay(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (player.playing) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControlsOverlay(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    // Clear any pending single tap timeout
    if (singleTapTimeoutRef.current) {
      clearTimeout(singleTapTimeoutRef.current);
      singleTapTimeoutRef.current = null;
    }
    
    if (lastTapRef.current && (now - lastTapRef.current) < DOUBLE_TAP_DELAY) {
      // Double tap detected - cancel single tap
      handlePlayPause();
      lastTapRef.current = 0;
    } else {
      // First tap - wait to see if it's a double tap
      lastTapRef.current = now;
      if (onPress) {
        // Schedule single tap handler
        singleTapTimeoutRef.current = setTimeout(() => {
          // If enough time has passed, it's a single tap
          if (lastTapRef.current === now) {
            onPress();
            lastTapRef.current = 0;
          }
          singleTapTimeoutRef.current = null;
        }, DOUBLE_TAP_DELAY + 50);
      } else {
        handleShowControls();
      }
    }
  };

  const handleMuteToggle = () => {
    haptics.light();
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    haptics.medium();
    setIsFullscreen(!isFullscreen);
    setShowControlsOverlay(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControlsOverlay(false);
    }, 3000);
  };

  const handleShowControls = () => {
    setShowControlsOverlay(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    // Only auto-hide if video is playing
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControlsOverlay(false);
      }, 3000);
    }
  };

  const handleProgressBarPress = (event: any) => {
    if (!progressBarRef.current || duration === 0) return;
    
    try {
      progressBarRef.current.measureInWindow((x, width) => {
        const touchX = event.nativeEvent.locationX;
        const progress = Math.max(0, Math.min(1, touchX / width));
        const newPosition = progress * duration * 1000; // Convert to milliseconds
        
        player.currentTime = newPosition;
        haptics.light();
      });
    } catch (error) {
      console.error('Error seeking video:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? position / duration : 0;

  const renderVideoContent = (fullscreen = false) => {
    const containerWidth = fullscreen ? SCREEN_WIDTH : videoWidth;
    const containerHeight = fullscreen ? SCREEN_HEIGHT : videoHeight;

    return (
      <View 
        ref={fullscreen ? undefined : containerRef}
        style={[styles.container, { width: containerWidth, height: containerHeight }]}
      >
        {/* Thumbnail overlay */}
        {showThumbnail && thumbnail && (
          <View style={styles.thumbnailOverlay}>
            <ExpoImage
              source={{ uri: thumbnail }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <View style={styles.thumbnailGradient} />
          </View>
        )}

        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
          allowsFullscreen={false}
        />

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        )}

        {showControls && (
          <View style={styles.controlsOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={handleDoubleTap}
              activeOpacity={1}
            />
            
            {/* Play button when paused */}
            {!isPlaying && (
              <View style={styles.controlsCenter} pointerEvents="box-none">
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={handlePlayPause}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="play"
                    size={24}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Controls overlay */}
            {showControlsOverlay && (
              <View style={styles.controlsBottom} pointerEvents="box-none">
                <View style={styles.bottomControlsRow}>
                  <Text style={styles.timeText}>
                    {formatTime(position)}
                  </Text>
                  <TouchableOpacity
                    ref={progressBarRef}
                    style={styles.progressBarContainer}
                    onPress={handleProgressBarPress}
                    activeOpacity={1}
                  >
                    <View style={styles.progressBarBackground} />
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progress * 100}%` },
                      ]}
                    />
                  </TouchableOpacity>
                  <Text style={styles.timeText}>
                    {formatTime(duration)}
                  </Text>
                  {!fullscreen && (
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={handleFullscreen}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="expand"
                        size={18}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleMuteToggle}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isMuted ? 'volume-mute' : 'volume-high'}
                      size={18}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      {renderVideoContent(false)}
      
      <Modal
        visible={isFullscreen}
        transparent={true}
        animationType="fade"
        onRequestClose={handleFullscreen}
        statusBarTranslucent
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity
            style={styles.fullscreenCloseButton}
            onPress={handleFullscreen}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {renderVideoContent(true)}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  thumbnailGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 3,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
    minWidth: 40,
    textAlign: 'center',
  },
  controlsCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  controlsBottom: {
    paddingBottom: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  bottomControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  progressBarContainer: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 1,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: '#FFFFFF',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    right: 20,
    zIndex: 1000,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});



