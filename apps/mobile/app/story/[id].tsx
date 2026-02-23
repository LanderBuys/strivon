import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput,
  Dimensions, 
  TouchableOpacity, 
  Animated, 
  PanResponder,
  StatusBar,
  Platform,
  Modal,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { getStories, deleteStory } from '@/lib/api/stories';
import { Story, StoryTextOverlay, StoryStickerOverlay, StoryOverlay, StoryViewer } from '@/types/post';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useReportBlock } from '@/hooks/useReportBlock';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PlaceholderUrls } from '@/constants/urls';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000;

function formatViewedAt(iso: string | undefined): string {
  if (!iso) return '';
  const sec = (Date.now() - new Date(iso).getTime()) / 1000;
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

/** Instagram-style relative time for story header: "5h", "2m", "Just now" */
function formatStoryTime(iso: string): string {
  const sec = (Date.now() - new Date(iso).getTime()) / 1000;
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}

function StoryTextOverlayView({ overlay }: { overlay: StoryTextOverlay }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const left = `${overlay.position.xPercent}%` as const;
  const top = `${overlay.position.yPercent}%` as const;
  const transform = size.w && size.h
    ? [{ translateX: -size.w / 2 }, { translateY: -size.h / 2 }]
    : undefined;
  return (
    <View
      style={[styles.storyOverlay, { left, top, transform } as any]}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      pointerEvents="none"
    >
      <Text
        style={[
          styles.storyOverlayText,
          {
            fontSize: overlay.fontSize,
            color: overlay.color,
            fontWeight: overlay.fontWeight === 'bold' ? 'bold' : 'normal',
          },
        ]}
        numberOfLines={4}
      >
        {overlay.text}
      </Text>
    </View>
  );
}

function StoryStickerOverlayView({ overlay }: { overlay: StoryStickerOverlay }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const left = `${overlay.position.xPercent}%` as const;
  const top = `${overlay.position.yPercent}%` as const;
  const transform = size.w && size.h
    ? [{ translateX: -size.w / 2 }, { translateY: -size.h / 2 }]
    : undefined;
  return (
    <View
      style={[styles.storyOverlay, { left, top, transform } as any]}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      pointerEvents="none"
    >
      <Text style={[styles.storyOverlayText, { fontSize: overlay.fontSize }]}>{overlay.emoji}</Text>
    </View>
  );
}

function StoryVideoPlayer({ uri, isPaused }: { uri: string; isPaused: boolean }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = false;
  });
  useEffect(() => {
    if (isPaused) {
      player.pause();
    } else {
      player.play();
    }
  }, [isPaused, player]);
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

interface UserStories {
  userId: string;
  stories: Story[];
}

export default function StoryViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const currentUserId = useCurrentUserId();
  
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [userStoriesGroups, setUserStoriesGroups] = useState<UserStories[]>([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [replyFocused, setReplyFocused] = useState(false);
  const [prevUserIndex, setPrevUserIndex] = useState<number | null>(null);
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [storiesLoaded, setStoriesLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Group stories by user (include your own so you can view your story after posting)
  const groupedStories = useMemo(() => {
    const groups: UserStories[] = [];
    const userMap = new Map<string, Story[]>();
    
    allStories.forEach(story => {
      const userId = story.author.id;
      if (!userMap.has(userId)) {
        userMap.set(userId, []);
      }
      userMap.get(userId)!.push(story);
    });
    
    userMap.forEach((stories, userId) => {
      groups.push({ userId, stories });
    });
    
    return groups;
  }, [allStories]);

  // Get current user's stories
  const currentUserStories = useMemo(() => {
    if (userStoriesGroups.length === 0) return [];
    return userStoriesGroups[currentUserIndex]?.stories || [];
  }, [userStoriesGroups, currentUserIndex]);

  // Get current story
  const currentStory = useMemo(() => {
    return currentUserStories[currentStoryIndex];
  }, [currentUserStories, currentStoryIndex]);

  const isOwnStory = currentStory?.isOwn === true || currentStory?.author?.id === currentUserId;
  const { getReportBlockOptions } = useReportBlock();

  // Store callbacks in refs to avoid stale closures
  const goToNextStoryRef = useRef<(() => void) | null>(null);
  const goToPreviousStoryRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    loadStories();
  }, []);

  useEffect(() => {
    setUserStoriesGroups(groupedStories);
    // Find starting user and story index
    if (groupedStories.length > 0 && id) {
      let foundUserIndex = -1;
      let foundStoryIndex = -1;
      
      groupedStories.forEach((group, userIdx) => {
        const storyIdx = group.stories.findIndex(s => s.id === id);
        if (storyIdx >= 0) {
          foundUserIndex = userIdx;
          foundStoryIndex = storyIdx;
        }
      });
      
      if (foundUserIndex >= 0) {
        setCurrentUserIndex(foundUserIndex);
        setCurrentStoryIndex(foundStoryIndex);
      }
    }
  }, [groupedStories, id]);

  const progressPaused = isPaused || replyFocused;
  useEffect(() => {
    if (currentUserStories.length > 0 && !progressPaused && currentStory) {
      startProgress();
    }
    return () => {
      progressAnim.stopAnimation();
    };
  }, [currentStoryIndex, currentUserIndex, currentUserStories.length, progressPaused, currentStory]);

  const loadStories = async () => {
    setLoadError(null);
    try {
      const stories = await getStories();
      setAllStories(stories);
    } catch (error) {
      console.error('Error loading stories:', error);
      setLoadError('Could not load stories');
    } finally {
      setStoriesLoaded(true);
    }
  };

  const startProgress = useCallback(() => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !progressPaused && goToNextStoryRef.current) {
        goToNextStoryRef.current();
      }
    });
  }, [progressPaused]);

  const goToNextStory = useCallback(() => {
    const currentStories = userStoriesGroups[currentUserIndex]?.stories || [];
    
    // Check if there are more stories for current user
    if (currentStoryIndex < currentStories.length - 1) {
      // Next story in same user's collection - no animation
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
    } else if (currentUserIndex < userStoriesGroups.length - 1) {
      // Move to next user's first story - instant switch
      setCurrentUserIndex(currentUserIndex + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      // No more stories, go back
      router.back();
    }
  }, [currentUserIndex, currentStoryIndex, userStoriesGroups, router]);

  const goToPreviousStory = useCallback(() => {
    const currentStories = userStoriesGroups[currentUserIndex]?.stories || [];
    
    if (currentStoryIndex > 0) {
      // Previous story in same user's collection - no animation
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    } else if (currentUserIndex > 0) {
      // Move to previous user's last story - instant switch
      const prevUserGroup = userStoriesGroups[currentUserIndex - 1];
      const prevUserStories = prevUserGroup?.stories || [];
      setCurrentUserIndex(currentUserIndex - 1);
      setCurrentStoryIndex(prevUserStories.length - 1);
      setProgress(0);
    }
  }, [currentUserIndex, currentStoryIndex, userStoriesGroups]);

  // Update refs when callbacks change
  useEffect(() => {
    goToNextStoryRef.current = goToNextStory;
    goToPreviousStoryRef.current = goToPreviousStory;
  }, [goToNextStory, goToPreviousStory]);

  // Create panResponder after functions are defined
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const swipeThreshold = 50;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal swipe
          if (dx > swipeThreshold) {
            // Swipe right - previous story
            goToPreviousStoryRef.current?.();
          } else if (dx < -swipeThreshold) {
            // Swipe left - next story
            goToNextStoryRef.current?.();
          }
        } else {
          // Vertical swipe
          if (dy > swipeThreshold) {
            // Swipe down - close
            router.back();
          }
        }
      },
    })
  ).current;

  const handleTap = (event: any) => {
    const { locationX } = event.nativeEvent;
    const screenMiddle = SCREEN_WIDTH / 2;
    
    if (locationX < screenMiddle) {
      goToPreviousStory();
    } else {
      goToNextStory();
    }
  };

  const handleDeleteStory = useCallback(() => {
    if (!currentStory) return;
    haptics.light();
    Alert.alert(
      'Delete story',
      'Remove this story? It can\'t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteStory(currentStory.id);
              await loadStories();
              setShowViewersSheet(false);
              router.back();
            } catch (e) {
              console.error('Delete story failed:', e);
              Alert.alert('Error', 'Could not delete story.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [currentStory, router]);

  // Still loading stories from API
  if (!storiesLoaded) {
    return (
      <ErrorBoundary>
        <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={[styles.loadingText, { marginTop: Spacing.md }]}>Loading...</Text>
        </View>
      </View>
      </ErrorBoundary>
    );
  }

  // Load failed
  if (loadError) {
    return (
      <ErrorBoundary>
        <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.center, styles.errorCenter]}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={48} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={styles.errorTitle}>Couldn't load stories</Text>
          <Text style={styles.errorMessage}>{loadError}</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity
              style={[styles.errorButton, styles.errorButtonPrimary]}
              onPress={() => { setLoadError(null); loadStories(); }}
              activeOpacity={0.8}
              accessibilityLabel="Try again"
              accessibilityRole="button"
            >
              <Text style={styles.errorButtonText}>Try again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.errorButton, styles.errorButtonSecondary]}
              onPress={() => router.back()}
              activeOpacity={0.8}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Text style={styles.errorButtonSecondaryText}>Go back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </ErrorBoundary>
    );
  }

  // Story id in URL but not in list (deleted or invalid)
  const storyNotFound = id && !allStories.some((s) => s.id === id);
  if (storyNotFound) {
    return (
      <ErrorBoundary>
        <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.center}>
          <Ionicons name="image-outline" size={56} color="rgba(255,255,255,0.5)" />
          <Text style={styles.loadingText}>Story not found</Text>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ErrorBoundary>
    );
  }

  if (!currentStory || currentUserStories.length === 0 || userStoriesGroups.length === 0) {
    return (
      <ErrorBoundary>
        <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.center}>
          <Text style={styles.loadingText}>No stories yet</Text>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ErrorBoundary>
    );
  }

  const storyMediaUrl = currentStory.media?.url || currentStory.mediaUrl || currentStory.author.avatar || PlaceholderUrls.storyImage(currentStory.id);
  const isVideoStory = currentStory.media?.type === 'video' || currentStory.mediaType === 'video';
  const overlays = currentStory.overlays || [];

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
      
      {/* Story media (image or video) */}
      <View style={styles.imageWrapper}>
        <View style={styles.imageContainer}>
          {isVideoStory ? (
            <StoryVideoPlayer uri={storyMediaUrl} isPaused={isPaused} />
          ) : (
            <ExpoImage
              source={{ uri: storyMediaUrl }}
              style={styles.storyImage}
              contentFit="cover"
              transition={200}
              placeholder={{ uri: PlaceholderUrls.imagePlaceholder() }}
            />
          )}
          {overlays.map((overlay) => {
            if (overlay.type === 'text') return <StoryTextOverlayView key={overlay.id} overlay={overlay} />;
            if (overlay.type === 'sticker') return <StoryStickerOverlayView key={overlay.id} overlay={overlay} />;
            return null;
          })}
        </View>
      </View>
      
      {/* Progress bars (Instagram-style: horizontal at top) */}
      <View style={[styles.progressRow, { paddingTop: insets.top + 8 }]}>
        {currentUserStories.map((_, index) => (
          <View key={index} style={styles.progressSegmentWrapper}>
            <View style={styles.progressSegmentBg} />
            {index === currentStoryIndex ? (
              <Animated.View
                style={[
                  styles.progressSegmentFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            ) : index < currentStoryIndex ? (
              <View style={[styles.progressSegmentFill, { width: '100%' }]} />
            ) : null}
          </View>
        ))}
      </View>

      {/* Top header */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 8 + 3 + 8 + 6 }]}>
        <View style={styles.userInfo}>
          <ExpoImage
            source={{ uri: currentStory.author.avatar || PlaceholderUrls.avatarGeneric() }}
            style={styles.headerAvatar}
            contentFit="cover"
          />
          <View>
            <Text style={styles.userName}>{currentStory.author.name}</Text>
            <Text style={styles.storyTime}>{formatStoryTime(currentStory.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.topHeaderActions}>
          {!isOwnStory && currentStory?.author && (() => {
            const opts = getReportBlockOptions({
              id: currentStory.author.id,
              name: currentStory.author.name,
              handle: currentStory.author.handle,
              avatar: currentStory.author.avatar,
            });
            if (opts.length === 0) return null;
            return (
              <TouchableOpacity
                style={styles.headerAddBtn}
                onPress={() => {
                  haptics.light();
                  Alert.alert('Options', '', [
                    ...opts.map((o) => ({ text: o.text, style: o.style, onPress: o.onPress })),
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="ellipsis-horizontal" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            );
          })()}
          {isOwnStory && (
            <>
              <TouchableOpacity
                style={styles.headerAddBtn}
                onPress={() => {
                  haptics.light();
                  router.push('/story/create');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="add-circle-outline" size={26} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerDeleteBtn}
                onPress={handleDeleteStory}
                disabled={deleting}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FF3B30" />
                ) : (
                  <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                )}
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom bar: own story = tappable view count (opens viewers); others = reply + like */}
      <View style={[styles.bottomBar, { bottom: Math.max(insets.bottom, 20) + 8 }]}>
        {isOwnStory ? (
          <TouchableOpacity
            style={styles.ownStoryViewsPill}
            onPress={() => {
              haptics.light();
              setShowViewersSheet(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="eye-outline" size={20} color="#FFF" />
            <Text style={styles.ownStoryViewsPillText}>
              {(currentStory.views ?? 0)} {(currentStory.views ?? 0) === 1 ? 'view' : 'views'} · tap to see who
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.replyContainer}>
              <TextInput
                style={styles.replyInput}
                placeholder="Send message"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={replyText}
                onChangeText={setReplyText}
                onFocus={() => setReplyFocused(true)}
                onBlur={() => setReplyFocused(false)}
                onSubmitEditing={() => {
                  if (replyText.trim()) {
                    haptics.light();
                    setReplyText('');
                  }
                }}
              />
              <TouchableOpacity
                style={[styles.sendButton, !replyText.trim() && styles.sendButtonDisabled]}
                onPress={() => {
                  if (replyText.trim()) {
                    haptics.light();
                    setReplyText('');
                  }
                }}
                disabled={!replyText.trim()}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={replyText.trim() ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.likeButton}
              onPress={() => {
                setIsLiked(!isLiked);
                haptics.light();
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={28}
                color={isLiked ? '#FF3040' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Viewers sheet for own story */}
      <Modal
        visible={showViewersSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowViewersSheet(false)}
      >
        <TouchableOpacity
          style={styles.viewersSheetOverlay}
          activeOpacity={1}
          onPress={() => {
            haptics.light();
            setShowViewersSheet(false);
          }}
        >
          <SafeAreaView style={styles.viewersSheetSafe} edges={['bottom']}>
            <View
              style={[styles.viewersSheet, { backgroundColor: colors.surface }]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.viewersSheetHandle} />
              <Text style={[styles.viewersSheetTitle, { color: colors.text }]}>Viewers</Text>
              <Text style={[styles.viewersSheetSubtitle, { color: colors.secondary }]}>
                {(currentStory?.views ?? 0)} {(currentStory?.views ?? 0) === 1 ? 'view' : 'views'} · Tap outside to close
              </Text>
              <ScrollView
                style={styles.viewersList}
                contentContainerStyle={styles.viewersListContent}
                showsVerticalScrollIndicator={true}
              >
                {(currentStory?.viewers && currentStory.viewers.length > 0) ? (
                  currentStory.viewers.map((v: StoryViewer) => (
                    <View key={v.id} style={styles.viewerRow}>
                      <ExpoImage
                        source={{ uri: v.avatar || PlaceholderUrls.avatar(v.id) }}
                        style={styles.viewerAvatar}
                        contentFit="cover"
                      />
                      <View style={styles.viewerInfo}>
                        <Text style={[styles.viewerName, { color: colors.text }]} numberOfLines={1}>{v.name}</Text>
                        <Text style={[styles.viewerMeta, { color: colors.secondary }]}>
                          {v.viewedAt ? formatViewedAt(v.viewedAt) : v.handle ? `@${(v.handle || '').replace(/^@/, '')}` : ''}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.viewersEmptyWrap}>
                    <View style={[styles.viewersEmptyIcon, { backgroundColor: colors.secondary + '20' }]}>
                      <Ionicons name="eye-outline" size={40} color={colors.secondary} />
                    </View>
                    <Text style={[styles.viewersEmptyTitle, { color: colors.text }]}>No viewers yet</Text>
                    <Text style={[styles.viewersEmptySub, { color: colors.secondary }]}>
                      When people view your story they'll show up here
                    </Text>
                  </View>
                )}
              </ScrollView>
              <TouchableOpacity
                style={[styles.viewersSheetClose, { backgroundColor: colors.primary + '18' }]}
                onPress={() => {
                  haptics.light();
                  setShowViewersSheet(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.viewersSheetCloseText, { color: colors.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>

      {/* Interactive area for taps and swipes */}
      <View style={styles.interactiveArea}>
        <TouchableOpacity
          style={styles.tapArea}
          activeOpacity={1}
          onPress={handleTap}
          onLongPress={() => setIsPaused(true)}
          onPressOut={() => setIsPaused(false)}
          {...panResponder.panHandlers}
        />
      </View>
    </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  backLink: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  backLinkText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
  },
  errorCenter: {
    padding: Spacing.lg,
  },
  errorIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  errorMessage: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    maxWidth: 280,
  },
  errorActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  errorButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  errorButtonPrimary: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  errorButtonSecondary: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  errorButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  errorButtonSecondaryText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 14,
    fontWeight: '600',
  },
  imageWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 0,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  storyOverlay: {
    position: 'absolute',
    padding: 4,
    maxWidth: '80%',
  },
  storyOverlayText: {
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  progressRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingBottom: 8,
    zIndex: 10,
  },
  progressSegmentWrapper: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  progressSegmentBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  progressSegmentFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  storyTime: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
  },
  topHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerAddBtn: {
    padding: Spacing.xs,
    marginRight: 4,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerDeleteBtn: {
    padding: Spacing.xs,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: Spacing.xs,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    zIndex: 10,
  },
  ownStoryViewsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  ownStoryViewsPillText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 14,
    fontWeight: '500',
  },
  replyContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  replyInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    padding: 0,
  },
  sendButton: {
    padding: Spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  likeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  viewersSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  viewersSheetSafe: {
    width: '100%',
    maxHeight: '75%',
  },
  viewersSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingTop: 8,
    paddingBottom: Spacing.lg,
    maxHeight: 400,
  },
  viewersSheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  viewersSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  viewersSheetSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  viewersList: {
    maxHeight: 280,
  },
  viewersListContent: {
    paddingBottom: Spacing.md,
  },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  viewerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  viewerInfo: {
    flex: 1,
    minWidth: 0,
  },
  viewerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewerMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  viewersEmptyWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 1.5,
  },
  viewersEmptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  viewersEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  viewersEmptySub: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  viewersSheetClose: {
    alignSelf: 'stretch',
    marginTop: Spacing.md,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewersSheetCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  interactiveArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  tapArea: {
    flex: 1,
  },
});
