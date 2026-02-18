import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert, Platform, PanResponder, Dimensions } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { BlurView } from 'expo-blur';

interface VoiceMessageRecorderProps {
  onSend: (duration: number, uri: string) => void;
  onCancel: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_DURATION = 300; // 5 minutes max
const MIN_DURATION = 1; // 1 second minimum

export function VoiceMessageRecorder({ onSend, onCancel }: VoiceMessageRecorderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const playbackRef = useRef<Audio.Sound | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const lockProgressAnim = useRef(new Animated.Value(0)).current;
  const isRecordingRef = useRef(false);
  const isLockedRef = useRef(false);
  
  // Keep refs in sync with state
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);
  
  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  const handleLockRecording = () => {
    setIsLocked(true);
    lockProgressAnim.setValue(1);
    haptics.success();
  };

  const handleStopRecording = async (currentDuration?: number) => {
    if (!recordingRef.current) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      if (!uri) {
        Alert.alert('Error', 'Failed to save recording.');
        return;
      }

      const finalDuration = currentDuration ?? duration;
      if (finalDuration < MIN_DURATION) {
        Alert.alert('Too Short', `Please record for at least ${MIN_DURATION} second${MIN_DURATION > 1 ? 's' : ''}.`);
        // Delete the recorded file (Recording doesn't expose deleteAsync)
        try {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        } catch {}
        recordingRef.current = null;
        setIsRecording(false);
        setDuration(0);
        return;
      }

      setIsRecording(false);
      setRecordingUri(uri);
      setDuration(finalDuration);
      haptics.success();
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const stopPlayback = async () => {
    if (playbackRef.current) {
      try {
        await playbackRef.current.stopAsync();
        await playbackRef.current.unloadAsync();
        playbackRef.current = null;
        setIsPlaying(false);
      } catch (error) {
        console.error('Error stopping playback:', error);
      }
    }
  };

  const stopRecording = async () => {
    if (recordingRef.current) {
      try {
        const status = await recordingRef.current.getStatusAsync();
        if (status.isRecording) {
          await recordingRef.current.stopAndUnloadAsync();
        }
        recordingRef.current = null;
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
  };

  const panResponderRef = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (isRecordingRef.current && !isLockedRef.current) {
          const progress = Math.min(Math.max(-gestureState.dy / 100, 0), 1);
          lockProgressAnim.setValue(progress);
          
          if (progress >= 0.8 && !isLockedRef.current) {
            handleLockRecording();
          }
        }
      },
      onPanResponderRelease: () => {
        if (!isLockedRef.current) {
          lockProgressAnim.setValue(0);
        }
      },
    })
  );

  useEffect(() => {
    requestPermissions();
    return () => {
      stopRecording();
      stopPlayback();
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= MAX_DURATION) {
            // Stop recording when max duration reached
            handleStopRecording(newDuration);
            return MAX_DURATION;
          }
          return newDuration;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRecording]);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
    }
  }, [isRecording, scaleAnim, opacityAnim]);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'We need microphone access to record voice messages.',
          [{ text: 'OK', onPress: onCancel }]
        );
      }
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      setHasPermission(false);
    }
  };

  const handleStartRecording = async () => {
    if (hasPermission === false) {
      Alert.alert('Permission Denied', 'Microphone access is required to record voice messages.');
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
      setDuration(0);
      setRecordingUri(null);
      haptics.medium();
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const handleUnlockRecording = () => {
    setIsLocked(false);
    lockProgressAnim.setValue(0);
    handleStopRecording();
    haptics.light();
  };

  const handlePlayPreview = async () => {
    if (!recordingUri) return;

    try {
      if (playbackRef.current) {
        await playbackRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );

      playbackRef.current = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Failed to play preview:', error);
      Alert.alert('Error', 'Failed to play preview.');
    }
  };

  const handleSend = async () => {
    if (!recordingUri) return;
    
    await stopPlayback();
    onSend(duration, recordingUri);
  };

  const handleCancel = async () => {
    haptics.light();
    await stopRecording();
    await stopPlayback();
    
    if (recordingUri) {
      try {
        // Clean up the recording file - Audio recording cleanup is handled by expo-av
        // The file will be cleaned up automatically when the recording is unloaded
      } catch (error) {
        console.error('Error cleaning up recording:', error);
      }
    }
    
    setIsRecording(false);
    setDuration(0);
    setIsLocked(false);
    setRecordingUri(null);
    onCancel();
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWaveformBars = () => {
    const bars = 20;
    const baseHeight = 4;
    return Array.from({ length: bars }, (_, i) => {
      const animValue = isRecording ? Math.random() * 0.7 + 0.3 : 0.2;
      const height = baseHeight + animValue * 20;
      return (
        <Animated.View
          key={i}
          style={[
            styles.waveformBar,
            {
              height: isRecording ? height : baseHeight,
              backgroundColor: colors.primary,
              opacity: isRecording ? opacityAnim : 0.3,
            },
          ]}
        />
      );
    });
  };

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
        <View style={[styles.content, { backgroundColor: colors.cardBackground }]}>
          <IconSymbol name="mic-off" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            Microphone access required
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={requestPermissions}
          >
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Text style={[styles.cancelText, { color: colors.secondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Preview mode (after recording)
  if (recordingUri && !isRecording) {
    return (
      <View style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.75)' }]}>
        <BlurView intensity={100} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[styles.content, styles.previewContent, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.previewHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <IconSymbol name="mic" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.previewTitle, { color: colors.text }]}>Voice Message</Text>
            <Text style={[styles.previewDuration, { color: colors.secondary }]}>
              {formatDuration(duration)}
            </Text>
          </View>
          
          <View style={styles.waveformContainer}>
            {getWaveformBars()}
          </View>

          <View style={styles.previewActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.spaceBackground }]}
              onPress={isPlaying ? stopPlayback : handlePlayPreview}
              activeOpacity={0.7}
            >
              <IconSymbol 
                name={isPlaying ? "pause" : "play"} 
                size={22} 
                color={colors.primary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: colors.primary }]}
              onPress={handleSend}
              activeOpacity={0.8}
            >
              <IconSymbol name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.6}
          >
            <Text style={[styles.cancelText, { color: colors.secondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Recording mode
  return (
    <View style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.75)' }]}>
      <BlurView intensity={100} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[styles.content, { backgroundColor: colors.cardBackground }]}>
        {hasPermission === null ? (
          <View style={styles.idleContainer}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <IconSymbol name="mic" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.instruction, { color: colors.text }]}>
              Loading...
            </Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.6}
            >
              <Text style={[styles.cancelText, { color: colors.secondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : isLocked ? (
          <View style={styles.lockedContainer}>
            <View style={styles.lockedHeader}>
              <View style={[styles.lockIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <IconSymbol name="lock-closed" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.lockedText, { color: colors.text }]}>Recording Locked</Text>
            </View>
            <Text style={[styles.duration, { color: colors.text }]}>
              {formatDuration(duration)}
            </Text>
            <View style={styles.waveformContainer}>
              {getWaveformBars()}
            </View>
            <TouchableOpacity
              style={[styles.recordButton, styles.stopButton, { backgroundColor: colors.error }]}
              onPress={handleUnlockRecording}
              activeOpacity={0.8}
            >
              <IconSymbol name="stop" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={[styles.hint, { color: colors.secondary }]}>
              Tap to finish recording
            </Text>
          </View>
        ) : (
          <>
            {isRecording ? (
              <View style={styles.recordingContainer}>
                <View style={styles.recordingHeader}>
                  <Animated.View 
                    style={[
                      styles.recordingIndicator, 
                      { 
                        backgroundColor: colors.error,
                        opacity: opacityAnim,
                      }
                    ]} 
                  />
                  <Text style={[styles.duration, { color: colors.text }]}>
                    {formatDuration(duration)}
                  </Text>
                </View>
                
                <View style={styles.waveformContainer}>
                  {getWaveformBars()}
                </View>

                <View style={styles.recordingControls}>
                  <Animated.View 
                    style={[styles.recordButtonWrapper, { transform: [{ scale: scaleAnim }] }]}
                    {...panResponderRef.current.panHandlers}
                  >
                    <TouchableOpacity
                      style={[styles.recordButton, styles.recording, { backgroundColor: colors.error }]}
                      onPressOut={() => handleStopRecording()}
                      activeOpacity={0.8}
                    >
                      <IconSymbol name="mic" size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                  </Animated.View>
                  
                  <Animated.View 
                    style={[
                      styles.lockProgress,
                      {
                        width: lockProgressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                        backgroundColor: colors.primary,
                      }
                    ]}
                  />
                  
                  <Text style={[styles.hint, { color: colors.secondary }]}>
                    Swipe up to lock recording
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.idleContainer}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                  <IconSymbol name="mic" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.instruction, { color: colors.text }]}>
                  Hold to Record
                </Text>
                <TouchableOpacity
                  style={[styles.recordButton, { backgroundColor: colors.primary }]}
                  onPressIn={handleStartRecording}
                  activeOpacity={0.8}
                >
                  <IconSymbol name="mic" size={28} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={[styles.hint, { color: colors.secondary }]}>
                  Swipe up while recording to lock
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.6}
            >
              <Text style={[styles.cancelText, { color: colors.secondary }]}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    borderRadius: 28,
    padding: Spacing.xl + 8,
    alignItems: 'center',
    minWidth: 320,
    maxWidth: SCREEN_WIDTH - Spacing.xl * 2,
    width: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  previewContent: {
    paddingVertical: Spacing.xl + 12,
  },
  idleContainer: {
    alignItems: 'center',
    width: '100%',
  },
  recordingContainer: {
    alignItems: 'center',
    width: '100%',
  },
  lockedContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  lockIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  instruction: {
    fontSize: Typography.xl,
    fontWeight: '700',
    marginBottom: Spacing.xl + 4,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  hint: {
    fontSize: Typography.sm,
    marginTop: Spacing.md,
    textAlign: 'center',
    opacity: 0.7,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  recordButtonWrapper: {
    marginVertical: Spacing.lg,
  },
  recording: {
    width: 80,
    height: 80,
  },
  stopButton: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  duration: {
    fontSize: Typography['3xl'] + 2,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1.5,
    marginBottom: Spacing.sm,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 48,
    marginVertical: Spacing.lg,
    width: '100%',
    paddingHorizontal: Spacing.md,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
    minHeight: 6,
    flex: 1,
  },
  lockProgress: {
    height: 4,
    borderRadius: 2,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    alignSelf: 'stretch',
    maxWidth: '80%',
  },
  recordingControls: {
    alignItems: 'center',
    width: '100%',
  },
  lockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  lockedText: {
    fontSize: Typography.base,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  previewHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  previewTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  previewDuration: {
    fontSize: Typography['2xl'],
    fontWeight: '600',
    opacity: 0.8,
    letterSpacing: -0.5,
  },
  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginVertical: Spacing.xl,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sendButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Typography.base,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.xl + 8,
    marginTop: Spacing.lg,
    borderRadius: 12,
  },
  cancelText: {
    fontSize: Typography.base,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  errorText: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  button: {
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.xl + 8,
    borderRadius: 14,
    marginBottom: Spacing.md,
    minWidth: 200,
  },
});
