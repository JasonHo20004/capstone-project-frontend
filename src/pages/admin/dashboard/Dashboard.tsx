import { Users, BookOpen, DollarSign, UserCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { dashboardService } from "@/lib/api/services/admin";
import StatCard from "@/components/admin/StatCard";
import ChartCard from "@/components/admin/ChartCard";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

// Mapping course status to Vietnamese
const getCourseStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    PUBLISHED: "Đã xuất bản",
    ACTIVE: "Hoạt động",
    PENDING: "Chờ duyệt",
    REFUSE: "Từ chối",
    INACTIVE: "Không hoạt động",
    DELETE: "Đã xóa",
    DRAFT: "Nháp",
  };
  return statusMap[status.toUpperCase()] || status;
};

export default function AdminDashboard() {
  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: () => dashboardService.getDashboardData(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const stats = dashboardData?.data?.stats;
  const revenueData = dashboardData?.data?.revenueData || [];
  const userGrowthData = dashboardData?.data?.userGrowthData || [];

  // Transform course status data to Vietnamese
  const courseStatusData = (dashboardData?.data?.courseStatusData || []).map(
    (item) => ({
      ...item,
      name: getCourseStatusLabel(item.name),
    })
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">
          Đang tải dữ liệu dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Tổng quan về hệ thống SkillBoost
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng người dùng"
          value={stats?.totalUsers || 0}
          icon={Users}
          trend={
            stats?.monthlyGrowth?.users
              ? {
                  value: stats.monthlyGrowth.users,
                  label: "so với tháng trước",
                }
              : undefined
          }
        />

        <StatCard
          title="Tổng khóa học"
          value={stats?.totalCourses || 0}
          icon={BookOpen}
          trend={
            stats?.monthlyGrowth?.courses
              ? {
                  value: stats.monthlyGrowth.courses,
                  label: "so với tháng trước",
                }
              : undefined
          }
        />

        <StatCard
          title="Doanh thu"
          value={
            stats?.totalRevenue ? formatCurrency(stats.totalRevenue) : "N/A"
          }
          icon={DollarSign}
          trend={
            stats?.monthlyGrowth?.revenue
              ? {
                  value: stats.monthlyGrowth.revenue,
                  label: "so với tháng trước",
                }
              : undefined
          }
        />

        <StatCard
          title="Đơn chờ duyệt"
          value={stats?.pendingApplications || 0}
          icon={UserCheck}
          description="Cần xem xét"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <ChartCard
          title="Doanh thu theo tháng"
          description="Biểu đồ doanh thu 6 tháng gần nhất"
          className="col-span-4"
        >
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(value: number) => [
                    formatCurrency(value),
                    "Doanh thu",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              Chưa có dữ liệu doanh thu
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Trạng thái khóa học"
          description="Phân bố trạng thái các khóa học"
          className="col-span-3"
        >
          {courseStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={courseStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {courseStatusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              Chưa có dữ liệu khóa học
            </div>
          )}
        </ChartCard>
      </div>

      <ChartCard
        title="Tăng trưởng người dùng"
        description="Số lượng người dùng mới theo tháng"
      >
        {userGrowthData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Chưa có dữ liệu tăng trưởng
          </div>
        )}
      </ChartCard>
    </div>
  );
}
