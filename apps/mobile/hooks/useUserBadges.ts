import { useState, useEffect } from 'react';
import { Badge } from '@/types/badges';
import { User } from '@/types/post';
import { getUserBadges, getUserBadgeObjects } from '@/lib/services/badgeService';

export interface UseUserBadgesResult {
  badges: Badge[];
  activeStatus: boolean;
  activeStreak: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useUserBadges(user: User | null): UseUserBadgesResult {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [activeStatus, setActiveStatus] = useState(false);
  const [activeStreak, setActiveStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadBadges = async () => {
    if (!user) {
      setBadges([]);
      setActiveStatus(false);
      setActiveStreak(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await getUserBadges(user);
      setBadges(result.badges.map(b => b.badge));
      setActiveStatus(result.activeStatus);
      setActiveStreak(result.activeStreak);
    } catch (error) {
      console.error('Error loading badges:', error);
      setBadges([]);
      setActiveStatus(false);
      setActiveStreak(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBadges();
  }, [user?.id]);

  return {
    badges,
    activeStatus,
    activeStreak,
    loading,
    refresh: loadBadges,
  };
}

