import {
  Users,
  BookOpen,
  DollarSign,
  UserCheck,
  TrendingUp,
  GraduationCap,
  ShieldCheck,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  Legend,
} from "recharts";
import { dashboardService } from "@/lib/api/services/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/user-avatar";

const CHART_COLORS = {
  primary: "#6366f1",
  secondary: "#06b6d4",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  muted: "#94a3b8",
};

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#94a3b8", "#6366f1"];

const getCourseStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    ACTIVE: "Hoạt động",
    PENDING: "Chờ duyệt",
    REFUSE: "Từ chối",
    INACTIVE: "Không hoạt động",
    DRAFT: "Nháp",
  };
  return statusMap[status.toUpperCase()] || status;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

const formatCompactCurrency = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
};

interface TrendBadgeProps {
  value: number;
  label?: string;
}

function TrendBadge({ value, label = "so với tháng trước" }: TrendBadgeProps) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" /> Không thay đổi
      </span>
    );
  }
  const isPositive = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        isPositive ? "text-emerald-600" : "text-red-600"
      }`}
    >
      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {isPositive ? "+" : ""}
      {value}% {label}
    </span>
  );
}

export default function AdminDashboard() {
  const {
    data: dashboardData,
    isLoading,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: () => dashboardService.getDashboardData(),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 15_000,
  });

  const stats = dashboardData?.data?.stats;
  const revenueData = dashboardData?.data?.revenueData ?? [];
  const userGrowthData = dashboardData?.data?.userGrowthData ?? [];
  const topCourses = dashboardData?.data?.topCourses ?? [];
  const userBreakdown = dashboardData?.data?.userBreakdown ?? { students: 0, sellers: 0, admins: 0 };

  const rawCourseStatusData = dashboardData?.data?.courseStatusData || [];
  const draftCourses =
    rawCourseStatusData.find((s) => s.name.toUpperCase() === "DRAFT")?.value ?? 0;
  const courseStatusData = rawCourseStatusData.map((item) => ({
    ...item,
    name: getCourseStatusLabel(item.name),
  }));

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-3 w-20" />
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-7">
          <Card className="lg:col-span-4 p-6 space-y-3">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-[280px] w-full" />
          </Card>
          <Card className="lg:col-span-3 p-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-[220px] w-full rounded-full" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Tổng quan hoạt động hệ thống Alicia —{" "}
            {new Date().toLocaleDateString("vi-VN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {dataUpdatedAt > 0 && (
            <span className="text-xs text-muted-foreground">
              Cập nhật lúc {new Date(dataUpdatedAt).toLocaleTimeString("vi-VN")}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Đang tải..." : "Làm mới"}
          </Button>
        </div>
      </div>

      {/* ─── Stat Cards ─────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Link to="/admin/users" aria-label="Xem danh sách người dùng" className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
        <Card className="relative h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng người dùng</CardTitle>
            <div className="rounded-lg bg-indigo-500/10 p-2">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <div className="text-3xl font-bold font-display">
              {(stats?.totalUsers || 0).toLocaleString()}
            </div>
            <div className="min-h-[20px] mt-1">
              {stats?.monthlyGrowth?.users !== undefined && (
                <TrendBadge value={stats.monthlyGrowth.users} />
              )}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-auto pt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3 w-3" /> {userBreakdown.students || 0} Học viên
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> {userBreakdown.sellers || 0} Giảng viên
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> {userBreakdown.admins || 0} Quản trị
              </span>
            </div>
          </CardContent>
        </Card>
        </Link>

        {/* Total Courses */}
        <Link to="/admin/courses" aria-label="Xem danh sách khóa học" className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
        <Card className="relative h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng khóa học</CardTitle>
            <div className="rounded-lg bg-cyan-500/10 p-2">
              <BookOpen className="h-5 w-5 text-cyan-600" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <div className="text-3xl font-bold font-display">
              {(stats?.totalCourses || 0).toLocaleString()}
            </div>
            <div className="min-h-[20px] mt-1">
              {stats?.monthlyGrowth?.courses !== undefined && (
                <TrendBadge value={stats.monthlyGrowth.courses} />
              )}
            </div>
            <div className="flex gap-3 mt-auto pt-3 text-xs text-muted-foreground">
              <span className="text-emerald-600 font-medium">{stats?.activeCourses ?? 0} Hoạt động</span>
              <span className="text-amber-600 font-medium">{draftCourses} Nháp</span>
            </div>
          </CardContent>
        </Card>
        </Link>

        {/* Revenue */}
        <Link to="/admin/transactions" aria-label="Xem chi tiết giao dịch" className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
        <Card className="relative h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Doanh thu</CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <div className="text-3xl font-bold font-display">
              {stats?.totalRevenue ? formatCompactCurrency(stats.totalRevenue) : "0"}
              <span className="text-lg text-muted-foreground ml-1">₫</span>
            </div>
            <div className="min-h-[20px] mt-1">
              {stats?.monthlyGrowth?.revenue !== undefined && (
                <TrendBadge value={stats.monthlyGrowth.revenue} />
              )}
            </div>
            <div className="flex gap-3 mt-auto pt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Tổng từ trước đến nay
              </span>
            </div>
          </CardContent>
        </Card>
        </Link>

        {/* Pending Applications */}
        <Link to="/admin/applications?status=PENDING" aria-label="Xem đơn chờ duyệt" className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
        <Card className="relative h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đơn chờ duyệt</CardTitle>
            <div className="rounded-lg bg-amber-500/10 p-2">
              <UserCheck className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <div className="text-3xl font-bold font-display">
              {stats?.pendingApplications || 0}
            </div>
            <div className="min-h-[20px] mt-1">
              {(stats?.pendingApplications || 0) > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                  <ShieldCheck className="h-3 w-3" /> Cần xem xét
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Minus className="h-3 w-3" /> Không có đơn chờ
                </span>
              )}
            </div>
            <div className="flex gap-3 mt-auto pt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <UserCheck className="h-3 w-3" /> Yêu cầu giảng viên
              </span>
            </div>
          </CardContent>
        </Card>
        </Link>
      </div>

      {/* ─── Charts Row 1: Revenue + Course Status ──────────────────── */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Doanh thu theo tháng
            </CardTitle>
            <CardDescription>Biểu đồ doanh thu & số đơn 6 tháng gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.success} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={CHART_COLORS.success} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(v) => formatCompactCurrency(v)}
                    tick={{ fontSize: 12 }}
                    width={60}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === "revenue" ? formatCurrency(value) : value,
                      name === "revenue" ? "Doanh thu" : "Đơn hàng",
                    ]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Doanh thu"
                    stroke={CHART_COLORS.success}
                    fill="url(#revGradient)"
                    strokeWidth={2.5}
                  />
                  <Bar
                    dataKey="orders"
                    name="Đơn hàng"
                    fill={CHART_COLORS.primary}
                    opacity={0.6}
                    radius={[4, 4, 0, 0]}
                    barSize={16}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[320px] text-muted-foreground">
                Chưa có dữ liệu doanh thu
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Status Pie */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Phân bố Khóa học</CardTitle>
            <CardDescription>Trạng thái các khóa học trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            {courseStatusData.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={courseStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {courseStatusData.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {courseStatusData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                Chưa có dữ liệu khóa học
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Charts Row 2: User Growth + Top Courses ──────────────── */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* User Growth */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              Tăng trưởng Người dùng
            </CardTitle>
            <CardDescription>Số lượng người dùng mới đăng ký theo tháng</CardDescription>
          </CardHeader>
          <CardContent>
            {userGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userGrowthData}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number) => [value, "Người dùng mới"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    name="Người dùng mới"
                    fill="url(#barGradient)"
                    radius={[6, 6, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Chưa có dữ liệu tăng trưởng
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Courses */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Top Khóa học
            </CardTitle>
            <CardDescription>Khóa học được đánh giá nhiều nhất</CardDescription>
          </CardHeader>
          <CardContent>
            {topCourses.length > 0 ? (
              <div className="space-y-4">
                {topCourses.map((course, index) => (
                  <div
                    key={course.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0 relative">
                      <UserAvatar src={course.thumbnailUrl} name={`#${index + 1}`} className="h-10 w-10 rounded-lg" />
                      <Badge className="absolute -top-1 -left-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-primary">
                        {index + 1}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{course.title}</p>
                      <p className="text-xs text-muted-foreground">{course.sellerName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-emerald-600">
                        {formatCurrency(course.price)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {course.ratingCount} đánh giá
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                Chưa có dữ liệu khóa học
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
