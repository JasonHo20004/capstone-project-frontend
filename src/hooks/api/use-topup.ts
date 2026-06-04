import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { topupService, type CreateTopupRequest } from '@/lib/api/services/user';

export const useCreateTopupOrder = () => {
  return useMutation({
    mutationFn: (data: CreateTopupRequest) => topupService.createOrder(data),
  });
};

export const useTopupOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await topupService.getOrderStatus(orderId);
      return response.data;
    },
    onSuccess: (data) => {
      if (!data) {
        return;
      }

      if (data.status === 'SUCCESS') {
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
        queryClient.invalidateQueries({ queryKey: ['wallet', 'summary'] });
        queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
        queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
        queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
        toast.success('Nạp tiền thành công! Số dư đã được cập nhật.');
      }

      if (data.status === 'FAILED') {
        toast.error('Thanh toán không thành công. Vui lòng thử lại.');
      }
    },
  });
};