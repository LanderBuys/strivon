import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  View, 
  RefreshControl, 
  TouchableOpacity, 
  Text, 
  ScrollView,
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { NewsArticle, NewsCategory } from '@/types/news';
import { NewsCard } from '@/components/news/NewsCard';
import { NewsCardSkeleton } from '@/components/news/NewsCardSkeleton';
import { ShareModal } from '@/components/news/ShareModal';
import { EmptyState } from '@/components/EmptyState';
import { SearchBar } from '@/components/search/SearchBar';
import { ScrollToTopButton } from '@/components/feed/ScrollToTopButton';
import { getNewsArticles, incrementNewsShares, NewsSortOption } from '@/lib/api/news';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useDebounce } from '@/hooks/useDebounce';
import { useFadeIn } from '@/hooks/useFadeIn';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Check if API key is available
const hasApiKey = !!(process.env.EXPO_PUBLIC_NEWS_API_KEY || Constants.expoConfig?.extra?.newsApiKey);

const CATEGORIES: { label: string; value: NewsCategory; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'All', value: 'all', icon: 'newspaper' },
  { label: 'Investing', value: 'investing', icon: 'trending-up' },
  { label: 'Trading', value: 'trading', icon: 'bar-chart' },
  { label: 'Startups', value: 'startups', icon: 'rocket' },
  { label: 'Tech', value: 'tech', icon: 'hardware-chip' },
  { label: 'Finance', value: 'finance', icon: 'wallet' },
  { label: 'Markets', value: 'markets', icon: 'pulse' },
];

const SORT_OPTIONS: { value: NewsSortOption; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'newest', label: 'Newest', icon: 'time' },
  { value: 'popular', label: 'Popular', icon: 'flame' },
  { value: 'relevance', label: 'Relevance', icon: 'search' },
];

const SEARCH_SUGGESTIONS = ['stocks', 'Fed', 'AI', 'earnings', 'startups', 'crypto'];

function FadeInItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useFadeIn(280, index * 48);
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

export default function NewsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHapticFeedback();
  const flatListRef = useRef<FlatList>(null);
  
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<NewsSortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [shareArticle, setShareArticle] = useState<NewsArticle | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const loadArticles = useCallback(async (reset: boolean = false, targetPage?: number) => {
    try {
      if (reset) {
        setRefreshing(true);
      }
      
      const currentPage = targetPage ?? (reset ? 1 : page);
      const searchTerm = debouncedSearchQuery.trim() || undefined;
      const response = await getNewsArticles(selectedCategory, currentPage, 10, searchTerm, sortBy);
      
      if (reset) {
        setArticles(response.data);
        setPage(1);
      } else {
        setArticles(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.hasMore);
      setError(null);
    } catch (err) {
      console.error('Error loading articles:', err);
      setError('Failed to load news articles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, page, debouncedSearchQuery, sortBy]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    setArticles([]);
    loadArticles(true, 1);
  }, [selectedCategory, debouncedSearchQuery, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = useCallback(() => {
    haptics.light();
    loadArticles(true);
  }, [loadArticles, haptics]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadArticles(false, nextPage);
    }
  }, [loading, hasMore, refreshing, page, loadArticles]);

  const handleArticlePress = useCallback((article: NewsArticle) => {
    haptics.light();
    router.push({
      pathname: '/news/[id]',
      params: { id: article.id },
    });
  }, [router, haptics]);

  const handleCategoryChange = useCallback((category: NewsCategory) => {
    haptics.light();
    setSelectedCategory(category);
  }, [haptics]);

  const handleScrollToTop = useCallback(() => {
    haptics.light();
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [haptics]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setShowScrollToTop(offsetY > 300);
      },
    }
  );

  const handleSharePress = useCallback((article: NewsArticle) => {
    setShareArticle(article);
  }, []);

  const renderArticle = useCallback(
    ({ item, index }: { item: NewsArticle; index: number }) => (
      <FadeInItem index={index}>
        <NewsCard
          article={item}
          onPress={() => handleArticlePress(item)}
          onSave={() => {
            setArticles(prev =>
              prev.map(a => (a.id === item.id ? { ...a, isSaved: !a.isSaved } : a))
            );
          }}
          onShare={() => {
            setArticles(prev =>
              prev.map(a => (a.id === item.id ? { ...a, shares: a.shares + 1 } : a))
            );
          }}
          onSharePress={handleSharePress}
        />
      </FadeInItem>
    ),
    [handleArticlePress, handleSharePress]
  );

  const sortOption = SORT_OPTIONS.find(o => o.value === sortBy) ?? SORT_OPTIONS[0];
  const showFeatured = !searchQuery && articles.length > 0;
  const listArticles = showFeatured ? articles.slice(1) : articles;

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <View style={[styles.headerTop, { borderBottomColor: colors.divider }]}>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>News</Text>
            <Text style={[styles.headerSubtitle, { color: colors.secondary }]}>
              From the builder network
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
            onPress={() => {
              haptics.light();
              setShowSortMenu(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name={sortOption.icon as any} size={16} color={colors.primary} />
            <Text style={[styles.sortButtonText, { color: colors.text }]} numberOfLines={1}>
              {sortOption.label}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.secondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search articles..."
            onClear={() => setSearchQuery('')}
          />
          {debouncedSearchQuery.trim().length > 0 && (
            <Text style={[styles.searchHint, { color: colors.secondary }]} numberOfLines={1}>
              {loading && articles.length === 0
                ? 'Searching…'
                : `${articles.length} result${articles.length !== 1 ? 's' : ''}`}
            </Text>
          )}
        </View>
      </View>

      {!searchQuery && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
          style={styles.categoriesScroll}
        >
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.value;
            return (
              <TouchableOpacity
                key={category.value}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.cardBorder,
                  },
                ]}
                onPress={() => handleCategoryChange(category.value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={category.icon as any}
                  size={14}
                  color={isSelected ? '#FFFFFF' : colors.secondary}
                  style={styles.categoryIcon}
                />
                <Text
                  style={[
                    styles.categoryText,
                    { color: isSelected ? '#FFFFFF' : colors.text, fontWeight: isSelected ? '600' : '500' },
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Featured / Top story */}
      {showFeatured && articles[0] && (
        <View style={styles.featuredSection}>
          <View style={styles.featuredLabelRow}>
            <View style={[styles.featuredLabelDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.featuredLabel, { color: colors.secondary }]}>Top story</Text>
          </View>
          <NewsCard
            article={articles[0]}
            featured
            onPress={() => handleArticlePress(articles[0])}
            onSave={() => {
              setArticles(prev =>
                prev.map(a => (a.id === articles[0].id ? { ...a, isSaved: !a.isSaved } : a))
              );
            }}
            onShare={() => {
              setArticles(prev =>
                prev.map(a => (a.id === articles[0].id ? { ...a, shares: a.shares + 1 } : a))
              );
            }}
            onSharePress={handleSharePress}
          />
          {listArticles.length > 0 && (
            <View style={[styles.sectionLabelRow, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.sectionLabel, { color: colors.secondary }]}>Latest</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) {
      if (articles.length > 0) {
        return (
          <View style={styles.footerEnd}>
            <Text style={[styles.footerEndText, { color: colors.secondary }]}>
              You&apos;re all caught up
            </Text>
          </View>
        );
      }
      return null;
    }
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.footerText, { color: colors.secondary }]}>Loading more…</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (error) {
      return (
        <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.errorIconWrap, { backgroundColor: colors.error + '15' }]}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.error} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Couldn&apos;t load articles</Text>
          <Text style={[styles.errorMessage, { color: colors.secondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (searchQuery.trim()) {
      return (
        <View style={styles.emptySearchContainer}>
          <EmptyState
            icon="search-outline"
            title="No articles found"
            message={`No results for "${searchQuery}". Try different keywords.`}
          />
          <View style={styles.suggestionsWrap}>
            <Text style={[styles.suggestionsLabel, { color: colors.secondary }]}>Try searching for</Text>
            <View style={styles.suggestionsRow}>
              {SEARCH_SUGGESTIONS.map((term) => (
                <TouchableOpacity
                  key={term}
                  style={[styles.suggestionChip, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
                  onPress={() => {
                    haptics.light();
                    setSearchQuery(term);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.suggestionChipText, { color: colors.text }]}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      );
    }
    return (
      <EmptyState
        icon="newspaper-outline"
        title="No news articles"
        message={`No articles in ${selectedCategory === 'all' ? 'this feed' : selectedCategory} right now. Pull to refresh.`}
      />
    );
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonList}>
      <View style={styles.featuredSkeletonWrap}>
        <NewsCardSkeleton featured />
      </View>
      {Array.from({ length: 3 }).map((_, index) => (
        <NewsCardSkeleton key={`skeleton-${index}`} />
      ))}
    </View>
  );

  if (loading && articles.length === 0) {
    return (
      <ErrorBoundary>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
          {renderHeader()}
          <ScrollView
            contentContainerStyle={styles.skeletonContainer}
            showsVerticalScrollIndicator={false}
          >
            {renderSkeleton()}
          </ScrollView>
        </SafeAreaView>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <Animated.FlatList
        ref={flatListRef}
        data={listArticles}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={listArticles.length === 0 && !showFeatured ? renderEmpty : undefined}
        contentContainerStyle={[
          styles.listContent,
          listArticles.length === 0 && !showFeatured && styles.emptyContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressViewOffset={Platform.OS === 'android' ? 20 : 0}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        initialNumToRender={6}
        windowSize={8}
      />

      <ScrollToTopButton
        visible={showScrollToTop}
        onPress={handleScrollToTop}
        bottomInset={insets.bottom}
      />

      {/* Sort Menu Modal */}
      <Modal
        visible={showSortMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortMenu(false)}
        >
          <View style={[styles.sortMenu, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sortMenuTitle, { color: colors.text }]}>Sort by</Text>
            {SORT_OPTIONS.map((option) => {
              const isSelected = sortBy === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    isSelected && { backgroundColor: colors.primary + '18' },
                  ]}
                  onPress={() => {
                    haptics.light();
                    setSortBy(option.value);
                    setShowSortMenu(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={isSelected ? colors.primary : colors.secondary}
                    style={{ marginRight: Spacing.sm }}
                  />
                  <Text
                    style={[
                      styles.sortOptionText,
                      { color: isSelected ? colors.primary : colors.text },
                      isSelected && { fontWeight: '600' },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {shareArticle && (
        <ShareModal
          visible={true}
          articleId={shareArticle.id}
          articleTitle={shareArticle.title}
          articleDescription={shareArticle.description}
          articleSourceUrl={shareArticle.sourceUrl}
          article={shareArticle}
          onClose={() => setShareArticle(null)}
          onShareComplete={(count) => {
            setArticles(prev =>
              prev.map(a => (a.id === shareArticle.id ? { ...a, shares: a.shares + count } : a))
            );
          }}
          onExternalShareComplete={() => {
            incrementNewsShares(shareArticle.id);
            setArticles(prev =>
              prev.map(a => (a.id === shareArticle.id ? { ...a, shares: a.shares + 1 } : a))
            );
          }}
        />
      )}
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  emptyContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: Spacing.sm,
    paddingBottom: 0,
  },
  headerTop: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  titleBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    marginTop: 2,
    fontWeight: '500',
    opacity: 0.9,
  },
  searchContainer: {
    marginTop: Spacing.xs,
  },
  searchHint: {
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
    marginLeft: 2,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 4,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 130,
  },
  sortButtonText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  categoriesScroll: {
    maxHeight: 48,
  },
  categoriesContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  categoryIcon: {
    marginRight: 4,
  },
  featuredSection: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  featuredLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: 6,
  },
  featuredLabelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featuredLabel: {
    fontSize: Typography.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionLabelRow: {
    paddingTop: Spacing.lg,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionLabel: {
    fontSize: Typography.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  skeletonContainer: {
    paddingBottom: Spacing.xl,
  },
  skeletonList: {
    paddingTop: Spacing.md,
  },
  featuredSkeletonWrap: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortMenu: {
    width: '80%',
    maxWidth: 300,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sortMenuTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  sortOptionText: {
    flex: 1,
    fontSize: Typography.base,
  },
  categoryChip: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  footerText: {
    fontSize: Typography.sm,
  },
  footerEnd: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  footerEndText: {
    fontSize: Typography.sm,
  },
  emptySearchContainer: {
    flex: 1,
  },
  suggestionsWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  suggestionsLabel: {
    fontSize: Typography.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  suggestionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  suggestionChipText: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    minHeight: 400,
  },
  errorTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  errorMessage: {
    fontSize: Typography.base,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  errorIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.base,
    fontWeight: '600',
  },
});
