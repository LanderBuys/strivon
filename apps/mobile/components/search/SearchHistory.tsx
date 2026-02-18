import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

const SEARCH_HISTORY_KEY = '@strivon_search_history';
const MAX_HISTORY_ITEMS = 10;

interface SearchHistoryProps {
  onSelectQuery?: (query: string) => void;
  onClear?: () => void;
}

export function SearchHistory({ onSelectQuery, onClear }: SearchHistoryProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const history = JSON.parse(stored);
        setSearchHistory(Array.isArray(history) ? history : []);
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const handleClear = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
      setSearchHistory([]);
      haptics.light();
      onClear?.();
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }, [haptics, onClear]);

  if (searchHistory.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="time-outline" size={18} color={colors.secondary} />
          <Text style={[styles.title, { color: colors.text }]}>Recent Searches</Text>
        </View>
        <TouchableOpacity
          onPress={handleClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.clearText, { color: colors.primary }]}>Clear</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.historyList}>
        {searchHistory.map((query, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.historyItem, { borderBottomColor: colors.divider }]}
            onPress={() => {
              haptics.light();
              onSelectQuery?.(query);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={18} color={colors.secondary} style={styles.historyIcon} />
            <Text style={[styles.historyText, { color: colors.text }]} numberOfLines={1}>
              {query}
            </Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                removeFromHistory(query);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color={colors.secondary} style={{ opacity: 0.5 }} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  async function removeFromHistory(query: string) {
    try {
      const updated = searchHistory.filter(q => q !== query);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      setSearchHistory(updated);
      haptics.light();
    } catch (error) {
      console.error('Error removing from history:', error);
    }
  }
}

export async function addToSearchHistory(query: string) {
  if (!query || query.trim().length === 0) return;
  
  try {
    const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    let history: string[] = stored ? JSON.parse(stored) : [];
    
    // Remove if already exists (to move to top)
    history = history.filter(q => q.toLowerCase() !== query.toLowerCase());
    
    // Add to beginning
    history.unshift(query.trim());
    
    // Keep only last MAX_HISTORY_ITEMS
    history = history.slice(0, MAX_HISTORY_ITEMS);
    
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error adding to search history:', error);
  }
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  historyList: {
    paddingHorizontal: Spacing.md,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyIcon: {
    marginRight: Spacing.md,
    opacity: 0.6,
  },
  historyText: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: '400',
  },
});
