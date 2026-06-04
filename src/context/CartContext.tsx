import React, { createContext, useContext, useMemo, useCallback } from 'react';
import {
  useGetUserCart,
  useAddToCart,
  useRemoveCartItem,
  useClearCart,
} from '@/hooks/api/use-cart';
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
    thumbnailUrl?: string;
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
  const { data: cart, isLoading } = useGetUserCart();
  const addToCartMutation = useAddToCart();
  const removeCartItemMutation = useRemoveCartItem();
  const clearCartMutation = useClearCart();

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
      addToCartMutation.mutate({
        id: course.id,
        title: course.title,
        price: course.price,
        thumbnailUrl: course.thumbnailUrl,
      });
    },
    [addToCartMutation]
  );

  const removeItem = useCallback(
    (cartItemId: string) => {
      removeCartItemMutation.mutate(cartItemId);
    },
    [removeCartItemMutation]
  );

  const clear = useCallback(() => {
    clearCartMutation.mutate();
  }, [clearCartMutation]);

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