import apiClient from "@/lib/api/config";
import type { ApiResponse } from "@/lib/api/types";

export type RefundRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

export interface RefundRequest {
  id: string;
  orderId: string;
  requesterId: string;
  amount: number | string;
  reason: string;
  status: RefundRequestStatus;
  adminId: string | null;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
  order?: {
    id: string;
    userId: string;
    totalAmount: number | string;
    createdAt: string;
  };
}

export interface ListAdminRefundsParams {
  page?: number;
  limit?: number;
  status?: RefundRequestStatus;
}

export interface ListRefundsResponse {
  success: boolean;
  data: RefundRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class RefundService {
  // ── Admin ────────────────────────────────────────────────────────────
  async listAdmin(params?: ListAdminRefundsParams): Promise<ListRefundsResponse> {
    const response = await apiClient.get<ListRefundsResponse>("/admin/refunds", {
      params,
    });
    return response.data;
  }

  async approve(refundId: string, adminNote?: string): Promise<ApiResponse<RefundRequest>> {
    const response = await apiClient.post<ApiResponse<RefundRequest>>(
      `/admin/refunds/${refundId}/approve`,
      { adminNote },
    );
    return response.data;
  }

  async reject(refundId: string, adminNote: string): Promise<ApiResponse<RefundRequest>> {
    const response = await apiClient.post<ApiResponse<RefundRequest>>(
      `/admin/refunds/${refundId}/reject`,
      { adminNote },
    );
    return response.data;
  }

  // ── Learner ──────────────────────────────────────────────────────────
  async create(orderId: string, reason: string): Promise<ApiResponse<RefundRequest>> {
    const response = await apiClient.post<ApiResponse<RefundRequest>>(
      "/refunds/request",
      { orderId, reason },
    );
    return response.data;
  }

  async listMine(params?: { page?: number; limit?: number }): Promise<ListRefundsResponse> {
    const response = await apiClient.get<ListRefundsResponse>("/refunds/my", {
      params,
    });
    return response.data;
  }
}

export const refundService = new RefundService();
