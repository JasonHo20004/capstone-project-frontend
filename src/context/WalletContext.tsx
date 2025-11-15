import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { mockUsers } from '@/data/mock';

type PaymentMethod = 'MOMO' | 'ZALOPAY' | 'BANKING' | 'APPLEPAY';

interface WalletContextValue {
  balance: number;
  deposit: (amount: number, method: PaymentMethod, currency?: string) => void;
  pay: (amount: number) => boolean;
  clear: () => void;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

const CURRENT_USER_ID = '1';
// No persistence required; keep balance ephemeral per session.

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const initialBalance = useMemo(() => {
    const user = mockUsers.find(u => u.id === CURRENT_USER_ID);
    return user?.wallet?.allowance ?? 0;
  }, []);

  const [balance, setBalance] = useState<number>(initialBalance);

  useEffect(() => {
    // Best-effort: sync mock data for demo pages that read from mockUsers
    const user = mockUsers.find(u => u.id === CURRENT_USER_ID);
    if (user && user.wallet) {
      user.wallet.allowance = balance;
    }
  }, [balance]);

  const deposit = (amount: number, _method: PaymentMethod, _currency = 'VND') => {
    if (!amount || amount <= 0) return;
    setBalance(prev => prev + amount);
  };

  const pay = (amount: number) => {
    if (!amount || amount <= 0) return false;
    if (balance < amount) return false;
    setBalance(prev => prev - amount);
    return true;
  };

  const clear = () => setBalance(0);

  const value: WalletContextValue = { balance, deposit, pay, clear };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}