import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  withdrawalService,
  type WithdrawalListResponse,
  type WithdrawalRequestPayload,
  type WithdrawalRequestStatus,
  type WithdrawalSummary,
} from '@/lib/api/services/withdrawal.service';

// ── SELLER HOOKS ────────────────────────────────────────────────────────

export const useSellerWithdrawalHistory = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['withdrawals', 'seller', params],
    queryFn: () => withdrawalService.getSellerHistory(params),
    staleTime: 60 * 1000,
    // Backend returns { success, data, total, page, limit, totalPages }
    // Service already extracts response.data (axios), so queryFn returns the JSON body
    select: (response): WithdrawalListResponse => ({
      data: response.data ?? [],
      total: (response as any).total ?? 0,
      page: (response as any).page ?? 1,
      limit: (response as any).limit ?? 10,
      totalPages: (response as any).totalPages ?? 1,
    }),
  });
};

export const useRequestWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: WithdrawalRequestPayload) => withdrawalService.requestWithdrawal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals', 'seller'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
};

// ── ADMIN HOOKS ─────────────────────────────────────────────────────────

export const useAdminWithdrawalRequests = (params?: {
  page?: number;
  limit?: number;
  status?: WithdrawalRequestStatus;
}) => {
  return useQuery({
    queryKey: ['withdrawals', 'admin', 'list', params],
    queryFn: () => withdrawalService.getAdminRequests(params),
    staleTime: 60 * 1000,
    select: (response): WithdrawalListResponse => ({
      data: response.data ?? [],
      total: (response as any).total ?? 0,
      page: (response as any).page ?? 1,
      limit: (response as any).limit ?? 10,
      totalPages: (response as any).totalPages ?? 1,
    }),
  });
};

export const useAdminWithdrawalSummary = () => {
  return useQuery({
    queryKey: ['withdrawals', 'admin', 'summary'],
    queryFn: () => withdrawalService.getAdminSummary(),
    staleTime: 60 * 1000,
    select: (response): WithdrawalSummary | undefined => response.data,
  });
};

export const useApproveWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; proofImageUrl?: string; adminNote?: string }) =>
      withdrawalService.approveWithdrawal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals', 'admin'] });
    },
  });
};

export const useRejectWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; adminNote: string }) => withdrawalService.rejectWithdrawal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals', 'admin'] });
    },
  });
};
