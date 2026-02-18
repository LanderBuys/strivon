import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function FollowingScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const router = useRouter();
  
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    // Redirect to followers screen with following tab
    router.replace(`/profile/${id}/followers?tab=following`);
  }, [id, router]);

  return null;
}
