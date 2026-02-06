import { useMutation, useQueryClient } from '@tanstack/react-query';
import { topupService, type CreateTopupRequest, type ConfirmPaymentRequest } from '@/lib/api/services/user';
import { toast } from 'sonner';

export const useCreateTopupOrder = () => {
  return useMutation({
    mutationFn: (data: CreateTopupRequest) => topupService.createOrder(data),
  });
};

export const useConfirmTopup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ConfirmPaymentRequest) => topupService.confirmPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      toast.success('Nạp tiền thành công! Số dư đã được cập nhật.');
    },
  });
};