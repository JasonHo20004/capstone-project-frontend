import type { ApiResponse } from "../types";

/**
 * Dashboard API Types - request/response contracts for admin dashboard endpoints
 */

export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  activeCourses: number;
  pendingCourses: number;
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
  orders: number;
}

export interface MonthlyUserGrowthData {
  name: string;
  value: number;
}

export interface CourseStatusData {
  name: string;
  value: number;
}

export interface TopCourseData {
  id: string;
  title: string;
  price: number;
  ratingCount: number;
  thumbnailUrl: string;
  lessonCount: number;
  sellerName: string;
}

export interface UserBreakdown {
  students: number;
  sellers: number;
  admins: number;
}

export interface DashboardData {
  stats: DashboardStats;
  revenueData: MonthlyRevenueData[];
  userGrowthData: MonthlyUserGrowthData[];
  courseStatusData: CourseStatusData[];
  topCourses: TopCourseData[];
  userBreakdown: UserBreakdown;
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
