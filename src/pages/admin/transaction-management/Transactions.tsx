import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import {
  MoreHorizontal,
  Eye,
  Download,
  CreditCard,
  Wallet
} from 'lucide-react';
import { transactionManagementService } from '@/lib/api/services/admin';
import type { TransactionFilters, TransactionWithRelations } from '@/lib/api/types/transaction.types';
import DataTable from '@/components/admin/DataTable';

export default function TransactionsManagement() {
  // UI state (immediate updates)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<TransactionFilters['transactionType']>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Applied state (only updates on search button click)
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('all');
  const [appliedType, setAppliedType] = useState<TransactionFilters['transactionType']>('all');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');

  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithRelations | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Handle search button click - apply all filters
  const handleSearch = () => {
    setAppliedSearch(searchTerm);
    setAppliedStatus(statusFilter);
    setAppliedType(typeFilter);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setPage(1);
  };

  // Handle Enter key in search input
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Build filters using applied values
  const filters: TransactionFilters = {
    search: appliedSearch || undefined,
    status: appliedStatus === 'all' ? undefined : appliedStatus as any,
    transactionType: appliedType,
    startDate: appliedStartDate || undefined,
    endDate: appliedEndDate || undefined,
    page,
    limit
  };

  // Fetch transactions from API
  const { data: transactionsResp, isLoading, error } = useQuery({
    queryKey: ['adminTransactions', filters],
    queryFn: () => transactionManagementService.getTransactions(filters),
    refetchInterval: 30000,
  });

  const transactions = transactionsResp?.data?.transactions || [];
  const pagination = transactionsResp?.data?.pagination;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge variant="default">Thành công</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Đang xử lý</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Thất bại</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <Wallet className="h-4 w-4 text-green-600" />;
      case 'PAYMENT':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'MONTHLYFEE':
        return <CreditCard className="h-4 w-4 text-orange-600" />;
      case 'WITHDRAW':
        return <Wallet className="h-4 w-4 text-red-600" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const columns = [
    {
      key: 'transaction',
      header: 'Giao dịch',
      render: (transaction: TransactionWithRelations) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getTypeIcon(transaction.transactionType)}
          </div>
          <div>
            <div className="font-medium">{transaction.description || 'Không có mô tả'}</div>
            <div className="text-sm text-muted-foreground">ID: {transaction.id.substring(0, 8)}...</div>
          </div>
        </div>
      )
    },
    {
      key: 'user',
      header: 'Người dùng',
      render: (transaction: TransactionWithRelations) => (
        <div>
          <div className="font-medium">{transaction.wallet?.user?.fullName || 'N/A'}</div>
          <div className="text-sm text-muted-foreground">
            {transaction.wallet?.user?.email || 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Số tiền',
      render: (transaction: TransactionWithRelations) => (
        <div className="text-right">
          <div className="font-medium">{formatCurrency(Number(transaction.amount))}</div>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Loại',
      render: (transaction: TransactionWithRelations) => getTypeBadge(transaction.transactionType)
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (transaction: TransactionWithRelations) => getStatusBadge(transaction.status)
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (transaction: TransactionWithRelations) => new Date(transaction.createdAt).toLocaleString('vi-VN')
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (transaction: TransactionWithRelations) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Mở menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setSelectedTransaction(transaction)}>
              <Eye className="mr-2 h-4 w-4" />
              Xem chi tiết
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Xuất báo cáo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'SUCCESS', label: 'Thành công' },
    { value: 'PENDING', label: 'Đang xử lý' },
    { value: 'FAILED', label: 'Thất bại' }
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
        <div className="text-muted-foreground">Đang tải dữ liệu giao dịch...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-destructive">
          Có lỗi xảy ra khi tải dữ liệu: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý giao dịch</h1>
        <p className="text-muted-foreground">
          Theo dõi và quản lý tất cả giao dịch trong hệ thống
        </p>
      </div>

      <div className="space-y-4">
        {/* Row 1: Search and Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Tìm kiếm theo mô tả hoặc ID giao dịch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="flex h-10 w-[400px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Lọc theo trạng thái"
            className="px-3 py-2 border border-input rounded-md text-sm h-10"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={typeFilter || 'all'}
            onChange={(e) => setTypeFilter(e.target.value as TransactionFilters['transactionType'])}
            aria-label="Lọc theo loại giao dịch"
            className="px-3 py-2 border border-input rounded-md text-sm h-10"
          >
            {typeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Row 2: Date Range and Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="startDate" className="text-sm font-medium">Từ ngày:</label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-input rounded-md text-sm h-10"
          />
          <label htmlFor="endDate" className="text-sm font-medium">Đến ngày:</label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-input rounded-md text-sm h-10"
          />
          <Button onClick={handleSearch}>
            Tìm kiếm
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Clear UI state
              setSearchTerm('');
              setStatusFilter('all');
              setTypeFilter('all');
              setStartDate('');
              setEndDate('');
              // Clear applied state
              setAppliedSearch('');
              setAppliedStatus('all');
              setAppliedType('all');
              setAppliedStartDate('');
              setAppliedEndDate('');
              setPage(1);
            }}
          >
            Xóa tất cả bộ lọc
          </Button>
        </div>
      </div>

      <DataTable
        title="Danh sách giao dịch"
        description={`Hiển thị ${transactions.length} trong tổng số ${pagination?.total || 0} giao dịch`}
        data={transactions}
        columns={columns}
        emptyMessage="Không tìm thấy giao dịch nào"
      />

      {/* Pagination */}
      {pagination && pagination.total > limit && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Trang {page} trong {Math.ceil(pagination.total / limit)}
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
              onClick={() => setPage(page + 1)}
              disabled={page * limit >= pagination.total}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết giao dịch</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về giao dịch
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Transaction Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  {getTypeIcon(selectedTransaction.transactionType)}
                  <span className="ml-2">Thông tin giao dịch</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">ID giao dịch</label>
                    <p className="text-sm text-muted-foreground font-mono">{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Số tiền</label>
                    <p className="text-lg font-semibold">{formatCurrency(Number(selectedTransaction.amount))}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Loại giao dịch</label>
                    <div className="mt-1">{getTypeBadge(selectedTransaction.transactionType)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Trạng thái</label>
                    <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                  </div>
                </div>

                {selectedTransaction.description && (
                  <div className="mt-4">
                    <label className="text-sm font-medium">Mô tả</label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedTransaction.description}
                    </p>
                  </div>
                )}
              </div>

              {/* User & Wallet Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Thông tin người dùng</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Tên người dùng</label>
                    <p className="text-sm text-muted-foreground">{selectedTransaction.wallet?.user?.fullName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground">{selectedTransaction.wallet?.user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">ID ví</label>
                    <p className="text-sm text-muted-foreground font-mono">{selectedTransaction.wallet?.id || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Related Information */}
              {(selectedTransaction.topupOrder || selectedTransaction.order) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Thông tin liên quan</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedTransaction.topupOrder && (
                      <>
                        <div>
                          <label className="text-sm font-medium">ID đơn nạp tiền</label>
                          <p className="text-sm text-muted-foreground font-mono">{selectedTransaction.topupOrder.id}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Số tiền thực</label>
                          <p className="text-sm text-muted-foreground">{formatCurrency(selectedTransaction.topupOrder.realMoney)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Phương thức thanh toán</label>
                          <p className="text-sm text-muted-foreground">{selectedTransaction.topupOrder.paymentMethod}</p>
                        </div>
                      </>
                    )}
                    {selectedTransaction.order && (
                      <>
                        <div>
                          <label className="text-sm font-medium">ID đơn hàng</label>
                          <p className="text-sm text-muted-foreground font-mono">{selectedTransaction.order.id}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Tổng tiền đơn hàng</label>
                          <p className="text-sm text-muted-foreground">{formatCurrency(selectedTransaction.order.totalAmount)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Ngày tạo đơn</label>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedTransaction.order.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Thời gian</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium">Ngày tạo</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedTransaction.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
