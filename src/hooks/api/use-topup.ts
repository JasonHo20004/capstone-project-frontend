import { useMutation, useQueryClient } from '@tanstack/react-query';
import { topupService, type CreateTopupRequest, type ConfirmPaymentRequest } from '@/lib/api/services/user';
import { toast } from 'sonner';

export const useCreateTopupOrder = () => {
  return useMutation({
    mutationFn: (data: CreateTopupRequest) => topupService.createOrder(data),
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể tạo đơn nạp tiền');
    },
  });
};

export const useConfirmTopup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ConfirmPaymentRequest) => topupService.confirmPayment(data),
    onSuccess: () => {
      // QUAN TRỌNG: Sau khi nạp thành công, làm mới thông tin User (để cập nhật số dư ví)
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      toast.success('Nạp tiền thành công! Số dư đã được cập nhật.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Xác nhận thanh toán thất bại');
    },
  });
};