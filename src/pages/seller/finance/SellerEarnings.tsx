import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatVND } from '@/lib/utils';
import { useSellerEarnings, useSellerCommissionRate, useSellerWithdrawalHistory } from '@/hooks/api';
import { useWallet } from '@/hooks/api/use-wallet';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import DataTable from '@/components/admin/DataTable';
import ChartCard from '@/components/admin/ChartCard';
import { WithdrawalModal } from '@/components/seller/finance/WithdrawalModal';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign,
  Percent,
  Receipt,
  ArrowLeft,
  Clock,
  Landmark,
  Wallet,
  ArrowUpRight,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

function aggregateEarningsByMonth(data: { sellerAmount: number; createdAt: string }[]) {
  const map = new Map<string, number>();
  data.forEach((d) => {
    const dt = new Date(d.createdAt);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    map.set(key, (map.get(key) ?? 0) + d.sellerAmount);
  });
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([name, amount]) => ({ name, amount }));
}

function getRemainingDays(availableAt: string) {
  const now = new Date();
  const target = new Date(availableAt);
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export default function SellerEarnings() {
  const [earningPage, setEarningPage] = useState(1);
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

  const { data: earningsData, isLoading: isLoadingEarnings, error: earningsError } = useSellerEarnings({ page: earningPage, limit: 10 });
  const { data: withdrawalsData } = useSellerWithdrawalHistory({ page: withdrawalPage, limit: 10 });
  const { data: commissionRate } = useSellerCommissionRate();
  const { data: walletData } = useWallet();

  const chartData = useMemo(
    () => aggregateEarningsByMonth(earningsData?.data ?? []),
    [earningsData?.data]
  );

  if (isLoadingEarnings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (earningsError) {
    return <ErrorMessage message="Không thể tải dữ liệu doanh thu. Vui lòng thử lại sau." />;
  }

  const summary = earningsData?.summary ?? {
    totalRevenue: 0, totalGatewayFee: 0, totalNetRevenue: 0,
    totalEarnings: 0, totalCommission: 0, totalPending: 0,
  };
  const sellerPercent = commissionRate ? Math.round((1 - commissionRate) * 100) : 70;
  const platformPercent = commissionRate ? Math.round(commissionRate * 100) : 30;

  const availableBalance = walletData?.balance ?? 0;

  const statCards = [
    {
      label: 'Khả dụng (Có thể rút)',
      value: formatVND(availableBalance),
      description: `Đã mở khoá: ${formatVND(summary.totalEarnings - summary.totalPending)}`,
      icon: Wallet,
      color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      iconBg: 'bg-emerald-500/15',
    },
    {
      label: 'Đang chờ mở khoá',
      value: formatVND(summary.totalPending),
      description: 'Tiền chờ qua thời gian giữ (7 ngày)',
      icon: Clock,
      color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
      iconBg: 'bg-amber-500/15',
    },
    {
      label: 'Tổng doanh thu (Gross)',
      value: formatVND(summary.totalRevenue),
      description: `Phí cổng: ${formatVND(summary.totalGatewayFee)}`,
      icon: Receipt,
      color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
      iconBg: 'bg-blue-500/15',
    },
    {
      label: 'Tỷ lệ chia',
      value: `${sellerPercent}% / ${platformPercent}%`,
      description: `Bạn ${sellerPercent}% • Platform ${platformPercent}%`,
      icon: Percent,
      color: 'bg-primary/10 text-primary border-primary/20',
      iconBg: 'bg-primary/15',
    },
  ];

  return (
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
        <Button onClick={() => setIsWithdrawalModalOpen(true)} className="gap-2">
          <ArrowUpRight className="h-4 w-4" />
          Rút tiền về Ngân hàng
        </Button>
      </div>

      <WithdrawalModal 
        open={isWithdrawalModalOpen} 
        onOpenChange={setIsWithdrawalModalOpen} 
        availableBalance={availableBalance} 
      />

      {/* Revenue Split Breakdown */}
      <Card className="border-dashed border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" />
            Cách tính doanh thu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <Badge variant="outline">Giá khoá học</Badge>
            <span>→</span>
            <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/30">
              - Phí cổng (3% + 2,000đ)
            </Badge>
            <span>=</span>
            <Badge variant="outline" className="border-blue-500/30 text-blue-600">Net Revenue</Badge>
            <span>→</span>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600">
              Bạn {sellerPercent}%
            </Badge>
            <span>+</span>
            <Badge variant="outline" className="border-amber-500/30 text-amber-600">
              Platform {platformPercent}%
            </Badge>
            <span>→</span>
            <Badge variant="outline" className="border-orange-500/30 text-orange-600">
              🔒 Khoá 7 ngày
            </Badge>
            <span>→</span>
            <Badge variant="outline" className="border-primary/30 text-primary">
              💰 Sẵn sàng rút
            </Badge>
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

      {/* Tabs for Earnings & Withdrawals */}
      <Tabs defaultValue="earnings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="earnings" className="gap-2">
            <DollarSign className="w-4 h-4" /> Lịch sử Doanh thu
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-2">
            <Wallet className="w-4 h-4" /> Lịch sử Rút tiền
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earnings" className="space-y-6">
          <ChartCard
            title="Thu nhập theo tháng"
            description="Thu nhập ròng (sau khi trừ phí cổng + platform fee) theo tháng"
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
                        return `${m}/${y}`;
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
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <DollarSign className="mx-auto h-12 w-12 opacity-40" />
                    <p className="mt-2 text-sm">Chưa có doanh thu nào</p>
                  </div>
                </div>
              )}
            </div>
          </ChartCard>

          <DataTable
            title="Chi tiết bán hàng"
            description="Lịch sử doanh thu từ mỗi giao dịch mua khoá học"
            data={earningsData?.data ?? []}
            columns={[
              {
                key: 'createdAt',
                header: 'Thời gian',
                render: (r) => new Date(r.createdAt).toLocaleDateString('vi-VN'),
              },
              {
                key: 'totalAmount',
                header: 'Giá (Gross)',
                render: (r) => formatVND(r.totalAmount),
              },
              {
                key: 'gatewayFee',
                header: 'Phí cổng',
                render: (r) => (
                  <span className="text-red-500 text-xs">-{formatVND(r.gatewayFee)}</span>
                ),
              },
              {
                key: 'sellerAmount',
                header: 'Nhận được',
                render: (r) => (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    +{formatVND(r.sellerAmount)}
                  </span>
                ),
              },
              {
                key: 'commissionAmount',
                header: 'Platform Fee',
                render: (r) => (
                  <span className="text-muted-foreground text-xs">-{formatVND(r.commissionAmount)}</span>
                ),
              },
              {
                key: 'status',
                header: 'Trạng thái',
                render: (r) => {
                  if (r.status === 'PENDING') {
                    const days = getRemainingDays(r.availableAt);
                    return (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs">
                        <Clock className="mr-1 h-3 w-3" />
                        Khoá ({days}d)
                      </Badge>
                    );
                  }
                  if (r.status === 'RELEASED') {
                    return (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-xs">
                        Sẵn sàng rút
                      </Badge>
                    );
                  }
                  return (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/30 text-xs">
                      Đã ghi nhận
                    </Badge>
                  );
                },
              },
            ]}
          />

          {earningsData && earningsData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline" size="sm" disabled={earningPage <= 1}
                onClick={() => setEarningPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <span className="text-sm text-muted-foreground">Trang {earningPage} / {earningsData.totalPages}</span>
              <Button
                variant="outline" size="sm" disabled={earningPage >= earningsData.totalPages}
                onClick={() => setEarningPage((p) => p + 1)}
              >
                Tiếp
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-6">
          <DataTable
            title="Lịch sử rút tiền"
            description="Các yêu cầu rút tiền về tài khoản ngân hàng"
            data={withdrawalsData?.data ?? []}
            columns={[
              {
                key: 'createdAt',
                header: 'Ngày yêu cầu',
                render: (r) => new Date(r.createdAt).toLocaleDateString('vi-VN'),
              },
              {
                key: 'amount',
                header: 'Số tiền rút',
                render: (r) => (
                  <span className="font-semibold text-primary">{formatVND(r.amount)}</span>
                ),
              },
              {
                key: 'bankName',
                header: 'Ngân hàng',
                render: (r) => (
                  <div>
                    <p className="font-medium">{r.bankName}</p>
                    <p className="text-xs text-muted-foreground">{r.accountName} - {r.accountNumber}</p>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Trạng thái',
                render: (r) => {
                  if (r.status === 'PENDING') {
                    return (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30">
                        <Clock className="w-3 h-3 mr-1" /> Chờ admin duyệt
                      </Badge>
                    );
                  }
                  if (r.status === 'APPROVED') {
                    return (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Đã chuyển khoản
                      </Badge>
                    );
                  }
                  return (
                    <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/30">
                      <XCircle className="w-3 h-3 mr-1" /> Đã từ chối
                    </Badge>
                  );
                },
              },
              {
                key: 'adminNote',
                header: 'Ghi chú / Biên lai',
                render: (r) => (
                  <div className="max-w-[200px] truncate text-xs">
                    {r.proofImageUrl && (
                      <a href={r.proofImageUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline block mb-1">
                        Xem biên lai
                      </a>
                    )}
                    {r.adminNote && <span className="text-muted-foreground">{r.adminNote}</span>}
                  </div>
                ),
              },
            ]}
          />
          {withdrawalsData && withdrawalsData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline" size="sm" disabled={withdrawalPage <= 1}
                onClick={() => setWithdrawalPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <span className="text-sm text-muted-foreground">Trang {withdrawalPage} / {withdrawalsData.totalPages}</span>
              <Button
                variant="outline" size="sm" disabled={withdrawalPage >= withdrawalsData.totalPages}
                onClick={() => setWithdrawalPage((p) => p + 1)}
              >
                Tiếp
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
