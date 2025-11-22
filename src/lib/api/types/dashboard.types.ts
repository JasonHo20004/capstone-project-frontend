export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  pendingApplications: number;
  monthlyGrowth: {
    users: number; // Percentage growth
    courses: number; // Percentage growth
    revenue: number; // Percentage growth
  };
}

export interface MonthlyRevenueData {
  month: string; // e.g., "T1", "T2", ...
  revenue: number;
}

export interface MonthlyUserGrowthData {
  name: string; // e.g., "T1", "T2", ...
  value: number; // Number of new users
}

export interface CourseStatusData {
  name: string; // e.g., "Hoạt động", "Chờ duyệt", ...
  value: number; // Count
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
