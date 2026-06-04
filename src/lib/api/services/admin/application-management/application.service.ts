import apiClient from "@/lib/api/config";
import type { ApiResponse } from "@/lib/api/types";
import type { CourseSellerApplication } from "@/domain";

export interface UpdateApplicationStatusRequest {
  status: "APPROVED" | "REJECTED";
  rejectionReason?: string;
  message?: string;
}

class ApplicationManagementService {
  async getApplications(params?: {
    page?: number;
    limit?: number;
    status?: "PENDING" | "APPROVED" | "REJECTED";
  }): Promise<ApiResponse<CourseSellerApplication[]>> {
    const response = await apiClient.get<ApiResponse<CourseSellerApplication[]>>(
      "/admin/seller-applications",
      { params }
    );
    return response.data;
  }

  async updateApplicationStatus(
    applicationId: string,
    body: UpdateApplicationStatusRequest
  ): Promise<ApiResponse<CourseSellerApplication>> {
    const response = await apiClient.patch<ApiResponse<CourseSellerApplication>>(
      `/admin/seller-applications/${applicationId}`,
      body
    );
    return response.data;
  }
}

export const applicationManagementService = new ApplicationManagementService();
