import { Modal, View, Text, StyleSheet } from 'react-native';

interface MessageSearchProps {
  messages: any[];
  onSelectMessage: (message: any) => void;
  onClose: () => void;
}

export function MessageSearch({ messages, onSelectMessage, onClose }: MessageSearchProps) {
  return (
    <Modal visible={true} transparent animationType="slide">
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Search Messages</Text>
          <Text style={styles.text}>No messages found</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  text: {
    fontSize: 14,
    color: '#666',
  },
});
