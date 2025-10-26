import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, CreditCard, Calendar } from 'lucide-react';
import { mockTransactions, mockUsers } from '@/data/admin-mock';
import { Transaction } from '@/types/admin';

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
      
      if (period !== 'all') {
        filtered = filtered.filter(t => new Date(t.createdAt) >= filterDate);
      }
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [startDate, endDate, period, transactionType]);

  // Tính toán thống kê
  const stats = useMemo(() => {
    const totalRevenue = filteredTransactions.reduce((sum, t) => {
      // Chỉ tính PAYMENT và MONTHLYFEE là revenue, DEPOSIT và WITHDRAW không phải
      if (t.transactionType === 'PAYMENT' || t.transactionType === 'MONTHLYFEE') {
        return sum + t.amount;
      }
      return sum;
    }, 0);

    const totalTransactions = filteredTransactions.length;
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return {
      totalRevenue,
      totalTransactions,
      averageTransaction
    };
  }, [filteredTransactions]);

  // Tạo dữ liệu cho biểu đồ
  const chartData = useMemo(() => {
    const dailyRevenue = new Map();
    
    filteredTransactions.forEach(transaction => {
      if (transaction.transactionType === 'PAYMENT' || transaction.transactionType === 'MONTHLYFEE') {
        const date = new Date(transaction.createdAt).toISOString().split('T')[0];
        const current = dailyRevenue.get(date) || 0;
        dailyRevenue.set(date, current + transaction.amount);
      }
    });

    return Array.from(dailyRevenue.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Lấy 30 ngày gần nhất
  }, [filteredTransactions]);

  // Phân trang
  const paginatedTransactions = useMemo(() => {
    const limitNum = parseInt(limit);
    const startIndex = (page - 1) * limitNum;
    return filteredTransactions.slice(startIndex, startIndex + limitNum);
  }, [filteredTransactions, page, limit]);

  const totalPages = Math.ceil(filteredTransactions.length / parseInt(limit));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeBadge = (type: string) => {
    const variants = {
      PAYMENT: 'default',
      DEPOSIT: 'secondary',
      MONTHLYFEE: 'outline',
      WITHDRAW: 'destructive'
    } as const;

    const labels = {
      PAYMENT: 'Thanh toán',
      DEPOSIT: 'Nạp tiền',
      MONTHLYFEE: 'Phí hàng tháng',
      WITHDRAW: 'Rút tiền'
    };

    return (
      <Badge variant={variants[type as keyof typeof variants] || 'default'}>
        {labels[type as keyof typeof labels] || type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý Doanh thu</h1>
        <p className="text-muted-foreground">
          Theo dõi và phân tích doanh thu từ các giao dịch
        </p>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng giao dịch</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giao dịch trung bình</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.averageTransaction)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Biểu đồ doanh thu */}
      <Card>
        <CardHeader>
          <CardTitle>Biểu đồ doanh thu theo ngày</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
                labelFormatter={(label) => `Ngày: ${label}`}
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
        </CardContent>
      </Card>

      {/* Bộ lọc */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Ngày bắt đầu</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Ngày kết thúc</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Khoảng thời gian</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="today">Hôm nay</SelectItem>
                  <SelectItem value="week">7 ngày qua</SelectItem>
                  <SelectItem value="month">30 ngày qua</SelectItem>
                  <SelectItem value="quarter">3 tháng qua</SelectItem>
                  <SelectItem value="year">1 năm qua</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Loại giao dịch</label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="PAYMENT">Thanh toán</SelectItem>
                  <SelectItem value="DEPOSIT">Nạp tiền</SelectItem>
                  <SelectItem value="MONTHLYFEE">Phí hàng tháng</SelectItem>
                  <SelectItem value="WITHDRAW">Rút tiền</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Số lượng/trang</label>
              <Select value={limit} onValueChange={setLimit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setPeriod('all');
                  setTransactionType('all');
                  setPage(1);
                }}
                variant="outline"
                className="w-full"
              >
                Đặt lại
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bảng giao dịch */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết giao dịch</CardTitle>
          <p className="text-sm text-muted-foreground">
            Hiển thị {paginatedTransactions.length} trong tổng số {filteredTransactions.length} giao dịch
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã giao dịch</TableHead>
                <TableHead>Người dùng</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.map((transaction) => {
                const user = getUserFromWalletId(transaction.walletId);
                return (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-sm">
                      {transaction.id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user?.fullName || 'Unknown User'}</div>
                        <div className="text-sm text-muted-foreground">{user?.email || transaction.walletId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTransactionTypeBadge(transaction.transactionType)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={transaction.description}>
                        {transaction.description || 'Không có mô tả'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(transaction.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
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
        </CardContent>
      </Card>
    </div>
  );
}