import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Story } from '@/types/post';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STORY_SIZE = 72;
const STORY_BORDER_WIDTH = 2.5;
const AVATAR_SIZE = STORY_SIZE - STORY_BORDER_WIDTH * 2 - 2;

interface StoryCircleProps {
  story: Story;
  onPress: () => void;
  /** When set, shows a + on "Your story" (when you have a story) to create another */
  onAddPress?: () => void;
  isFirst?: boolean; // For "Your Story" add button
}

export const StoryCircle = React.memo(function StoryCircle({ 
  story, 
  onPress,
  onAddPress,
  isFirst = false 
}: StoryCircleProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (isFirst && story.isOwn) {
    const hasStory = story.id !== 'create' && (story.media?.url || story.mediaUrl);
    // "Your Story" – when has story + onAddPress, + is a separate layer on top (same position) so it's not clipped
    const circleContent = (
      <View style={[styles.circle, {
        backgroundColor: 'transparent',
        borderColor: hasStory ? colors.primary : (colorScheme === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'),
        borderWidth: STORY_BORDER_WIDTH,
        overflow: 'hidden',
        ...Platform.select({
          ios: {
            shadowColor: Colors[colorScheme ?? 'light'].background,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
          },
          android: {
            elevation: 1,
          },
        }),
      }]}>
        {hasStory ? (
          <ExpoImage
            source={{ uri: story.media?.url || story.mediaUrl || story.author.avatar || '' }}
            style={[StyleSheet.absoluteFill, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#e8e8e8' }]}
            contentFit="cover"
            transition={0}
            recyclingKey={story.media?.url || story.mediaUrl || story.author.avatar || story.id}
            cachePolicy="memory-disk"
          />
        ) : (
          <>
            <View style={[styles.avatarContainer, {
              backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#e8e8e8',
              ...Platform.select({
                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3 },
                android: { elevation: 2 },
              }),
            }]}>
              {story.author.avatar ? (
                <ExpoImage
                  source={{ uri: story.author.avatar }}
                  style={styles.avatar}
                  contentFit="cover"
                  transition={0}
                  recyclingKey={story.author.avatar}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }]}>
                  <Ionicons name="person" size={32} color={colors.secondary} />
                </View>
              )}
            </View>
            <View style={[styles.addButton, {
              backgroundColor: colors.primary,
              borderColor: colors.surface,
              ...Platform.select({
                ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 4 },
                android: { elevation: 6 },
              }),
            }]}>
              <Ionicons name="add" size={16} color="#fff" />
            </View>
          </>
        )}
      </View>
    );
    return (
      <View style={styles.container}>
        <View style={styles.yourStoryLayerWrap}>
          <AnimatedPressable scale={0.94} onPress={onPress}>
            {circleContent}
          </AnimatedPressable>
          {hasStory && onAddPress && (
            <TouchableOpacity
              style={[styles.addButtonOnTop, {
                backgroundColor: colors.primary,
                borderColor: colors.surface,
                ...Platform.select({
                  ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 3 },
                  android: { elevation: 8 },
                }),
              }]}
              onPress={onAddPress}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          Your Story
        </Text>
      </View>
    );
  }

  // Regular story with gradient border effect for unviewed
  const hasUnviewedStory = !story.isViewed;
  
  return (
    <AnimatedPressable
      scale={0.94}
      style={styles.container}
      onPress={onPress}
    >
      {/* Gradient border effect for unviewed stories */}
      {hasUnviewedStory ? (
        <View style={styles.gradientBorderContainer}>
          <View style={[styles.gradientOuter, {
            borderColor: '#E1306C',
            ...Platform.select({
              ios: {
                shadowColor: '#E1306C',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 8,
              },
              android: { elevation: 4 },
            }),
          }]}>
            <View style={[styles.gradientMiddle, { borderColor: '#F77737' }]}>
              <View style={[styles.gradientInner, { borderColor: '#FCAF45' }]}>
                <View style={[styles.avatarContainer, {
                  backgroundColor: 'transparent',
                  ...Platform.select({
                    ios: {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 3,
                    },
                    android: { elevation: 2 },
                  }),
                }]}>
                  {story.author.avatar ? (
                    <ExpoImage
                      source={{ uri: story.author.avatar }}
                      style={[styles.avatar, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#e8e8e8' }]}
                      contentFit="cover"
                      transition={0}
                      recyclingKey={story.author.avatar}
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(225, 48, 108, 0.08)' }]}>
                      <Ionicons name="person" size={28} color="#E1306C" />
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.circle, { 
          backgroundColor: 'transparent',
          borderColor: colorScheme === 'dark' 
            ? 'rgba(255,255,255,0.18)' 
            : 'rgba(0,0,0,0.15)', 
          borderWidth: STORY_BORDER_WIDTH,
          ...Platform.select({
            ios: {
              shadowColor: colorScheme === 'dark' ? '#000' : '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 2.5,
            },
            android: {
              elevation: 1,
            },
          }),
        }]}>
          <View style={[styles.avatarContainer, { 
            backgroundColor: 'transparent',
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
              },
              android: {
                elevation: 1,
              },
            }),
          }]}>
            {story.author.avatar ? (
              <ExpoImage
                source={{ uri: story.author.avatar }}
                style={[styles.avatar, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#e8e8e8' }]}
                contentFit="cover"
                transition={0}
                recyclingKey={story.author.avatar}
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { 
                backgroundColor: colorScheme === 'dark' 
                  ? 'rgba(255,255,255,0.08)' 
                  : 'rgba(0,0,0,0.06)'
              }]}>
                <Ionicons 
                  name="person" 
                  size={28} 
                  color={colors.secondary}
                />
              </View>
            )}
          </View>
        </View>
      )}
      <Text style={[styles.name, { 
        color: colors.text,
        opacity: hasUnviewedStory ? 1 : 0.6,
        fontWeight: hasUnviewedStory ? '600' : '400',
        textShadowColor: hasUnviewedStory && colorScheme === 'dark' 
          ? 'rgba(0,0,0,0.3)' 
          : 'transparent',
        textShadowOffset: hasUnviewedStory && colorScheme === 'dark' 
          ? { width: 0, height: 0.5 } 
          : { width: 0, height: 0 },
        textShadowRadius: hasUnviewedStory && colorScheme === 'dark' ? 1 : 0,
      }]} numberOfLines={1}>
        {story.author.name.split(' ')[0]}
      </Text>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: Spacing.xs,
    width: STORY_SIZE + 20,
  },
  yourStoryLayerWrap: {
    position: 'relative',
    width: STORY_SIZE,
    height: STORY_SIZE,
  },
  addButtonOnTop: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    zIndex: 10,
    elevation: 10,
  },
  circle: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    borderWidth: STORY_BORDER_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBorderContainer: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOuter: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0.5,
  },
  gradientMiddle: {
    width: '100%',
    height: '100%',
    borderRadius: (STORY_SIZE - 8) / 2,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0.5,
  },
  gradientInner: {
    width: '100%',
    height: '100%',
    borderRadius: (STORY_SIZE - 14) / 2,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: AVATAR_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
  },
  name: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: STORY_SIZE + 20,
    letterSpacing: -0.1,
  },
});

