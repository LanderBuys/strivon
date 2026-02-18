import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Platform, TextInput, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useDebounce } from '@/hooks/useDebounce';
import { Post, User, Space } from '@/types/post';

const SEARCH_HISTORY_KEY = '@strivon_search_history';

interface SearchOverlayProps {
  visible: boolean;
  query: string;
  onClose: () => void;
  onSelectResult?: (type: 'user' | 'post' | 'space', id: string, searchQuery?: string) => void;
  onSearch?: (query: string) => void;
  onQueryChange?: (query: string) => void;
  allPosts?: Post[];
}

// Recent searches loaded from AsyncStorage in the component
const defaultRecentSearches: string[] = [];
const trendingSearches = [
  { query: 'React Native', count: '12.5K', trend: 'up' },
  { query: 'AI Development', count: '8.2K', trend: 'up' },
  { query: 'Startup Tips', count: '6.7K', trend: 'up' },
  { query: 'Web Design', count: '5.1K', trend: 'up' },
  { query: 'Productivity', count: '4.3K', trend: 'up' },
  { query: 'Open Source', count: '3.9K', trend: 'up' },
];

const trendingHashtags = [
  '#buildlog',
  '#webdev',
  '#startup',
  '#coding',
  '#design',
  '#productivity',
  '#tech',
  '#innovation',
];

const suggestedSearches = [
  { query: 'React Native', icon: 'code-slash-outline', category: 'Development' },
  { query: 'UI Design', icon: 'color-palette-outline', category: 'Design' },
  { query: 'Product Management', icon: 'briefcase-outline', category: 'Business' },
  { query: 'Startup Stories', icon: 'rocket-outline', category: 'Entrepreneurship' },
];

export function SearchOverlay({ visible, query, onClose, onSelectResult, onSearch, onQueryChange, allPosts = [] }: SearchOverlayProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const haptics = useHapticFeedback();
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<{ users: User[]; posts: Post[]; spaces: Space[] }>({
    users: [],
    posts: [],
    spaces: [],
  });
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [liveSuggestions, setLiveSuggestions] = useState<string[]>([]);
  const hasNavigatedRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load recent searches from storage
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Animate on mount
  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);

  // Generate live suggestions as user types
  useEffect(() => {
    if (query.trim().length >= 1 && query.trim().length < 2) {
      const suggestions: string[] = [];
      const lowerQuery = query.toLowerCase();
      
      // Suggest from recent searches
      recentSearches.forEach(search => {
        if (search.toLowerCase().startsWith(lowerQuery) && suggestions.length < 3) {
          suggestions.push(search);
        }
      });
      
      // Suggest from trending
      trendingSearches.forEach(item => {
        if (item.query.toLowerCase().startsWith(lowerQuery) && suggestions.length < 5) {
          suggestions.push(item.query);
        }
      });
      
      // Suggest from hashtags
      trendingHashtags.forEach(tag => {
        if (tag.toLowerCase().includes(lowerQuery) && suggestions.length < 6) {
          suggestions.push(tag);
        }
      });
      
      setLiveSuggestions(suggestions.slice(0, 5));
    } else {
      setLiveSuggestions([]);
    }
  }, [query, recentSearches]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const history = JSON.parse(stored);
        setRecentSearches(Array.isArray(history) ? history.slice(0, 6) : []);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  // Live search as you type (results pop up in the overlay)
  useEffect(() => {
    if (debouncedQuery.trim().length >= 1) {
      performSearch(debouncedQuery);
    } else {
      setResults({ users: [], posts: [], spaces: [] });
      setLoading(false);
    }
  }, [debouncedQuery]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery || !searchQuery.trim()) {
      setResults({ users: [], posts: [], spaces: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { searchAll } = await import('@/lib/api/search');
      const { users, posts, spaces } = await searchAll(searchQuery);
      setResults({
        users: users.slice(0, 8),
        posts: posts.slice(0, 10),
        spaces: spaces.slice(0, 8),
      });
    } catch (error) {
      console.error('Search overlay error:', error);
      setResults({ users: [], posts: [], spaces: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = async (suggestion: string) => {
    haptics.light();
    onSearch?.(suggestion);
    
    // Save to search history
    try {
      const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      let history: string[] = stored ? JSON.parse(stored) : [];
      history = history.filter(q => q.toLowerCase() !== suggestion.toLowerCase());
      history.unshift(suggestion.trim());
      history = history.slice(0, 10);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
      setRecentSearches(history.slice(0, 6));
    } catch (error) {
      console.error('Error saving search:', error);
    }
    
    // Navigate to search results immediately
    if (onSelectResult) {
      hasNavigatedRef.current = true;
      onSelectResult('post', '', suggestion);
      setTimeout(() => {
        onClose();
      }, 50);
    }
  };

  const handleSelectResult = (type: 'user' | 'post' | 'space', id: string) => {
    haptics.light();
    hasNavigatedRef.current = true;
    // Navigate to search results screen immediately
    onSelectResult?.(type, id);
    onClose();
  };

  const hasResults = useMemo(() => 
    results.users.length > 0 || results.posts.length > 0 || results.spaces.length > 0,
    [results]
  );
  const showSuggestions = !query.trim() || (query.trim().length < 1);

  const submitSearch = () => {
    if (!query.trim()) return;
    hasNavigatedRef.current = true;
    onSelectResult?.('post', '', query.trim());
    onClose();
  };

  useEffect(() => {
    if (!visible) hasNavigatedRef.current = false;
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={{ flex: 1 }}
        >
          <View style={[styles.content, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <View style={[styles.searchHeader, { borderBottomColor: colors.divider, backgroundColor: colors.surface }]}>
              <Text style={[styles.searchSheetTitle, { color: (colors as any).textMuted ?? colors.secondary }]}>Search</Text>
              <View style={styles.searchRow}>
                <View style={[styles.searchInputContainer, { 
                  backgroundColor: colors.inputBackground ?? colors.surface,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.inputBorder ?? colors.divider,
                  ...Shadows.sm,
                  shadowColor: (colors as any).shadow ?? '#000',
                }]}>
                  <Ionicons name="search" size={20} color={colors.primary} style={styles.searchInputIcon} />
                  <TextInput
                    style={[styles.searchInputField, { color: colors.text }]}
                    placeholder="Search posts, people, topics..."
                    placeholderTextColor={colors.secondary}
                    value={query}
                    onChangeText={onQueryChange}
                    returnKeyType="search"
                    autoFocus
                    onSubmitEditing={submitSearch}
                  />
                  {query.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        onQueryChange?.('');
                        haptics.light();
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.6}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.secondary} />
                    </TouchableOpacity>
                  )}
                  {query.length === 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        haptics.light();
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.6}
                    >
                      <Ionicons name="mic-outline" size={18} color={colors.secondary} style={{ opacity: 0.6 }} />
                    </TouchableOpacity>
                  )}
                </View>
                {query.trim().length > 0 ? (
                  <TouchableOpacity
                    onPress={() => {
                      haptics.light();
                      submitSearch();
                    }}
                    style={[styles.searchButton, { backgroundColor: colors.primary }]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.searchButtonText}>Search</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      haptics.light();
                    }}
                    style={styles.closeButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Live Suggestions (1 char) */}
              {liveSuggestions.length > 0 && (
                <View style={[styles.liveSuggestionsContainer, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                  {liveSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.liveSuggestionItem, { 
                        borderBottomColor: index < liveSuggestions.length - 1 ? colors.divider : 'transparent'
                      }]}
                      onPress={() => handleSelectSuggestion(suggestion)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="search-outline" size={16} color={colors.secondary} style={{ opacity: 0.6 }} />
                      <Text style={[styles.liveSuggestionText, { color: colors.text }]} numberOfLines={1}>
                        {suggestion}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            {showSuggestions ? (
              <ScrollView 
                style={styles.suggestionsContainer}
                contentContainerStyle={[styles.suggestionsContent, { paddingBottom: Spacing.xxl }]}
                showsVerticalScrollIndicator={false}
              >
            {query.trim().length === 0 && (
              <>
                {recentSearches.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                      <View style={styles.sectionHeaderLeft}>
                        <Ionicons name="time-outline" size={18} color={colors.secondary} />
                        <Text style={[styles.sectionTitle, { color: (colors as any).textMuted ?? colors.secondary }]}>Recent</Text>
                      </View>
                      <TouchableOpacity
                        onPress={async () => {
                          try {
                            await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
                            setRecentSearches([]);
                            haptics.light();
                          } catch (error) {
                            console.error('Error clearing history:', error);
                          }
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={[styles.clearText, { color: colors.primary }]}>Clear</Text>
                      </TouchableOpacity>
                    </View>
                    {recentSearches.map((search, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.suggestionItem, { 
                          backgroundColor: colors.surface,
                          borderColor: colors.divider,
                        }]}
                        onPress={() => handleSelectSuggestion(search)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="time-outline" size={18} color={colors.secondary} style={styles.suggestionIcon} />
                        <Text style={[styles.suggestionText, { color: colors.text }]} numberOfLines={1}>{search}</Text>
                        <TouchableOpacity
                          onPress={async (e) => {
                            e.stopPropagation();
                            const updated = recentSearches.filter((_, i) => i !== index);
                            await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
                            setRecentSearches(updated);
                            haptics.light();
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="close" size={18} color={colors.secondary} style={{ opacity: 0.5 }} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionHeaderLeft}>
                      <Ionicons name="trending-up" size={18} color={colors.primary} />
                      <Text style={[styles.sectionTitle, { color: (colors as any).textMuted ?? colors.secondary }]}>Trending</Text>
                    </View>
                  </View>
                  <View style={styles.subsection}>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={[styles.chipsContainer, { paddingRight: Spacing.lg }]}
                    >
                      {trendingSearches.map((item, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[styles.trendingChip, { 
                            backgroundColor: colors.surface,
                            borderColor: colors.divider,
                          }]}
                          onPress={() => handleSelectSuggestion(item.query)}
                          activeOpacity={0.7}
                        >
                          <Ionicons 
                            name="trending-up" 
                            size={14} 
                            color={colors.primary} 
                            style={styles.trendIcon}
                          />
                          <Text style={[styles.trendingText, { color: colors.text }]} numberOfLines={1}>
                            {item.query}
                          </Text>
                          <Text style={[styles.trendingCount, { color: colors.secondary }]}>
                            {item.count}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={styles.subsection}>
                    <Text style={[styles.subsectionTitle, { color: (colors as any).textMuted ?? colors.secondary }]}>Hashtags</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={[styles.chipsContainer, { paddingRight: Spacing.lg }]}
                    >
                      {trendingHashtags.map((hashtag, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[styles.hashtagChip, { 
                            backgroundColor: colors.primary + '15',
                            borderColor: colors.primary + '30',
                          }]}
                          onPress={() => handleSelectSuggestion(hashtag)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="pricetag" size={14} color={colors.primary} />
                          <Text style={[styles.hashtagText, { color: colors.primary }]}>
                            {hashtag}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionHeaderLeft}>
                      <Ionicons name="bulb-outline" size={18} color={colors.primary} />
                      <Text style={[styles.sectionTitle, { color: (colors as any).textMuted ?? colors.secondary }]}>Suggested</Text>
                    </View>
                  </View>
                  {suggestedSearches.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.suggestedItem, { 
                        backgroundColor: colors.surface,
                        borderColor: colors.divider,
                      }]}
                      onPress={() => handleSelectSuggestion(item.query)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.suggestedIconContainer, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                      </View>
                      <View style={styles.suggestedContent}>
                        <Text style={[styles.suggestedQuery, { color: colors.text }]} numberOfLines={1}>
                          {item.query}
                        </Text>
                        <Text style={[styles.suggestedCategory, { color: colors.secondary }]} numberOfLines={1}>
                          {item.category}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.secondary} style={{ opacity: 0.4 }} />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
              </ScrollView>
            ) : (
              <FlatList
            data={[
              ...(results.users.length > 0 ? [{ type: 'section' as const, title: 'Users', data: null }] : []),
              ...results.users.map(u => ({ type: 'user' as const, data: u })),
              ...(results.posts.length > 0 ? [{ type: 'section' as const, title: 'Posts', data: null }] : []),
              ...results.posts.map(p => ({ type: 'post' as const, data: p })),
              ...(results.spaces.length > 0 ? [{ type: 'section' as const, title: 'Spaces', data: null }] : []),
              ...results.spaces.map(s => ({ type: 'space' as const, data: s })),
            ]}
            keyExtractor={(item, index) => {
              if (item.type === 'section') {
                return `section-${item.title}-${index}`;
              }
              return `${item.type}-${item.data.id}-${index}`;
            }}
            renderItem={({ item }) => {
              if (item.type === 'section') {
                const sectionItem = item as { type: 'section'; title: string; data: null };
                return (
                  <View style={[styles.sectionHeader, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
                    <Text style={[styles.sectionHeaderText, { color: colors.text }]}>{sectionItem.title}</Text>
                  </View>
                );
              }
              if (item.type === 'user') {
                const user = item.data as User;
                return (
                  <TouchableOpacity
                    style={[styles.resultItem, { 
                      borderBottomColor: colors.divider,
                      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                    }]}
                    onPress={() => handleSelectResult('user', user.id)}
                    activeOpacity={0.6}
                  >
                    {user.avatar ? (
                      <View style={styles.avatarContainer}>
                        <ExpoImage
                          source={{ uri: user.avatar }}
                          style={styles.userAvatar}
                          contentFit="cover"
                        />
                      </View>
                    ) : (
                      <View style={[styles.avatarContainer, { backgroundColor: colors.divider }]}>
                        <Ionicons name="person" size={20} color={colors.secondary} />
                      </View>
                    )}
                    <View style={styles.resultContent}>
                      <View style={styles.userInfoRow}>
                        <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>{user.name}</Text>
                        {user.label && (
                          <View style={[styles.labelBadge, { backgroundColor: colors.divider }]}>
                            <Text style={[styles.userLabel, { color: colors.secondary }]}>{user.label}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.resultSubtitle, { color: colors.secondary }]} numberOfLines={1}>{user.handle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.secondary} style={{ opacity: 0.5 }} />
                  </TouchableOpacity>
                );
              }
              if (item.type === 'post') {
                const post = item.data as Post;
                const postContent = post.content || post.title || 'Post';
                return (
                  <TouchableOpacity
                    style={[styles.resultItem, { 
                      borderBottomColor: colors.divider,
                      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                    }]}
                    onPress={() => handleSelectResult('post', post.id)}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.postIconContainer, { backgroundColor: colors.primary + '15' }]}>
                      <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.resultContent}>
                      <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={2}>
                        {postContent}
                      </Text>
                      <View style={styles.postMetaRow}>
                        <Text style={[styles.resultSubtitle, { color: colors.secondary }]} numberOfLines={1}>
                          {post.author?.name || 'Unknown'}
                        </Text>
                        <View style={[styles.metaDot, { backgroundColor: colors.secondary }]} />
                        <Ionicons name="heart" size={12} color={colors.secondary} style={{ opacity: 0.6 }} />
                        <Text style={[styles.metaText, { color: colors.secondary }]}>
                          {post.likes || 0}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.secondary} style={{ opacity: 0.5 }} />
                  </TouchableOpacity>
                );
              }
              if (item.type === 'space') {
                const space = item.data as Space;
                return (
                  <TouchableOpacity
                    style={[styles.resultItem, { 
                      borderBottomColor: colors.divider,
                      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                    }]}
                    onPress={() => handleSelectResult('space', space.id)}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.spaceIconContainer, { backgroundColor: colors.primary + '15' }]}>
                      <Ionicons name="people" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.resultContent}>
                      <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>{space.name}</Text>
                      <View style={styles.spaceMetaRow}>
                        <Text style={[styles.resultSubtitle, { color: colors.secondary }]} numberOfLines={1}>
                          {space.description || 'Space'}
                        </Text>
                        <View style={[styles.metaDot, { backgroundColor: colors.secondary }]} />
                        <Ionicons name="people" size={12} color={colors.secondary} style={{ opacity: 0.6 }} />
                        <Text style={[styles.metaText, { color: colors.secondary }]}>
                          {space.memberCount.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.secondary} style={{ opacity: 0.5 }} />
                  </TouchableOpacity>
                );
              }
              return null;
            }}
            ListEmptyComponent={
              loading ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={32} color={colors.secondary} style={{ opacity: 0.5, marginBottom: Spacing.sm }} />
                  <Text style={[styles.emptyText, { color: colors.secondary }]}>Searching...</Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={32} color={colors.secondary} style={{ opacity: 0.5, marginBottom: Spacing.sm }} />
                  <Text style={[styles.emptyText, { color: colors.secondary }]}>No results found</Text>
                  <Text style={[styles.emptySubtext, { color: colors.secondary }]}>
                    Try searching for users, posts, or topics
                  </Text>
                </View>
              )
            }
            ListFooterComponent={hasResults ? (
              <TouchableOpacity
                style={[styles.seeAllResults, { borderTopColor: colors.divider }]}
                onPress={() => {
                  haptics.light();
                  submitSearch();
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.seeAllResultsText, { color: colors.primary }]}>See all results</Text>
                <Ionicons name="open-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            ) : null}
            contentContainerStyle={[styles.resultsContainer, hasResults ? { paddingBottom: Spacing.lg } : undefined]}
              />
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Colors.light.background,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  searchHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchSheetTitle: {
    fontSize: Typography.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  seeAllResults: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  seeAllResultsText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  filtersContainer: {
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
    marginRight: Spacing.sm,
  },
  filterChipText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  liveSuggestionsContainer: {
    marginTop: Spacing.sm,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  liveSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'transparent',
  },
  liveSuggestionText: {
    flex: 1,
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  searchInputIcon: {
    marginRight: Spacing.xs,
  },
  searchInputField: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    fontWeight: '500',
  },
  searchButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsContainer: {
    flex: 1,
  },
  suggestionsContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  subsection: {
    marginBottom: Spacing.lg,
  },
  subsectionTitle: {
    fontSize: Typography.sm - 1,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    opacity: 0.7,
  },
  chipsContainer: {
    gap: Spacing.sm,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  suggestionIcon: {
    marginRight: 0,
  },
  suggestionText: {
    fontSize: Typography.base,
    flex: 1,
    fontWeight: '500',
  },
  trendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
  },
  trendIcon: {
    marginRight: 2,
  },
  trendingText: {
    fontSize: Typography.sm,
    fontWeight: '500',
    marginRight: Spacing.xs,
  },
  trendingCount: {
    fontSize: Typography.sm - 2,
    fontWeight: '400',
    opacity: 0.7,
  },
  hashtagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
  },
  hashtagText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  suggestedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  suggestedIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestedContent: {
    flex: 1,
  },
  suggestedQuery: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestedCategory: {
    fontSize: Typography.sm,
    opacity: 0.7,
  },
  resultsContainer: {
    paddingTop: Spacing.xs,
  },
  sectionHeader: {
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.xs,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.6,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 64,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  postIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  labelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginLeft: Spacing.sm,
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  spaceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  resultSubtitle: {
    fontSize: 13,
    opacity: 0.7,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: 12,
    gap: Spacing.xs,
  },
  viewAllText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
