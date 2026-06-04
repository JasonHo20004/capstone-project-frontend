import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MoreHorizontal,
  Eye,
  Download,
  CreditCard,
  Wallet,
  Search as SearchIcon,
} from "lucide-react";
import { toast } from "sonner";
import { transactionManagementService } from "@/lib/api/services/admin";
import type {
  TransactionFilters,
  TransactionWithRelations,
} from "@/lib/api/types/transaction.types";
import type { TransactionStatus } from "@/domain";
import DataTable from "@/components/admin/DataTable";

export default function TransactionsManagement() {
  const [searchParams, setSearchParams] = useSearchParams();

  // UI state (immediate updates) — seeded from URL so refresh restores filters.
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all");
  const [typeFilter, setTypeFilter] = useState<TransactionFilters["transactionType"]>(
    (searchParams.get("type") as TransactionFilters["transactionType"]) ?? "all"
  );
  const [startDate, setStartDate] = useState(searchParams.get("startDate") ?? "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") ?? "");

  // Applied state (only updates on search button click) — also seeded from URL
  // so the initial query honors the URL filters.
  const [appliedSearch, setAppliedSearch] = useState(searchParams.get("q") ?? "");
  const [appliedStatus, setAppliedStatus] = useState(searchParams.get("status") ?? "all");
  const [appliedType, setAppliedType] = useState<TransactionFilters["transactionType"]>(
    (searchParams.get("type") as TransactionFilters["transactionType"]) ?? "all"
  );
  const [appliedStartDate, setAppliedStartDate] = useState(searchParams.get("startDate") ?? "");
  const [appliedEndDate, setAppliedEndDate] = useState(searchParams.get("endDate") ?? "");

  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithRelations | null>(null);
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

  // Mirror applied filters into the URL (after Search is pressed) — keeps URL
  // tied to what's actually being queried, not draft UI state.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (appliedSearch) next.set("q", appliedSearch); else next.delete("q");
    if (appliedStatus && appliedStatus !== "all") next.set("status", appliedStatus);
    else next.delete("status");
    if (appliedType && appliedType !== "all") next.set("type", appliedType);
    else next.delete("type");
    if (appliedStartDate) next.set("startDate", appliedStartDate); else next.delete("startDate");
    if (appliedEndDate) next.set("endDate", appliedEndDate); else next.delete("endDate");
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedSearch, appliedStatus, appliedType, appliedStartDate, appliedEndDate]);

  // Handle Enter key in search input
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Build filters using applied values
  const filters: TransactionFilters = {
    search: appliedSearch || undefined,
    status: appliedStatus === "all" ? undefined : appliedStatus as TransactionStatus,
    transactionType: appliedType,
    startDate: appliedStartDate || undefined,
    endDate: appliedEndDate || undefined,
    page,
    limit,
  };

  // Fetch transactions from API
  const {
    data: transactionsResp,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["adminTransactions", filters],
    queryFn: () => transactionManagementService.getTransactions(filters),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 15_000,
  });

  const [isExporting, setIsExporting] = useState(false);

  const transactions = transactionsResp?.data?.transactions || [];
  const pagination = transactionsResp?.data?.pagination;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <Badge variant="default">Thành công</Badge>;
      case "PENDING":
        return <Badge variant="secondary">Đang xử lý</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Thất bại</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      DEPOSIT: { label: "Nạp tiền", variant: "default" as const },
      PAYMENT: { label: "Thanh toán", variant: "secondary" as const },
      WITHDRAW: { label: "Rút tiền", variant: "destructive" as const },
    };

    const typeInfo = typeMap[type as keyof typeof typeMap] || {
      label: type,
      variant: "outline" as const,
    };
    return <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return <Wallet className="h-4 w-4 text-green-600" />;
      case "PAYMENT":
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case "WITHDRAW":
        return <Wallet className="h-4 w-4 text-red-600" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const escapeCsv = (val: unknown) => {
    const s = String(val ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const buildCsv = (rows: TransactionWithRelations[]) => {
    const headers = ["ID", "Loại", "Mô tả", "Người dùng", "Email", "Số tiền", "Trạng thái", "Thời gian"];
    const body = rows.map((t) => [
      t.id,
      t.transactionType,
      t.description ?? "",
      t.wallet?.user?.fullName ?? "",
      t.wallet?.user?.email ?? "",
      String(t.amount),
      t.status,
      new Date(t.createdAt).toISOString(),
    ]);
    return [headers, ...body].map((r) => r.map(escapeCsv).join(",")).join("\n");
  };

  const downloadCsv = (csv: string, suffix: string) => {
    // BOM ensures Excel reads UTF-8 (Vietnamese) correctly.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${suffix}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCurrentPage = () => {
    if (transactions.length === 0) {
      toast.info("Không có giao dịch nào để xuất");
      return;
    }
    downloadCsv(buildCsv(transactions), `page-${page}`);
    toast.success(`Đã xuất ${transactions.length} giao dịch (trang ${page})`);
  };

  const handleExportAll = async () => {
    if ((pagination?.total ?? 0) === 0) {
      toast.info("Không có giao dịch nào để xuất");
      return;
    }
    setIsExporting(true);
    try {
      // Pull the full filtered set in one request. Backend already caps via limit.
      const all = await transactionManagementService.getTransactions({
        ...filters,
        page: 1,
        limit: Math.max(pagination?.total ?? 0, 10_000),
      });
      const rows = all?.data?.transactions ?? [];
      if (rows.length === 0) {
        toast.info("Không có giao dịch nào để xuất");
        return;
      }
      downloadCsv(buildCsv(rows), "all");
      toast.success(`Đã xuất ${rows.length} giao dịch (toàn bộ filter)`);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err instanceof Error ? err.message : "Xuất CSV thất bại");
      toast.error(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleViewTransaction = async (transactionId: string) => {
    try {
      const response = await transactionManagementService.getTransactionById(transactionId);
      if (response.data?.transaction) {
        setSelectedTransaction(response.data.transaction);
      }
    } catch (error) {
      console.error('Failed to fetch transaction details:', error);
    }
  };

  const columns = [
    {
      key: "transaction",
      header: "Giao dịch",
      render: (transaction: TransactionWithRelations) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getTypeIcon(transaction.transactionType)}
          </div>
          <div>
            <div className="font-medium">
              {transaction.description || "Không có mô tả"}
            </div>
            <div className="text-sm text-muted-foreground">
              ID: {transaction.id.substring(0, 8)}...
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "user",
      header: "Người dùng",
      render: (transaction: TransactionWithRelations) => (
        <div>
          <div className="font-medium">
            {transaction.wallet?.user?.fullName || "N/A"}
          </div>
          <div className="text-sm text-muted-foreground">
            {transaction.wallet?.user?.email || "N/A"}
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Số tiền",
      sortValue: (t: TransactionWithRelations) => Number(t.amount),
      render: (transaction: TransactionWithRelations) => (
        <div className="text-right">
          <div className="font-medium">
            {formatCurrency(Number(transaction.amount))}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Loại",
      sortValue: (t: TransactionWithRelations) => t.transactionType,
      render: (transaction: TransactionWithRelations) =>
        getTypeBadge(transaction.transactionType),
    },
    {
      key: "status",
      header: "Trạng thái",
      sortValue: (t: TransactionWithRelations) => t.status,
      render: (transaction: TransactionWithRelations) =>
        getStatusBadge(transaction.status),
    },
    {
      key: "createdAt",
      header: "Ngày tạo",
      sortValue: (t: TransactionWithRelations) => new Date(t.createdAt),
      render: (transaction: TransactionWithRelations) =>
        new Date(transaction.createdAt).toLocaleString("vi-VN"),
    },
    {
      key: "actions",
      header: "Thao tác",
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
            <DropdownMenuItem
              onClick={() => handleViewTransaction(transaction.id)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Xem chi tiết
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const statusOptions = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "SUCCESS", label: "Thành công" },
    { value: "PENDING", label: "Đang xử lý" },
    { value: "FAILED", label: "Thất bại" },
  ];

  const typeOptions = [
    { value: "all", label: "Tất cả loại" },
    { value: "DEPOSIT", label: "Nạp tiền" },
    { value: "PAYMENT", label: "Thanh toán" },
    { value: "WITHDRAW", label: "Rút tiền" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <Skeleton className="h-9 flex-1 min-w-[260px]" />
              <Skeleton className="h-9 w-[180px]" />
              <Skeleton className="h-9 w-[180px]" />
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <Skeleton className="h-9 w-[180px]" />
              <Skeleton className="h-9 w-[180px]" />
              <Skeleton className="h-9 w-28 ml-auto" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-32" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-72" />
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-destructive">
          Có lỗi xảy ra khi tải dữ liệu:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
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

      <div className="space-y-4 rounded-lg border bg-card p-4">
        {/* Row 1: Search and Filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[260px] max-w-md space-y-1">
            <Label htmlFor="txSearch" className="text-xs text-muted-foreground">
              Tìm kiếm
            </Label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="txSearch"
                placeholder="Mô tả hoặc ID giao dịch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Trạng thái</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Loại</Label>
            <Select
              value={typeFilter || "all"}
              onValueChange={(value) =>
                setTypeFilter(value as TransactionFilters["transactionType"])
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Date Range and Action Buttons */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="startDate" className="text-xs text-muted-foreground">
              Từ ngày
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[180px]"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="endDate" className="text-xs text-muted-foreground">
              Đến ngày
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[180px]"
            />
          </div>
          <div className="flex gap-2 ml-auto">
            <Button onClick={handleSearch}>
              <SearchIcon className="mr-2 h-4 w-4" />
              Tìm kiếm
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setTypeFilter("all");
                setStartDate("");
                setEndDate("");
                setAppliedSearch("");
                setAppliedStatus("all");
                setAppliedType("all");
                setAppliedStartDate("");
                setAppliedEndDate("");
                setPage(1);
              }}
            >
              Xóa lọc
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting}>
                  <Download className="mr-2 h-4 w-4" />
                  {isExporting ? "Đang xuất..." : "Xuất CSV"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCurrentPage}>
                  Trang hiện tại ({transactions.length} giao dịch)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportAll}>
                  Toàn bộ kết quả lọc ({pagination?.total ?? 0} giao dịch)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <DataTable
        title="Danh sách giao dịch"
        description={`Hiển thị ${transactions.length} trong tổng số ${
          pagination?.total || 0
        } giao dịch`}
        data={transactions}
        columns={columns}
        emptyMessage="Không tìm thấy giao dịch nào"
        enablePagination={false}
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
      <Dialog
        open={!!selectedTransaction}
        onOpenChange={() => setSelectedTransaction(null)}
      >
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
                    <p className="text-sm text-muted-foreground font-mono">
                      {selectedTransaction.id}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Số tiền</label>
                    <p className="text-lg font-semibold">
                      {formatCurrency(Number(selectedTransaction.amount))}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Loại giao dịch
                    </label>
                    <div className="mt-1">
                      {getTypeBadge(selectedTransaction.transactionType)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Trạng thái</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedTransaction.status)}
                    </div>
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
                <h3 className="text-lg font-semibold mb-3">
                  Thông tin người dùng
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">
                      Tên người dùng
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {selectedTransaction.wallet?.user?.fullName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedTransaction.wallet?.user?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">ID ví</label>
                    <p className="text-sm text-muted-foreground font-mono">
                      {selectedTransaction.wallet?.id || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Topup Order Information (for DEPOSIT) */}
              {selectedTransaction.topupOrder && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Thông tin nạp tiền
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        ID đơn nạp tiền
                      </label>
                      <p className="text-sm text-muted-foreground font-mono">
                        {selectedTransaction.topupOrder.id}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Số tiền nạp
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(Number(selectedTransaction.topupOrder.realMoney))}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Phương thức thanh toán
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {selectedTransaction.topupOrder.paymentMethod}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Trạng thái
                      </label>
                      <div className="mt-1">
                        {getStatusBadge((selectedTransaction.topupOrder as { status?: string })?.status ?? '')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Information (for PAYMENT) */}
              {selectedTransaction.order && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Thông tin đơn hàng
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-sm font-medium">
                        ID đơn hàng
                      </label>
                      <p className="text-sm text-muted-foreground font-mono">
                        {selectedTransaction.order.id}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Tổng tiền
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(Number(selectedTransaction.order.totalAmount))}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Ngày tạo đơn
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedTransaction.order.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  {/* Cart Items */}
                  {/* {selectedTransaction.order.cart?.cartItems && selectedTransaction.order.cart.cartItems.length > 0 && (
                    <div className="mt-4">
                      <label className="text-sm font-medium mb-2 block">
                        Các khoá học đã mua
                      </label>
                      <div className="space-y-2">
                        {selectedTransaction.order.cart.cartItems.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{item.course?.title || 'N/A'}</p>
                              <p className="text-sm text-muted-foreground">
                                ID: {item.courseId}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {formatCurrency(Number(item.priceAtTime))}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )} */}
                </div>
              )}

              {/* Timestamps */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Thời gian</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium">Ngày tạo</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedTransaction.createdAt).toLocaleString(
                        "vi-VN"
                      )}
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
