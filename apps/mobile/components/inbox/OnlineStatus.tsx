import { View, StyleSheet } from 'react-native';

interface OnlineStatusProps {
  isOnline: boolean;
  size?: number;
}

export function OnlineStatus({ isOnline, size = 12 }: OnlineStatusProps) {
  if (!isOnline) return null;
  
  return (
    <View style={[styles.indicator, { width: size, height: size, borderRadius: size / 2 }]} />
  );
}

const styles = StyleSheet.create({
  indicator: {
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});


