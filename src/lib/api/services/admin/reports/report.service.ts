import apiClient from "@/lib/api/config";
import type { ApiResponse } from "@/lib/api/types";
import type { Report } from "@/domain";

export interface ReportWithRelations extends Report {
  user?: { id: string; fullName: string; email: string };
  course?: { id: string; title: string; price?: number };
  status?: 'PENDING' | 'RESOLVED' | 'REJECTED';
}

export interface ResolveReportRequest {
  responseText?: string;
}

class ReportManagementService {
  async getReports(): Promise<ApiResponse<ReportWithRelations[]>> {
    const response = await apiClient.get<ApiResponse<ReportWithRelations[]>>(
      "/admin/reports"
    );
    return response.data;
  }

  async getReportById(id: string): Promise<ApiResponse<ReportWithRelations>> {
    const response = await apiClient.get<ApiResponse<ReportWithRelations>>(
      `/admin/reports/${id}`
    );
    return response.data;
  }

  async resolveReport(
    id: string,
    data?: ResolveReportRequest
  ): Promise<ApiResponse<ReportWithRelations>> {
    const response = await apiClient.put<ApiResponse<ReportWithRelations>>(
      `/admin/reports/${id}/resolve`,
      data ?? {}
    );
    return response.data;
  }

  async rejectReport(
    id: string,
    data?: ResolveReportRequest
  ): Promise<ApiResponse<ReportWithRelations>> {
    const response = await apiClient.put<ApiResponse<ReportWithRelations>>(
      `/admin/reports/${id}/reject`,
      data ?? {}
    );
    return response.data;
  }
}

export const reportManagementService = new ReportManagementService();
