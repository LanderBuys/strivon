import { View, Text, StyleSheet } from 'react-native';

interface AISuggestionsProps {
  query: string;
  onSelectSuggestion?: (suggestion: string) => void;
}

export function AISuggestions({ query, onSelectSuggestion }: AISuggestionsProps) {
  return null;
}
