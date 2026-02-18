import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SubscriptionPlan = 'free' | 'premium' | 'pro';

export interface SubscriptionState {
  plan: SubscriptionPlan;
  expiresAt: string | null;
  isActive: boolean;
}

const STORAGE_KEY = '@strivon_subscription';

const defaultState: SubscriptionState = {
  plan: 'free',
  expiresAt: null,
  isActive: false,
};

interface SubscriptionContextType {
  subscription: SubscriptionState;
  loading: boolean;
  setPlan: (plan: SubscriptionPlan, expiresAt?: string | null) => Promise<void>;
  isPremium: boolean;
  canUseFeature: (feature: string) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  free: ['basic_posting', 'basic_analytics'],
  premium: ['basic_posting', 'basic_analytics', 'scheduled_posts', 'content_ideas', 'boost'],
  pro: ['basic_posting', 'basic_analytics', 'scheduled_posts', 'content_ideas', 'boost', 'priority_support', 'advanced_analytics'],
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as SubscriptionState;
          const isExpired = parsed.expiresAt && new Date(parsed.expiresAt) < new Date();
          setSubscription({
            ...parsed,
            isActive: parsed.isActive && !isExpired,
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setPlan = useCallback(async (plan: SubscriptionPlan, expiresAt?: string | null) => {
    const next: SubscriptionState = {
      plan,
      expiresAt: expiresAt ?? null,
      isActive: plan !== 'free',
    };
    setSubscription(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const isPremium = subscription.plan !== 'free' && subscription.isActive;

  const canUseFeature = useCallback(
    (feature: string): boolean => {
      const allowed = PLAN_FEATURES[subscription.plan] ?? [];
      return subscription.isActive && allowed.includes(feature);
    },
    [subscription]
  );

  const value: SubscriptionContextType = {
    subscription,
    loading,
    setPlan,
    isPremium,
    canUseFeature,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) throw new Error('useSubscription must be used within SubscriptionProvider');
  return context;
}
