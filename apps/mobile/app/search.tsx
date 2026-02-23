import { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { User, Post, Space } from '@/types/post';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchTabs } from '@/components/search/SearchTabs';
import { SearchResults } from '@/components/search/SearchResults';
import { SearchFilters, SearchFilter } from '@/components/search/SearchFilters';
import { SearchHistory } from '@/components/search/SearchHistory';
import { SavedSearches, saveSearch } from '@/components/search/SavedSearches';
import { TrendingSearches } from '@/components/search/TrendingSearches';
import { SuggestedSearches } from '@/components/search/SuggestedSearches';
import { addToSearchHistory } from '@/components/search/SearchHistory';
import { AISuggestions } from '@/components/search/AISuggestions';
import { AdvancedSearchFilters } from '@/components/search/AdvancedSearchFilters';
import { searchAll } from '@/lib/api/search';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Spacing } from '@/constants/theme';
import { useDebounce } from '@/hooks/useDebounce';
import { TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { canUseAdvancedSearch } from '@/lib/services/subscriptionService';
import { useFocusEffect } from '@react-navigation/native';
import { ErrorBoundary } from '@/components/ErrorBoundary';

type SearchTabType = 'people' | 'projects' | 'topics';

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const haptics = useHapticFeedback();
  const params = useLocalSearchParams<{ q?: string | string[] }>();
  const initialQ = typeof params.q === 'string' ? params.q : (Array.isArray(params.q) ? params.q[0] : '') || '';
  const [query, setQuery] = useState(initialQ);
  const [activeTab, setActiveTab] = useState<SearchTabType>('projects');
  const [activeFilter, setActiveFilter] = useState<SearchFilter>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(!initialQ);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<any>({});
  const [canUseAdvanced, setCanUseAdvanced] = useState(false);

  useFocusEffect(
    useCallback(() => {
      checkAdvancedSearchAccess();
    }, [])
  );

  useEffect(() => {
    checkAdvancedSearchAccess();
  }, []);

  const checkAdvancedSearchAccess = async () => {
    const hasAccess = await canUseAdvancedSearch();
    setCanUseAdvanced(hasAccess);
    if (!hasAccess && showAdvancedFilters) {
      setShowAdvancedFilters(false);
    }
  };

  const debouncedQuery = useDebounce(query, 350);
  const searchInFlightRef = useRef(0);

  // When opened with ?q=..., run that search once
  useEffect(() => {
    const q = typeof params.q === 'string' ? params.q : (Array.isArray(params.q) ? params.q[0] : '') || '';
    if (q.trim()) {
      setQuery(q);
      setActiveTab('projects');
      runSearch(q, true);
    }
  }, [params.q]);

  // Live search as you type (results update while typing)
  useEffect(() => {
    if (debouncedQuery.trim()) {
      runSearch(debouncedQuery);
    } else {
      setUsers([]);
      setPosts([]);
      setSpaces([]);
      setShowSuggestions(true);
    }
  }, [debouncedQuery]);

  const runSearch = useCallback((searchQuery: string, addToHistory = false) => {
    const q = searchQuery.trim();
    if (!q) {
      setUsers([]);
      setPosts([]);
      setSpaces([]);
      setShowSuggestions(true);
      return;
    }
    setShowSuggestions(false);
    if (addToHistory) addToSearchHistory(q);
    const id = ++searchInFlightRef.current;
    setLoading(true);
    searchAll(q)
      .then(({ users: u, posts: p, spaces: s }) => {
        if (id !== searchInFlightRef.current) return;
        setUsers(u);
        setPosts(p);
        setSpaces(s);
      })
      .catch((error) => {
        if (id !== searchInFlightRef.current) return;
        console.error('Error searching:', error);
        setUsers([]);
        setPosts([]);
        setSpaces([]);
      })
      .finally(() => {
        if (id === searchInFlightRef.current) setLoading(false);
      });
  }, []);

  const handleSubmitSearch = useCallback(() => {
    runSearch(query, true);
  }, [query, runSearch]);

  const handleClear = () => {
    haptics.light();
    setQuery('');
    setUsers([]);
    setPosts([]);
    setSpaces([]);
    setShowSuggestions(true);
  };

  const handleSelectQuery = (selectedQuery: string) => {
    haptics.selection();
    setQuery(selectedQuery);
    setShowSuggestions(false);
    runSearch(selectedQuery, true);
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top'] as const}>
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <ThemedText type="title" style={styles.title}>Search</ThemedText>
        </View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBarRow}>
          <View style={{ flex: 1 }}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Search people, posts, spaces..."
              onClear={handleClear}
              onSubmit={handleSubmitSearch}
            />
          </View>
          {query.trim() && canUseAdvanced && (
            <TouchableOpacity
              style={[styles.filterButton, { 
                backgroundColor: colors.cardBackground, 
                borderColor: colors.cardBorder,
              }]}
              onPress={() => {
                haptics.light();
                setShowAdvancedFilters(true);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="options-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        {query.length > 2 && <AISuggestions query={query} onSelectSuggestion={handleSelectQuery} />}
      </View>
      {query.trim() && (
        <>
          <SearchFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          <SearchTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </>
      )}
      {showSuggestions && !query.trim() ? (
        <ScrollView 
          style={styles.suggestionsContainer}
          contentContainerStyle={styles.suggestionsContent}
          showsVerticalScrollIndicator={false}
        >
          {canUseAdvanced && (
            <SavedSearches onSelectSearch={(search) => handleSelectQuery(search.query)} />
          )}
          <SearchHistory onSelectQuery={handleSelectQuery} onClear={handleClear} />
          <TrendingSearches onSelectQuery={handleSelectQuery} />
          <SuggestedSearches onSelectQuery={handleSelectQuery} />
        </ScrollView>
      ) : query.trim() ? (
        <SearchResults
          activeTab={activeTab}
          users={users}
          posts={posts}
          spaces={spaces}
          query={query}
          loading={loading}
        />
      ) : null}
      <AdvancedSearchFilters
        visible={showAdvancedFilters}
        filters={advancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApply={(filters) => {
          setAdvancedFilters(filters);
          if (query.trim() && canUseAdvanced) {
            saveSearch(query, filters);
          }
        }}
        onReset={() => {
          setAdvancedFilters({});
        }}
      />
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  searchContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsContainer: {
    flex: 1,
  },
  suggestionsContent: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
});

