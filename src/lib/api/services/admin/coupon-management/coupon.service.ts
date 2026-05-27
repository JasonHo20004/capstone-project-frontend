import apiClient from "@/lib/api/config";
import type { ApiResponse } from "@/lib/api/types";

export type CouponType = "PERCENT" | "FIXED";
export type CouponStatusFilter = "active" | "inactive" | "expired" | "all";

export interface AdminCoupon {
  id: string;
  code: string;
  description: string | null;
  discountType: CouponType;
  discountValue: number | string;
  maxDiscount: number | string | null;
  minOrderAmount: number | string;
  maxRedemptions: number | null;
  maxPerUser: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponPayload {
  code: string;
  description?: string;
  discountType: CouponType;
  discountValue: number;
  maxDiscount?: number | null;
  minOrderAmount?: number;
  maxRedemptions?: number | null;
  maxPerUser?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
}

export type UpdateCouponPayload = Partial<CreateCouponPayload>;

export interface ListCouponsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CouponStatusFilter;
}

export interface ListCouponsResponse {
  success: boolean;
  data: AdminCoupon[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class AdminCouponService {
  async list(params?: ListCouponsParams): Promise<ListCouponsResponse> {
    const response = await apiClient.get<ListCouponsResponse>("/admin/coupons", {
      params,
    });
    return response.data;
  }

  async getOne(id: string): Promise<ApiResponse<AdminCoupon>> {
    const response = await apiClient.get<ApiResponse<AdminCoupon>>(`/admin/coupons/${id}`);
    return response.data;
  }

  async create(payload: CreateCouponPayload): Promise<ApiResponse<AdminCoupon>> {
    const response = await apiClient.post<ApiResponse<AdminCoupon>>("/admin/coupons", payload);
    return response.data;
  }

  async update(id: string, payload: UpdateCouponPayload): Promise<ApiResponse<AdminCoupon>> {
    const response = await apiClient.patch<ApiResponse<AdminCoupon>>(
      `/admin/coupons/${id}`,
      payload
    );
    return response.data;
  }

  async deactivate(id: string): Promise<ApiResponse<AdminCoupon>> {
    const response = await apiClient.post<ApiResponse<AdminCoupon>>(
      `/admin/coupons/${id}/deactivate`
    );
    return response.data;
  }
}

export const adminCouponService = new AdminCouponService();

export interface ValidateCouponResult {
  id: string;
  code: string;
  discountType: CouponType;
  discountValue: number;
  discount: number;
  subtotal: number;
  total: number;
}

class CouponService {
  async validate(code: string): Promise<ApiResponse<ValidateCouponResult>> {
    const response = await apiClient.post<ApiResponse<ValidateCouponResult>>(
      "/coupons/validate",
      { code }
    );
    return response.data;
  }
}

export const couponService = new CouponService();
