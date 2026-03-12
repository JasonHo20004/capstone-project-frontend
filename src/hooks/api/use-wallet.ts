import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletService } from '@/lib/api/services/user/wallet/wallet.service';

/**
 * Get current user's wallet balance
 */
export const useWallet = () => {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await walletService.getWallet();
      return response.data!;
    },
    staleTime: 30_000,
  });
};

export const useWalletSummary = () => {
  return useQuery({
    queryKey: ['wallet', 'summary'],
    queryFn: async () => {
      const response = await walletService.getSummary();
      return response.data!;
    },
    staleTime: 30_000,
  });
};

/**
 * Deposit money into wallet
 */
export const useDeposit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { amount: number; description?: string }) =>
      walletService.deposit(data.amount, data.description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
};

/**
 * Get wallet transaction history with pagination
 */
export const useWalletTransactions = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['wallet', 'transactions', params],
    queryFn: async () => {
      const response = await walletService.getTransactions(params);
      return response;
    },
    staleTime: 30_000,
  });
};
