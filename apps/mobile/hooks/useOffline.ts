import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useOffline(): boolean {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOffline(state.isConnected === false);
    });
    return () => unsubscribe();
  }, []);

  return offline;
}
