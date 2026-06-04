import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
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
  courseId?: string;
  sortBy?: 'date' | 'course';
  sortOrder?: 'asc' | 'desc';
}) => {
  return useQuery({
    queryKey: ['seller', 'learners', params],
    queryFn: () => sellerService.getLearners(params),
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
    select: (response) => response.data,
  });
};

/**
 * Hook để lấy danh sách bình luận của seller — hỗ trợ lọc theo course
 * và trạng thái trả lời (unanswered / answered / all).
 */
export const useSellerComments = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  courseId?: string;
  status?: 'all' | 'unanswered' | 'answered';
}) => {
  return useQuery({
    queryKey: ['seller', 'comments', params],
    queryFn: () => sellerService.getComments(params),
    staleTime: 2 * 60 * 1000,
    // Keep showing the previous result while a new search/filter is loading.
    // Without this, every keystroke flips isLoading=true → the page renders
    // a full-screen spinner → input loses focus and "feels like reload".
    placeholderData: keepPreviousData,
    select: (response) => response.data,
  });
};

export const useDeleteSellerComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => sellerService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'comments'] });
    },
  });
};

/** Comments-inbox summary used by the page header. */
export const useSellerCommentsSummary = () => {
  return useQuery({
    queryKey: ['seller', 'comments', 'summary'],
    queryFn: () => sellerService.getCommentsSummary(),
    staleTime: 60 * 1000,
    select: (response) => response.data,
  });
};

/**
 * Hook để lấy thống kê doanh thu theo tháng của seller (commission-based).
 */
export const useSellerMonthlyFees = (params?: {
  year?: number;
}) => {
  return useQuery({
    queryKey: ['seller', 'fees', params],
    queryFn: () => sellerService.getMonthlyFees(params),
    staleTime: 2 * 60 * 1000,
    select: (response) => response.data,
  });
};

/**
 * Drill-down detail for one (year, month). Only fires when enabled=true,
 * keeping the modal cheap to mount before the user picks a month.
 */
export const useSellerMonthlyFeeDetail = (
  year: number | undefined,
  month: number | undefined,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ['seller', 'fees', 'detail', year, month],
    queryFn: () => sellerService.getMonthlyFeeDetail(year!, month!),
    enabled: enabled && !!year && !!month,
    staleTime: 60 * 1000,
    select: (response) => response.data ?? [],
  });
};

