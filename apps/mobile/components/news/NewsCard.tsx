import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Share, Alert, Modal, Platform } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NewsArticle, StockVote } from '@/types/news';
import { HighlightedText } from './HighlightedText';
import { StockVoteComponent } from './StockVote';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { incrementNewsViews, incrementNewsShares, saveNewsArticle, unsaveNewsArticle, voteOnNewsArticle } from '@/lib/api/news';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = Spacing.lg;

interface NewsCardProps {
  article: NewsArticle;
  featured?: boolean;
  onPress?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  /** When set, share button opens this unified share flow instead of external-only */
  onSharePress?: (article: NewsArticle) => void;
}

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

const calculateReadingTime = (content: string): number => {
  // Average reading speed: 200 words per minute
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const getCategoryColor = (category: string, colorScheme: 'light' | 'dark'): string => {
  const colors = Colors[colorScheme ?? 'light'];
  const categoryColors: Record<string, string> = {
    investing: colors.info,
    trading: colors.primary,
    startups: colors.purple,
    tech: colors.cyan,
    finance: colors.success,
    markets: colors.warning,
  };
  return categoryColors[category] || colors.secondary;
};

const formatReadingTime = (min: number): string => (min === 1 ? '1 min read' : `${min} min read`);

export const NewsCard = React.memo(function NewsCard({ 
  article, 
  featured = false,
  onPress,
  onSave,
  onShare,
  onSharePress,
}: NewsCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(article.isSaved || false);
  const [shares, setShares] = useState(article.shares);
  const [longVotes, setLongVotes] = useState(article.longVotes || 0);
  const [shortVotes, setShortVotes] = useState(article.shortVotes || 0);
  const [userVote, setUserVote] = useState<StockVote>(article.userVote || null);
  const [imageError, setImageError] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const handlePress = () => {
    haptics.light();
    incrementNewsViews(article.id);
    onPress?.();
  };

  const handleSave = async () => {
    haptics.light();
    try {
      if (isSaved) {
        await unsaveNewsArticle(article.id);
        setIsSaved(false);
      } else {
        await saveNewsArticle(article.id);
        setIsSaved(true);
      }
      onSave?.();
    } catch (error) {
      console.error('Error saving article:', error);
      Alert.alert('Error', 'Failed to save article');
    }
  };

  const handleShare = () => {
    haptics.medium();
    if (onSharePress) {
      onSharePress(article);
      return;
    }
    // Fallback: external share only (when no unified modal is used)
    (async () => {
      const title = article.title || 'Article';
      const message = [title, article.description, article.sourceUrl].filter(Boolean).join('\n\n');
      const shareUrl = article.sourceUrl || undefined;
      const tryNativeShare = async (): Promise<boolean> => {
        if (Platform.OS === 'web' || typeof Share?.share !== 'function') return false;
        try {
          const content: { message: string; title?: string; url?: string } = { message };
          if (title) content.title = title;
          if (shareUrl && Platform.OS === 'ios') content.url = shareUrl;
          const result = await Share.share(content);
          return result.action === Share.sharedAction;
        } catch {
          return false;
        }
      };
      const shared = await tryNativeShare();
      if (shared) {
        await incrementNewsShares(article.id);
        setShares(prev => prev + 1);
        onShare?.();
        return;
      }
      try {
        await Clipboard.setStringAsync(message);
        Alert.alert('Copied', 'Article link copied to clipboard. Paste it anywhere to share.');
        await incrementNewsShares(article.id);
        setShares(prev => prev + 1);
        onShare?.();
      } catch (err) {
        console.error('Share fallback failed:', err);
        Alert.alert('Error', 'Could not share or copy. Please try again.');
      }
    })();
  };

  const handleVote = async (vote: StockVote) => {
    try {
      const previousVote = userVote;
      
      // Optimistic update
      if (previousVote === 'long') {
        setLongVotes(prev => Math.max(0, prev - 1));
      } else if (previousVote === 'short') {
        setShortVotes(prev => Math.max(0, prev - 1));
      }
      
      if (vote === 'long') {
        setLongVotes(prev => prev + 1);
      } else if (vote === 'short') {
        setShortVotes(prev => prev + 1);
      }
      
      setUserVote(vote);
      
      // Update in API
      await voteOnNewsArticle(article.id, vote);
    } catch (error) {
      console.error('Error voting on article:', error);
      // Revert optimistic update on error
      setLongVotes(article.longVotes || 0);
      setShortVotes(article.shortVotes || 0);
      setUserVote(article.userVote || null);
    }
  };

  const categoryColor = getCategoryColor(article.category, colorScheme ?? 'light');
  const readingMins = calculateReadingTime(article.content || article.description);

  // —— Featured layout: hero card with overlay text ——
  if (featured) {
    const hasImage = article.imageUrl && !imageError;
    return (
      <TouchableOpacity
        style={[styles.card, styles.cardFeatured, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
        onPress={handlePress}
        activeOpacity={0.94}
      >
        {hasImage ? (
          <TouchableOpacity
            style={styles.featuredImageWrap}
            onPress={() => {
              haptics.light();
              setShowImageModal(true);
            }}
            activeOpacity={0.9}
          >
            <ExpoImage
              source={{ uri: article.imageUrl }}
              style={styles.featuredImage}
              contentFit="cover"
              transition={250}
              cachePolicy="memory-disk"
              onError={() => setImageError(true)}
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.75)']}
              style={styles.featuredGradient}
            />
            <View style={[styles.categoryBadge, styles.categoryBadgeFeatured, { backgroundColor: categoryColor + 'E6' }]}>
              <Text style={styles.categoryText}>{article.category}</Text>
            </View>
            <View style={styles.featuredOverlay}>
              <Text style={styles.featuredSource}>{article.source}</Text>
              <Text style={styles.featuredTitle} numberOfLines={3}>{article.title}</Text>
              <Text style={styles.featuredMeta}>
                {formatTimeAgo(article.publishedAt)} · {formatReadingTime(readingMins)}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={[styles.featuredImageWrap, styles.featuredNoImage, { backgroundColor: colors.surface }]}>
            <View style={[styles.categoryBadge, styles.categoryBadgeFeatured, { backgroundColor: categoryColor + 'E6' }]}>
              <Text style={styles.categoryText}>{article.category}</Text>
            </View>
            <View style={[styles.featuredOverlay, styles.featuredOverlayNoImage]}>
              <Text style={[styles.featuredSource, { color: colors.primary }]}>{article.source}</Text>
              <Text style={[styles.featuredTitle, { color: colors.text }]} numberOfLines={3}>{article.title}</Text>
              <Text style={[styles.featuredMeta, { color: colors.secondary }]}>
                {formatTimeAgo(article.publishedAt)} · {formatReadingTime(readingMins)}
              </Text>
            </View>
          </View>
        )}
        <View style={[styles.featuredActions, { borderTopColor: colors.divider }]}>
          <TouchableOpacity style={styles.actionButton} onPress={() => { haptics.light(); router.push('/(tabs)/create'); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} activeOpacity={0.6}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionLabel, { color: colors.primary }]}>Discuss</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => { haptics.light(); router.push(`/news/${article.id}`); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} activeOpacity={0.6}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.secondary} />
            {article.comments && article.comments > 0 && (
              <Text style={[styles.actionCount, { color: colors.secondary }]}>{article.comments}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleSave} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} activeOpacity={0.6}>
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={isSaved ? colors.primary : colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} activeOpacity={0.6}>
            <Ionicons name="share-outline" size={20} color={colors.secondary} />
          </TouchableOpacity>
        </View>
        {article.imageUrl && (
          <Modal visible={showImageModal} transparent animationType="fade" onRequestClose={() => setShowImageModal(false)}>
            <View style={styles.imageModalContainer}>
              <TouchableOpacity style={styles.imageModalCloseButton} onPress={() => setShowImageModal(false)} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                <Ionicons name="close" size={32} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageModalContent} activeOpacity={1} onPress={() => setShowImageModal(false)}>
                <ExpoImage source={{ uri: article.imageUrl }} style={styles.imageModalImage} contentFit="contain" transition={200} cachePolicy="memory-disk" />
              </TouchableOpacity>
            </View>
          </Modal>
        )}
      </TouchableOpacity>
    );
  }

  // —— Default card layout ——
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
      onPress={handlePress}
      activeOpacity={0.92}
    >
      {/* Image */}
      {article.imageUrl && !imageError ? (
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={() => {
            haptics.light();
            setShowImageModal(true);
          }}
          activeOpacity={0.9}
        >
          <ExpoImage
            source={{ uri: article.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            onError={() => setImageError(true)}
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          />
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor + 'E6' }]}>
            <Text style={styles.categoryText}>{article.category}</Text>
          </View>
        </TouchableOpacity>
      ) : article.imageUrl && imageError ? (
        <View style={[styles.imageContainer, styles.imageErrorContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="image-outline" size={48} color={colors.secondary} style={{ opacity: 0.3 }} />
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor + 'E6' }]}>
            <Text style={styles.categoryText}>{article.category}</Text>
          </View>
        </View>
      ) : null}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.metaRow}>
          <Text style={[styles.source, { color: colors.primary }]} numberOfLines={1}>
            {article.source}
          </Text>
          <View style={styles.metaRight}>
            {article.views > 0 && (
              <Text style={[styles.viewsText, { color: colors.secondary }]}>
                {formatNumber(article.views)} views
              </Text>
            )}
            <Text style={[styles.time, { color: colors.secondary }]}>
              {formatTimeAgo(article.publishedAt)}
            </Text>
            <Text style={[styles.readingTime, { color: colors.secondary }]}>
              · {formatReadingTime(readingMins)}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {article.title}
        </Text>

        {/* Description with keyword highlighting */}
        <View style={styles.descriptionContainer}>
          <HighlightedText 
            text={article.description} 
            style={styles.description}
            numberOfLines={2}
          />
        </View>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {article.tags.slice(0, 4).map((tag) => (
              <View
                key={tag}
                style={[styles.tagPill, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              >
                <Text style={[styles.tagPillText, { color: colors.secondary }]} numberOfLines={1}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Stock Voting - Only show for stock-related articles */}
        {article.isStockRelated && (
          <View style={styles.voteContainer}>
            <StockVoteComponent
              longVotes={longVotes}
              shortVotes={shortVotes}
              userVote={userVote}
              onVote={handleVote}
              compact={true}
            />
          </View>
        )}

        {/* Actions - Simplified */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              haptics.light();
              router.push('/(tabs)/create');
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionLabel, { color: colors.primary }]}>Discuss</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              haptics.light();
              router.push(`/news/${article.id}`);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Ionicons name="chatbubble-outline" size={20} color={colors.secondary} />
            {article.comments && article.comments > 0 && (
              <Text style={[styles.actionCount, { color: colors.secondary }]}>
                {article.comments}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSave}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSaved ? colors.primary : colors.secondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Ionicons name="share-outline" size={20} color={colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Image Modal */}
      {article.imageUrl && (
        <Modal
          visible={showImageModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowImageModal(false)}
        >
          <View style={styles.imageModalContainer}>
            <TouchableOpacity
              style={styles.imageModalCloseButton}
              onPress={() => setShowImageModal(false)}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Ionicons name="close" size={32} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageModalContent}
              activeOpacity={1}
              onPress={() => setShowImageModal(false)}
            >
              <ExpoImage
                source={{ uri: article.imageUrl }}
                style={styles.imageModalImage}
                contentFit="contain"
                transition={200}
                cachePolicy="memory-disk"
              />
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardFeatured: {
    marginHorizontal: 0,
    marginBottom: 0,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  featuredImageWrap: {
    width: '100%',
    height: 260,
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  categoryBadgeFeatured: {
    top: Spacing.md,
    left: Spacing.md,
  },
  featuredOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    justifyContent: 'flex-end',
  },
  featuredOverlayNoImage: {
    paddingTop: Spacing.lg,
  },
  featuredSource: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: Typography.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  featuredTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  featuredMeta: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.xs,
    marginTop: 6,
  },
  featuredNoImage: {
    minHeight: 220,
    justifyContent: 'flex-end',
  },
  featuredActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  content: {
    padding: Spacing.md + 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  source: {
    fontSize: Typography.sm,
    fontWeight: '600',
    flex: 1,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 6,
  },
  viewsText: {
    fontSize: Typography.xs,
  },
  time: {
    fontSize: Typography.xs,
  },
  readingTime: {
    fontSize: Typography.xs,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    lineHeight: 24,
  },
  descriptionContainer: {
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: Typography.sm,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tagPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 80,
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  voteContainer: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.xs,
    minWidth: 40,
    justifyContent: 'center',
  },
  actionCount: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  imageErrorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  imageModalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalImage: {
    width: '100%',
    height: '100%',
  },
});
