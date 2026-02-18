import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { NewsArticle, StockVote, NewsComment } from '@/types/news';
import { getNewsArticleById, incrementNewsViews, incrementNewsShares, saveNewsArticle, unsaveNewsArticle, voteOnNewsArticle, getNewsComments, addNewsComment, likeNewsComment } from '@/lib/api/news';
import { HighlightedText } from '@/components/news/HighlightedText';
import { StockVoteComponent } from '@/components/news/StockVote';
import { NewsComment as NewsCommentComponent } from '@/components/news/NewsComment';
import { NewsCommentInput } from '@/components/news/NewsCommentInput';
import { ShareModal } from '@/components/news/ShareModal';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

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

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const calculateReadingTime = (content: string): number => {
  const words = (content || '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [shares, setShares] = useState(0);
  const [longVotes, setLongVotes] = useState(0);
  const [shortVotes, setShortVotes] = useState(0);
  const [userVote, setUserVote] = useState<StockVote>(null);
  const [comments, setComments] = useState<NewsComment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: { name: string }; content: string } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    loadArticle();
  }, [id]);

  const loadArticle = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await getNewsArticleById(id);
      if (data) {
        setArticle(data);
        setIsSaved(data.isSaved || false);
        setShares(data.shares);
        setLongVotes(data.longVotes || 0);
        setShortVotes(data.shortVotes || 0);
        setUserVote(data.userVote || null);
        setCommentCount(data.comments || 0);
        
        // Load comments
        setLoadingComments(true);
        try {
          const articleComments = await getNewsComments(id);
          setComments(articleComments);
        } catch (error) {
          console.error('Error loading comments:', error);
        } finally {
          setLoadingComments(false);
        }
        
        await incrementNewsViews(id);
      } else {
        Alert.alert('Error', 'Article not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading article:', error);
      Alert.alert('Error', 'Failed to load article');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!article) return;
    
    haptics.light();
    try {
      if (isSaved) {
        await unsaveNewsArticle(article.id);
        setIsSaved(false);
      } else {
        await saveNewsArticle(article.id);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error saving article:', error);
      Alert.alert('Error', 'Failed to save article');
    }
  };

  const handleShare = () => {
    if (!article) return;
    haptics.medium();
    setShowShareModal(true);
  };

  const handleSendComment = async (content: string, media?: any[], replyTo?: string, poll?: any) => {
    if (!article) return;
    
    setSendingComment(true);
    try {
      const newComment = await addNewsComment(article.id, content, replyTo, media, poll);
      
      // Reload comments
      const updatedComments = await getNewsComments(article.id);
      setComments(updatedComments);
      setCommentCount(prev => prev + 1);
      setReplyingTo(null);
      
      // Update article state
      setArticle(prev => prev ? { ...prev, comments: (prev.comments || 0) + 1 } : null);
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSendingComment(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!article) return;
    
    try {
      await likeNewsComment(article.id, commentId);
      
      // Reload comments to get updated likes
      const updatedComments = await getNewsComments(article.id);
      setComments(updatedComments);
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleReply = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId) || 
                   comments.flatMap(c => c.replies || []).find(r => r.id === commentId);
    if (comment) {
      setReplyingTo({
        id: comment.id,
        author: { name: comment.author.name },
        content: comment.content,
      });
    }
  };

  const handleOpenSource = async () => {
    if (!article?.sourceUrl) return;
    
    haptics.light();
    try {
      const canOpen = await Linking.canOpenURL(article.sourceUrl);
      if (canOpen) {
        await Linking.openURL(article.sourceUrl);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', 'Failed to open article source');
    }
  };

  const handleVote = async (vote: StockVote) => {
    if (!article) return;
    
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
      
      // Update article state
      setArticle(prev => prev ? {
        ...prev,
        longVotes: vote === 'long' ? longVotes + 1 : (previousVote === 'long' ? longVotes - 1 : longVotes),
        shortVotes: vote === 'short' ? shortVotes + 1 : (previousVote === 'short' ? shortVotes - 1 : shortVotes),
        userVote: vote,
      } : null);
    } catch (error) {
      console.error('Error voting on article:', error);
      // Revert optimistic update on error
      setLongVotes(article.longVotes || 0);
      setShortVotes(article.shortVotes || 0);
      setUserVote(article.userVote || null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={isSaved ? colors.primary : colors.text}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Image */}
        {article.imageUrl && (
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={handleOpenSource}
            activeOpacity={0.9}
          >
            <ExpoImage
              source={{ uri: article.imageUrl }}
              style={styles.image}
              contentFit="cover"
              cachePolicy="memory-disk"
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            />
          </TouchableOpacity>
        )}

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.metaRow}>
            <View style={styles.metaLeft}>
              <Text style={[styles.source, { color: colors.primary }]}>
                {article.source}
              </Text>
              {article.author && (
                <Text style={[styles.author, { color: colors.secondary }]}>
                  · {article.author}
                </Text>
              )}
            </View>
            <View style={styles.metaRight}>
              <Text style={[styles.time, { color: colors.secondary }]}>
                {formatTimeAgo(article.publishedAt)}
              </Text>
              <Text style={[styles.readingTime, { color: colors.secondary }]}>
                · {calculateReadingTime(article.content || article.description)} min read
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            {article.title}
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.secondary }]}>
            {article.description}
          </Text>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {article.tags.map((tag, index) => (
                <View
                  key={index}
                  style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
                >
                  <Text style={[styles.tagText, { color: colors.secondary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Stock Voting - Only show for stock-related articles */}
          {article.isStockRelated && (
            <StockVoteComponent
              longVotes={longVotes}
              shortVotes={shortVotes}
              userVote={userVote}
              onVote={handleVote}
              compact={false}
            />
          )}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Full Content with Keyword Highlighting */}
          <View style={styles.contentSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Article</Text>
            {article.content && article.content.length > 0 ? (
              <HighlightedText 
                text={article.content} 
                style={styles.fullContent}
              />
            ) : (
              <Text style={[styles.fullContent, { color: colors.secondary, fontStyle: 'italic' }]}>
                Full article content not available. Please read on the source website.
              </Text>
            )}
          </View>

          {article.sourceUrl && (
            <TouchableOpacity
              style={[styles.sourceLink, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}
              onPress={handleOpenSource}
              activeOpacity={0.7}
            >
              <View style={[styles.sourceLinkIconWrap, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="open-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.sourceLinkTextWrap}>
                <Text style={[styles.sourceLinkLabel, { color: colors.secondary }]}>Full article</Text>
                <Text style={[styles.sourceLinkText, { color: colors.primary }]} numberOfLines={1}>
                  Read on {article.source}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}

          <View style={[styles.stats, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={18} color={colors.secondary} />
              <Text style={[styles.statText, { color: colors.secondary }]}>
                {formatNumber(article.views)} views
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-outline" size={18} color={colors.secondary} />
              <Text style={[styles.statText, { color: colors.secondary }]}>
                {formatNumber(commentCount)} comments
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.statItem}>
              <Ionicons name="share-social-outline" size={18} color={colors.secondary} />
              <Text style={[styles.statText, { color: colors.secondary }]}>
                {formatNumber(shares)} shares
              </Text>
            </View>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <View style={[styles.commentsHeader, { borderBottomColor: colors.divider }]}>
              <View style={styles.commentsHeaderLeft}>
                <Ionicons name="chatbubbles" size={20} color={colors.primary} />
                <Text style={[styles.commentsTitle, { color: colors.text }]}>
                  Comments
                </Text>
                {commentCount > 0 && (
                  <View style={[styles.commentBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.commentBadgeText, { color: colors.primary }]}>
                      {commentCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {loadingComments ? (
              <View style={styles.loadingComments}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.secondary }]}>
                  Loading comments...
                </Text>
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.emptyComments}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.secondary} style={{ opacity: 0.5 }} />
                <Text style={[styles.emptyCommentsText, { color: colors.text }]}>
                  No comments yet
                </Text>
                <Text style={[styles.emptyCommentsSubtext, { color: colors.secondary }]}>
                  Be the first to share your thoughts!
                </Text>
              </View>
            ) : (
              <View style={styles.commentsList}>
                {comments.map((comment) => {
                  const replyToComment = comment.replyTo 
                    ? comments.find(c => c.id === comment.replyTo) || 
                      comments.flatMap(c => c.replies || []).find(r => r.id === comment.replyTo) || 
                      null
                    : null;
                  
                  return (
                    <NewsCommentComponent
                      key={comment.id}
                      comment={comment}
                      onReply={handleReply}
                      onLike={handleLikeComment}
                      replyToComment={replyToComment}
                    />
                  );
                })}
              </View>
            )}
          </View>
        </View>
        </ScrollView>

        {/* Comment Input */}
        <NewsCommentInput
          onSend={handleSendComment}
          replyTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
        {sendingComment && (
          <View style={[styles.sendingOverlay, { backgroundColor: colors.background + 'E0' }]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Share Modal */}
      {article && (
        <ShareModal
          visible={showShareModal}
          articleId={article.id}
          articleTitle={article.title}
          articleDescription={article.description}
          articleSourceUrl={article.sourceUrl}
          article={article}
          onClose={() => setShowShareModal(false)}
          onShareComplete={(count) => {
            setShares(prev => prev + count);
          }}
          onExternalShareComplete={() => {
            incrementNewsShares(article.id);
            setShares(prev => prev + 1);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerActionButton: {
    padding: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl + 80, // Extra padding for comment input
  },
  imageContainer: {
    width: '100%',
    height: 250,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: Spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  source: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  author: {
    fontSize: Typography.sm,
  },
  time: {
    fontSize: Typography.xs,
  },
  readingTime: {
    fontSize: Typography.xs,
  },
  title: {
    fontSize: Typography['2xl'],
    fontWeight: '700',
    marginBottom: Spacing.md,
    lineHeight: 32,
  },
  description: {
    fontSize: Typography.base,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tagText: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.lg,
  },
  contentSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  fullContent: {
    fontSize: Typography.base,
    lineHeight: 26,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sourceLinkIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceLinkTextWrap: {
    flex: 1,
  },
  sourceLinkLabel: {
    fontSize: Typography.xs,
    marginBottom: 2,
  },
  sourceLinkText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 20,
    borderRadius: 1,
  },
  commentsSection: {
    marginTop: Spacing.lg,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.md,
  },
  commentsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  commentsTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
  },
  commentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  commentBadgeText: {
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  loadingComments: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: Typography.sm,
  },
  commentsList: {
    gap: 0,
    paddingBottom: Spacing.sm,
  },
  emptyComments: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptyCommentsSubtext: {
    fontSize: Typography.sm,
    marginTop: Spacing.xs,
  },
  sendingOverlay: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 0,
    right: 0,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
