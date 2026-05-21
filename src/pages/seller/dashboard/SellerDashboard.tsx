import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/utils';
import {
  useSellerDashboard,
  useSellerMonthlyFees,
  useSellerLearners,
  useSellerEarnings,
  useSellerWithdrawalHistory,
} from '@/hooks/api';
import { useWallet } from '@/hooks/api/use-wallet';
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
  Plus,
  ArrowRight,
  Sparkles,
  TrendingUp,
  DollarSign,
  Activity,
  Wallet,
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

function aggregateFeesByMonth(fees: { month: number; year: number; netAmount: number }[]) {
  return fees
    .filter((f) => f.netAmount > 0)
    .map((f) => ({
      name: `${f.year}-${String(f.month).padStart(2, '0')}`,
      amount: f.netAmount,
    }));
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
  const { data: feesData } = useSellerMonthlyFees();
  const { data: learnersData } = useSellerLearners({ limit: 500 });
  const { data: earningsData } = useSellerEarnings({ limit: 200 });
  const { data: wallet } = useWallet();
  const { data: withdrawalsResp } = useSellerWithdrawalHistory({ page: 1, limit: 50 });

  const pendingWithdrawals = useMemo(() => {
    const items = (withdrawalsResp?.data ?? []) as Array<{ status: string; amount: number | string }>;
    const pending = items.filter((w) => w.status === 'PENDING');
    return {
      count: pending.length,
      total: pending.reduce((sum, w) => sum + Number(w.amount), 0),
    };
  }, [withdrawalsResp]);

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

  const { coursesCount, learnersCount, commentsCount } = dashboardStats;

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

        {/* Earnings Card — total + pending lock + available cash + pending withdraw */}
        <Link to="/seller/earnings" className="group block cursor-pointer">
          <Card className="overflow-hidden border-emerald-500/20 bg-emerald-500/5 transition-all duration-200 hover:shadow-md hover:border-emerald-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Số dư có thể rút</CardTitle>
              <div className="rounded-lg bg-emerald-500/15 p-2">
                <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display text-emerald-700 dark:text-emerald-400">
                {formatVND(Number(wallet?.allowance ?? wallet?.balance ?? 0))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Số tiền đã clear, có thể rút ngay</p>

              {(Number(wallet?.pendingBalance ?? 0) > 0 ||
                (earningsData?.summary?.totalPending ?? 0) > 0) && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  🔒 Đang khoá:{' '}
                  {formatVND(
                    Number(wallet?.pendingBalance ?? earningsData?.summary?.totalPending ?? 0)
                  )}
                </p>
              )}

              {pendingWithdrawals.count > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  ⏳ {pendingWithdrawals.count} đơn rút đang chờ:{' '}
                  {formatVND(pendingWithdrawals.total)}
                </p>
              )}

              <p className="text-[11px] text-muted-foreground mt-1">
                Tổng thu nhập từ trước đến nay: {formatVND(earningsData?.summary?.totalEarnings ?? 0)}
              </p>

              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Xem chi tiết
                <ArrowRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts: Revenue & Learner Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Doanh thu theo tháng"
          description="Số tiền nhận sau khi trừ phí nền tảng, theo tháng"
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
