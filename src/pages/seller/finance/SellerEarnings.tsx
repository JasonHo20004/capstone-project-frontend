import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatVND } from '@/lib/utils';
import {
  useSellerEarnings, useSellerCommissionRate, useSellerWithdrawalHistory,
  useSellerPolicy, useSellerEarningsTimeseries, useSellerEarningsByCourse,
  useSellerCourses,
} from '@/hooks/api';
import { useWallet } from '@/hooks/api/use-wallet';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import DataTable from '@/components/admin/DataTable';
import ChartCard from '@/components/admin/ChartCard';
import { WithdrawalModal } from '@/components/seller/finance/WithdrawalModal';
import { WithdrawalHistoryTab } from '@/components/seller/finance/WithdrawalHistoryTab';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import {
  DollarSign, Percent, Receipt, ArrowLeft, Clock, Landmark, Wallet,
  ArrowUpRight, CheckCircle2, Info, Download, BookOpen, AlertCircle,
  TrendingUp, TrendingDown, FileSpreadsheet,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MIN_WITHDRAW = 50_000;

function escapeCsv(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escapeCsv(r[h])).join(',')),
  ].join('\n');
  // BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function remainingDaysLabel(availableAt: string): { days: number; ready: boolean } {
  const diff = new Date(availableAt).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return { days: Math.max(0, days), ready: diff <= 0 };
}

type EarningStatusFilter = 'ALL' | 'PENDING' | 'AVAILABLE' | 'RELEASED' | 'REFUNDED';

export default function SellerEarnings() {
  const [earningPage, setEarningPage] = useState(1);
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<EarningStatusFilter>('ALL');
  const [courseFilter, setCourseFilter] = useState<string>('ALL');
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

  const { data: earningsData, isLoading: isLoadingEarnings, error: earningsError } =
    useSellerEarnings({ page: earningPage, limit: 10 });
  const { data: withdrawalsData } = useSellerWithdrawalHistory({ page: withdrawalPage, limit: 10 });
  const { data: commissionRate } = useSellerCommissionRate();
  const { data: policy } = useSellerPolicy();
  const { data: walletData } = useWallet();
  const { data: timeseries } = useSellerEarningsTimeseries(12);
  const { data: byCourse } = useSellerEarningsByCourse();
  // First arg is the seller ID — empty string falls back to /me which reads
  // the seller from the JWT. Passing the params object as arg 1 was the bug.
  const { data: myCoursesResp } = useSellerCourses('', { page: 1, limit: 100 });

  // Map courseId → title once for any table/list that references it.
  const courseTitleById = useMemo(() => {
    const map = new Map<string, string>();
    const list = (myCoursesResp as { data?: Array<{ id: string; title: string }> } | undefined)?.data ?? [];
    list.forEach((c) => map.set(c.id, c.title));
    return map;
  }, [myCoursesResp]);

  const courseTitle = (id: string) => courseTitleById.get(id) ?? `#${id.slice(0, 6)}`;

  // ── All useMemo hooks must run on every render to keep the call order
  //    stable. React forbids hooks after early returns (Rules of Hooks).
  //    Kept up here so the guards below don't trip the "rendered more hooks
  //    than during the previous render" error.

  // Chart prefers the dedicated full-history timeseries from BE.
  const chartData = useMemo(() => {
    if (timeseries && timeseries.length > 0) {
      return timeseries.map((p) => ({ name: p.month, amount: p.amount }));
    }
    return [];
  }, [timeseries]);

  // Month-over-month growth derived from the same timeseries.
  const growth = useMemo(() => {
    if (!timeseries || timeseries.length < 2) return null;
    const thisMonth = timeseries[timeseries.length - 1]?.amount ?? 0;
    const lastMonth = timeseries[timeseries.length - 2]?.amount ?? 0;
    const delta = thisMonth - lastMonth;
    const pct = lastMonth > 0 ? (delta / lastMonth) * 100 : thisMonth > 0 ? 100 : 0;
    return { thisMonth, lastMonth, delta, pct };
  }, [timeseries]);

  // Tax summary: net the seller received YTD — handy for accounting/tax.
  const yearToDate = useMemo(() => {
    if (!timeseries || timeseries.length === 0) return null;
    const currentYear = new Date().getFullYear();
    const ytd = timeseries.filter((p) => p.month.startsWith(String(currentYear)));
    const netReceived = ytd.reduce((s, p) => s + (p.amount ?? 0), 0);
    return { year: currentYear, netReceived };
  }, [timeseries]);

  // Earnings table filtering — client-side because BE only paginates.
  const filteredEarnings = useMemo(() => {
    let rows = earningsData?.data ?? [];
    if (statusFilter !== 'ALL') rows = rows.filter((r) => r.status === statusFilter);
    if (courseFilter !== 'ALL') rows = rows.filter((r) => r.courseId === courseFilter);
    return rows;
  }, [earningsData?.data, statusFilter, courseFilter]);

  // ── Early-return guards (only after every hook above has run) ──────────
  if (isLoadingEarnings && !earningsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }
  if (earningsError && !earningsData) {
    return <ErrorMessage message="Không thể tải dữ liệu doanh thu. Vui lòng thử lại sau." />;
  }

  const summary = earningsData?.summary ?? {
    totalRevenue: 0, totalGatewayFee: 0, totalNetRevenue: 0,
    totalEarnings: 0, totalCommission: 0, totalPending: 0,
  };

  // Show "—" instead of fake 70/30 when policy fetch hasn't returned yet.
  const sellerPercent = commissionRate != null ? Math.round((1 - commissionRate) * 100) : null;
  const platformPercent = commissionRate != null ? Math.round(commissionRate * 100) : null;
  const clearanceDays = policy?.clearanceDays ?? 7;
  const gatewayFeeRate = policy?.gatewayFeeRate ?? 0.03;
  const gatewayFeeFixed = policy?.gatewayFeeFixed ?? 2000;

  const availableBalance = walletData?.balance ?? 0;
  const pendingBalance = walletData?.pendingBalance ?? 0;

  // Concrete worked example using actual platform config — clearer than
  // abstract chains of badges.
  const examplePrice = 200_000;
  const exampleGateway = Math.round(examplePrice * gatewayFeeRate + gatewayFeeFixed);
  const exampleNet = examplePrice - exampleGateway;
  const examplePlatform = commissionRate != null ? Math.round(exampleNet * commissionRate) : null;
  const exampleSeller = examplePlatform != null ? exampleNet - examplePlatform : null;

  // Pending withdrawals on the current page — best-effort indicator. (Full-set
  // count would need a dedicated summary endpoint.)
  const pendingWithdrawals = (withdrawalsData?.data ?? []).filter((w) => w.status === 'PENDING');
  const hasPendingWithdrawal = pendingWithdrawals.length > 0;
  const belowMinimum = availableBalance < MIN_WITHDRAW;
  const withdrawDisabled = belowMinimum || hasPendingWithdrawal;

  const statCards = [
    {
      label: 'Khả dụng (Có thể rút)',
      value: formatVND(availableBalance),
      description: hasPendingWithdrawal
        ? `Đang khoá ${pendingWithdrawals.length} lệnh chờ duyệt`
        : belowMinimum
        ? `Cần tối thiểu ${formatVND(MIN_WITHDRAW)} để rút`
        : 'Đã trừ tiền đang chờ rút',
      icon: Wallet,
      color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      iconBg: 'bg-emerald-500/15',
    },
    {
      label: `Đang chờ mở khoá (${clearanceDays} ngày)`,
      value: formatVND(pendingBalance || summary.totalPending),
      description: 'Tiền sẽ tự mở khoá sau khi qua thời gian giữ',
      icon: Clock,
      color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
      iconBg: 'bg-amber-500/15',
    },
    {
      label: 'Đã bán (tổng tiền học viên trả)',
      value: formatVND(summary.totalRevenue),
      description: `Phí cổng đã trừ: ${formatVND(summary.totalGatewayFee)}`,
      icon: Receipt,
      color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
      iconBg: 'bg-blue-500/15',
    },
    {
      label: 'Tỷ lệ chia với platform',
      value: sellerPercent != null ? `${sellerPercent}%` : '—',
      description: platformPercent != null ? `Platform giữ ${platformPercent}%` : 'Đang tải…',
      icon: Percent,
      color: 'bg-primary/10 text-primary border-primary/20',
      iconBg: 'bg-primary/15',
    },
  ];


  const handleExportEarnings = () => {
    const rows = (earningsData?.data ?? []).map((r) => ({
      'Ngay': new Date(r.createdAt).toLocaleDateString('vi-VN'),
      'Khoa hoc': courseTitle(r.courseId),
      'Gross (VND)': r.totalAmount,
      'Phi cong (VND)': r.gatewayFee,
      'Platform fee (VND)': r.commissionAmount,
      'Ban nhan (VND)': r.sellerAmount,
      'Trang thai': r.status,
      'Mo khoa': new Date(r.availableAt).toLocaleDateString('vi-VN'),
    }));
    downloadCsv(`earnings-page${earningPage}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const handleExportWithdrawals = () => {
    const rows = (withdrawalsData?.data ?? []).map((r) => ({
      'Ngay': new Date(r.createdAt).toLocaleDateString('vi-VN'),
      'So tien (VND)': r.amount,
      'Ngan hang': r.bankName,
      'Chu tai khoan': r.accountName,
      'So tai khoan': r.accountNumber,
      'Trang thai': r.status,
      'Ghi chu admin': r.adminNote ?? '',
    }));
    downloadCsv(`withdrawals-page${withdrawalPage}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/seller/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl font-display">
                Tài chính & Rút tiền
              </h1>
            </div>
            <p className="text-muted-foreground ml-12">
              Theo dõi thu nhập, phí thanh toán và quản lý rút tiền
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <Button
                  onClick={() => setIsWithdrawalModalOpen(true)}
                  className="gap-2"
                  disabled={withdrawDisabled}
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Rút tiền về Ngân hàng
                </Button>
              </span>
            </TooltipTrigger>
            {withdrawDisabled && (
              <TooltipContent>
                {hasPendingWithdrawal
                  ? 'Bạn đang có lệnh rút chờ duyệt — chờ admin xử lý trước'
                  : `Số dư khả dụng phải ≥ ${formatVND(MIN_WITHDRAW)}`}
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        <WithdrawalModal
          open={isWithdrawalModalOpen}
          onOpenChange={setIsWithdrawalModalOpen}
          availableBalance={availableBalance}
        />

        {/* Concrete worked example */}
        <Card className="border-dashed border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Landmark className="h-4 w-4 text-primary" />
              Cách tính thu nhập trên 1 đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
              <ExampleStep label="Giá khoá học" value={formatVND(examplePrice)} tone="neutral" />
              <ExampleStep
                label={`Phí cổng (${Math.round(gatewayFeeRate * 100)}% + ${formatVND(gatewayFeeFixed)})`}
                value={`- ${formatVND(exampleGateway)}`}
                tone="red"
              />
              <ExampleStep label="Net Revenue" value={formatVND(exampleNet)} tone="blue" />
              <ExampleStep
                label={`Platform fee ${platformPercent != null ? `(${platformPercent}%)` : ''}`}
                value={examplePlatform != null ? `- ${formatVND(examplePlatform)}` : '—'}
                tone="amber"
              />
              <ExampleStep
                label="Bạn nhận"
                value={exampleSeller != null ? formatVND(exampleSeller) : '—'}
                tone="emerald"
                bold
              />
            </div>
            <div className="flex items-start gap-2 mt-3 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>
                Sau khi học viên trả, tiền vào trạng thái <strong>Đang khoá {clearanceDays} ngày</strong> để xử lý hoàn tiền/khiếu nại,
                sau đó chuyển sang <strong>Sẵn sàng rút</strong>.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(({ label, value, description, icon: Icon, color, iconBg }) => (
            <Card key={label} className={`overflow-hidden border ${color}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <div className={`rounded-lg p-2 ${iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-display">{value}</div>
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Growth + tax summary */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {growth && growth.pct >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                Tăng trưởng tháng này vs tháng trước
              </CardTitle>
            </CardHeader>
            <CardContent>
              {growth ? (
                <div className="space-y-1">
                  <div className="text-2xl font-bold font-display">
                    {growth.pct >= 0 ? '+' : ''}
                    {growth.pct.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tháng này: <strong>{formatVND(growth.thisMonth)}</strong> • Tháng trước:{' '}
                    {formatVND(growth.lastMonth)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Cần ít nhất 2 tháng dữ liệu.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                Tổng thu nhập YTD (cho khai thuế)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {yearToDate ? (
                <div className="space-y-1">
                  <div className="text-2xl font-bold font-display">
                    {formatVND(yearToDate.netReceived)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Năm {yearToDate.year} — đã trừ phí cổng & platform fee. Dùng "Xuất CSV" để có
                    chi tiết từng đơn cho hồ sơ thuế.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu năm nay.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="earnings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="earnings" className="gap-2">
              <DollarSign className="w-4 h-4" /> Lịch sử Doanh thu
            </TabsTrigger>
            <TabsTrigger value="by-course" className="gap-2">
              <BookOpen className="w-4 h-4" /> Theo khoá học
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="gap-2">
              <Wallet className="w-4 h-4" /> Lịch sử Rút tiền
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earnings" className="space-y-6">
            <ChartCard
              title="Thu nhập theo tháng (12 tháng gần nhất)"
              description="Thu nhập ròng sau phí cổng + platform fee — đã loại đơn hoàn tiền"
            >
              <div className="h-[280px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => {
                          const [y, m] = v.split('-');
                          return `${m}/${y.slice(2)}`;
                        }}
                      />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                        formatter={(value: number) => [formatVND(value), 'Thu nhập']}
                        labelFormatter={(label) => `Tháng ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="hsl(142, 71%, 45%)"
                        fill="url(#colorEarnings)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={DollarSign} title="Chưa có doanh thu" hint="Khi học viên mua khoá, biểu đồ sẽ hiện ở đây." />
                )}
              </div>
            </ChartCard>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as EarningStatusFilter)}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Đang khoá</option>
                <option value="AVAILABLE">Sẵn sàng rút</option>
                <option value="RELEASED">Đã rút</option>
                <option value="REFUNDED">Đã hoàn</option>
              </select>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="h-9 rounded-md border bg-background px-3 text-sm max-w-xs"
              >
                <option value="ALL">Tất cả khoá học</option>
                {Array.from(courseTitleById.entries()).map(([id, title]) => (
                  <option key={id} value={id}>{title}</option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={handleExportEarnings} className="ml-auto">
                <Download className="w-4 h-4 mr-1.5" /> Xuất CSV
              </Button>
            </div>

            <DataTable
              title="Chi tiết bán hàng"
              description="Lịch sử doanh thu từ mỗi giao dịch mua khoá học"
              data={filteredEarnings}
              columns={[
                {
                  key: 'createdAt',
                  header: 'Ngày',
                  render: (r) => new Date(r.createdAt).toLocaleDateString('vi-VN'),
                },
                {
                  key: 'courseId',
                  header: 'Khoá học',
                  render: (r) => <span className="text-sm font-medium">{courseTitle(r.courseId)}</span>,
                },
                {
                  key: 'totalAmount',
                  header: 'Học viên trả',
                  render: (r) => formatVND(r.totalAmount),
                },
                {
                  key: 'gatewayFee',
                  header: 'Phí cổng',
                  render: (r) => <span className="text-red-500 text-xs">-{formatVND(r.gatewayFee)}</span>,
                },
                {
                  key: 'commissionAmount',
                  header: 'Platform fee',
                  render: (r) => <span className="text-muted-foreground text-xs">-{formatVND(r.commissionAmount)}</span>,
                },
                {
                  key: 'sellerAmount',
                  header: 'Bạn nhận',
                  render: (r) => (
                    <span className={`font-semibold ${r.status === 'REFUNDED' ? 'text-red-600 line-through' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {r.status === 'REFUNDED' ? '' : '+'}{formatVND(r.sellerAmount)}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Trạng thái',
                  render: (r) => <StatusBadge status={r.status} availableAt={r.availableAt} />,
                },
              ]}
            />

            {filteredEarnings.length === 0 && (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={DollarSign}
                    title="Không có giao dịch"
                    hint={statusFilter !== 'ALL' || courseFilter !== 'ALL'
                      ? 'Không tìm thấy giao dịch khớp bộ lọc.'
                      : 'Khi học viên mua khoá học, giao dịch sẽ hiện ở đây.'}
                  />
                </CardContent>
              </Card>
            )}

            {earningsData && earningsData.totalPages > 1 && (
              <Pagination
                page={earningPage}
                totalPages={earningsData.totalPages}
                onChange={setEarningPage}
              />
            )}
          </TabsContent>

          <TabsContent value="by-course" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Doanh thu theo khoá học</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Tổng tiền bạn đã nhận theo từng khoá (loại đơn hoàn). Sắp xếp giảm dần.
                </p>
              </CardHeader>
              <CardContent>
                {(byCourse?.length ?? 0) === 0 ? (
                  <EmptyState icon={BookOpen} title="Chưa có doanh thu theo khoá" hint="Tạo và xuất bản khoá để bắt đầu." />
                ) : (
                  <div className="space-y-2">
                    {byCourse!.map((c) => {
                      const max = Math.max(...byCourse!.map((b) => b.sellerAmount), 1);
                      const pct = (c.sellerAmount / max) * 100;
                      return (
                        <div key={c.courseId} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-medium truncate">{courseTitle(c.courseId)}</div>
                              <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                {formatVND(c.sellerAmount)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-3 mt-1">
                              <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500/70 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="text-xs text-muted-foreground whitespace-nowrap">
                                {c.salesCount} lượt • Gross: {formatVND(c.totalAmount)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-6">
            <WithdrawalHistoryTab
              page={withdrawalPage}
              onPageChange={setWithdrawalPage}
              onExportCsv={handleExportWithdrawals}
            />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

function ExampleStep({
  label, value, tone, bold,
}: {
  label: string;
  value: string;
  tone: 'neutral' | 'red' | 'blue' | 'amber' | 'emerald';
  bold?: boolean;
}) {
  const toneClass: Record<string, string> = {
    neutral: 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900/40 dark:border-slate-700',
    red: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800',
  };
  return (
    <div className={`rounded-lg border p-3 ${toneClass[tone]}`}>
      <div className="text-xs">{label}</div>
      <div className={`mt-1 ${bold ? 'text-base font-bold' : 'text-sm font-semibold'}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status, availableAt }: { status: string; availableAt: string }) {
  if (status === 'PENDING') {
    const { days, ready } = remainingDaysLabel(availableAt);
    if (ready) {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs">
          <Clock className="mr-1 h-3 w-3" /> Sắp mở
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs">
        <Clock className="mr-1 h-3 w-3" /> Khoá ({days}d)
      </Badge>
    );
  }
  if (status === 'AVAILABLE') {
    return (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-xs">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Sẵn sàng rút
      </Badge>
    );
  }
  if (status === 'RELEASED') {
    return (
      <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/30 text-xs">
        Đã rút
      </Badge>
    );
  }
  if (status === 'REFUNDED') {
    return (
      <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/30 text-xs">
        <AlertCircle className="mr-1 h-3 w-3" /> Đã hoàn
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs">{status}</Badge>
  );
}

function EmptyState({ icon: Icon, title, hint }: { icon: typeof DollarSign; title: string; hint?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center py-6">
      <Icon className="h-10 w-10 opacity-30" />
      <p className="mt-2 text-sm font-medium">{title}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground max-w-sm">{hint}</p>}
    </div>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(Math.max(1, page - 1))}>
        Trước
      </Button>
      <span className="text-sm text-muted-foreground">Trang {page} / {totalPages}</span>
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Tiếp
      </Button>
    </div>
  );
}
