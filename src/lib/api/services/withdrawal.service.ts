import apiClient from '../config';
import type { ApiResponse } from '../types';

export type WithdrawalRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface WithdrawalRequest {
  id: string;
  sellerId: string;
  amount: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  /** NAPAS bank BIN (6 digits) — used to render the admin VietQR. */
  bankBin?: string | null;
  status: WithdrawalRequestStatus;
  proofImageUrl: string | null;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
  cancelledAt?: string | null;
  retriedFromId?: string | null;
}

export interface WithdrawalListResponse {
  data: WithdrawalRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WithdrawalRequestPayload {
  amount: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  /** NAPAS bank BIN (6 digits) of the selected bank. */
  bankBin?: string;
}

export interface WithdrawalSummary {
  totalPendingAmount: number;
  totalApprovedAmount: number;
  totalRejectedAmount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalCount: number;
}

// ── Service ──────────────────────────────────────────────────────────────

class WithdrawalService {
  // ── [SELLER] Endpoints ──────────────────────────────────────────────────

  async requestWithdrawal(data: WithdrawalRequestPayload): Promise<ApiResponse<WithdrawalRequest>> {
    const response = await apiClient.post<ApiResponse<WithdrawalRequest>>(
      '/withdrawals/seller/request',
      data
    );
    return response.data;
  }

  async getSellerHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<WithdrawalListResponse>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get<ApiResponse<WithdrawalListResponse>>(
      `/withdrawals/seller/history?${queryParams.toString()}`
    );
    return response.data;
  }

  /** Cancel a PENDING withdrawal request (seller-initiated). */
  async cancelWithdrawal(id: string): Promise<ApiResponse<WithdrawalRequest>> {
    const response = await apiClient.post<ApiResponse<WithdrawalRequest>>(
      `/withdrawals/seller/requests/${id}/cancel`
    );
    return response.data;
  }

  /** Resubmit a previously REJECTED withdrawal (optionally with new bank/amount). */
  async retryWithdrawal(
    id: string,
    overrides?: Partial<WithdrawalRequestPayload>
  ): Promise<ApiResponse<WithdrawalRequest>> {
    const response = await apiClient.post<ApiResponse<WithdrawalRequest>>(
      `/withdrawals/seller/requests/${id}/retry`,
      overrides ?? {}
    );
    return response.data;
  }

  // ── [ADMIN] Endpoints ───────────────────────────────────────────────────

  async getAdminRequests(params?: {
    page?: number;
    limit?: number;
    status?: WithdrawalRequestStatus;
  }): Promise<ApiResponse<WithdrawalListResponse>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const response = await apiClient.get<ApiResponse<WithdrawalListResponse>>(
      `/withdrawals/admin/requests?${queryParams.toString()}`
    );
    return response.data;
  }

  async approveWithdrawal(data: { id: string; proofImageUrl?: string; adminNote?: string }): Promise<ApiResponse<WithdrawalRequest>> {
    const { id, ...payload } = data;
    const response = await apiClient.post<ApiResponse<WithdrawalRequest>>(
      `/withdrawals/admin/requests/${id}/approve`,
      payload
    );
    return response.data;
  }

  async rejectWithdrawal(data: { id: string; adminNote: string }): Promise<ApiResponse<WithdrawalRequest>> {
    const { id, ...payload } = data;
    const response = await apiClient.post<ApiResponse<WithdrawalRequest>>(
      `/withdrawals/admin/requests/${id}/reject`,
      payload
    );
    return response.data;
  }

  async getAdminSummary(): Promise<ApiResponse<WithdrawalSummary>> {
    const response = await apiClient.get<ApiResponse<WithdrawalSummary>>(
      '/withdrawals/admin/summary'
    );
    return response.data;
  }

  /**
   * Upload a single proof-of-transfer image (admin only).
   * Returns the public S3 URL to pass to `approveWithdrawal`.
   */
  async uploadProofImage(file: File): Promise<ApiResponse<{ url: string }>> {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      '/withdrawals/admin/upload-proof',
      form
    );
    return response.data;
  }
}

export const withdrawalService = new WithdrawalService();
