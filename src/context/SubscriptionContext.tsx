import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMySubscription, SUBSCRIPTION_CACHE_KEY, MY_SUBSCRIPTION_KEY } from '@/hooks/api/use-user-subscription';
import type { UserSubscriptionStatus, PremiumFeature } from '@/domain';

interface SubscriptionContextValue {
  subscription: UserSubscriptionStatus | null;
  isProUser: boolean;
  isLoading: boolean;
  hasFeature: (feature: PremiumFeature) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  // Bumped on auth-change to force a re-render; useMySubscription then recomputes
  // its localStorage-derived `enabled` flag. The value itself is intentionally unused.
  const [, setAuthVersion] = useState(0);
  const { data: subscriptionData, isLoading } = useMySubscription();

  // This provider sits above the Router, so navigation after login does NOT
  // re-render it. Without this, `useMySubscription`'s `enabled` flag (derived
  // from localStorage) is never recomputed after login and the subscription is
  // only fetched on a full page refresh. Listen for auth changes to force a
  // re-render + refetch so Pro status reflects immediately. Mirrors PurchasesContext.
  useEffect(() => {
    const handleAuthChange = () => {
      queryClient.invalidateQueries({ queryKey: MY_SUBSCRIPTION_KEY });
      setAuthVersion((v) => v + 1);
    };
    window.addEventListener('auth-change', handleAuthChange);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'accessToken') handleAuthChange();
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [queryClient]);

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
