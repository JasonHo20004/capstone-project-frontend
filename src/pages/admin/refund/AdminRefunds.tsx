import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DataTable from "@/components/admin/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  refundService,
  auditLogService,
  type RefundRequest,
  type RefundRequestStatus,
} from "@/lib/api/services/admin";
import { Receipt, Check, X, Eye, RefreshCw } from "lucide-react";

const STATUS_LABEL: Record<
  RefundRequestStatus,
  { text: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { text: "Chờ duyệt", variant: "secondary" },
  APPROVED: { text: "Đã duyệt", variant: "default" },
  COMPLETED: { text: "Hoàn tất", variant: "default" },
  REJECTED: { text: "Từ chối", variant: "destructive" },
};

const formatVND = (val: number | string) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(val));

export default function AdminRefunds() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RefundRequestStatus | "all">("PENDING");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<RefundRequest | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const { data, isLoading, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["adminRefunds", status, page],
    queryFn: () =>
      refundService.listAdmin({
        page,
        limit: 20,
        status: status !== "all" ? status : undefined,
      }),
    // Polling removed — silent refetches were stealing focus mid-review.
    // Sidebar still polls /pending counts; admin can refresh manually.
    staleTime: 30_000,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      refundService.approve(id, note),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["adminRefunds"] });
      toast.success("Đã duyệt hoàn tiền");
      if (selected) {
        auditLogService
          .record({
            action: "REFUND_APPROVE",
            entityType: "REFUND",
            entityId: vars.id,
            reason: vars.note,
            metadata: {
              orderId: selected.orderId,
              requesterId: selected.requesterId,
              amount: selected.amount,
            },
          })
          .catch((err) => console.error("[Audit] refund approve log failed:", err));
      }
      setAction(null);
      setAdminNote("");
      setSelected(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err instanceof Error ? err.message : "Duyệt thất bại");
      toast.error(msg);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      refundService.reject(id, note),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["adminRefunds"] });
      toast.success("Đã từ chối yêu cầu");
      if (selected) {
        auditLogService
          .record({
            action: "REFUND_REJECT",
            entityType: "REFUND",
            entityId: vars.id,
            reason: vars.note,
            metadata: {
              orderId: selected.orderId,
              requesterId: selected.requesterId,
              amount: selected.amount,
            },
          })
          .catch((err) => console.error("[Audit] refund reject log failed:", err));
      }
      setAction(null);
      setAdminNote("");
      setSelected(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err instanceof Error ? err.message : "Từ chối thất bại");
      toast.error(msg);
    },
  });

  const refunds = data?.data ?? [];
  const pagination = data?.pagination;

  const stats = {
    pending: refunds.filter((r) => r.status === "PENDING").length,
    totalPendingAmount: refunds
      .filter((r) => r.status === "PENDING")
      .reduce((sum, r) => sum + Number(r.amount), 0),
  };

  const columns = [
    {
      key: "createdAt",
      header: "Thời gian",
      sortValue: (r: RefundRequest) => new Date(r.createdAt),
      render: (r: RefundRequest) => (
        <div className="text-sm">{new Date(r.createdAt).toLocaleString("vi-VN")}</div>
      ),
    },
    {
      key: "order",
      header: "Đơn hàng",
      render: (r: RefundRequest) => (
        <div className="text-sm">
          <div className="font-mono text-xs">{r.orderId.slice(0, 8)}…</div>
          <div className="text-muted-foreground">{formatVND(r.amount)}</div>
        </div>
      ),
    },
    {
      key: "requester",
      header: "Người yêu cầu",
      render: (r: RefundRequest) => (
        <div className="font-mono text-xs">{r.requesterId.slice(0, 8)}…</div>
      ),
    },
    {
      key: "reason",
      header: "Lý do",
      render: (r: RefundRequest) => (
        <div className="text-sm text-muted-foreground line-clamp-2 max-w-sm">
          {r.reason}
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      sortValue: (r: RefundRequest) => r.status,
      render: (r: RefundRequest) => (
        <Badge variant={STATUS_LABEL[r.status].variant}>{STATUS_LABEL[r.status].text}</Badge>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (r: RefundRequest) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelected(r)}>
            <Eye className="h-4 w-4" />
          </Button>
          {r.status === "PENDING" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-green-600"
                onClick={() => {
                  setSelected(r);
                  setAction("approve");
                }}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={() => {
                  setSelected(r);
                  setAction("reject");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Card>
          <CardContent className="p-6 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Receipt className="h-7 w-7 text-primary mt-1" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Yêu cầu hoàn tiền</h1>
          <p className="text-muted-foreground">
            Duyệt yêu cầu hoàn tiền từ học viên. Khi duyệt, tiền được cộng vào ví học viên và doanh thu seller cho đơn đó bị đánh dấu REFUNDED.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          {dataUpdatedAt > 0 && (
            <span className="text-[10px] text-muted-foreground">
              Cập nhật: {new Date(dataUpdatedAt).toLocaleTimeString('vi-VN')}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Chờ duyệt</div>
            <div className="text-2xl font-bold">{stats.pending} yêu cầu</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Tổng tiền pending</div>
            <div className="text-2xl font-bold text-amber-600">
              {formatVND(stats.totalPendingAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Trạng thái</Label>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v as RefundRequestStatus | "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                  <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                  <SelectItem value="COMPLETED">Hoàn tất</SelectItem>
                  <SelectItem value="REJECTED">Từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Danh sách"
        description={`Tổng ${pagination?.total ?? 0} yêu cầu`}
        data={refunds}
        columns={columns}
        emptyMessage="Chưa có yêu cầu nào"
        enablePagination={false}
      />

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Trang {page} / {pagination.totalPages}
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
              disabled={page >= pagination.totalPages}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!selected && !action} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu hoàn tiền</DialogTitle>
            <DialogDescription>
              {selected && `Tạo lúc ${new Date(selected.createdAt).toLocaleString("vi-VN")}`}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Đơn hàng</Label>
                  <p className="font-mono text-xs">{selected.orderId}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Số tiền</Label>
                  <p className="font-bold">{formatVND(selected.amount)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Người yêu cầu</Label>
                  <p className="font-mono text-xs">{selected.requesterId}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Trạng thái</Label>
                  <Badge variant={STATUS_LABEL[selected.status].variant} className="mt-1">
                    {STATUS_LABEL[selected.status].text}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Lý do của học viên</Label>
                <p className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/30 p-3">
                  {selected.reason}
                </p>
              </div>
              {selected.adminNote && (
                <div>
                  <Label className="text-xs text-muted-foreground">Ghi chú admin</Label>
                  <p className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/30 p-3">
                    {selected.adminNote}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!action}
        onOpenChange={(open) => {
          if (!open) {
            setAction(null);
            setAdminNote("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Duyệt hoàn tiền" : "Từ chối hoàn tiền"}
            </DialogTitle>
            <DialogDescription>
              {selected && (
                <>
                  Đơn <span className="font-mono">{selected.orderId.slice(0, 8)}</span> —{" "}
                  <span className="font-bold">{formatVND(selected.amount)}</span>
                  {action === "approve" && (
                    <span className="block mt-2 text-amber-600">
                      Tiền sẽ được cộng vào ví học viên và doanh thu seller cho đơn này sẽ bị đánh dấu REFUNDED.
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="adminNote">
              Ghi chú {action === "reject" && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="adminNote"
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={
                action === "approve"
                  ? "Tuỳ chọn — thêm ghi chú nội bộ"
                  : "Bắt buộc — lý do từ chối hiển thị cho học viên"
              }
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAction(null);
                setAdminNote("");
              }}
            >
              Huỷ
            </Button>
            <Button
              variant={action === "reject" ? "destructive" : "default"}
              disabled={
                (action === "reject" && !adminNote.trim()) ||
                approveMutation.isPending ||
                rejectMutation.isPending
              }
              onClick={() => {
                if (!selected) return;
                if (action === "approve") {
                  approveMutation.mutate({ id: selected.id, note: adminNote.trim() || undefined });
                } else if (action === "reject") {
                  rejectMutation.mutate({ id: selected.id, note: adminNote.trim() });
                }
              }}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
