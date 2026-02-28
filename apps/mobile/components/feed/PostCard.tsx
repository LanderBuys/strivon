import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions, Modal, StatusBar, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Post, PostType } from '@/types/post';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { VideoPlayer } from './VideoPlayer';
import { getProfilePageCustomization } from '@/lib/services/badgePerksService';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { FormattedPostText } from './FormattedPostText';
import { MediaViewer } from '@/components/media/MediaViewer';
import { SharePostModal } from './SharePostModal';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POST_PADDING = Spacing.lg * 2; // Left and right padding
const MEDIA_MAX_WIDTH = SCREEN_WIDTH - POST_PADDING;
const MEDIA_GAP = Spacing.xs;

interface PostCardProps {
  post: Post;
  onLike?: () => void;
  onSave?: () => void;
  onComment?: () => void;
  onPollVote?: (optionId: string) => void;
  onPress?: () => void;
  onLongPress?: (post: Post) => void;
  onOpenMediaViewer?: (postId: string) => void;
  backgroundColor?: string | null;
  backgroundImage?: string | null;
  textColor?: string | null;
  /** When false, videos in this card pause and mute (e.g. other feed tab is visible) */
  isFeedVisible?: boolean;
}

export const PostCard = React.memo(function PostCard({ 
  post, 
  onLike, 
  onSave,
  onComment,
  onPollVote,
  onPress,
  onLongPress,
  onOpenMediaViewer,
  backgroundColor,
  backgroundImage,
  textColor,
  isFeedVisible = true,
}: PostCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const router = useRouter();
  const currentUserId = useCurrentUserId();
  // Check if this is the current user's post
  const isCurrentUserPost = post.author?.id === currentUserId || post.author?.id === '1';
  
  // Load current user's profile customization for post card background and text
  const [userPostCardBackground, setUserPostCardBackground] = useState<string | undefined>(undefined);
  const [userPostCardBackgroundImage, setUserPostCardBackgroundImage] = useState<string | undefined>(undefined);
  const [userPostCardTextColor, setUserPostCardTextColor] = useState<string | undefined>(undefined);
  
  // Load customization function
  const loadPostCardCustomization = React.useCallback(() => {
    if (isCurrentUserPost) {
      getProfilePageCustomization().then((customization) => {
        setUserPostCardBackground(customization.postCardBackgroundColor);
        setUserPostCardBackgroundImage(customization.postCardBackgroundImage);
        setUserPostCardTextColor(customization.postCardTextColor);
      });
    }
  }, [isCurrentUserPost]);
  
  // Load on mount
  useEffect(() => {
    loadPostCardCustomization();
  }, [loadPostCardCustomization]);
  
  // Sync internal state when backgroundColor prop changes (for immediate updates)
  // If prop is explicitly null/undefined after being set, clear internal state
  useEffect(() => {
    if (isCurrentUserPost) {
      if (backgroundColor === null || backgroundColor === '') {
        setUserPostCardBackground(undefined);
      } else if (backgroundColor !== undefined) {
        setUserPostCardBackground(backgroundColor);
      }
    }
  }, [isCurrentUserPost, backgroundColor]);
  
  // Sync internal state when backgroundImage prop changes
  useEffect(() => {
    if (isCurrentUserPost) {
      if (backgroundImage === null || backgroundImage === '') {
        setUserPostCardBackgroundImage(undefined);
      } else if (backgroundImage !== undefined) {
        setUserPostCardBackgroundImage(backgroundImage);
      }
    }
  }, [isCurrentUserPost, backgroundImage]);
  
  // Sync internal state when textColor prop changes (for immediate updates)
  useEffect(() => {
    if (isCurrentUserPost) {
      if (textColor === null || textColor === '') {
        setUserPostCardTextColor(undefined);
      } else if (textColor !== undefined) {
        setUserPostCardTextColor(textColor);
      }
    }
  }, [isCurrentUserPost, textColor]);
  
  // Reload when screen comes into focus (e.g., after editing profile)
  useFocusEffect(
    React.useCallback(() => {
      loadPostCardCustomization();
    }, [loadPostCardCustomization])
  );
  
  const effectiveTextColorProp =
    typeof textColor === 'string' && textColor.trim().length > 0 ? textColor : undefined;
  const effectiveBgColorProp =
    typeof backgroundColor === 'string' && backgroundColor.trim().length > 0 ? backgroundColor : undefined;
  const effectiveBgImageProp =
    typeof backgroundImage === 'string' && backgroundImage.trim().length > 0 ? backgroundImage : undefined;

  // Priority: 1) provided prop (for immediate updates), 2) user's stored customization, 3) default
  const postTextColor =
    effectiveTextColorProp ??
    (isCurrentUserPost ? userPostCardTextColor : undefined) ??
    colors.text;
  const postSecondaryColor = `${postTextColor}CC`; // Slightly transparent for secondary text
  
  // Priority: 1) provided backgroundColor prop, 2) user's stored customization, 3) default card
  const postCardBgColor =
    (effectiveBgImageProp ? 'transparent' : undefined) ??
    effectiveBgColorProp ??
    (isCurrentUserPost ? userPostCardBackground : undefined) ??
    colors.cardBackground;
  
  // Priority: 1) provided backgroundImage prop, 2) user's stored customization
  const postCardBgImage =
    effectiveBgImageProp ??
    (isCurrentUserPost ? userPostCardBackgroundImage : undefined) ??
    undefined;
  
  const [imageError, setImageError] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [allImages, setAllImages] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const [contentWarningDismissed, setContentWarningDismissed] = useState(false);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [mediaViewerItems, setMediaViewerItems] = useState<Array<{ id: string; uri: string; type: 'image' | 'video'; thumbnail?: string }>>([]);
  const [mediaViewerInitialIndex, setMediaViewerInitialIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);

  // Reset content warning dismissal when post changes
  useEffect(() => {
    setContentWarningDismissed(false);
  }, [post.id]);

  const handleLike = () => {
    haptics.light();
    onLike?.();
  };


  const handleSave = () => {
    haptics.light();
    onSave?.();
  };

  const handleComment = () => {
    haptics.light();
    onComment?.();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleProfilePress = () => {
    if (post.author?.id) {
      haptics.light();
      router.push(`/profile/${post.author.id}`);
    }
  };

  const handleImagePress = (imageUrl: string, index: number) => {
    if (onOpenMediaViewer) {
      haptics.light();
      onOpenMediaViewer(post.id);
      return;
    }
    if (post.media) {
      const imageUrls = post.media
        .filter(m => m.type === 'image')
        .map(m => m.url);
      setAllImages(imageUrls);
      const initialIndex = imageUrls.indexOf(imageUrl);
      setSelectedImageIndex(initialIndex);
      setSelectedImage(imageUrl);
      haptics.light();
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: initialIndex * SCREEN_WIDTH,
          animated: false,
        });
      }, 100);
    }
  };

  const handleCloseImage = () => {
    setSelectedImage(null);
  };

  const handleVideoPress = (videoUrl: string, thumbnail?: string) => {
    if (onOpenMediaViewer) {
      haptics.light();
      onOpenMediaViewer(post.id);
      return;
    }
    if (!post.media) return;
    
    const videoItems = post.media
      .filter(m => m.type === 'video')
      .map((m, index) => ({
        id: `video-${index}`,
        uri: m.url,
        type: 'video' as const,
        thumbnail: m.thumbnail,
      }));
    
    const initialIndex = videoItems.findIndex(item => item.uri === videoUrl);
    
    if (initialIndex >= 0) {
      setMediaViewerItems(videoItems);
      setMediaViewerInitialIndex(initialIndex);
      setShowMediaViewer(true);
      haptics.light();
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== selectedImageIndex && index >= 0 && index < allImages.length) {
      setSelectedImageIndex(index);
      setSelectedImage(allImages[index]);
    }
  };

  // Media display components
  const SingleMedia = ({ media, colors, colorScheme }: { media: any; colors: any; colorScheme: string }) => {
    const aspectRatio = media.width && media.height ? media.width / media.height : 16 / 9;
    const maxHeight = MEDIA_MAX_WIDTH * 1.2;
    const height = Math.min(MEDIA_MAX_WIDTH / aspectRatio, maxHeight);

    return (
      <View style={styles.singleMediaContainer}>
        {media.type === 'image' ? (
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => handleImagePress(media.url, 0)}
          >
            <ExpoImage
              source={{ uri: media.url }}
              style={[styles.singleMedia, { height, borderRadius: 14, backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#e8e8e8' }]}
              contentFit="cover"
              transition={0}
              recyclingKey={media.url}
              cachePolicy="memory-disk"
            />
          </TouchableOpacity>
        ) : (
          <View style={[styles.singleMediaContainer, { height }]}>
            <VideoPlayer
              uri={media.url}
              thumbnail={media.thumbnail}
              width={MEDIA_MAX_WIDTH}
              height={height}
              autoplay={true}
              showControls={true}
              onPress={() => handleVideoPress(media.url, media.thumbnail)}
              isFeedVisible={isFeedVisible}
            />
          </View>
        )}
      </View>
    );
  };

  const TwoMediaGrid = ({ media, colors, colorScheme }: { media: any[]; colors: any; colorScheme: string }) => {
    let imageIndex = 0;
    return (
      <View style={styles.twoMediaGrid}>
        {media.map((item, index) => {
          const currentImageIndex = item.type === 'image' ? imageIndex++ : -1;
          return (
            <View key={item.id || index} style={styles.twoMediaItem}>
              {item.type === 'image' ? (
                <TouchableOpacity 
                  activeOpacity={0.9}
                  onPress={() => handleImagePress(item.url, currentImageIndex)}
                  style={styles.gridMedia}
                >
                  <ExpoImage
                    source={{ uri: item.url }}
                    style={[styles.gridMedia, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#e8e8e8' }]}
                    contentFit="cover"
                    transition={0}
                    recyclingKey={item.url}
                    cachePolicy="memory-disk"
                  />
                </TouchableOpacity>
              ) : (
            <View style={styles.gridMedia}>
              <VideoPlayer
                uri={item.url}
                thumbnail={item.thumbnail}
                width={MEDIA_MAX_WIDTH / 2 - MEDIA_GAP / 2}
                height={(MEDIA_MAX_WIDTH / 2 - MEDIA_GAP / 2) / (item.width && item.height ? item.width / item.height : 16 / 9)}
                autoplay={true}
                showControls={true}
                onPress={() => handleVideoPress(item.url, item.thumbnail)}
                isFeedVisible={isFeedVisible}
              />
            </View>
          )}
        </View>
          );
        })}
      </View>
    );
  };

  const ThreeMediaGrid = ({ media, colors, colorScheme }: { media: any[]; colors: any; colorScheme: string }) => {
    let imageIndex = 0;
    const firstImageIndex = media[0].type === 'image' ? imageIndex++ : -1;
    return (
      <View style={styles.threeMediaGrid}>
        <View style={styles.threeMediaLeft}>
          {media[0].type === 'image' ? (
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => handleImagePress(media[0].url, firstImageIndex)}
              style={styles.threeMediaLeftItem}
            >
              <ExpoImage
                source={{ uri: media[0].url }}
                style={[styles.threeMediaLeftItem, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#e8e8e8' }]}
                contentFit="cover"
                transition={0}
                recyclingKey={media[0].url}
                cachePolicy="memory-disk"
              />
            </TouchableOpacity>
          ) : (
          <View style={styles.threeMediaLeftItem}>
            <VideoPlayer
              uri={media[0].url}
              thumbnail={media[0].thumbnail}
              width={(MEDIA_MAX_WIDTH / 2) - MEDIA_GAP / 2}
              height={(MEDIA_MAX_WIDTH / 2) - MEDIA_GAP / 2}
              autoplay={true}
              showControls={true}
              onPress={() => handleVideoPress(media[0].url, media[0].thumbnail)}
              isFeedVisible={isFeedVisible}
            />
          </View>
        )}
      </View>
      <View style={styles.threeMediaRight}>
        {media.slice(1).map((item, index) => {
          const currentImageIndex = item.type === 'image' ? imageIndex++ : -1;
          return (
            <View key={item.id || index} style={styles.threeMediaRightItem}>
              {item.type === 'image' ? (
                <TouchableOpacity 
                  activeOpacity={0.9}
                  onPress={() => handleImagePress(item.url, currentImageIndex)}
                  style={styles.gridMedia}
                >
                  <ExpoImage
                    source={{ uri: item.url }}
                    style={[styles.gridMedia, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#e8e8e8' }]}
                    contentFit="cover"
                    transition={0}
                    recyclingKey={item.url}
                    cachePolicy="memory-disk"
                  />
                </TouchableOpacity>
              ) : (
              <View style={styles.gridMedia}>
                <VideoPlayer
                  uri={item.url}
                  thumbnail={item.thumbnail}
                  width={(MEDIA_MAX_WIDTH / 2) - MEDIA_GAP / 2}
                  height={(MEDIA_MAX_WIDTH / 2) - MEDIA_GAP / 2}
                  autoplay={true}
                  showControls={true}
                  onPress={() => handleVideoPress(item.url, item.thumbnail)}
                  isFeedVisible={isFeedVisible}
                />
              </View>
            )}
          </View>
          );
        })}
      </View>
    </View>
    );
  };

  const FourPlusMediaGrid = ({ media, colors, colorScheme }: { media: any[]; colors: any; colorScheme: string }) => {
    const displayMedia = media.slice(0, 4);
    const remainingCount = media.length - 4;
    let imageIndex = 0;

    return (
      <View style={styles.fourMediaGrid}>
        {displayMedia.map((item, index) => {
          const isLast = index === 3;
          const showOverlay = isLast && remainingCount > 0;
          const currentImageIndex = item.type === 'image' ? imageIndex++ : -1;
          
          return (
            <View 
              key={item.id || index} 
              style={styles.fourMediaItem}
            >
              {item.type === 'image' ? (
                <TouchableOpacity 
                  activeOpacity={0.9}
                  onPress={() => handleImagePress(item.url, currentImageIndex)}
                  style={styles.gridMedia}
                >
                  <ExpoImage
                    source={{ uri: item.url }}
                    style={[styles.gridMedia, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#e8e8e8' }]}
                    contentFit="cover"
                    transition={0}
                    recyclingKey={item.url}
                    cachePolicy="memory-disk"
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.gridMedia}>
                  <VideoPlayer
                    uri={item.url}
                    thumbnail={item.thumbnail}
                    width={(MEDIA_MAX_WIDTH / 2) - MEDIA_GAP / 2}
                    height={(MEDIA_MAX_WIDTH / 2) - MEDIA_GAP / 2}
                    autoplay={true}
                    showControls={true}
                    onPress={() => handleVideoPress(item.url, item.thumbnail)}
                    isFeedVisible={isFeedVisible}
                  />
                </View>
              )}
              {showOverlay && (
                <View style={[styles.moreMediaOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                  <Text style={[styles.moreMediaText, { color: '#fff' }]}>+{remainingCount}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const formatVideoDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [localPoll, setLocalPoll] = useState(post.poll);
  const [isVoting, setIsVoting] = useState(false);
  const skipNextUpdateRef = useRef(false);

  // Update local poll when post.poll changes (but skip if we're handling a vote)
  useEffect(() => {
    if (skipNextUpdateRef.current) {
      skipNextUpdateRef.current = false;
      return;
    }
    if (post.poll) {
      setLocalPoll(post.poll);
    }
  }, [post.poll]);

  const handlePollVote = async (optionId: string) => {
    if (!localPoll || isVoting) return;
    
    // Use localPoll state to determine current vote (more reliable)
    const currentVote = localPoll.userVote;
    
    // If clicking the same option that's already voted, remove the vote
    // Otherwise, switch to the new option
    const newOptionId = currentVote === optionId ? '' : optionId;
    
    // Optimistically update local state with proper vote counts
    setIsVoting(true);
    skipNextUpdateRef.current = true;
    
    const optimisticPoll = {
      ...localPoll,
      options: localPoll.options.map((opt: any) => {
        // Remove vote from previous option
        if (currentVote && opt.id === currentVote) {
          return { ...opt, votes: Math.max(0, (opt.votes || 0) - 1) };
        }
        // Add vote to new option
        if (newOptionId && opt.id === newOptionId) {
          return { ...opt, votes: (opt.votes || 0) + 1 };
        }
        return opt;
      }),
      userVote: newOptionId || undefined,
    };
    setLocalPoll(optimisticPoll);
    
    haptics.light();
    
    try {
      const { votePoll } = await import('@/lib/api/posts');
      const updatedPoll = await votePoll(post.id, newOptionId);
      
      // Update local state with server response
      setLocalPoll(updatedPoll);
      
      // Skip the next useEffect update from parent to prevent overwriting our update
      skipNextUpdateRef.current = true;
      
      // Call callback if provided (this will update parent state)
      if (onPollVote) {
        onPollVote(newOptionId);
      }
      
      haptics.success();
    } catch (error) {
      console.error('Error voting on poll:', error);
      // Revert optimistic update on error
      skipNextUpdateRef.current = true;
      if (post.poll) {
        setLocalPoll(post.poll);
      }
      haptics.error();
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <View style={[styles.wrapper, { 
      backgroundColor: 'transparent',
      paddingHorizontal: 0,
      paddingVertical: 0,
    }]}>
      <TouchableOpacity 
        onPress={onPress}
        onLongPress={post.author ? () => { haptics.medium(); onLongPress?.(post); } : undefined}
        activeOpacity={0.98}
        accessibilityRole="button"
        accessibilityLabel={`Post by ${post.author?.name || 'User'}. Double tap to open.`}
        style={[
          styles.postContainer,
          { 
            backgroundColor: postCardBgImage ? 'transparent' : postCardBgColor,
            borderWidth: postCardBgImage ? 0 : StyleSheet.hairlineWidth,
            borderColor: postCardBgImage ? 'transparent' : colors.cardBorder,
            shadowColor: (colors as any).shadow ?? '#000',
            ...Shadows.sm,
          },
        ]}
      >
        {postCardBgImage && (
          <ExpoImage
            source={{ uri: postCardBgImage }}
            style={styles.postBackgroundImage}
            contentFit="cover"
            transition={200}
          />
        )}
        <View style={[
          styles.postContent,
          postCardBgImage && { backgroundColor: postCardBgColor || 'rgba(0, 0, 0, 0.3)' }
        ]}>
          {/* Post Header */}
          <View style={styles.postHeader}>
            <View style={styles.userInfo}>
            <TouchableOpacity 
              style={[styles.avatarWrapper, {
                borderColor: 'transparent',
              }]}
              onPress={handleProfilePress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`View profile of ${post.author?.name || 'User'}`}
            >
              <View style={[styles.avatar, {
                backgroundColor: post.author?.avatar 
                  ? 'transparent' 
                  : colorScheme === 'dark' 
                    ? colors.primary + '40' 
                    : colors.primary + '18'
              }]}>
                {post.author?.avatar ? (
                  <ExpoImage
                    source={{ uri: post.author.avatar }}
                    style={styles.avatarImage}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {getInitials(post.author?.name || 'U')}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
            
            <View style={styles.userDetails}>
              <TouchableOpacity 
                style={styles.nameRow}
                onPress={handleProfilePress}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`View profile of ${post.author?.name || 'User'}`}
              >
                <Text style={[styles.userName, { color: postTextColor }]} numberOfLines={1}>
                  {post.author?.name || 'User'}
                </Text>
                {post.author?.isVerified && (() => {
                  const tier = post.author?.verifiedTier ?? 'premium';
                  const badgeColor = tier === 'pro' ? (colorScheme === 'dark' ? '#FFFFFF' : colors.textMuted) : colors.primary;
                  return <Ionicons name="checkmark-circle" size={16} color={badgeColor} style={styles.verifiedBadge} />;
                })()}
              </TouchableOpacity>
              <View style={styles.metaInfo}>
                <Text style={[styles.userHandle, { color: postSecondaryColor }]} numberOfLines={1}>
                  {post.author?.handle || '@user'}
                </Text>
                <Text style={[styles.separatorDot, { color: postSecondaryColor }]}> · </Text>
                <Text style={[styles.postTime, { color: postSecondaryColor }]}>
                  {formatTime(post.createdAt)}
                </Text>
              </View>
            </View>
          </View>
            {onLongPress && (
              <TouchableOpacity
                style={[styles.postOptionsButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  haptics.light();
                  onLongPress(post);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="More options for this post"
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>

        {/* Post Type Badge */}
        {post.postType && post.postType !== PostType.CONTENT && (() => {
          const typeLabel = post.postType === PostType.BUILD_LOG ? 'Build Log'
            : post.postType === PostType.QUESTION ? 'Question'
            : post.postType === PostType.WIN ? 'Win'
            : post.postType === PostType.LOSS ? 'Lesson'
            : post.postType === PostType.COLLABORATION ? 'Collaboration'
            : post.postType === PostType.MILESTONE ? 'Milestone'
            : post.postType === PostType.TIP ? 'Tip'
            : post.postType === PostType.RESOURCE ? 'Resource'
            : post.postType === PostType.LAUNCH ? 'Launch'
            : post.postType === PostType.SHIP ? 'Ship'
            : post.postType === PostType.TAKEAWAY ? 'Takeaway'
            : null;
          if (!typeLabel) return null;
          return (
            <View style={[styles.postTypeBadge, { backgroundColor: colors.primary + '18' }]}>
              <Text style={[styles.postTypeBadgeText, { color: colors.primary }]}>{typeLabel}</Text>
            </View>
          );
        })()}

        {/* Content Warning */}
        {post.contentWarning && !contentWarningDismissed && (
          <View style={[styles.contentWarningContainer, { 
            backgroundColor: colors.error + '12',
            borderColor: colors.error + '30',
          }]}>
            <View style={styles.contentWarningHeader}>
              <View style={[styles.contentWarningIconContainer, { backgroundColor: colors.error + '20' }]}>
                <Ionicons name="warning" size={20} color={colors.error} />
              </View>
              <View style={styles.contentWarningHeaderText}>
                <Text style={[styles.contentWarningTitle, { color: colors.error }]}>
                  Content Warning
                </Text>
                <Text style={[styles.contentWarningText, { color: postTextColor }]}>
                  {post.contentWarning}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.contentWarningButton, { backgroundColor: colors.error }]}
              onPress={() => {
                haptics.light();
                setContentWarningDismissed(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.contentWarningButtonText}>Show Content</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Post Content */}
        {(!post.contentWarning || contentWarningDismissed) && (post.title || post.content) && (
          <View style={styles.postContentInner}>
            {post.title && (
              <Text style={[styles.postTitle, { color: postTextColor }]}>
                {post.title}
              </Text>
            )}
            {post.content && (
              <FormattedPostText 
                text={post.content} 
                color={postTextColor}
              />
            )}
          </View>
        )}

        {/* Poll - Hide if content warning not dismissed */}
        {(!post.contentWarning || contentWarningDismissed) && localPoll && (() => {
          const totalVotes = localPoll.options.reduce((sum: number, opt: any) => sum + (opt.votes || 0), 0);
          const numOptions = localPoll.options.length;
          return (
            <View style={[styles.pollContainer, {
              backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.024)',
              borderColor: colors.border,
            }]}>
              <Text style={[styles.pollLabel, { color: postSecondaryColor }]}>Poll</Text>
              <Text style={[styles.pollQuestion, { color: postTextColor }]}>
                {localPoll.question}
              </Text>
              <View style={styles.pollOptionsList}>
                {localPoll.options.map((option: any, index: number) => {
                  const optionVotes = option.votes || 0;
                  const percentage = totalVotes > 0 ? Math.min(100, Math.round((optionVotes / totalVotes) * 100)) : 0;
                  const isVoted = localPoll.userVote === option.id;
                  const isLast = index === numOptions - 1;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      activeOpacity={0.72}
                      onPress={() => handlePollVote(option.id)}
                      disabled={isVoting}
                      style={[
                        styles.pollOptionRow,
                        {
                          opacity: isVoting ? 0.6 : 1,
                          borderLeftColor: isVoted ? colors.primary : 'transparent',
                          backgroundColor: isVoted ? (colorScheme === 'dark' ? colors.primary + '14' : colors.primary + '0A') : undefined,
                          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                          borderBottomColor: colors.divider,
                        },
                      ]}
                    >
                      <View style={styles.pollOptionTop}>
                        <Text style={[styles.pollOptionText, { color: postTextColor }]} numberOfLines={2}>
                          {option.text}
                        </Text>
                        {totalVotes > 0 && (
                          <Text style={[styles.pollOptionPct, { color: isVoted ? colors.primary : postSecondaryColor }]}>
                            {Math.round(percentage)}%
                          </Text>
                        )}
                      </View>
                      {totalVotes > 0 && (
                        <View style={[styles.pollBarTrack, { backgroundColor: colors.divider }]}>
                          <View
                            style={[
                              styles.pollBarFill,
                              {
                                width: `${percentage}%`,
                                backgroundColor: isVoted ? colors.primary : ((colors as any).textMuted ?? colors.secondary),
                              },
                            ]}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })()}

        {/* Post Media - Hide if content warning not dismissed */}
        {(!post.contentWarning || contentWarningDismissed) && post.media && post.media.length > 0 && (
          <View style={styles.mediaContainer}>
            {post.media.length === 1 ? (
              <SingleMedia media={post.media[0]} colors={colors} colorScheme={colorScheme ?? 'light'} />
            ) : post.media.length === 2 ? (
              <TwoMediaGrid media={post.media} colors={colors} colorScheme={colorScheme ?? 'light'} />
            ) : post.media.length === 3 ? (
              <ThreeMediaGrid media={post.media} colors={colors} colorScheme={colorScheme ?? 'light'} />
            ) : (
              <FourPlusMediaGrid media={post.media} colors={colors} colorScheme={colorScheme ?? 'light'} />
            )}
          </View>
        )}

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        {/* Post Actions */}
        <View style={[styles.postActions, { borderTopColor: 'transparent' }]}>
          <AnimatedPressable
            scale={0.9}
            style={styles.actionButton}
            onPress={handleLike}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={post.isLiked ? `Unlike. ${post.likes} likes` : `Like. ${post.likes || 0} likes`}
          >
            <Ionicons 
              name={post.isLiked ? 'heart' : 'heart-outline'} 
              size={20} 
              color={post.isLiked ? '#EF4444' : postSecondaryColor} 
            />
            {post.likes > 0 && (
              <Text style={[
                styles.actionCount, 
                { color: post.isLiked ? '#EF4444' : postSecondaryColor }
              ]}>
                {formatNumber(post.likes)}
              </Text>
            )}
          </AnimatedPressable>

          <AnimatedPressable
            scale={0.9}
            style={styles.actionButton}
            onPress={handleComment}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={`Comment. ${post.comments ?? 0} comments`}
          >
            <Ionicons 
              name="chatbubble-outline" 
              size={20} 
              color={postSecondaryColor} 
            />
            {(post.comments ?? 0) > 0 && (
              <Text style={[
                styles.actionCount, 
                { color: postSecondaryColor }
              ]}>
                {formatNumber(post.comments ?? 0)}
              </Text>
            )}
          </AnimatedPressable>

          <AnimatedPressable
            scale={0.9}
            style={styles.actionButton}
            onPress={handleSave}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={post.isSaved ? 'Unsave post' : 'Save post'}
          >
            <Ionicons 
              name={post.isSaved ? 'bookmark' : 'bookmark-outline'} 
              size={20} 
              color={post.isSaved ? postTextColor : postSecondaryColor} 
            />
          </AnimatedPressable>

          <AnimatedPressable
            scale={0.9}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => {
              haptics.light();
              setShowShareModal(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Share post"
          >
            <Ionicons 
              name="share-outline" 
              size={20} 
              color={postSecondaryColor} 
            />
          </AnimatedPressable>

          {(post.views ?? 0) > 0 && (
            <Text style={[styles.viewsText, { color: postSecondaryColor }]}>
              {formatNumber(post.views ?? 0)} views
            </Text>
          )}
        </View>
        </View>
      </TouchableOpacity>
      
      {/* Image Viewer Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseImage}
        statusBarTranslucent
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.imageModalContainer}>
          <TouchableOpacity 
            style={styles.imageModalCloseButton}
            onPress={handleCloseImage}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          
          {allImages.length > 1 && (
            <View style={styles.imageModalIndicator}>
              {allImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.imageModalDot,
                    index === selectedImageIndex && styles.imageModalDotActive,
                  ]}
                />
              ))}
            </View>
          )}
          
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            scrollEventThrottle={16}
            style={styles.imageModalScrollView}
            contentContainerStyle={styles.imageModalScrollContent}
          >
            {allImages.map((imageUrl, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.imageModalImageContainer}
                activeOpacity={1}
                onPress={handleCloseImage}
              >
                <ExpoImage
                  source={{ uri: imageUrl }}
                  style={styles.imageModalImage}
                  contentFit="contain"
                  transition={200}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
      
      {/* Video Media Viewer */}
      <MediaViewer
        visible={showMediaViewer}
        mediaItems={mediaViewerItems}
        initialIndex={mediaViewerInitialIndex}
        onClose={() => setShowMediaViewer(false)}
      />
      
      {/* Share Post Modal */}
      <SharePostModal
        visible={showShareModal}
        post={post}
        onClose={() => setShowShareModal(false)}
        onShareComplete={() => {
          // Optionally update UI or show success message
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    // No border, using card style instead
  },
  postContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md + 6,
    paddingBottom: Spacing.md + 6,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  postBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm + 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  postOptionsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  avatarWrapper: {
    marginRight: Spacing.md,
    borderRadius: 30,
    borderWidth: 0,
    padding: 0,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  userDetails: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    flexWrap: 'wrap',
    gap: 4,
  },
  verifiedBadge: {
    marginLeft: 0,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: Spacing.xs + 2,
    letterSpacing: -0.2,
    lineHeight: 16,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
  },
  userHandle: {
    fontSize: 15,
    fontWeight: '400',
    opacity: 0.7,
  },
  separatorDot: {
    fontSize: 15,
    opacity: 0.5,
    marginHorizontal: 4,
  },
  postTime: {
    fontSize: 15,
    fontWeight: '400',
    opacity: 0.7,
  },
  moreButton: {
    padding: Spacing.xs,
    marginTop: -Spacing.xs,
    marginRight: -Spacing.xs,
    borderRadius: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  postContent: {
    marginBottom: Spacing.sm,
    paddingLeft: 0,
  },
  postContentInner: {
    marginBottom: Spacing.sm,
    paddingLeft: 0,
  },
  postTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  postBody: {
    fontSize: Typography.sm + 1,
    lineHeight: 22,
    letterSpacing: -0.1,
    fontWeight: '400',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    paddingLeft: 0,
    paddingRight: 0,
    minHeight: 40,
    borderTopWidth: 0,
    marginTop: 0,
    width: '100%',
    overflow: 'hidden',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: Spacing.sm,
    paddingVertical: Spacing.xs,
    minWidth: 40,
  },
  viewsText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 'auto',
    marginRight: Spacing.md,
    flexShrink: 1,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: '400',
    minWidth: 24,
    letterSpacing: -0.1,
  },
  mediaContainer: {
    marginTop: Spacing.sm + 2,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  singleMediaContainer: {
    width: '100%',
  },
  singleMedia: {
    width: '100%',
  },
  twoMediaGrid: {
    flexDirection: 'row',
    width: '100%',
    gap: MEDIA_GAP,
  },
  twoMediaItem: {
    flex: 1,
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  threeMediaGrid: {
    flexDirection: 'row',
    width: '100%',
    gap: MEDIA_GAP,
  },
  threeMediaLeft: {
    flex: 1,
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  threeMediaLeftItem: {
    width: '100%',
    height: '100%',
  },
  threeMediaRight: {
    flex: 1,
    gap: MEDIA_GAP,
  },
  threeMediaRightItem: {
    width: '100%',
    height: 98,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  fourMediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    gap: MEDIA_GAP,
  },
  fourMediaItem: {
    width: '48%',
    height: 150,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  gridMedia: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
  },
  pollContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm + 4,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pollLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  pollQuestion: {
    fontSize: Typography.base,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  pollOptionsList: {},
  pollOptionRow: {
    paddingVertical: 12,
    paddingLeft: 14,
    borderLeftWidth: 3,
  },
  pollOptionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs + 2,
  },
  pollOptionText: {
    fontSize: Typography.sm + 1,
    fontWeight: '400',
    flex: 1,
    lineHeight: 20,
    marginRight: Spacing.sm,
  },
  pollOptionPct: {
    fontSize: Typography.sm,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'right',
  },
  pollBarTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  pollBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  videoDuration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  videoDurationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreMediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreMediaText: {
    fontSize: 24,
    fontWeight: '700',
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    right: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  imageModalIndicator: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  imageModalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  imageModalDotActive: {
    width: 24,
    backgroundColor: '#fff',
  },
  imageModalScrollView: {
    flex: 1,
  },
  imageModalScrollContent: {
    flexDirection: 'row',
  },
  imageModalImageContainer: {
    width: SCREEN_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  postTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  postTypeBadgeText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  contentWarningContainer: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  contentWarningHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  contentWarningIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  contentWarningHeaderText: {
    flex: 1,
    gap: Spacing.xs,
  },
  contentWarningTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  contentWarningText: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.5,
  },
  contentWarningButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  contentWarningButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.base,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
