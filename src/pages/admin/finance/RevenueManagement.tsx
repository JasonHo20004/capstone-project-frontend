import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, CreditCard, Calendar } from 'lucide-react';
import { mockTransactions, mockUsers } from '@/data/mock';
import { Transaction } from '@/types/type';
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import FilterSection from '@/components/admin/FilterSection';
import DataTable from '@/components/admin/DataTable';

export default function RevenueManagement() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [period, setPeriod] = useState('all');
  const [transactionType, setTransactionType] = useState('all');
  const [limit, setLimit] = useState('10');
  const [page, setPage] = useState(1);

  // Helper function to get user information from wallet userId
  const getUserFromWalletId = (walletId: string) => {
    return mockUsers.find(user => user.wallet?.id === walletId);
  };

  // Tính toán dữ liệu revenue từ transactions
  const filteredTransactions = useMemo(() => {
    let filtered = mockTransactions.filter(transaction => transaction.status === 'SUCCESS');

    // Lọc theo loại giao dịch
    if (transactionType !== 'all') {
      filtered = filtered.filter(t => t.transactionType === transactionType);
    }

    // Lọc theo khoảng thời gian
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.createdAt);
        return transactionDate >= start && transactionDate <= end;
      });
    } else if (period !== 'all') {
      const now = new Date();
      let filterDate = new Date();
      
      switch (period) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(t => new Date(t.createdAt) >= filterDate);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [startDate, endDate, period, transactionType]);

  // Tính toán thống kê
  const stats = useMemo(() => {
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalTransactions = filteredTransactions.length;
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    // Tính toán tăng trưởng so với kỳ trước
    const now = new Date();
    const previousPeriodStart = new Date();
    const currentPeriodStart = new Date();
    
    switch (period) {
      case 'today':
        previousPeriodStart.setDate(now.getDate() - 1);
        currentPeriodStart.setHours(0, 0, 0, 0);
        break;
      case 'week':
        previousPeriodStart.setDate(now.getDate() - 14);
        currentPeriodStart.setDate(now.getDate() - 7);
        break;
      case 'month':
        previousPeriodStart.setMonth(now.getMonth() - 2);
        currentPeriodStart.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        previousPeriodStart.setMonth(now.getMonth() - 6);
        currentPeriodStart.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        previousPeriodStart.setFullYear(now.getFullYear() - 2);
        currentPeriodStart.setFullYear(now.getFullYear() - 1);
        break;
      default:
        // For 'all', compare with previous month
        previousPeriodStart.setMonth(now.getMonth() - 2);
        currentPeriodStart.setMonth(now.getMonth() - 1);
    }
    
    const previousRevenue = mockTransactions
      .filter(t => t.status === 'SUCCESS')
      .filter(t => {
        const date = new Date(t.createdAt);
        return date >= previousPeriodStart && date < currentPeriodStart;
      })
      .reduce((sum, t) => sum + t.amount, 0);
    
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    
    return {
      totalRevenue,
      totalTransactions,
      averageTransaction,
      revenueGrowth
    };
  }, [filteredTransactions, period]);

  // Tạo dữ liệu cho biểu đồ
  const chartData = useMemo(() => {
    const dataMap = new Map();
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.createdAt);
      let key: string;
      
      switch (period) {
        case 'today':
          key = date.getHours().toString().padStart(2, '0') + ':00';
          break;
        case 'week':
          key = date.toLocaleDateString('vi-VN', { weekday: 'short' });
          break;
        case 'month':
          key = date.getDate().toString();
          break;
        case 'quarter':
        case 'year':
          key = date.toLocaleDateString('vi-VN', { month: 'short' });
          break;
        default:
          key = date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
      }
      
      if (!dataMap.has(key)) {
        dataMap.set(key, { name: key, revenue: 0, transactions: 0 });
      }
      
      const existing = dataMap.get(key);
      existing.revenue += transaction.amount;
      existing.transactions += 1;
    });
    
    return Array.from(dataMap.values()).sort((a, b) => {
      // Simple sorting - in real app, you'd want more sophisticated date sorting
      return a.name.localeCompare(b.name);
    });
  }, [filteredTransactions, period]);

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

  // Phân trang
  const itemsPerPage = parseInt(limit);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const columns = [
    {
      key: 'id',
      header: 'Mã giao dịch',
      render: (transaction: Transaction) => (
        <div className="font-mono text-sm">{transaction.id}</div>
      )
    },
    {
      key: 'type',
      header: 'Loại',
      render: (transaction: Transaction) => getTypeBadge(transaction.transactionType)
    },
    {
      key: 'amount',
      header: 'Số tiền',
      render: (transaction: Transaction) => (
        <div className="font-medium text-right">{formatCurrency(transaction.amount)}</div>
      )
    },
    {
      key: 'wallet',
      header: 'Ví',
      render: (transaction: Transaction) => (
        <div className="font-mono text-sm">{transaction.walletId}</div>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý doanh thu</h1>
        <p className="text-muted-foreground">
          Theo dõi và phân tích doanh thu từ các giao dịch
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng doanh thu"
          value={formatCurrency(stats.totalRevenue)}
          description={`${stats.totalTransactions} giao dịch`}
          icon={DollarSign}
          trend={{
            value: stats.revenueGrowth,
            label: `${stats.revenueGrowth.toFixed(1)}%`,
            isPositive: stats.revenueGrowth >= 0
          }}
        />
        <StatCard
          title="Số giao dịch"
          value={stats.totalTransactions.toString()}
          description="Giao dịch thành công"
          icon={CreditCard}
        />
        <StatCard
          title="Trung bình/giao dịch"
          value={formatCurrency(stats.averageTransaction)}
          description="Giá trị trung bình"
          icon={TrendingUp}
        />
        <StatCard
          title="Tăng trưởng"
          value={`${stats.revenueGrowth.toFixed(1)}%`}
          description="So với kỳ trước"
          icon={Calendar}
          trend={{
            value: stats.revenueGrowth,
            label: `${stats.revenueGrowth.toFixed(1)}%`,
            isPositive: stats.revenueGrowth >= 0
          }}
        />
      </div>

      {/* Revenue Chart */}
      <ChartCard
        title="Biểu đồ doanh thu"
        description="Doanh thu theo thời gian"
      >
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
      </ChartCard>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-4">
            <div className="flex gap-2">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
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
                onChange={(e) => setTransactionType(e.target.value)}
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
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-input rounded-md text-sm"
              placeholder="Từ ngày"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-input rounded-md text-sm"
              placeholder="Đến ngày"
            />
            <Button
              variant="outline"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setPeriod('all');
                setTransactionType('all');
              }}
            >
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <DataTable
        title="Chi tiết giao dịch"
        description={`Hiển thị ${paginatedTransactions.length} trong tổng số ${filteredTransactions.length} giao dịch`}
        data={paginatedTransactions}
        columns={columns}
        emptyMessage="Không có giao dịch nào trong khoảng thời gian này"
      />

      {/* Custom Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Trang {page} trong {totalPages}
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
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}