import apiClient from "@/lib/api/config";
import type { ApiResponse } from "@/lib/api/types";
import type { SubscriptionContract, SubscriptionPlan, User } from "@/domain";

export interface SubscriptionContractWithRelations extends SubscriptionContract {
  user: Pick<User, "id" | "fullName" | "email">;
  subscriptionPlan: SubscriptionPlan;
}

export interface CreateSubscriptionContractRequest {
  courseSellerId: string;
  subscriptionPlanId: string;
  notes?: string;
}

export interface UpdateSubscriptionContractRequest {
  status?: boolean;
  notes?: string;
}

export interface RenewSubscriptionContractRequest {
  subscriptionPlanId: string;
  notes?: string;
}

class SubscriptionContractService {
  async getContracts(): Promise<
    ApiResponse<SubscriptionContractWithRelations[]>
  > {
    const response = await apiClient.get<
      ApiResponse<SubscriptionContractWithRelations[]>
    >("/admin/subscription-contracts");
    return response.data;
  }

  async getContractById(
    id: string
  ): Promise<ApiResponse<SubscriptionContractWithRelations>> {
    const response = await apiClient.get<
      ApiResponse<SubscriptionContractWithRelations>
    >(`/admin/subscription-contracts/${id}`);
    return response.data;
  }

  async createContract(
    data: CreateSubscriptionContractRequest
  ): Promise<ApiResponse<SubscriptionContractWithRelations>> {
    const response = await apiClient.post<
      ApiResponse<SubscriptionContractWithRelations>
    >("/admin/subscription-contracts", data);
    return response.data;
  }

  async updateContract(
    id: string,
    data: UpdateSubscriptionContractRequest
  ): Promise<ApiResponse<SubscriptionContractWithRelations>> {
    const response = await apiClient.put<
      ApiResponse<SubscriptionContractWithRelations>
    >(`/admin/subscription-contracts/${id}`, data);
    return response.data;
  }

  async renewContract(
    id: string,
    data: RenewSubscriptionContractRequest
  ): Promise<ApiResponse<SubscriptionContractWithRelations>> {
    const response = await apiClient.post<
      ApiResponse<SubscriptionContractWithRelations>
    >(`/admin/subscription-contracts/${id}/renew`, data);
    return response.data;
  }
}

export const subscriptionContractService = new SubscriptionContractService();
