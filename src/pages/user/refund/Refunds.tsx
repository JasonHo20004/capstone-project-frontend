import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useOrderHistory } from "@/hooks/api";
import {
  refundService,
  type RefundRequest,
  type RefundRequestStatus,
} from "@/lib/api/services/admin";
import { formatVND } from "@/lib/utils";

const STATUS: Record<
  RefundRequestStatus,
  { label: string; variant: "default" | "secondary" | "destructive"; icon: typeof Clock }
> = {
  PENDING: { label: "Đang chờ duyệt", variant: "secondary", icon: Clock },
  APPROVED: { label: "Đã duyệt", variant: "default", icon: CheckCircle2 },
  COMPLETED: { label: "Hoàn tất - đã cộng ví", variant: "default", icon: CheckCircle2 },
  REJECTED: { label: "Bị từ chối", variant: "destructive", icon: XCircle },
};

export default function Refunds() {
  const queryClient = useQueryClient();
  const [requestFor, setRequestFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const ordersQuery = useOrderHistory({ page: 1, limit: 50 });
  const refundsQuery = useQuery({
    queryKey: ["userRefunds"],
    queryFn: () => refundService.listMine({ page: 1, limit: 50 }),
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      refundService.create(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userRefunds"] });
      toast.success("Đã gửi yêu cầu hoàn tiền, admin sẽ xem xét sớm");
      setRequestFor(null);
      setReason("");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err instanceof Error ? err.message : "Tạo yêu cầu thất bại");
      toast.error(msg);
    },
  });

  const orders = ordersQuery.data?.data ?? [];
  const refunds = refundsQuery.data?.data ?? [];

  // Order has refund if there's an existing PENDING/APPROVED/COMPLETED refund.
  const refundByOrder = new Map<string, RefundRequest>();
  refunds.forEach((r) => {
    if (r.status !== "REJECTED") refundByOrder.set(r.orderId, r);
  });

  if (ordersQuery.isLoading || refundsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Receipt className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hoàn tiền</h1>
          <p className="text-sm text-muted-foreground">
            Yêu cầu hoàn tiền các đơn hàng đã mua. Tiền sẽ được cộng vào ví sau khi admin duyệt.
          </p>
        </div>
      </div>

      {refunds.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Yêu cầu của tôi</h2>
          <div className="space-y-2">
            {refunds.map((r) => {
              const { label, variant, icon: Icon } = STATUS[r.status];
              return (
                <Card key={r.id}>
                  <CardContent className="p-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <Badge variant={variant}>{label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div className="text-sm">
                        Đơn <span className="font-mono text-xs">{r.orderId.slice(0, 8)}…</span> —{" "}
                        <span className="font-bold">{formatVND(Number(r.amount))}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        Lý do: {r.reason}
                      </div>
                      {r.adminNote && (
                        <div className="text-xs mt-2 rounded border-l-2 border-primary bg-muted/40 px-2 py-1">
                          <span className="font-medium">Phản hồi admin:</span> {r.adminNote}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Đơn hàng của tôi</h2>
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Bạn chưa có đơn hàng nào.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => {
              const existing = refundByOrder.get(order.id);
              return (
                <Card key={order.id}>
                  <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs text-muted-foreground">
                        {order.id.slice(0, 8)}…
                      </div>
                      <div className="font-bold">{formatVND(Number(order.totalAmount))}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </div>
                    </div>
                    {existing ? (
                      <Badge variant={STATUS[existing.status].variant}>
                        {STATUS[existing.status].label}
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRequestFor(order.id)}
                      >
                        Yêu cầu hoàn tiền
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!requestFor} onOpenChange={(open) => !open && setRequestFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yêu cầu hoàn tiền</DialogTitle>
            <DialogDescription>
              Vui lòng nêu rõ lý do bạn muốn hoàn tiền cho đơn này. Admin sẽ xem xét và phản hồi trong vòng 3-5 ngày làm việc.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="refundReason">
              Lý do <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="refundReason"
              rows={4}
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Nội dung khoá học không đúng mô tả; giảng viên không phản hồi; chất lượng video kém..."
            />
            <p className="text-xs text-muted-foreground text-right">
              {reason.length}/1000 (tối thiểu 10 ký tự)
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRequestFor(null);
                setReason("");
              }}
            >
              Huỷ
            </Button>
            <Button
              disabled={reason.trim().length < 10 || createMutation.isPending}
              onClick={() => {
                if (!requestFor) return;
                createMutation.mutate({ orderId: requestFor, reason: reason.trim() });
              }}
            >
              {createMutation.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
