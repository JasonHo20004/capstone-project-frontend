import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  commissionService,
  type SellerEarningsResponse,
  type AdminCommissionReportResponse,
  type CommissionConfig,
  type UpdateConfigPayload,
  type SellerPolicy,
  type EarningsTimeseriesPoint,
  type CourseEarningsBreakdown,
} from '@/lib/api/services/commission.service';

// ── Seller Hooks ─────────────────────────────────────────────────────────

export const useSellerEarnings = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['commission', 'seller', 'earnings', params],
    queryFn: () => commissionService.getSellerEarnings(params),
    staleTime: 2 * 60 * 1000,
    select: (response): SellerEarningsResponse | undefined => response.data,
  });
};

export const useSellerCommissionRate = () => {
  return useQuery({
    queryKey: ['commission', 'seller', 'rate'],
    queryFn: () => commissionService.getSellerRate(),
    staleTime: 5 * 60 * 1000,
    // Return undefined on failure so callers can show "—" instead of pretending
    // the rate is the default 30%.
    select: (response) => response.data?.commissionRate,
  });
};

export const useSellerPolicy = () => {
  return useQuery({
    queryKey: ['commission', 'seller', 'policy'],
    queryFn: () => commissionService.getSellerPolicy(),
    staleTime: 5 * 60 * 1000,
    select: (response): SellerPolicy | undefined => response.data,
  });
};

export const useSellerEarningsTimeseries = (months: number = 12) => {
  return useQuery({
    queryKey: ['commission', 'seller', 'timeseries', months],
    queryFn: () => commissionService.getSellerEarningsTimeseries(months),
    staleTime: 2 * 60 * 1000,
    select: (response): EarningsTimeseriesPoint[] => response.data ?? [],
  });
};

export const useSellerEarningsByCourse = () => {
  return useQuery({
    queryKey: ['commission', 'seller', 'by-course'],
    queryFn: () => commissionService.getSellerEarningsByCourse(),
    staleTime: 2 * 60 * 1000,
    select: (response): CourseEarningsBreakdown[] => response.data ?? [],
  });
};

// ── Admin Hooks ──────────────────────────────────────────────────────────

export const useAdminCommissionReport = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['commission', 'admin', 'report', params],
    queryFn: () => commissionService.getAdminReport(params),
    staleTime: 2 * 60 * 1000,
    select: (response): AdminCommissionReportResponse | undefined => response.data,
  });
};

export const useCommissionConfig = () => {
  return useQuery({
    queryKey: ['commission', 'config'],
    queryFn: () => commissionService.getConfig(),
    staleTime: 5 * 60 * 1000,
    select: (response): CommissionConfig | undefined => response.data,
  });
};

export const useUpdateCommissionRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rate: number) => commissionService.updateGlobalRate(rate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission'] });
    },
  });
};

export const useUpdateCommissionConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateConfigPayload) => commissionService.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission'] });
    },
  });
};

export const useReleaseEarnings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => commissionService.releaseEarnings(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission'] });
    },
  });
};
