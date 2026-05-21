import apiClient from '../config';
import type { ApiResponse } from '../types';

export interface SellerDashboardStats {
  coursesCount: number;
  learnersCount: number;
  commentsCount: number;
  averageRating: number;
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
  platformFee: number;
  netAmount: number;
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
  }): Promise<ApiResponse<GetLearnersResponse>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

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
  }): Promise<ApiResponse<GetCommentsResponse>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const response = await apiClient.get<ApiResponse<GetCommentsResponse>>(
      `/seller/comments?${queryParams.toString()}`
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
}

export const sellerService = new SellerService();

