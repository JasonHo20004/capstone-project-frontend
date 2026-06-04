import apiClient from "@/lib/api/config";
import type { ApiResponse } from "@/lib/api/types";
import type {
  DashboardData,
  DashboardStats,
  MonthlyRevenueData,
  MonthlyUserGrowthData,
  CourseStatusData,
} from "@/lib/api/types/dashboard.types";

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
  async getRevenueData(months: number = 6): Promise<ApiResponse<MonthlyRevenueData[]>> {
    const response = await apiClient.get<ApiResponse<MonthlyRevenueData[]>>(
      `/admin/dashboard/revenue?months=${months}`
    );
    return response.data;
  }

  /**
   * Get user growth data for chart (last N months)
   */
  async getUserGrowthData(months: number = 6): Promise<ApiResponse<MonthlyUserGrowthData[]>> {
    const response = await apiClient.get<ApiResponse<MonthlyUserGrowthData[]>>(
      `/admin/dashboard/user-growth?months=${months}`
    );
    return response.data;
  }

  /**
   * Get course status distribution
   */
  async getCourseStatusData(): Promise<ApiResponse<CourseStatusData[]>> {
    const response = await apiClient.get<ApiResponse<CourseStatusData[]>>(
      "/admin/dashboard/course-status"
    );
    return response.data;
  }
}

export const dashboardService = new DashboardService();
