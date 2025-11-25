import apiClient from "../../../config";
import type { ApiResponse } from "../../../types";
import type {
  DashboardData,
  DashboardStats,
} from "../../../types/dashboard.types";

class DashboardService {
  /**
   * Get overall dashboard statistics
   */
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const response = await apiClient.get<ApiResponse<DashboardStats>>(
      "/admin/dashboard/stats"
    );
    return response.data;
  }

  /**
   * Get complete dashboard data (stats + charts data)
   */
  async getDashboardData(): Promise<ApiResponse<DashboardData>> {
    const response = await apiClient.get<ApiResponse<DashboardData>>(
      "/admin/dashboard"
    );
    return response.data;
  }

  /**
   * Get revenue data for chart (last N months)
   */
  async getRevenueData(months: number = 6): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/admin/dashboard/revenue?months=${months}`
    );
    return response.data;
  }

  /**
   * Get user growth data for chart (last N months)
   */
  async getUserGrowthData(months: number = 6): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/admin/dashboard/user-growth?months=${months}`
    );
    return response.data;
  }

  /**
   * Get course status distribution
   */
  async getCourseStatusData(): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>(
      "/admin/dashboard/course-status"
    );
    return response.data;
  }
}

export const dashboardService = new DashboardService();
