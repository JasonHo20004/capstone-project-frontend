import React, { createContext, useContext, useEffect, useState } from 'react';
import { userService } from '@/lib/api/services/user';
import type { UserWithRelations } from '@/domain';

type PaymentMethod = 'STRIPE' | 'ZALOPAY' | 'BANKING' | 'APPLEPAY';

interface WalletContextValue {
  balance: number;
  deposit: (amount: number, method: PaymentMethod, currency?: string) => void;
  pay: (amount: number) => boolean;
  clear: () => void;
  isLoading: boolean;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    userService
      .getProfile()
      .then((res) => {
        if (cancelled || !res?.data) return;
        const user = res.data as UserWithRelations;
        setBalance(Number(user?.wallet?.allowance) || 0);
      })
      .catch(() => {
        if (!cancelled) setBalance(0);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const deposit = (amount: number, _method: PaymentMethod, _currency = 'VND') => {
    if (!amount || amount <= 0) return;
    setBalance((prev) => prev + amount);
  };

  const pay = (amount: number) => {
    if (!amount || amount <= 0) return false;
    if (balance < amount) return false;
    setBalance((prev) => prev - amount);
    return true;
  };

  const clear = () => setBalance(0);

  const value: WalletContextValue = { balance, deposit, pay, clear, isLoading };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}