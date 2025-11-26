import apiClient from "../../../config";
import type { ApiResponse } from "../../../types";
import type { CourseSellerApplication } from "@/types/type";

export interface UpdateApplicationStatusRequest {
  status: "APPROVED" | "REJECTED";
}

class ApplicationManagementService {
  async getApplications(): Promise<ApiResponse<CourseSellerApplication[]>> {
    const response = await apiClient.get<ApiResponse<CourseSellerApplication[]>>(
      "/admin/applications"
    );
    return response.data;
  }

  async getApplicationById(
    applicationId: string
  ): Promise<ApiResponse<CourseSellerApplication>> {
    const response = await apiClient.get<ApiResponse<CourseSellerApplication>>(
      `/admin/applications/${applicationId}`
    );
    return response.data;
  }

  async updateApplicationStatus(
    applicationId: string,
    status: "APPROVED" | "REJECTED"
  ): Promise<ApiResponse<CourseSellerApplication>> {
    const response = await apiClient.put<ApiResponse<CourseSellerApplication>>(
      `/admin/applications/${applicationId}`,
      { status }
    );
    return response.data;
  }
}

export const applicationManagementService = new ApplicationManagementService();
