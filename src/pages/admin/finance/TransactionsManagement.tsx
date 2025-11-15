import { useState } from 'react';
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
import { mockTransactions } from '@/data/mock';
import { Transaction } from '@/types/type';
import DataTable from '@/components/admin/DataTable';
import FilterSection from '@/components/admin/FilterSection';

export default function TransactionsManagement() {
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      render: (transaction: Transaction) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getTypeIcon(transaction.transactionType)}
          </div>
          <div>
            <div className="font-medium">{transaction.description || 'Không có mô tả'}</div>
            <div className="text-sm text-muted-foreground">ID: {transaction.id}</div>
          </div>
        </div>
      )
    },
    {
      key: 'wallet',
      header: 'Ví',
      render: (transaction: Transaction) => (
        <div>
          <div className="font-medium">ID: {transaction.walletId}</div>
          <div className="text-sm text-muted-foreground">
            Số dư: {transaction.wallet ? formatCurrency(transaction.wallet.allowance) : 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Số tiền',
      render: (transaction: Transaction) => (
        <div className="text-right">
          <div className="font-medium">{formatCurrency(transaction.amount)}</div>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Loại',
      render: (transaction: Transaction) => getTypeBadge(transaction.transactionType)
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (transaction: Transaction) => getStatusBadge(transaction.status)
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (transaction: Transaction) => new Date(transaction.createdAt).toLocaleDateString('vi-VN')
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (transaction: Transaction) => (
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý giao dịch</h1>
        <p className="text-muted-foreground">
          Theo dõi và quản lý tất cả giao dịch trong hệ thống
        </p>
      </div>

      <FilterSection
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm kiếm theo mô tả, tên người dùng hoặc email..."
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: statusOptions,
            placeholder: "Lọc theo trạng thái"
          },
          {
            value: typeFilter,
            onChange: setTypeFilter,
            options: typeOptions,
            placeholder: "Lọc theo loại"
          }
        ]}
      />

      <DataTable
        title="Danh sách giao dịch"
        description={`Tổng cộng ${transactions.length} giao dịch`}
        data={filteredTransactions}
        columns={columns}
        emptyMessage="Không tìm thấy giao dịch nào"
      />

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
                    <p className="text-lg font-semibold">{formatCurrency(selectedTransaction.amount)}</p>
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

              {/* User Information */}
               <div>
                 <h3 className="text-lg font-semibold mb-3">Thông tin ví</h3>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-sm font-medium">ID ví</label>
                     <p className="text-sm text-muted-foreground font-mono">{selectedTransaction.walletId}</p>
                   </div>
                   <div>
                     <label className="text-sm font-medium">Số dư ví hiện tại</label>
                     <p className="text-sm text-muted-foreground">{formatCurrency(selectedTransaction.wallet.allowance)}</p>
                   </div>
                 </div>
               </div>

              {/* Related Information */}
              {(selectedTransaction.topupOrderId || selectedTransaction.subscriptionContractId) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Thông tin liên quan</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedTransaction.topupOrderId && (
                      <div>
                        <label className="text-sm font-medium">ID đơn nạp tiền</label>
                        <p className="text-sm text-muted-foreground font-mono">{selectedTransaction.topupOrderId}</p>
                      </div>
                    )}
                    {selectedTransaction.subscriptionContractId && (
                      <div>
                        <label className="text-sm font-medium">ID hợp đồng đăng ký</label>
                        <p className="text-sm text-muted-foreground font-mono">{selectedTransaction.subscriptionContractId}</p>
                      </div>
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