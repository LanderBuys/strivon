import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface QuickReactionsProps {
  onReaction: (emoji: string) => void;
}

export function QuickReactions({ onReaction }: QuickReactionsProps) {
  const emojis = ['👍', '❤️', '😂', '🔥', '👏'];
  
  return (
    <View style={styles.container}>
      {emojis.map((emoji) => (
        <TouchableOpacity key={emoji} onPress={() => onReaction(emoji)} style={styles.button}>
          <Text style={styles.emoji}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    padding: 8,
  },
  emoji: {
    fontSize: 24,
  },
});


