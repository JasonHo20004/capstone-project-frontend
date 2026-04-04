import apiClient from '../config';
import type { ApiResponse } from '../types';

// ── Types ────────────────────────────────────────────────────────────────

export type EarningStatus = 'PENDING' | 'AVAILABLE' | 'RELEASED';

export interface SellerEarning {
  id: string;
  courseId: string;
  orderId: string;
  buyerId: string;
  totalAmount: number;
  gatewayFee: number;
  netAmount: number;
  commissionRate: number;
  commissionAmount: number;
  sellerAmount: number;
  status: EarningStatus;
  availableAt: string;
  releasedAt: string | null;
  createdAt: string;
}

export interface SellerEarningsSummary {
  totalRevenue: number;
  totalGatewayFee: number;
  totalNetRevenue: number;
  totalEarnings: number;
  totalCommission: number;
  totalPending: number;
}

export interface SellerEarningsResponse {
  data: SellerEarning[];
  summary: SellerEarningsSummary;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminCommissionSummary {
  totalSales: number;
  totalGatewayFee: number;
  totalNetRevenue: number;
  totalCommission: number;
  totalSellerPayouts: number;
  transactionCount: number;
}

export interface AdminCommissionReportResponse {
  data: (SellerEarning & { sellerId: string })[];
  summary: AdminCommissionSummary;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CommissionConfig {
  globalRate: number;
  gatewayFeeRate: number;
  gatewayFeeFixed: number;
  clearanceDays: number;
  configs: {
    id: string;
    sellerId: string | null;
    commissionRate: number;
    gatewayFeeRate: number;
    gatewayFeeFixed: number;
    clearanceDays: number;
    updatedAt: string;
  }[];
}

export interface UpdateConfigPayload {
  commissionRate?: number;
  gatewayFeeRate?: number;
  gatewayFeeFixed?: number;
  clearanceDays?: number;
}

// ── Service ──────────────────────────────────────────────────────────────

class CommissionService {
  // Seller endpoints
  async getSellerEarnings(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<SellerEarningsResponse>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const response = await apiClient.get<ApiResponse<SellerEarningsResponse>>(
      `/commission/seller/earnings?${queryParams.toString()}`
    );
    return response.data;
  }

  async getSellerRate(): Promise<ApiResponse<{ commissionRate: number }>> {
    const response = await apiClient.get<ApiResponse<{ commissionRate: number }>>(
      '/commission/seller/rate'
    );
    return response.data;
  }

  // Admin endpoints
  async getAdminReport(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<AdminCommissionReportResponse>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const response = await apiClient.get<ApiResponse<AdminCommissionReportResponse>>(
      `/commission/admin/report?${queryParams.toString()}`
    );
    return response.data;
  }

  async getConfig(): Promise<ApiResponse<CommissionConfig>> {
    const response = await apiClient.get<ApiResponse<CommissionConfig>>(
      '/commission/config'
    );
    return response.data;
  }

  async updateGlobalRate(rate: number): Promise<ApiResponse<unknown>> {
    const response = await apiClient.put<ApiResponse<unknown>>(
      '/commission/config',
      { rate }
    );
    return response.data;
  }

  async updateConfig(data: UpdateConfigPayload): Promise<ApiResponse<unknown>> {
    const response = await apiClient.patch<ApiResponse<unknown>>(
      '/commission/config',
      data
    );
    return response.data;
  }

  async releaseEarnings(): Promise<ApiResponse<{ released: number; totalAmount: number; sellers: number }>> {
    const response = await apiClient.post<ApiResponse<{ released: number; totalAmount: number; sellers: number }>>(
      '/commission/admin/release-earnings'
    );
    return response.data;
  }
}

export const commissionService = new CommissionService();
