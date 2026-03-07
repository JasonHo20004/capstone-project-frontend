import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetUserCart, useAddToCart, cartKeys } from '@/hooks/api/use-cart';
import { cartService } from '@/lib/api/services/user';
import { toast } from 'sonner';
import type { Course as AdminCourse } from '@/domain';

export type CartItem = {
  id: string;
  courseId: string;
  title: string;
  price: number;
  addedAt: string;
  course?: {
    id: string;
    title: string;
    price: number;
  };
};

type CartContextValue = {
  items: CartItem[];
  addItem: (course: AdminCourse) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  count: number;
  total: number;
  isLoading: boolean;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const queryClient = useQueryClient();
  const { data: cart, isLoading } = useGetUserCart();
  const addToCartMutation = useAddToCart();

  const items: CartItem[] = useMemo(() => {
    if (!cart?.cartItems) return [];
    return cart.cartItems.map((item) => ({
      id: item.id,
      courseId: item.courseId,
      title: item.course?.title || 'Unknown Course',
      price: Number(item.course?.price ?? item.priceAtTime ?? 0),
      addedAt: item.addedAt,
      course: item.course,
    }));
  }, [cart]);

  const count = items.length;
  const total = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.price || 0), 0),
    [items]
  );

  const addItem = useCallback(
    (course: AdminCourse) => {
      addToCartMutation.mutate(course.id);
    },
    [addToCartMutation]
  );

  const removeItem = useCallback(
    async (courseId: string) => {
      try {
        // Note: If backend supports remove, call it here
        // For now, invalidate and refetch
        toast.info('Đã xoá khỏi giỏ hàng');
        queryClient.invalidateQueries({ queryKey: cartKeys.userCart });
      } catch {
        toast.error('Không thể xoá khỏi giỏ hàng');
      }
    },
    [queryClient]
  );

  const clear = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: cartKeys.userCart });
  }, [queryClient]);

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    clear,
    count,
    total,
    isLoading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};