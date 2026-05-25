import apiClient from '../config';
import type { ApiResponse } from '../types';

export interface SellerTopCourse {
  id: string;
  title: string;
  price: number;
  thumbnailUrl: string | null;
  ratingCount: number;
  status: string;
  learners: number;
  ratings: number;
}

export interface SellerFinancialSummary {
  totalEarnings: number;
  totalPending: number;
  allowance: number;
  pendingBalance: number;
  pendingWithdrawalCount: number;
  pendingWithdrawalTotal: number;
  thisMonthNet: number;
  prevMonthNet: number;
}

export interface SellerDashboardStats {
  coursesCount: number;
  learnersCount: number;
  commentsCount: number;
  averageRating: number;
  topCourses: SellerTopCourse[];
  financial: SellerFinancialSummary;
}

export interface SellerLearner {
  id: string;
  userId: string;
  userName: string;
  email: string;
  profilePicture: string | null;
  courseId: string;
  courseTitle: string;
  courseThumbnail: string | null;
  purchasedAt: string;
}

export interface SellerComment {
  id: string;
  content: string;
  userName: string;
  userEmail: string;
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  createdAt: string;
  /** Backend now also returns: parentCommentId, isOwn, isReply, isAnswered */
  parentCommentId?: string | null;
  isOwn?: boolean;
  isReply?: boolean;
  /** null when not a top-level student comment (own reply or seller's own comment). */
  isAnswered?: boolean | null;
}

/**
 * Monthly commission/revenue breakdown returned by GET /seller/fees.
 * grossAmount = total course price collected; platformFee = commission taken;
 * netAmount = grossAmount - platformFee (what reaches the seller).
 */
export interface SellerMonthlyFee {
  month: number;
  year: number;
  grossAmount: number;
  /** Backend now returns gateway fee separately so the FE can show full breakdown. */
  gatewayFee?: number;
  platformFee: number;
  netAmount: number;
  /** Number of sales contributing to this month. */
  salesCount?: number;
}

export interface SellerMonthlyFeeDetailRow {
  id: string;
  createdAt: string;
  courseId: string;
  courseTitle: string;
  orderId: string;
  totalAmount: number;
  gatewayFee: number;
  commissionAmount: number;
  sellerAmount: number;
  status: string;
  availableAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GetLearnersResponse {
  learners: SellerLearner[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GetCommentsResponse {
  comments: SellerComment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GetMonthlyFeesResponse {
  fees: SellerMonthlyFee[];
  year: number;
}

class SellerService {
  /**
   * Get seller dashboard statistics
   */
  async getDashboardStats(): Promise<ApiResponse<SellerDashboardStats>> {
    const response = await apiClient.get<ApiResponse<SellerDashboardStats>>('/seller/dashboard');
    return response.data;
  }

  /**
   * Get seller's learners
   */
  async getLearners(params?: {
    page?: number;
    limit?: number;
    search?: string;
    courseId?: string;
  }): Promise<ApiResponse<GetLearnersResponse>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.courseId) queryParams.append('courseId', params.courseId);

    const response = await apiClient.get<ApiResponse<GetLearnersResponse>>(
      `/seller/learners?${queryParams.toString()}`
    );
    return response.data;
  }

  /**
   * Get seller's comments
   */
  async getComments(params?: {
    page?: number;
    limit?: number;
    search?: string;
    courseId?: string;
    status?: 'all' | 'unanswered' | 'answered';
  }): Promise<ApiResponse<GetCommentsResponse>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.courseId) queryParams.append('courseId', params.courseId);
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);

    const response = await apiClient.get<ApiResponse<GetCommentsResponse>>(
      `/seller/comments?${queryParams.toString()}`
    );
    return response.data;
  }

  /**
   * Delete a comment on one of seller's own courses (moderation).
   */
  async deleteComment(commentId: string): Promise<ApiResponse<unknown>> {
    const response = await apiClient.delete<ApiResponse<unknown>>(
      `/seller/comments/${commentId}`
    );
    return response.data;
  }

  /** Aggregate counts for the comments-inbox header. */
  async getCommentsSummary(): Promise<ApiResponse<{ total: number; unanswered: number; answered: number }>> {
    const response = await apiClient.get<ApiResponse<{ total: number; unanswered: number; answered: number }>>(
      `/seller/comments/summary`
    );
    return response.data;
  }

  /**
   * Get seller's monthly commission/revenue breakdown for a given year.
   * Returns 12 entries (Jan..Dec). Defaults to current year if `year` is omitted.
   */
  async getMonthlyFees(params?: {
    year?: number;
  }): Promise<ApiResponse<GetMonthlyFeesResponse>> {
    const queryParams = new URLSearchParams();
    if (params?.year) queryParams.append('year', params.year.toString());

    const response = await apiClient.get<ApiResponse<GetMonthlyFeesResponse>>(
      `/seller/fees?${queryParams.toString()}`
    );
    return response.data;
  }

  /**
   * Per-order detail for a single (year, month) bucket of seller fees.
   * Powers the drill-down modal.
   */
  async getMonthlyFeeDetail(
    year: number,
    month: number
  ): Promise<ApiResponse<SellerMonthlyFeeDetailRow[]>> {
    const response = await apiClient.get<ApiResponse<SellerMonthlyFeeDetailRow[]>>(
      `/seller/fees/${year}/${month}/detail`
    );
    return response.data;
  }
}

export const sellerService = new SellerService();

