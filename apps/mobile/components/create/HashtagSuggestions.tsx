import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface HashtagSuggestionsProps {
  query: string;
  onSelectHashtag: (tag: string) => void;
}

// Popular hashtags for suggestions
const popularHashtags = [
  'buildlog', 'webdev', 'startup', 'coding', 'design', 'productivity',
  'entrepreneur', 'tech', 'innovation', 'collaboration', 'project',
  'development', 'programming', 'business', 'growth', 'learning',
];

export function HashtagSuggestions({ query, onSelectHashtag }: HashtagSuggestionsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (!query || query.length < 1) return null;

  const queryWithoutHash = query.startsWith('#') ? query.slice(1) : query;
  
  // Filter hashtags based on query
  const filteredHashtags = popularHashtags
    .filter(tag => tag.toLowerCase().includes(queryWithoutHash.toLowerCase()))
    .slice(0, 5);

  if (filteredHashtags.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.divider,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: colors.text }]}>Hashtag suggestions</Text>
      </View>
      <FlatList
        data={filteredHashtags}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hashtagList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.hashtagButton,
              {
                backgroundColor: colors.tint + '15',
                borderColor: colors.tint,
              },
            ]}
            onPress={() => onSelectHashtag(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="pricetag" size={14} color={colors.tint} />
            <Text style={[styles.hashtagText, { color: colors.tint }]}>#{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hashtagList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  hashtagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    gap: Spacing.xs,
    marginRight: Spacing.sm,
  },
  hashtagText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
