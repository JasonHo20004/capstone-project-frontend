// src/hooks/api/use-cart.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '@/lib/api/services/user';
import { toast } from 'sonner';

export const cartKeys = {
  userCart: ['cart', 'user'] as const,
};

// Hook to fetch the user's cart
export const useGetUserCart = () => {
  return useQuery({
    queryKey: cartKeys.userCart,
    queryFn: async () => {
      const res = await cartService.getUserCart();
      return res.data;
    },
  });
};

// Hook to add item to cart
export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => cartService.addToCart(courseId),
    onSuccess: () => {
      toast.success("Đã thêm vào giỏ hàng");
      queryClient.invalidateQueries({ queryKey: cartKeys.userCart });
    },
  });
};

// Hook for full cart checkout
export const useCheckoutFullCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cartService.checkoutFullCart(),
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
    mutationFn: (cartItemIds: string[]) => cartService.checkoutPartial(cartItemIds),
    onSuccess: () => {
      toast.success('Thanh toán thành công!');
      queryClient.invalidateQueries({ queryKey: cartKeys.userCart });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'my'] });
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