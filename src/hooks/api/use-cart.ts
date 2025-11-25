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
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Thêm vào giỏ hàng thất bại");
        }
    })
}

// Hook for full cart checkout
export const useCheckoutFullCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cartService.checkoutFullCart(),
    onSuccess: () => {
      toast.success('Thanh toán thành công!');
      // Invalidate cart to show empty cart
      queryClient.invalidateQueries({ queryKey: cartKeys.userCart });
      // Invalidate profile/wallet to update balance
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'my'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Thanh toán thất bại');
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Thanh toán thất bại');
    },
  });
};