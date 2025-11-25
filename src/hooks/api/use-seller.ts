import { useQuery } from '@tanstack/react-query';
import {
  sellerService,
  type SellerDashboardStats,
  type GetLearnersResponse,
  type GetCommentsResponse,
  type GetMonthlyFeesResponse,
} from '@/lib/api/services';

/**
 * Hook để lấy thống kê dashboard của seller
 */
export const useSellerDashboard = () => {
  return useQuery({
    queryKey: ['seller', 'dashboard'],
    queryFn: () => sellerService.getDashboardStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    select: (response) => response.data,
  });
};

/**
 * Hook để lấy danh sách người học của seller
 */
export const useSellerLearners = (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['seller', 'learners', params],
    queryFn: () => sellerService.getLearners(params),
    staleTime: 2 * 60 * 1000,
    select: (response) => response.data,
  });
};

/**
 * Hook để lấy danh sách bình luận của seller
 */
export const useSellerComments = (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['seller', 'comments', params],
    queryFn: () => sellerService.getComments(params),
    staleTime: 2 * 60 * 1000,
    select: (response) => response.data,
  });
};

/**
 * Hook để lấy danh sách phí hằng tháng của seller
 */
export const useSellerMonthlyFees = (params?: {
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['seller', 'fees', params],
    queryFn: () => sellerService.getMonthlyFees(params),
    staleTime: 2 * 60 * 1000,
    select: (response) => response.data,
  });
};

