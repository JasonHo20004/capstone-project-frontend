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
  isActive?: boolean;
}

export interface PlanFeatureDefinition {
  id: string;
  key: string;
  label: string;
  isPremium: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreatePlanFeatureRequest {
  key: string;
  label: string;
  isPremium?: boolean;
  displayOrder?: number;
}

export interface UpdatePlanFeatureRequest {
  label?: string;
  isPremium?: boolean;
  displayOrder?: number;
}

export interface PlanStatsRow {
  planId: string;
  name: string;
  type: "FREE" | "PRO";
  price: number;
  activeCount: number;
  last30dCount: number;
  mrr: number;
}

export interface PlanStats {
  perPlan: PlanStatsRow[];
  totals: {
    activeCount: number;
    mrr: number;
    last30dCount: number;
  };
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

  // ── Plan stats (admin dashboard) ────────────────────────────────────
  async getStats(): Promise<ApiResponse<PlanStats>> {
    const response = await apiClient.get<ApiResponse<PlanStats>>(
      "/subscriptions/admin/plans/stats"
    );
    return response.data;
  }

  // ── Feature definitions (master list, drives plan edit UI) ─────────
  async listFeatures(): Promise<ApiResponse<PlanFeatureDefinition[]>> {
    // Public GET — anyone can read the feature catalog (the marketing
    // /pricing page also benefits from this).
    const response = await apiClient.get<ApiResponse<PlanFeatureDefinition[]>>(
      "/subscriptions/features"
    );
    return response.data;
  }

  async createFeature(
    data: CreatePlanFeatureRequest
  ): Promise<ApiResponse<PlanFeatureDefinition>> {
    const response = await apiClient.post<ApiResponse<PlanFeatureDefinition>>(
      "/subscriptions/admin/features",
      data
    );
    return response.data;
  }

  async updateFeature(
    id: string,
    data: UpdatePlanFeatureRequest
  ): Promise<ApiResponse<PlanFeatureDefinition>> {
    const response = await apiClient.put<ApiResponse<PlanFeatureDefinition>>(
      `/subscriptions/admin/features/${id}`,
      data
    );
    return response.data;
  }

  async deleteFeature(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/subscriptions/admin/features/${id}`
    );
    return response.data;
  }
}

export const adminUserPlanService = new AdminUserPlanService();
