import apiClient from "@/lib/api/config";
import type { ApiResponse } from "@/lib/api/types";
import type { UserPlan, UserSubscription, UserSubscriptionStatus } from "@/domain";

class UserSubscriptionService {
  async getPlans(): Promise<ApiResponse<UserPlan[]>> {
    const response = await apiClient.get<ApiResponse<UserPlan[]>>(
      "/subscriptions/plans"
    );
    return response.data;
  }

  async getMySubscription(): Promise<ApiResponse<UserSubscriptionStatus>> {
    const response = await apiClient.get<ApiResponse<UserSubscriptionStatus>>(
      "/subscriptions/my-subscription"
    );
    return response.data;
  }

  async subscribe(planId: string): Promise<ApiResponse<UserSubscription>> {
    const response = await apiClient.post<ApiResponse<UserSubscription>>(
      "/subscriptions/subscribe",
      { planId }
    );
    return response.data;
  }

  async cancelSubscription(): Promise<ApiResponse<{ message: string; refundAmount: number }>> {
    const response = await apiClient.put<ApiResponse<{ message: string; refundAmount: number }>>(
      "/subscriptions/cancel"
    );
    return response.data;
  }

  async checkFeatureAccess(feature: string): Promise<ApiResponse<{ hasAccess: boolean; feature: string }>> {
    const response = await apiClient.get<ApiResponse<{ hasAccess: boolean; feature: string }>>(
      `/subscriptions/check-access/${feature}`
    );
    return response.data;
  }

  async getHistory(): Promise<ApiResponse<UserSubscription[]>> {
    const response = await apiClient.get<ApiResponse<UserSubscription[]>>(
      "/subscriptions/history"
    );
    return response.data;
  }
}

export const userSubscriptionService = new UserSubscriptionService();
