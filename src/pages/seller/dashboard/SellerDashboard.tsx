import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatVND } from '@/lib/utils';
import {
  useSellerDashboard,
  useSellerMonthlyFees,
  useSellerLearners,
} from '@/hooks/api';
import { useProfile } from '@/hooks/api/use-user';
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
  UserCircle,
  Star,
  Trophy,
  CreditCard,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const statCards = [
  {
    key: 'courses',
    icon: BookOpen,
    href: '/seller/courses',
    color: 'bg-primary/10 text-primary border-primary/20',
    iconBg: 'bg-primary/15',
  },
  {
    key: 'learners',
    icon: Users,
    href: '/seller/learners',
    color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    iconBg: 'bg-emerald-500/15',
  },
  {
    key: 'comments',
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

function greetingKey() {
  const h = new Date().getHours();
  if (h < 11) return 'morning';
  if (h < 14) return 'noon';
  if (h < 18) return 'afternoon';
  return 'evening';
}

/** Star row for the average rating. Renders 5 stars with partial fill. */
function RatingStars({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(5, value));
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, safeValue - (i - 1)));
        return (
          <div key={i} className="relative h-4 w-4">
            <Star className="absolute inset-0 h-4 w-4 text-muted-foreground/30" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
        );
      })}
      <span className="ml-1 text-sm font-medium tabular-nums">{safeValue.toFixed(1)}</span>
    </div>
  );
}

export default function SellerDashboard() {
  const { t } = useTranslation('seller');
  const { user } = useProfile();
  const { data: dashboardStats, isLoading, error } = useSellerDashboard();

  const [revenueYear, setRevenueYear] = useState<number>(new Date().getFullYear());
  const { data: feesData, isLoading: isLoadingFees } = useSellerMonthlyFees({ year: revenueYear });
  const { data: learnersData, isLoading: isLoadingLearners } = useSellerLearners({ limit: 500 });

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
    return <ErrorMessage message={t('dashboard.errors.load')} />;
  }

  if (!dashboardStats) {
    return <ErrorMessage message={t('dashboard.errors.noData')} />;
  }

  const { coursesCount, learnersCount, commentsCount, averageRating, topCourses, financial } =
    dashboardStats;

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
            {t(`dashboard.greeting.${greetingKey()}`)}, {user?.fullName?.split(' ').slice(-1)[0] || t('dashboard.defaultInstructor')}
          </h1>
          <p className="mt-1 text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-primary/70" />
              {t('dashboard.subtitle')}
            </span>
            {averageRating > 0 && (
              <span className="inline-flex items-center gap-1">
                <RatingStars value={averageRating} />
              </span>
            )}
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link to="/seller/courses">
            <Plus className="mr-2 h-5 w-5" />
            {t('dashboard.createCourse')}
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ key, icon: Icon, href, color, iconBg }) => (
          <Link key={key} to={href} className="group block cursor-pointer h-full">
            <Card
              className={`h-full overflow-hidden border transition-all duration-200 hover:shadow-md hover:border-primary/30 ${color}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t(`dashboard.stats.${key}.label`)}</CardTitle>
                <div className={`rounded-lg p-2 ${iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-display">{statValues[key]}</div>
                <p className="text-xs text-muted-foreground mt-1">{t(`dashboard.stats.${key}.description`)}</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  {t('dashboard.viewDetails')}
                  <ArrowRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {/* Earnings Card — same shape as the other three for visual parity */}
        <Link to="/seller/earnings" className="group block cursor-pointer h-full">
          <Card className="h-full overflow-hidden border-emerald-500/20 bg-emerald-500/5 transition-all duration-200 hover:shadow-md hover:border-emerald-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.earnings.label')}
              </CardTitle>
              <div className="rounded-lg bg-emerald-500/15 p-2">
                <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display text-emerald-700 dark:text-emerald-400">
                {formatVND(financial.allowance)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {financial.pendingBalance > 0
                  ? t('dashboard.earnings.locked', { amount: formatVND(financial.pendingBalance) })
                  : financial.pendingWithdrawalCount > 0
                    ? t('dashboard.earnings.pendingWithdrawals', { count: financial.pendingWithdrawalCount })
                    : t('dashboard.earnings.totalReceived', { amount: formatVND(financial.totalEarnings) })}
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {t('dashboard.viewDetails')}
                <ArrowRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts: Revenue (with year picker) & Learner Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title={t('dashboard.revenueChart.title')}
          description={t('dashboard.revenueChart.description', { year: revenueYear })}
          headerExtra={
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRevenueYear((y) => y - 1)}
                className="h-7 px-2"
              >
                ←
              </Button>
              <span className="text-sm font-semibold tabular-nums px-1">{revenueYear}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRevenueYear((y) => y + 1)}
                disabled={revenueYear >= new Date().getFullYear()}
                className="h-7 px-2"
              >
                →
              </Button>
            </div>
          }
        >
          <div className="h-[280px] w-full">
            {isLoadingFees ? (
              <div className="h-full w-full flex flex-col gap-2 justify-end p-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : revenueChartData.length > 0 ? (
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
                      const [, m] = v.split('-');
                      return `T${m}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [formatVND(value), t('dashboard.revenueChart.amount')]}
                    labelFormatter={(label) => t('dashboard.chartMonthLabel', { label })}
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
                  <p className="mt-2 text-sm">{t('dashboard.revenueChart.empty', { year: revenueYear })}</p>
                </div>
              </div>
            )}
          </div>
        </ChartCard>

        <ChartCard
          title={t('dashboard.learnerChart.title')}
          description={t('dashboard.learnerChart.description')}
        >
          <div className="h-[280px] w-full">
            {isLoadingLearners ? (
              <div className="h-full w-full flex items-end gap-2 p-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="flex-1" style={{ height: `${30 + (i * 7) % 60}%` }} />
                ))}
              </div>
            ) : learnerActivityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={learnerActivityData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => {
                      const [y, m] = v.split('-');
                      return `${m}/${String(y).slice(2)}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [value, t('dashboard.learnerChart.newLearners')]}
                    labelFormatter={(label) => t('dashboard.chartMonthLabel', { label })}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    name={t('dashboard.learnerChart.seriesName')}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Activity className="mx-auto h-12 w-12 opacity-40" />
                  <p className="mt-2 text-sm">{t('dashboard.learnerChart.empty')}</p>
                </div>
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Top Courses + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              {t('dashboard.topCourses.title')}
            </CardTitle>
            <CardDescription>{t('dashboard.topCourses.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {topCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">{t('dashboard.topCourses.empty')}</p>
            ) : (
              <ul className="space-y-3">
                {topCourses.map((c, idx) => (
                  <li key={c.id}>
                    <Link
                      to={`/seller/courses/${c.id}`}
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold dark:bg-amber-500/20">
                        {idx + 1}
                      </span>
                      {c.thumbnailUrl ? (
                        <img
                          src={c.thumbnailUrl}
                          alt={c.title}
                          className="h-12 w-16 rounded object-cover bg-muted"
                        />
                      ) : (
                        <div className="h-12 w-16 rounded bg-muted flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{c.title}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {c.learners}
                          </span>
                          <span>{formatVND(c.price)}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t('dashboard.quickActions.title')}
            </CardTitle>
            <CardDescription>{t('dashboard.quickActions.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" className="h-auto justify-start gap-3 py-4" asChild>
                <Link to="/seller/courses">
                  <BookOpen className="h-5 w-5 shrink-0" />
                  <span>{t('dashboard.quickActions.manageCourses')}</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto justify-start gap-3 py-4" asChild>
                <Link to="/seller/learners">
                  <Users className="h-5 w-5 shrink-0" />
                  <span>{t('dashboard.quickActions.viewLearners')}</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto justify-start gap-3 py-4" asChild>
                <Link to="/seller/comments">
                  <MessageSquare className="h-5 w-5 shrink-0" />
                  <span>{t('dashboard.quickActions.newComments')}</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto justify-start gap-3 py-4" asChild>
                <Link to="/seller/profile">
                  <UserCircle className="h-5 w-5 shrink-0" />
                  <span>{t('dashboard.quickActions.instructorProfile')}</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
