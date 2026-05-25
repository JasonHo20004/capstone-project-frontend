import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useMySubscription, SUBSCRIPTION_CACHE_KEY } from '@/hooks/api/use-user-subscription';
import type { UserSubscriptionStatus, PremiumFeature } from '@/domain';

interface SubscriptionContextValue {
  subscription: UserSubscriptionStatus | null;
  isProUser: boolean;
  isLoading: boolean;
  hasFeature: (feature: PremiumFeature) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: subscriptionData, isLoading } = useMySubscription();

  useEffect(() => {
    if (subscriptionData !== undefined) {
      localStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(subscriptionData));
    }
  }, [subscriptionData]);

  const value = useMemo<SubscriptionContextValue>(() => {
    const plan = subscriptionData?.plan ?? null;
    const features = plan?.features ?? [];
    const isProUser = !!subscriptionData?.isProUser || subscriptionData?.plan?.type === 'PRO';

    return {
      subscription: subscriptionData ?? null,
      isProUser,
      isLoading,
      hasFeature: (feature: PremiumFeature) => features.includes(feature),
    };
  }, [subscriptionData, isLoading]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
