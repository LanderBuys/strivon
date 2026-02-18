import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface TrendingSearchesProps {
  onSelectQuery: (query: string) => void;
}

// Mock trending searches - in a real app, this would come from an API
const trendingSearches = [
  { query: 'React Native', trend: 'up', count: '12.5K' },
  { query: 'AI Development', trend: 'up', count: '8.2K' },
  { query: 'Startup Tips', trend: 'up', count: '6.7K' },
  { query: 'Web Design', trend: 'up', count: '5.1K' },
  { query: 'Productivity', trend: 'up', count: '4.3K' },
  { query: 'Open Source', trend: 'up', count: '3.9K' },
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

export function TrendingSearches({ onSelectQuery }: TrendingSearchesProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="flame" size={18} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Trending</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Trending Searches</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {trendingSearches.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.trendingChip, { 
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
              }]}
              onPress={() => {
                haptics.light();
                onSelectQuery(item.query);
              }}
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

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Trending Hashtags</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {trendingHashtags.map((hashtag, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.hashtagChip, { 
                backgroundColor: colors.primary + '15',
                borderColor: colors.primary + '30',
              }]}
              onPress={() => {
                haptics.light();
                onSelectQuery(hashtag);
              }}
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
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sm - 1,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    opacity: 0.7,
  },
  chipsContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
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
});

