import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, CreditCard, Calendar } from 'lucide-react';
import { revenueManagementService } from '@/lib/api/services';
import { Transaction } from '@/types/type';
import type { RevenueFilters } from '@/lib/api/types/revenue.types';
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import DataTable from '@/components/admin/DataTable';

export default function RevenueManagement() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [period, setPeriod] = useState<RevenueFilters['period']>('all');
  const [transactionType, setTransactionType] = useState<RevenueFilters['transactionType']>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Build filters object
  const filters: RevenueFilters = {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    period,
    transactionType,
    page,
    limit
  };

  // Fetch revenue data from API
  const { data: revenueData, isLoading, error } = useQuery({
    queryKey: ['adminRevenue', filters],
    queryFn: () => revenueManagementService.getRevenueData(filters),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const stats = revenueData?.data?.stats;
  const chartData = revenueData?.data?.chartData || [];
  const transactions = revenueData?.data?.transactions || [];
  const pagination = revenueData?.data?.pagination;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      'DEPOSIT': { label: 'Nạp tiền', variant: 'default' as const },
      'PAYMENT': { label: 'Thanh toán', variant: 'secondary' as const },
      'MONTHLYFEE': { label: 'Phí hàng tháng', variant: 'outline' as const },
      'WITHDRAW': { label: 'Rút tiền', variant: 'destructive' as const }
    };

    const typeInfo = typeMap[type as keyof typeof typeMap] || { label: type, variant: 'outline' as const };
    return <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>;
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setPeriod('all');
    setTransactionType('all');
    setPage(1);
  };

  const columns = [
    {
      key: 'type',
      header: 'Loại',
      render: (transaction: Transaction) => getTypeBadge(transaction.transactionType)
    },
    {
      key: 'amount',
      header: 'Số tiền',
      className: 'text-right',
      render: (transaction: Transaction) => (
        <div className="font-medium">{formatCurrency(Number(transaction.amount))}</div>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (transaction: Transaction) => (
        <Badge variant={transaction.status === 'SUCCESS' ? 'default' : 'destructive'}>
          {transaction.status === 'SUCCESS' ? 'Thành công' :
           transaction.status === 'PENDING' ? 'Chờ xử lý' : 'Thất bại'}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      header: 'Thời gian',
      render: (transaction: Transaction) => (
        <div className="text-sm">
          {new Date(transaction.createdAt).toLocaleString('vi-VN')}
        </div>
      )
    }
  ];

  const periodOptions = [
    { value: 'all', label: 'Tất cả thời gian' },
    { value: 'today', label: 'Hôm nay' },
    { value: 'week', label: '7 ngày qua' },
    { value: 'month', label: '30 ngày qua' },
    { value: 'quarter', label: '3 tháng qua' },
    { value: 'year', label: '1 năm qua' }
  ];

  const typeOptions = [
    { value: 'all', label: 'Tất cả loại' },
    { value: 'DEPOSIT', label: 'Nạp tiền' },
    { value: 'PAYMENT', label: 'Thanh toán' },
    { value: 'MONTHLYFEE', label: 'Phí hàng tháng' },
    { value: 'WITHDRAW', label: 'Rút tiền' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Đang tải dữ liệu doanh thu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-destructive">Có lỗi xảy ra khi tải dữ liệu</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý doanh thu</h1>
        <p className="text-muted-foreground">
          Theo dõi và phân tích doanh thu từ các giao dịch
        </p>
      </div>

            {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-4">
            <div className="flex gap-2">
              <select
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value as RevenueFilters['period']);
                  setPage(1);
                }}
                className="px-3 py-2 border border-input rounded-md text-sm"
                title="Chọn khoảng thời gian"
              >
                {periodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={transactionType}
                onChange={(e) => {
                  setTransactionType(e.target.value as RevenueFilters['transactionType']);
                  setPage(1);
                }}
                className="px-3 py-2 border border-input rounded-md text-sm"
                title="Lọc theo loại giao dịch"
              >
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex space-x-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-input rounded-md text-sm"
              placeholder="Từ ngày"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-input rounded-md text-sm"
              placeholder="Đến ngày"
            />
            <Button variant="outline" onClick={handleClearFilters}>
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Tổng doanh thu"
          value={stats?.totalRevenue ? formatCurrency(stats.totalRevenue) : 'N/A'}
          description={`${stats?.totalTransactions || 0} giao dịch`}
          icon={DollarSign}
          trend={stats?.revenueGrowth ? {
            value: stats.revenueGrowth,
            label: `${stats.revenueGrowth.toFixed(1)}%`,
            isPositive: stats.revenueGrowth >= 0
          } : undefined}
        />
        <StatCard
          title="Số giao dịch"
          value={(stats?.totalTransactions || 0).toString()}
          description="Giao dịch thành công"
          icon={CreditCard}
        />
      </div>

      {/* Revenue Chart */}
      <ChartCard
        title="Biểu đồ doanh thu"
        description="Doanh thu theo thời gian"
      >
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
                labelFormatter={(label) => `Thời gian: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ fill: '#8884d8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Chưa có dữ liệu doanh thu
          </div>
        )}
      </ChartCard>



      {/* Transactions Table */}
      <DataTable
        title="Chi tiết giao dịch"
        description={`Hiển thị ${transactions.length} trong tổng số ${pagination?.total || 0} giao dịch`}
        data={transactions}
        columns={columns}
        emptyMessage="Không có giao dịch nào trong khoảng thời gian này"
      />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Trang {pagination.page} trong {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={page === pagination.totalPages}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
