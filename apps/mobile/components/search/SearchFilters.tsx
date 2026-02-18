import { View, StyleSheet } from 'react-native';

export type SearchFilter = 'all' | 'recent' | 'people' | 'posts';

interface SearchFiltersProps {
  activeFilter: SearchFilter;
  onFilterChange: (filter: SearchFilter) => void;
}

export function SearchFilters({ activeFilter, onFilterChange }: SearchFiltersProps) {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    height: 0,
  },
});


