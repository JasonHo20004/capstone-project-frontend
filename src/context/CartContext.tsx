import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Course as AdminCourse } from '@/types/type';

export type CartItem = {
  id: string;
  title: string;
  price: number;
  course?: AdminCourse;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (course: AdminCourse) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  count: number;
  total: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = 'skillboost_cart_v1';

export const CartProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const addItem = (course: AdminCourse) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === course.id)) {
        toast.info('Khoá học đã có trong giỏ hàng');
        return prev;
      }
      const next = [...prev, { id: course.id, title: course.title, price: course.price, course }];
      toast.success('Đã thêm vào giỏ hàng');
      return next;
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clear = () => setItems([]);

  const count = items.length;
  const total = useMemo(() => items.reduce((sum, i) => sum + (i.price || 0), 0), [items]);

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    clear,
    count,
    total,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};