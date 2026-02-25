import apiClient from "@/lib/api/config";
import type { ApiResponse } from "@/lib/api/types";
import type { SubscriptionPlan } from "@/domain";

export interface CreateSubscriptionPlanRequest {
  name: string;
  description?: string;
  maxCourses: number;
  monthlyFee: number;
}

export interface UpdateSubscriptionPlanRequest {
  name?: string;
  description?: string;
  maxCourses?: number;
  monthlyFee?: number;
}

class SubscriptionPlanService {
  async getPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
    const response = await apiClient.get<ApiResponse<SubscriptionPlan[]>>(
      "/admin/subscription-plans"
    );
    return response.data;
  }

  async getPlanById(id: string): Promise<ApiResponse<SubscriptionPlan>> {
    const response = await apiClient.get<ApiResponse<SubscriptionPlan>>(
      `/admin/subscription-plans/${id}`
    );
    return response.data;
  }

  async createPlan(
    data: CreateSubscriptionPlanRequest
  ): Promise<ApiResponse<SubscriptionPlan>> {
    const response = await apiClient.post<ApiResponse<SubscriptionPlan>>(
      "/admin/subscription-plans",
      data
    );
    return response.data;
  }

  async updatePlan(
    id: string,
    data: UpdateSubscriptionPlanRequest
  ): Promise<ApiResponse<SubscriptionPlan>> {
    const response = await apiClient.put<ApiResponse<SubscriptionPlan>>(
      `/admin/subscription-plans/${id}`,
      data
    );
    return response.data;
  }

  async deletePlan(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/admin/subscription-plans/${id}`
    );
    return response.data;
  }
}

export const subscriptionPlanService = new SubscriptionPlanService();
