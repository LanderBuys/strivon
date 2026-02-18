import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface SuggestedSearchesProps {
  onSelectQuery: (query: string) => void;
}

// Suggested searches based on user interests or popular content
const suggestedSearches = [
  { query: 'React Native', icon: 'code-slash-outline', category: 'Development' },
  { query: 'UI Design', icon: 'color-palette-outline', category: 'Design' },
  { query: 'Product Management', icon: 'briefcase-outline', category: 'Business' },
  { query: 'Startup Stories', icon: 'rocket-outline', category: 'Entrepreneurship' },
  { query: 'Web Development', icon: 'globe-outline', category: 'Development' },
  { query: 'Mobile Apps', icon: 'phone-portrait-outline', category: 'Development' },
];

export function SuggestedSearches({ onSelectQuery }: SuggestedSearchesProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const haptics = useHapticFeedback();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="bulb-outline" size={18} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Suggested for You</Text>
      </View>
      <View style={styles.suggestionsList}>
        {suggestedSearches.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.suggestionItem, { 
              backgroundColor: colors.cardBackground,
              borderColor: colors.cardBorder,
            }]}
            onPress={() => {
              haptics.light();
              onSelectQuery(item.query);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name={item.icon as any} size={20} color={colors.primary} />
            </View>
            <View style={styles.suggestionContent}>
              <Text style={[styles.suggestionQuery, { color: colors.text }]} numberOfLines={1}>
                {item.query}
              </Text>
              <Text style={[styles.suggestionCategory, { color: colors.secondary }]} numberOfLines={1}>
                {item.category}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.secondary} style={{ opacity: 0.4 }} />
          </TouchableOpacity>
        ))}
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
  suggestionsList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionQuery: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestionCategory: {
    fontSize: Typography.sm,
    opacity: 0.7,
  },
});

