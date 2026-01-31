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
    onError: (error: any) => {
      console.error('Failed to fetch cart:', error);
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
            toast.error(error.response?.data?.message);
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
      toast.error(error.response?.data?.message);
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
      toast.error(error.response?.data?.message);
    },
  });
};

export const useDirectBuy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => cartService.directBuy(courseId),
    
    onSuccess: () => {
      toast.success('Mua khóa học thành công!');
      // Làm mới thông tin User (để cập nhật số dư ví)
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      // Làm mới danh sách khóa học đã mua
      queryClient.invalidateQueries({ queryKey: ['courses', 'my'] });
      // Làm mới giỏ hàng (nếu backend xóa item khỏi giỏ khi mua direct)
      queryClient.invalidateQueries({ queryKey: cartKeys.userCart });
    },

    onError: (error: any) => {
      toast.error(error.response?.data?.message);
    },
  });
};