import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PostTemplatesProps {
  onSelectTemplate: (template: { content: string }) => void;
  onClose: () => void;
}

export function PostTemplates({ onSelectTemplate, onClose }: PostTemplatesProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Post Templates</Text>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  closeButton: {
    padding: 8,
    alignItems: 'center',
  },
});


