import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatVND } from '@/lib/utils';
import {
  useAdminCommissionReport,
  useCommissionConfig,
  useUpdateCommissionConfig,
  useReleaseEarnings,
} from '@/hooks/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import DataTable from '@/components/admin/DataTable';
import { toast } from 'sonner';
import {
  DollarSign,
  TrendingUp,
  Users,
  Settings,
  Percent,
  Receipt,
  Clock,
  Landmark,
  Unlock,
  CreditCard,
} from 'lucide-react';

export default function CommissionManagement() {
  const [page, setPage] = useState(1);
  const { data: reportData, isLoading, error } = useAdminCommissionReport({ page, limit: 10 });
  const { data: config } = useCommissionConfig();
  const updateConfig = useUpdateCommissionConfig();
  const releaseEarnings = useReleaseEarnings();

  // Config edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editRate, setEditRate] = useState('');
  const [editGatewayRate, setEditGatewayRate] = useState('');
  const [editGatewayFixed, setEditGatewayFixed] = useState('');
  const [editClearanceDays, setEditClearanceDays] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Không thể tải dữ liệu hoa hồng. Vui lòng thử lại sau." />;
  }

  const summary = reportData?.summary ?? {
    totalSales: 0, totalGatewayFee: 0, totalNetRevenue: 0,
    totalCommission: 0, totalSellerPayouts: 0, transactionCount: 0,
  };
  const globalRate = config?.globalRate ?? 0.3;
  const gatewayFeeRate = config?.gatewayFeeRate ?? 0.03;
  const gatewayFeeFixed = config?.gatewayFeeFixed ?? 2000;
  const clearanceDays = config?.clearanceDays ?? 7;

  const startEditing = () => {
    setIsEditing(true);
    setEditRate((globalRate * 100).toString());
    setEditGatewayRate((gatewayFeeRate * 100).toString());
    setEditGatewayFixed(gatewayFeeFixed.toString());
    setEditClearanceDays(clearanceDays.toString());
  };

  const handleSaveConfig = async () => {
    const rateNum = parseFloat(editRate);
    const gwRateNum = parseFloat(editGatewayRate);
    const gwFixedNum = parseFloat(editGatewayFixed);
    const clearanceNum = parseInt(editClearanceDays);

    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      toast.error('Tỷ lệ hoa hồng phải từ 0 đến 100');
      return;
    }
    if (isNaN(gwRateNum) || gwRateNum < 0 || gwRateNum > 100) {
      toast.error('Phí cổng (%) phải từ 0 đến 100');
      return;
    }
    if (isNaN(gwFixedNum) || gwFixedNum < 0) {
      toast.error('Phí cổng cố định phải >= 0');
      return;
    }
    if (isNaN(clearanceNum) || clearanceNum < 0 || clearanceNum > 90) {
      toast.error('Thời gian khoá phải từ 0 đến 90 ngày');
      return;
    }

    try {
      await updateConfig.mutateAsync({
        commissionRate: rateNum / 100,
        gatewayFeeRate: gwRateNum / 100,
        gatewayFeeFixed: gwFixedNum,
        clearanceDays: clearanceNum,
      });
      toast.success('Đã cập nhật cấu hình');
      setIsEditing(false);
    } catch {
      toast.error('Cập nhật thất bại');
    }
  };

  const handleRelease = async () => {
    try {
      const result = await releaseEarnings.mutateAsync();
      if (result.data && result.data.released > 0) {
        toast.success(`Đã mở khoá ${result.data.released} giao dịch (${formatVND(result.data.totalAmount)})`);
      } else {
        toast.info('Không có giao dịch nào cần mở khoá');
      }
    } catch {
      toast.error('Thao tác thất bại');
    }
  };

  const statCards = [
    {
      label: 'Tổng doanh thu (Gross)',
      value: formatVND(summary.totalSales),
      icon: Receipt,
      color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
      iconBg: 'bg-blue-500/15',
    },
    {
      label: 'Phí cổng thu được',
      value: formatVND(summary.totalGatewayFee),
      icon: CreditCard,
      color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
      iconBg: 'bg-red-500/15',
    },
    {
      label: 'Hoa hồng Platform',
      value: formatVND(summary.totalCommission),
      icon: DollarSign,
      color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      iconBg: 'bg-emerald-500/15',
    },
    {
      label: 'Đã trả cho Seller',
      value: formatVND(summary.totalSellerPayouts),
      icon: Users,
      color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
      iconBg: 'bg-amber-500/15',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl font-display">
            Quản lý Hoa hồng (Revenue Split)
          </h1>
          <p className="mt-1 text-muted-foreground">
            Quản lý phí cổng thanh toán, tỷ lệ chia doanh thu và thời gian khoá tiền
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRelease}
          disabled={releaseEarnings.isPending}
          className="gap-2"
        >
          <Unlock className="h-4 w-4" />
          {releaseEarnings.isPending ? 'Đang xử lý...' : 'Mở khoá thu nhập đến hạn'}
        </Button>
      </div>

      {/* Flow Breakdown */}
      <Card className="border-dashed border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" />
            Revenue Split Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <Badge variant="outline">Gross Sale</Badge>
            <span>→</span>
            <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/30">
              - Phí cổng ({Math.round(gatewayFeeRate * 100)}% + {formatVND(gatewayFeeFixed)})
            </Badge>
            <span>=</span>
            <Badge variant="outline" className="border-blue-500/30 text-blue-600">Net Revenue</Badge>
            <span>→</span>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600">
              Platform {Math.round(globalRate * 100)}%
            </Badge>
            <span>+</span>
            <Badge variant="outline" className="border-amber-500/30 text-amber-600">
              Seller {100 - Math.round(globalRate * 100)}%
            </Badge>
            <span>→</span>
            <Badge variant="outline" className="border-orange-500/30 text-orange-600">
              🔒 Khoá {clearanceDays} ngày
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color, iconBg }) => (
          <Card key={label} className={`overflow-hidden border ${color}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <div className={`rounded-lg p-2 ${iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Config Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Cấu hình Revenue Split
          </CardTitle>
          <CardDescription>
            Phí cổng thanh toán, tỷ lệ hoa hồng platform, và thời gian giữ tiền
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="editRate" className="text-xs font-medium text-muted-foreground">
                    Hoa hồng Platform (%)
                  </Label>
                  <div className="flex items-center gap-1">
                    <Input
                      id="editRate"
                      type="number" min="0" max="100" step="1"
                      value={editRate}
                      onChange={(e) => setEditRate(e.target.value)}
                      className="w-24"
                    />
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editGwRate" className="text-xs font-medium text-muted-foreground">
                    Phí cổng (%)
                  </Label>
                  <div className="flex items-center gap-1">
                    <Input
                      id="editGwRate"
                      type="number" min="0" max="100" step="0.1"
                      value={editGatewayRate}
                      onChange={(e) => setEditGatewayRate(e.target.value)}
                      className="w-24"
                    />
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editGwFixed" className="text-xs font-medium text-muted-foreground">
                    Phí cổng cố định (VNĐ)
                  </Label>
                  <Input
                    id="editGwFixed"
                    type="number" min="0" step="500"
                    value={editGatewayFixed}
                    onChange={(e) => setEditGatewayFixed(e.target.value)}
                    className="w-32"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editClearance" className="text-xs font-medium text-muted-foreground">
                    Thời gian khoá (ngày)
                  </Label>
                  <div className="flex items-center gap-1">
                    <Input
                      id="editClearance"
                      type="number" min="0" max="90" step="1"
                      value={editClearanceDays}
                      onChange={(e) => setEditClearanceDays(e.target.value)}
                      className="w-20"
                    />
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button size="sm" onClick={handleSaveConfig} disabled={updateConfig.isPending}>
                  {updateConfig.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Huỷ</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-6 flex-wrap">
              <div className="grid gap-4 sm:grid-cols-4 flex-1">
                <div>
                  <p className="text-xs text-muted-foreground">Hoa hồng</p>
                  <p className="text-xl font-bold font-display">{Math.round(globalRate * 100)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phí cổng (%)</p>
                  <p className="text-xl font-bold font-display">{(gatewayFeeRate * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phí cổng cố định</p>
                  <p className="text-xl font-bold font-display">{formatVND(gatewayFeeFixed)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Thời gian khoá</p>
                  <p className="text-xl font-bold font-display">{clearanceDays} ngày</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={startEditing}>
                <Settings className="mr-2 h-4 w-4" />
                Thay đổi
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Table */}
      <DataTable
        title="Lịch sử phân chia doanh thu"
        description="Chi tiết từng lần chia hoa hồng từ giao dịch mua khoá học"
        data={reportData?.data ?? []}
        enablePagination={false}
        columns={[
          {
            key: 'createdAt',
            header: 'Thời gian',
            render: (r) => new Date(r.createdAt).toLocaleDateString('vi-VN'),
          },
          {
            key: 'sellerId',
            header: 'Seller',
            render: (r) => (
              <span className="font-mono text-xs">{r.sellerId.slice(0, 8)}...</span>
            ),
          },
          {
            key: 'totalAmount',
            header: 'Gross',
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
            key: 'commissionAmount',
            header: 'Platform',
            render: (r) => (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                +{formatVND(r.commissionAmount)}
              </span>
            ),
          },
          {
            key: 'sellerAmount',
            header: 'Seller',
            render: (r) => (
              <span className="text-muted-foreground">{formatVND(r.sellerAmount)}</span>
            ),
          },
          {
            key: 'status',
            header: 'Trạng thái',
            render: (r) => {
              if (r.status === 'PENDING') {
                return (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs">
                    <Clock className="mr-1 h-3 w-3" /> Khoá
                  </Badge>
                );
              }
              if (r.status === 'RELEASED') {
                return (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-xs">
                    Đã mở
                  </Badge>
                );
              }
              return (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/30 text-xs">
                  Sẵn sàng
                </Badge>
              );
            },
          },
        ]}
      />

      {/* Pagination */}
      {reportData && reportData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {page} / {reportData.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= reportData.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Tiếp
          </Button>
        </div>
      )}
    </div>
  );
}
