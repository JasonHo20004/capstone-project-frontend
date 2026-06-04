// src/hooks/api/use-cart.ts
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '@/lib/api/services/user';
import { toast } from 'sonner';

export const cartKeys = {
  userCart: ['cart', 'user'] as const,
};

// True if the given courseId is already in the user's cart (reads cached cart).
export const useIsInCart = (courseId: string | undefined): boolean => {
  const { data } = useGetUserCart();
  if (!courseId || !data?.cartItems) return false;
  return data.cartItems.some((item) => item.courseId === courseId);
};

// Hook to fetch the user's cart
export const useGetUserCart = () => {
  const [hasToken, setHasToken] = useState(() =>
    Boolean(localStorage.getItem('accessToken'))
  );

  useEffect(() => {
    const sync = () => setHasToken(Boolean(localStorage.getItem('accessToken')));
    window.addEventListener('auth-change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('auth-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return useQuery({
    queryKey: cartKeys.userCart,
    queryFn: async () => {
      const res = await cartService.getUserCart();
      return res.data;
    },
    enabled: hasToken,
  });
};

// Optimistic add-to-cart: badge and dropdown update instantly, server reconciles after.
export type AddToCartInput = {
  id: string;
  title: string;
  price: number;
  thumbnailUrl?: string;
};

type CartSnapshot = {
  id?: string;
  userId?: string;
  createdAt?: string;
  cartItems: Array<{
    id: string;
    courseId: string;
    addedAt: string;
    priceAtTime: number;
    cartId?: string;
    course?: { id: string; title: string; price: number; thumbnailUrl?: string };
  }>;
} | undefined;

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (course: AddToCartInput) => cartService.addToCart(course.id),
    onMutate: async (course) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.userCart });
      const previous = queryClient.getQueryData<CartSnapshot>(cartKeys.userCart);

      const existing = previous?.cartItems?.find((i) => i.courseId === course.id);
      if (!existing) {
        const optimisticItem = {
          id: `optimistic-${course.id}`,
          courseId: course.id,
          addedAt: new Date().toISOString(),
          priceAtTime: course.price,
          course: {
            id: course.id,
            title: course.title,
            price: course.price,
            thumbnailUrl: course.thumbnailUrl,
          },
        };
        queryClient.setQueryData<CartSnapshot>(cartKeys.userCart, {
          ...(previous ?? { cartItems: [] }),
          cartItems: [...(previous?.cartItems ?? []), optimisticItem],
        });
      }

      toast.success("Đã thêm vào giỏ hàng");
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(cartKeys.userCart, context.previous);
      }
      toast.error("Không thể thêm vào giỏ hàng");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.userCart });
    },
  });
};

// Hook for full cart checkout
export const useCheckoutFullCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (couponCode?: string) => cartService.checkoutFullCart(couponCode),
    onSuccess: () => {
      toast.success('Thanh toán thành công!');
      queryClient.invalidateQueries({ queryKey: cartKeys.userCart });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'my'] });
    },
  });
};

// Hook for partial checkout
export const useCheckoutPartial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { cartItemIds: string[]; couponCode?: string }) =>
      cartService.checkoutPartial(vars.cartItemIds, vars.couponCode),
    onSuccess: () => {
      toast.success('Thanh toán thành công!');
      queryClient.invalidateQueries({ queryKey: cartKeys.userCart });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'my'] });
    },
  });
};

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cartItemId: string) => cartService.removeFromCart(cartItemId),
    onSuccess: () => {
      toast.success('Đã xoá khỏi giỏ hàng');
      queryClient.invalidateQueries({ queryKey: cartKeys.userCart });
    },
    onError: () => {
      toast.error('Không thể xoá khỏi giỏ hàng');
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cartService.clearCart(),
    onSuccess: () => {
      toast.success('Đã xoá toàn bộ giỏ hàng');
      queryClient.invalidateQueries({ queryKey: cartKeys.userCart });
    },
    onError: () => {
      toast.error('Không thể xoá giỏ hàng');
    },
  });
};

export const useDirectBuy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => cartService.directBuy(courseId),
    onSuccess: () => {
      toast.success('Mua khóa học thành công!');
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'my'] });
      queryClient.invalidateQueries({ queryKey: cartKeys.userCart });
    },
  });
};