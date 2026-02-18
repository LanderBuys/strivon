import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Image as ExpoImage } from 'expo-image';

interface CallScreenProps {
  visible: boolean;
  isIncoming: boolean;
  isVideoCall?: boolean;
  caller?: {
    id: string;
    name: string;
    avatar?: string;
  };
  onAccept?: () => void;
  onDecline: () => void;
  onEnd: () => void;
  onToggleMute?: () => void;
  onToggleSpeaker?: () => void;
  onToggleCamera?: () => void;
  onDurationChange?: (duration: number) => void;
  callDuration?: number;
  isMuted?: boolean;
  isSpeakerOn?: boolean;
  isCameraOn?: boolean;
}

export function CallScreen({
  visible,
  isIncoming,
  isVideoCall = false,
  caller,
  onAccept,
  onDecline,
  onEnd,
  onToggleMute,
  onToggleSpeaker,
  onToggleCamera,
  onDurationChange,
  callDuration = 0,
  isMuted = false,
  isSpeakerOn = false,
  isCameraOn = true,
}: CallScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [duration, setDuration] = useState(callDuration);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && !isIncoming) {
      setDuration(callDuration);
      const interval = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          onDurationChange?.(newDuration);
          return newDuration;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else if (!visible) {
      setDuration(0);
    }
  }, [visible, isIncoming, callDuration, onDurationChange]);

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);

  useEffect(() => {
    if (visible && isIncoming) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      const ring = Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(ringAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      ring.start();

      return () => {
        pulse.stop();
        ring.stop();
      };
    } else {
      pulseAnim.setValue(1);
      ringAnim.setValue(0);
    }
  }, [visible, isIncoming, pulseAnim, ringAnim]);

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

  if (!visible) return null;

  const ringScale = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.6],
  });

  const ringOpacity = ringAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={isIncoming ? handleDecline : handleEnd}
    >
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={StyleSheet.absoluteFill}
      />
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Top Right Camera Button */}
        {!isIncoming && onToggleCamera && (
          <View style={styles.topRightButton}>
            <TouchableOpacity
              style={styles.cameraToggleButton}
              onPress={onToggleCamera}
              activeOpacity={0.7}
            >
              <IconSymbol 
                name={isCameraOn ? "videocam" : "videocam-off"} 
                size={22} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          </View>
        )}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Caller Info */}
          <View style={styles.callerInfo}>
            <View style={styles.avatarContainer}>
              {isIncoming && (
                <>
                  <Animated.View
                    style={[
                      styles.ring,
                      {
                        transform: [{ scale: ringScale }],
                        opacity: ringOpacity,
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.ring,
                      {
                        transform: [{ scale: ringAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.3],
                        }) }],
                        opacity: ringAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.4, 0.2, 0],
                        }),
                      },
                    ]}
                  />
                </>
              )}
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                {caller?.avatar ? (
                  <ExpoImage
                    source={{ uri: caller.avatar }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={[colors.primary, colors.primary + 'CC']}
                    style={styles.avatarPlaceholder}
                  >
                    <Text style={styles.avatarText}>
                      {caller?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                    </Text>
                  </LinearGradient>
                )}
              </Animated.View>
            </View>
            
            <Text style={[styles.callerName, { color: '#FFFFFF' }]}>
              {caller?.name || 'Unknown'}
            </Text>
            
            {isIncoming ? (
              <View style={styles.statusContainer}>
                <Text style={[styles.callStatus, { color: 'rgba(255,255,255,0.9)' }]}>
                  {isVideoCall ? 'Incoming video call' : 'Incoming call'}
                </Text>
                <View style={styles.statusIndicator}>
                  <Animated.View
                    style={[
                      styles.statusDot,
                      {
                        opacity: pulseAnim.interpolate({
                          inputRange: [1, 1.15],
                          outputRange: [0.6, 1],
                        }),
                      },
                    ]}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.durationContainer}>
                <IconSymbol name="call" size={16} color="rgba(255,255,255,0.7)" />
                <Text style={[styles.callDuration, { color: 'rgba(255,255,255,0.9)' }]}>
                  {formatDuration(duration)}
                </Text>
              </View>
            )}
          </View>

          {/* Call Controls */}
          <View style={styles.controlsContainer}>
            <View style={styles.controls}>
            {isIncoming ? (
              <>
                <View style={styles.controlButtonContainer}>
                  <Text style={[styles.controlLabel, { color: 'rgba(255,255,255,0.7)' }]}>Decline</Text>
                  <TouchableOpacity
                    style={[styles.controlButton, styles.declineButton]}
                    onPress={handleDecline}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#EF4444', '#DC2626']}
                      style={styles.buttonGradient}
                    >
                      <IconSymbol name="close" size={28} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.controlButtonContainer}>
                  <Text style={[styles.controlLabel, { color: 'rgba(255,255,255,0.7)' }]}>Accept</Text>
                  <TouchableOpacity
                    style={[styles.controlButton, styles.acceptButton]}
                    onPress={handleAccept}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.buttonGradient}
                    >
                      <IconSymbol name={isVideoCall ? "videocam" : "call"} size={28} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.controlButtonContainer}>
                  <Text style={[styles.controlLabel, { color: 'rgba(255,255,255,0.7)' }]}>
                    {isMuted ? 'Unmute' : 'Mute'}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.controlButton,
                      styles.secondaryButton,
                      { backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.15)' },
                    ]}
                    onPress={onToggleMute}
                    activeOpacity={0.8}
                  >
                    <IconSymbol 
                      name={isMuted ? "mic-off" : "mic"} 
                      size={22} 
                      color="#FFFFFF" 
                    />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.controlButtonContainer}>
                  <Text style={[styles.controlLabel, { color: 'rgba(255,255,255,0.7)' }]}>End</Text>
                  <TouchableOpacity
                    style={[styles.controlButton, styles.endButton]}
                    onPress={handleEnd}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#EF4444', '#DC2626']}
                      style={styles.buttonGradient}
                    >
                      <IconSymbol name="call" size={28} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.controlButtonContainer}>
                  <Text style={[styles.controlLabel, { color: 'rgba(255,255,255,0.7)' }]}>
                    {isSpeakerOn ? 'Speaker' : 'Earpiece'}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.controlButton,
                      styles.secondaryButton,
                      { backgroundColor: isSpeakerOn ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.15)' },
                    ]}
                    onPress={onToggleSpeaker}
                    activeOpacity={0.8}
                  >
                    <IconSymbol 
                      name={isSpeakerOn ? "volume-high" : "volume-low"} 
                      size={22} 
                      color="#FFFFFF" 
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  topRightButton: {
    position: 'absolute',
    top: Spacing.xl + 16,
    right: Spacing.md + 8,
    zIndex: 10,
  },
  cameraToggleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  content: {
    width: '100%',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl + 4,
    paddingTop: Spacing.lg + 4,
    paddingBottom: Spacing.xl + 8,
  },
  callerInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingTop: 0,
    marginTop: -Spacing.xxl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  avatarText: {
    fontSize: Typography['3xl'] + 4,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  callerName: {
    fontSize: Typography['3xl'],
    fontWeight: '700',
    marginBottom: Spacing.md,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 4,
    marginTop: Spacing.xs,
  },
  callStatus: {
    fontSize: Typography.base + 1,
    fontWeight: '500',
    textAlign: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 4,
    paddingHorizontal: Spacing.md + 4,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginTop: Spacing.xs,
  },
  callDuration: {
    fontSize: Typography.lg,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  controlsContainer: {
    width: '100%',
    paddingTop: 0,
    paddingBottom: Spacing.md,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: Spacing.xl + 12,
    width: '100%',
  },
  controlButtonContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
    minWidth: 76,
  },
  controlLabel: {
    fontSize: Typography.xs - 1,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  controlButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
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
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  declineButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  endButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  secondaryButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});
