import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_SEARCHES_KEY = '@strivon_saved_searches';

export interface SavedSearch {
  id: string;
  query: string;
  filters?: any;
  createdAt: string;
}

interface SavedSearchesProps {
  onSelectSearch: (search: SavedSearch) => void;
  onDeleteSearch?: (id: string) => void;
}

export function SavedSearches({ onSelectSearch, onDeleteSearch }: SavedSearchesProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(SAVED_SEARCHES_KEY);
      if (stored) {
        const searches = JSON.parse(stored);
        setSavedSearches(searches.sort((a: SavedSearch, b: SavedSearch) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  };

  const handleDelete = useCallback(async (id: string) => {
    try {
      const updated = savedSearches.filter(s => s.id !== id);
      await AsyncStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
      setSavedSearches(updated);
      onDeleteSearch?.(id);
      haptics.success();
    } catch (error) {
      console.error('Error deleting saved search:', error);
    }
  }, [savedSearches, onDeleteSearch, haptics]);

  const renderSearch = useCallback(({ item }: { item: SavedSearch }) => (
    <TouchableOpacity
      style={[styles.searchItem, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
      onPress={() => {
        haptics.light();
        onSelectSearch(item);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.searchContent}>
        <Ionicons name="search" size={16} color={colors.primary} />
        <Text style={[styles.searchQuery, { color: colors.text }]} numberOfLines={1}>
          {item.query}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleDelete(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close-circle" size={18} color={colors.secondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  ), [colors, onSelectSearch, handleDelete, haptics]);

  if (savedSearches.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="bookmark" size={16} color={colors.secondary} />
        <Text style={[styles.title, { color: colors.text }]}>Saved Searches</Text>
      </View>
      <FlatList
        data={savedSearches}
        keyExtractor={(item) => item.id}
        renderItem={renderSearch}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

export async function saveSearch(query: string, filters?: any): Promise<SavedSearch> {
  try {
    const stored = await AsyncStorage.getItem(SAVED_SEARCHES_KEY);
    const searches: SavedSearch[] = stored ? JSON.parse(stored) : [];
    
    // Check if already exists
    const existing = searches.find(s => s.query === query);
    if (existing) {
      return existing;
    }

    const newSearch: SavedSearch = {
      id: `saved-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      query,
      filters,
      createdAt: new Date().toISOString(),
    };

    searches.unshift(newSearch);
    // Keep only last 10 saved searches
    const limited = searches.slice(0, 10);
    await AsyncStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(limited));
    return newSearch;
  } catch (error) {
    console.error('Error saving search:', error);
    throw error;
  }
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  searchQuery: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
});



