import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/lib/api/services/user/order/order.service';

/**
 * Create a new order from cart
 */
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cartId: string) => orderService.createOrder(cartId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

/**
 * Pay for an existing order
 */
export const usePayOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => orderService.payOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
};

/**
 * Get order history with pagination
 */
export const useOrderHistory = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['orders', 'history', params],
    queryFn: async () => {
      const response = await orderService.getHistory(params);
      return response;
    },
    staleTime: 60_000,
  });
};
