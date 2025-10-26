import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Filter,
  Download,
  CreditCard,
  Wallet
} from 'lucide-react';
import { mockTransactions } from '@/data/admin-mock';
import { Transaction } from '@/types/admin';

export default function TransactionsManagement() {
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      // transaction.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // transaction.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesType = typeFilter === 'all' || transaction.transactionType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge className="bg-green-100 text-green-800">Thành công</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Đang xử lý</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800">Thất bại</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'COURSE_PURCHASE':
        return (
          <div className="flex items-center space-x-1">
            <CreditCard className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Mua khóa học</span>
          </div>
        );
      case 'WALLET_TOPUP':
        return (
          <div className="flex items-center space-x-1">
            <Wallet className="h-4 w-4 text-green-600" />
            <span className="text-sm">Nạp ví</span>
          </div>
        );
      default:
        return <span className="text-sm">{type}</span>;
    }
  };

  const getTotalStats = () => {
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    const successful = transactions.filter(t => t.status === 'SUCCESS').length;
    const pending = transactions.filter(t => t.status === 'PENDING').length;
    const failed = transactions.filter(t => t.status === 'FAILED').length;

    return { total, successful, pending, failed };
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý giao dịch</h1>
          <p className="text-muted-foreground">
            Theo dõi và quản lý tất cả giao dịch trong hệ thống
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Xuất báo cáo
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thành công</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang xử lý</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thất bại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách giao dịch</CardTitle>
          <CardDescription>
            Tổng cộng {transactions.length} giao dịch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, email hoặc mã giao dịch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="SUCCESS">Thành công</SelectItem>
                <SelectItem value="PENDING">Đang xử lý</SelectItem>
                <SelectItem value="FAILED">Thất bại</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Loại giao dịch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="COURSE_PURCHASE">Mua khóa học</SelectItem>
                <SelectItem value="WALLET_TOPUP">Nạp ví</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Lọc
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã giao dịch</TableHead>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="font-mono text-sm">{transaction.id}</div>
                    </TableCell>
                    {/* <TableCell>
                      <div>
                        <div className="font-medium">{transaction.user.fullName}</div>
                        <div className="text-sm text-muted-foreground">{transaction.user.email}</div>
                      </div>
                    </TableCell> */}
                    <TableCell>
                      {getTypeBadge(transaction.transactionType)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(transaction.amount)}</div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDate(transaction.createdAt)}</div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Eye className="mr-2 h-4 w-4" />
                                Xem chi tiết
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Chi tiết giao dịch</DialogTitle>
                                <DialogDescription>
                                  Thông tin chi tiết của giao dịch #{transaction.id}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Mã giao dịch</label>
                                    <p className="text-sm text-muted-foreground font-mono">{transaction.id}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Loại giao dịch</label>
                                    <div className="mt-1">{getTypeBadge(transaction.transactionType)}</div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Số tiền</label>
                                    <p className="text-sm text-muted-foreground font-medium">{formatCurrency(transaction.amount)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Trạng thái</label>
                                    <div className="mt-1">{getStatusBadge(transaction.status)}</div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Thời gian tạo</label>
                                    <p className="text-sm text-muted-foreground">{formatDate(transaction.createdAt)}</p>
                                  </div>
                                </div>
                                {/* <div>
                                  <label className="text-sm font-medium">Thông tin người dùng</label>
                                  <div className="mt-1 p-3 bg-muted rounded-lg">
                                    <p className="font-medium">{transaction.user.fullName}</p>
                                    <p className="text-sm text-muted-foreground">{transaction.user.email}</p>
                                    <p className="text-sm text-muted-foreground">ID: {transaction.user.id}</p>
                                  </div>
                                </div> */}
                                {transaction.description && (
                                  <div>
                                    <label className="text-sm font-medium">Mô tả</label>
                                    <p className="text-sm text-muted-foreground mt-1">{transaction.description}</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}