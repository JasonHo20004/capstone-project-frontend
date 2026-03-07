import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/utils';
import { useSellerDashboard, useSellerMonthlyFees, useSellerLearners } from '@/hooks/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import ChartCard from '@/components/admin/ChartCard';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BookOpen,
  Users,
  MessageSquare,
  CreditCard,
  Plus,
  ArrowRight,
  Sparkles,
  TrendingUp,
  DollarSign,
  Activity,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const statCards = [
  {
    key: 'courses',
    label: 'Khoá học',
    description: 'Tổng số khoá học của bạn',
    icon: BookOpen,
    href: '/seller/courses',
    color: 'bg-primary/10 text-primary border-primary/20',
    iconBg: 'bg-primary/15',
  },
  {
    key: 'learners',
    label: 'Người học',
    description: 'Số học viên đã mua khoá học',
    icon: Users,
    href: '/seller/learners',
    color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    iconBg: 'bg-emerald-500/15',
  },
  {
    key: 'comments',
    label: 'Bình luận',
    description: 'Bình luận trên bài học',
    icon: MessageSquare,
    href: '/seller/comments',
    color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    iconBg: 'bg-amber-500/15',
  },
] as const;

function aggregateFeesByMonth(fees: { amount: number; createdAt: string; status: string }[]) {
  const map = new Map<string, number>();
  fees
    .filter((f) => f.status === 'SUCCESS')
    .forEach((f) => {
      const d = new Date(f.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, (map.get(key) ?? 0) + f.amount);
    });
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([name, amount]) => ({ name, amount }));
}

function aggregateLearnersByMonth(learners: { purchasedAt: string }[]) {
  const map = new Map<string, number>();
  learners.forEach((l) => {
    const d = new Date(l.purchasedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([name, count]) => ({ name, count }));
}

export default function SellerDashboard() {
  const { data: dashboardStats, isLoading, error } = useSellerDashboard();
  const { data: feesData } = useSellerMonthlyFees({ limit: 200 });
  const { data: learnersData } = useSellerLearners({ limit: 500 });

  const revenueChartData = useMemo(
    () => aggregateFeesByMonth(feesData?.fees ?? []),
    [feesData?.fees]
  );
  const learnerActivityData = useMemo(
    () => aggregateLearnersByMonth(learnersData?.learners ?? []),
    [learnersData?.learners]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Không thể tải dữ liệu dashboard. Vui lòng thử lại sau." />;
  }

  if (!dashboardStats) {
    return <ErrorMessage message="Không có dữ liệu dashboard." />;
  }

  const { coursesCount, learnersCount, commentsCount, subscription } = dashboardStats;
  const subscriptionData = subscription ?? {
    planName: 'Chưa đăng ký',
    monthlyFee: 0,
    status: false,
    expiresAt: null,
  };
  const contractStatus = subscriptionData.status ? 'Đang hoạt động' : 'Hết hạn';

  const statValues = {
    courses: coursesCount,
    learners: learnersCount,
    comments: commentsCount,
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl font-display">
            Tổng quan giảng viên
          </h1>
          <p className="mt-1 text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary/70" />
            Quản lý khoá học và theo dõi hiệu suất của bạn
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link to="/seller/courses">
            <Plus className="mr-2 h-5 w-5" />
            Tạo khoá học mới
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ key, label, description, icon: Icon, href, color, iconBg }) => (
          <Link key={key} to={href} className="group block cursor-pointer">
            <Card
              className={`overflow-hidden border transition-all duration-200 hover:shadow-md hover:border-primary/30 ${color}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <div className={`rounded-lg p-2 ${iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-display">{statValues[key]}</div>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Xem chi tiết
                  <ArrowRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {/* Subscription Card */}
        <Card className="overflow-hidden border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gói đăng ký</CardTitle>
            <div className="rounded-lg bg-primary/15 p-2">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold font-display">{subscriptionData.planName}</span>
              <Badge variant={subscriptionData.status ? 'default' : 'destructive'} className="shrink-0">
                {contractStatus}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Phí hằng tháng: {formatVND(subscriptionData.monthlyFee)}
            </p>
            <Link
              to="/seller/fees"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Xem lịch sử thanh toán
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Charts: Revenue & Learner Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Chi phí đăng ký theo tháng"
          description="Tổng phí đã thanh toán thành công theo tháng"
        >
          <div className="h-[280px] w-full">
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => {
                      const [y, m] = v.split('-');
                      return `${m}/${y}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [formatVND(value), 'Số tiền']}
                    labelFormatter={(label) => `Tháng ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <DollarSign className="mx-auto h-12 w-12 opacity-40" />
                  <p className="mt-2 text-sm">Chưa có giao dịch phí nào</p>
                </div>
              </div>
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="Hoạt động học viên"
          description="Số học viên mới mua khoá học theo tháng"
        >
          <div className="h-[280px] w-full">
            {learnerActivityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={learnerActivityData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => {
                      const [y, m] = v.split('-');
                      return `${m}/${y}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [value, 'Học viên mới']}
                    labelFormatter={(label) => `Tháng ${label}`}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    name="Học viên"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Activity className="mx-auto h-12 w-12 opacity-40" />
                  <p className="mt-2 text-sm">Chưa có học viên nào</p>
                </div>
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Quick Actions & Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Thao tác nhanh
            </CardTitle>
            <CardDescription>Điều hướng nhanh đến các mục quản lý</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" className="h-auto justify-start gap-3 py-4" asChild>
                <Link to="/seller/courses">
                  <BookOpen className="h-5 w-5 shrink-0" />
                  <span>Quản lý khoá học</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto justify-start gap-3 py-4" asChild>
                <Link to="/seller/learners">
                  <Users className="h-5 w-5 shrink-0" />
                  <span>Xem người học</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto justify-start gap-3 py-4" asChild>
                <Link to="/seller/comments">
                  <MessageSquare className="h-5 w-5 shrink-0" />
                  <span>Bình luận mới</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto justify-start gap-3 py-4" asChild>
                <Link to="/seller/profile">
                  <CreditCard className="h-5 w-5 shrink-0" />
                  <span>Hồ sơ giảng viên</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tổng quan hôm nay</CardTitle>
            <CardDescription>Thống kê nhanh về hoạt động của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
              <span className="text-sm font-medium">Tổng khoá học</span>
              <span className="text-xl font-bold font-display">{coursesCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
              <span className="text-sm font-medium">Học viên đã phục vụ</span>
              <span className="text-xl font-bold font-display">{learnersCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
              <span className="text-sm font-medium">Tương tác (bình luận)</span>
              <span className="text-xl font-bold font-display">{commentsCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
