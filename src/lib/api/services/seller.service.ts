import apiClient from '../config';
import type { ApiResponse } from '../types';

export interface SellerDashboardStats {
  coursesCount: number;
  learnersCount: number;
  commentsCount: number;
  subscription: {
    planName: string;
    monthlyFee: number;
    status: boolean;
    expiresAt: string | null;
  };
}

export interface SellerLearner {
  id: string;
  userId: string;
  userName: string;
  email: string;
  courseId: string;
  courseTitle: string;
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

export interface SellerMonthlyFee {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  description?: string;
  planName: string;
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
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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
   * Get seller's monthly fees
   */
  async getMonthlyFees(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<GetMonthlyFeesResponse>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get<ApiResponse<GetMonthlyFeesResponse>>(
      `/seller/fees?${queryParams.toString()}`
    );
    return response.data;
  }
}

export const sellerService = new SellerService();

