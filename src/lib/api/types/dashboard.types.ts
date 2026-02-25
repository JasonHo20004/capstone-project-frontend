import type { ApiResponse } from "../types";

/**
 * Dashboard API Types - request/response contracts for admin dashboard endpoints
 */

export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  pendingApplications: number;
  monthlyGrowth: {
    users: number;
    courses: number;
    revenue: number;
  };
}

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
}

export interface MonthlyUserGrowthData {
  name: string;
  value: number;
}

export interface CourseStatusData {
  name: string;
  value: number;
}

export interface DashboardData {
  stats: DashboardStats;
  revenueData: MonthlyRevenueData[];
  userGrowthData: MonthlyUserGrowthData[];
  courseStatusData: CourseStatusData[];
}

export interface RecentActivity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

// Response aliases for better readability

export type GetDashboardStatsResponse = ApiResponse<DashboardStats>;

export type GetDashboardDataResponse = ApiResponse<DashboardData>;

export type GetRevenueDataResponse = ApiResponse<MonthlyRevenueData[]>;

export type GetUserGrowthDataResponse = ApiResponse<MonthlyUserGrowthData[]>;

export type GetCourseStatusDataResponse = ApiResponse<CourseStatusData[]>;
