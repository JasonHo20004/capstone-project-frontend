import apiClient from "@/lib/api/config";
import type { ApiResponse } from "@/lib/api/types";
import type { UserPlan } from "@/domain";

export interface UpdateUserPlanRequest {
  name?: string;
  description?: string;
  price?: number;
  features?: string[];
  isActive?: boolean;
}

export interface CreateUserPlanRequest {
  name: string;
  type: "FREE" | "PRO";
  price: number;
  description?: string;
  features: string[];
}

class AdminUserPlanService {
  async getPlans(): Promise<ApiResponse<UserPlan[]>> {
    const response = await apiClient.get<ApiResponse<UserPlan[]>>(
      "/subscriptions/admin/plans"
    );
    return response.data;
  }

  async createPlan(data: CreateUserPlanRequest): Promise<ApiResponse<UserPlan>> {
    const response = await apiClient.post<ApiResponse<UserPlan>>(
      "/subscriptions/admin/plans",
      data
    );
    return response.data;
  }

  async updatePlan(id: string, data: UpdateUserPlanRequest): Promise<ApiResponse<UserPlan>> {
    const response = await apiClient.put<ApiResponse<UserPlan>>(
      `/subscriptions/admin/plans/${id}`,
      data
    );
    return response.data;
  }

  async deletePlan(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/subscriptions/admin/plans/${id}`
    );
    return response.data;
  }

  async seedPlans(): Promise<ApiResponse<UserPlan[]>> {
    const response = await apiClient.post<ApiResponse<UserPlan[]>>(
      "/subscriptions/admin/plans/seed"
    );
    return response.data;
  }
}

export const adminUserPlanService = new AdminUserPlanService();
