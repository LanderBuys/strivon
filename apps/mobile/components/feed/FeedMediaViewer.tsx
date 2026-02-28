import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  Text,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '@/types/post';
import { Spacing, Typography } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { SharePostModal } from '@/components/feed/SharePostModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const RAIL_ICON_SIZE = 28;
const RAIL_AVATAR_SIZE = 40;
const RAIL_GAP = 20;
const RAIL_WIDTH = 72;

/** TikTok-style: 210167 → "210.167", 2071 → "2.071", 93 → "93" */
function formatCount(n: number): string {
  if (n < 1000) return n > 0 ? String(n) : '';
  const t = Math.floor(n / 1000);
  const r = n % 1000;
  const rest = r < 10 ? `00${r}` : r < 100 ? `0${r}` : String(r);
  return `${t}.${rest}`;
}

function formatPostedAt(createdAt: string): string {
  const then = new Date(createdAt).getTime();
  const diff = Date.now() - then;
  const m = Math.floor(diff / (1000 * 60));
  const h = Math.floor(diff / (1000 * 60 * 60));
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const w = Math.floor(d / 7);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  if (d < 7) return `${d}d`;
  if (w < 4) return `${w}w`;
  return `${d}d`;
}

interface FeedMediaViewerProps {
  visible: boolean;
  posts: Post[];
  initialPostId: string | null;
  onClose: () => void;
  onLike?: (postId: string, authorId?: string) => void;
  onSave?: (postId: string, authorId?: string) => void;
  onComment?: (postId: string) => void;
  onFollow?: (userId: string) => void;
}

function hasMedia(post: Post): boolean {
  return !!(post.media && post.media.length > 0 && post.media.some((m) => isMediaImage(m) || isMediaVideo(m)));
}

function isMediaImage(m: { type?: string }): boolean {
  const t = typeof m.type === 'string' ? m.type.toLowerCase() : '';
  return t === 'image';
}

function isMediaVideo(m: { type?: string }): boolean {
  const t = typeof m.type === 'string' ? m.type.toLowerCase() : '';
  return t === 'video';
}

export function FeedMediaViewer({
  visible,
  posts,
  initialPostId,
  onClose,
  onLike,
  onSave,
  onComment,
  onFollow,
}: FeedMediaViewerProps) {
  const haptics = useHapticFeedback();
  const verticalListRef = useRef<FlatList>(null);
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);

  const mediaPosts = posts.filter(hasMedia);
  const initialIndex = initialPostId
    ? mediaPosts.findIndex((p) => p.id === initialPostId)
    : 0;
  const safeInitialIndex = initialIndex >= 0 ? initialIndex : 0;

  const onVerticalViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentPostIndex(viewableItems[0].index);
    }
  }).current;
  const verticalViewabilityConfig = useRef({ itemVisiblePercentThreshold: 90 }).current;

  useEffect(() => {
    if (visible && mediaPosts.length > 0) {
      setCurrentPostIndex(safeInitialIndex);
      setTimeout(() => {
        verticalListRef.current?.scrollToIndex({ index: safeInitialIndex, animated: false });
      }, 50);
    }
  }, [visible, initialPostId, mediaPosts.length, safeInitialIndex]);

  const handleClose = () => {
    haptics.light();
    onClose();
  };

  const getItemLayout = (_: unknown, index: number) => ({
    length: SCREEN_HEIGHT,
    offset: SCREEN_HEIGHT * index,
    index,
  });

  const insets = useSafeAreaInsets();

  if (!visible || mediaPosts.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <SafeAreaView style={styles.container} edges={[]}>
        <FlatList
          ref={verticalListRef}
          data={mediaPosts}
          keyExtractor={(item) => item.id}
          horizontal={false}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          initialScrollIndex={safeInitialIndex}
          getItemLayout={getItemLayout}
          onScrollToIndexFailed={() => {}}
          removeClippedSubviews={false}
          windowSize={5}
          maxToRenderPerBatch={3}
          onViewableItemsChanged={onVerticalViewableItemsChanged}
          viewabilityConfig={verticalViewabilityConfig}
          renderItem={({ item: post, index: postIndex }) => (
            <View style={styles.postSlide}>
              <PostMediaSlide
                post={post}
                isCurrentPost={postIndex === currentPostIndex}
                bottomInset={insets.bottom}
                topInset={insets.top}
                onLike={onLike}
                onSave={onSave}
                onComment={onComment}
                onFollow={onFollow}
                onSharePress={() => setSharePostId(post.id)}
                onClose={handleClose}
              />
            </View>
          )}
        />
        <SharePostModal
          visible={sharePostId !== null}
          post={sharePostId ? (mediaPosts.find((p) => p.id === sharePostId) ?? null) : null}
          onClose={() => setSharePostId(null)}
        />
      </SafeAreaView>
    </Modal>
  );
}

interface PostMediaSlideProps {
  post: Post;
  isCurrentPost: boolean;
  bottomInset: number;
  topInset: number;
  onLike?: (postId: string, authorId?: string) => void;
  onSave?: (postId: string, authorId?: string) => void;
  onComment?: (postId: string) => void;
  onFollow?: (userId: string) => void;
  onSharePress?: () => void;
  onClose: () => void;
}

function PostMediaSlide({
  post,
  isCurrentPost,
  bottomInset,
  topInset,
  onLike,
  onSave,
  onComment,
  onFollow,
  onSharePress,
  onClose,
}: PostMediaSlideProps) {
  const router = useRouter();
  const haptics = useHapticFeedback();
  const media = (post.media ?? []).filter((m) => isMediaImage(m) || isMediaVideo(m));
  const flatListRef = useRef<FlatList>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const author = post.author;
  const authorName = author?.name ?? 'User';
  const authorHandle = author?.handle ?? '@user';
  const authorAvatar = author?.avatar;
  const authorId = author?.id;

  const onHorizontalMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index >= 0 && index < media.length) {
      setCurrentMediaIndex(index);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentMediaIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const getItemLayout = (_: unknown, index: number) => ({
    length: SCREEN_WIDTH,
    offset: SCREEN_WIDTH * index,
    index,
  });

  const dotWidths = useRef<Animated.Value[]>([]).current;
  const prevDotIndex = useRef(0);
  if (dotWidths.length !== media.length) {
    while (dotWidths.length > media.length) dotWidths.pop();
    while (dotWidths.length < media.length) {
      dotWidths.push(new Animated.Value(dotWidths.length === currentMediaIndex ? 20 : 6));
    }
  }
  useEffect(() => {
    if (prevDotIndex.current !== currentMediaIndex && currentMediaIndex < dotWidths.length) {
      Animated.parallel([
        Animated.spring(dotWidths[prevDotIndex.current], {
          toValue: 6,
          useNativeDriver: false,
          damping: 14,
          stiffness: 200,
        }),
        Animated.spring(dotWidths[currentMediaIndex], {
          toValue: 20,
          useNativeDriver: false,
          damping: 14,
          stiffness: 200,
        }),
      ]).start();
      prevDotIndex.current = currentMediaIndex;
    }
  }, [currentMediaIndex, media.length]);

  if (media.length === 0) return null;

  const captionBottom = bottomInset + Spacing.md;

  return (
    <View style={styles.slideContainer}>
      {/* Media: horizontal paging, with double-tap to like */}
      <FlatList
        ref={flatListRef}
        key={`media-${post.id}`}
        data={media}
        keyExtractor={(item) => `${post.id}-${item.id}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onHorizontalMomentumScrollEnd}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        removeClippedSubviews={false}
        renderItem={({ item: m, index: mediaIndex }) => (
          <View style={styles.mediaCell} collapsable={false}>
            {isMediaImage(m) ? (
              <DoubleTapToLike
                onDoubleTap={() => {
                  haptics.medium();
                  onLike?.(post.id, post.author?.id);
                }}
                style={StyleSheet.absoluteFill}
              >
                <ExpoImage
                  source={{ uri: m.url }}
                  style={styles.media}
                  contentFit="contain"
                  transition={200}
                />
              </DoubleTapToLike>
            ) : mediaIndex === currentMediaIndex ? (
              <VideoCell
                uri={m.url}
                thumbnail={m.thumbnail}
                isActive={isCurrentPost}
              />
            ) : (
              <View style={styles.media}>
                <ExpoImage
                  source={{ uri: m.thumbnail || m.url }}
                  style={StyleSheet.absoluteFill}
                  contentFit="contain"
                />
              </View>
            )}
          </View>
        )}
      />

      {/* Top left: close */}
      <Pressable
        style={[styles.closeWrap, { top: topInset + Spacing.sm }]}
        onPress={onClose}
        hitSlop={12}
        android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true }}
      >
        <View style={styles.closeInner}>
          <Ionicons name="chevron-down" size={24} color="#FFF" />
        </View>
      </Pressable>

      {/* Right rail: profile avatar with + at top, then Like, Comment, Save, Share */}
      <View style={styles.rightRail}>
        <TouchableOpacity
          style={styles.railAvatarWrap}
          onPress={() => {
            haptics.light();
            if (authorId) {
              if (onFollow) onFollow(authorId);
              else {
                onClose();
                router.push(`/profile/${authorId}`);
              }
            }
          }}
          activeOpacity={0.75}
          hitSlop={8}
        >
          <View style={styles.railAvatarOuter}>
            {authorAvatar ? (
              <ExpoImage source={{ uri: authorAvatar }} style={styles.railAvatar} contentFit="cover" transition={200} />
            ) : (
              <View style={styles.railAvatarPlaceholder}>
                <Text style={styles.railAvatarLetter}>{authorName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.railAvatarPlus}>
              <Ionicons name="add" size={14} color="#FFF" />
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.railItem} onPress={() => { haptics.light(); onLike?.(post.id, post.author?.id); }} activeOpacity={0.7} hitSlop={8}>
          <Ionicons name={post.isLiked ? 'heart' : 'heart-outline'} size={RAIL_ICON_SIZE} color={post.isLiked ? '#FF375F' : '#FFF'} />
          <Text style={styles.railCount}>{formatCount(post.likes) || '0'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.railItem} onPress={() => { haptics.light(); onComment?.(post.id); }} activeOpacity={0.7} hitSlop={8}>
          <Ionicons name="chatbubble-ellipses-outline" size={RAIL_ICON_SIZE} color="#FFF" />
          <Text style={styles.railCount}>{formatCount(post.comments ?? 0) || '0'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.railItem} onPress={() => { haptics.light(); onSave?.(post.id, post.author?.id); }} activeOpacity={0.7} hitSlop={8}>
          <Ionicons name={post.isSaved ? 'bookmark' : 'bookmark-outline'} size={RAIL_ICON_SIZE} color="#FFF" />
          <Text style={styles.railCount}>{formatCount(post.saves ?? 0) || '0'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.railItem} onPress={() => { haptics.light(); onSharePress?.(); }} activeOpacity={0.7} hitSlop={8}>
          <Ionicons name="arrow-redo-outline" size={RAIL_ICON_SIZE} color="#FFF" />
          <Text style={styles.railCount}>{formatCount((post as { shares?: number }).shares ?? 0) || '0'}</Text>
        </TouchableOpacity>
      </View>

      {/* Page indicator: top center, animated */}
      {media.length > 1 && (
        <View style={[styles.indicatorWrap, { top: topInset + Spacing.sm + 44 + Spacing.sm }]}>
          <View style={styles.dotsRow}>
            {media.map((_, i) => (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidths[i] ?? 6 }]}
              />
            ))}
          </View>
        </View>
      )}

      {/* Bottom area: caption strip, no gradient overlay */}
      <View style={[styles.bottomArea, { paddingBottom: captionBottom }]}>
        <View style={styles.bottomGradient}>
          <View style={styles.captionStrip}>
            <View style={styles.captionNameRow}>
              <TouchableOpacity
                onPress={() => {
                  haptics.light();
                  onClose();
                  if (authorId) router.push(`/profile/${authorId}`);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.captionUsername} numberOfLines={1}>
                  {authorHandle.replace(/^@/, '')}
                </Text>
              </TouchableOpacity>
              <Text style={styles.captionDot}> · </Text>
              <Text style={styles.captionDate}>{formatPostedAt(post.createdAt)}</Text>
            </View>
            {(post.hashtags?.length ?? 0) > 0 && (
              <Text style={styles.captionHashtags} numberOfLines={1}>
                {post.hashtags!.join(' ')}
              </Text>
            )}
            {(post.title || post.content) ? (
              <Text style={styles.captionBodyText} numberOfLines={2}>
                {[post.title, post.content].filter(Boolean).join(' ')}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function DoubleTapToLike({
  children,
  onDoubleTap,
  style,
}: {
  children: React.ReactNode;
  onDoubleTap: () => void;
  style: object;
}) {
  const lastTap = useRef(0);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onDoubleTap();
      heartOpacity.setValue(1);
      heartScale.setValue(0.3);
      Animated.parallel([
        Animated.timing(heartScale, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
    lastTap.current = now;
  };

  return (
    <Pressable style={style} onPress={handlePress}>
      {children}
      <Animated.View
        style={[
          styles.heartOverlay,
          {
            opacity: heartOpacity,
            transform: [{ scale: heartScale }],
          },
        ]}
        pointerEvents="none"
      >
        <Ionicons name="heart" size={88} color="#FFFFFF" />
      </Animated.View>
    </Pressable>
  );
}

function VideoCell({ uri, thumbnail, isActive }: { uri: string; thumbnail?: string; isActive?: boolean }) {
  const videoRef = useRef<Video>(null);
  const [showControls, setShowControls] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const haptics = useHapticFeedback();

  const startPlayback = useCallback(() => {
    videoRef.current?.playAsync().then(() => setIsPlaying(true)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isActive) {
      videoRef.current?.pauseAsync().then(() => setIsPlaying(false)).catch(() => {});
      return;
    }
    const t = setTimeout(startPlayback, 50);
    return () => {
      clearTimeout(t);
      videoRef.current?.pauseAsync().catch(() => {});
    };
  }, [uri, isActive, startPlayback]);

  const handleVideoTap = () => {
    haptics.light();
    setShowControls((prev) => !prev);
  };

  const handlePlayPause = async () => {
    haptics.medium();
    try {
      const status = await videoRef.current?.getStatusAsync();
      if (status?.isLoaded && status.isPlaying) {
        await videoRef.current?.pauseAsync();
        setIsPlaying(false);
      } else {
        await videoRef.current?.playAsync();
        setIsPlaying(true);
      }
    } catch {
      // ignore
    }
  };

  return (
    <TouchableOpacity style={styles.videoContainer} activeOpacity={1} onPress={handleVideoTap}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        isLooping={true}
        isMuted={false}
        useNativeControls={false}
        onPlaybackStatusUpdate={(status) => {
          if (status.isLoaded) setIsPlaying(status.isPlaying);
        }}
        onReadyForDisplay={() => isActive && startPlayback()}
      />
      {thumbnail && !isPlaying && (
        <ExpoImage
          source={{ uri: thumbnail }}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
        />
      )}
      {showControls && (
        <View style={styles.videoControls} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.playPauseButton}
            onPress={(e) => {
              e.stopPropagation();
              handlePlayPause();
            }}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={48}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  closeWrap: {
    position: 'absolute',
    left: Spacing.md,
    zIndex: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  postSlide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  mediaCell: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  videoControls: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heartOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightRail: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 10,
    width: RAIL_WIDTH,
    alignItems: 'center',
    gap: RAIL_GAP,
  },
  railItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  railCount: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  railAvatarWrap: {
    marginBottom: 2,
  },
  railAvatarOuter: {
    position: 'relative',
    width: RAIL_AVATAR_SIZE,
    height: RAIL_AVATAR_SIZE,
  },
  railAvatar: {
    width: RAIL_AVATAR_SIZE,
    height: RAIL_AVATAR_SIZE,
    borderRadius: RAIL_AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  railAvatarPlus: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF375F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  railAvatarPlaceholder: {
    width: RAIL_AVATAR_SIZE,
    height: RAIL_AVATAR_SIZE,
    borderRadius: RAIL_AVATAR_SIZE / 2,
    backgroundColor: 'rgba(100,100,100,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  railAvatarLetter: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  indicatorWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    width: 20,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  bottomArea: {
    position: 'absolute',
    left: 0,
    right: RAIL_WIDTH + Spacing.md * 2,
    bottom: 0,
    zIndex: 5,
    justifyContent: 'flex-end',
  },
  bottomGradient: {
    paddingTop: 100,
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: 'flex-end',
  },
  captionStrip: {
    maxWidth: '100%',
  },
  captionNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 5,
    gap: 4,
  },
  captionUsername: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  captionDot: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '400',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  captionDate: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '400',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  captionHashtags: {
    color: 'rgba(255,255,255,0.98)',
    fontSize: 12,
    marginBottom: 5,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  captionBodyText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
});
