import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  { labelKey: string; variant: "default" | "secondary" | "destructive"; icon: typeof Clock }
> = {
  PENDING: { labelKey: "statusPending", variant: "secondary", icon: Clock },
  APPROVED: { labelKey: "statusApproved", variant: "default", icon: CheckCircle2 },
  COMPLETED: { labelKey: "statusCompleted", variant: "default", icon: CheckCircle2 },
  REJECTED: { labelKey: "statusRejected", variant: "destructive", icon: XCircle },
};

export default function Refunds() {
  const { t, i18n } = useTranslation("account");
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-GB";
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
      toast.success(t("refunds.toasts.submitSuccess"));
      setRequestFor(null);
      setReason("");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err instanceof Error ? err.message : t("refunds.toasts.submitError"));
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
          <h1 className="text-2xl font-bold tracking-tight">{t("refunds.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("refunds.subtitle")}</p>
        </div>
      </div>

      {refunds.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t("refunds.myRequests")}</h2>
          <div className="space-y-2">
            {refunds.map((r) => {
              const { labelKey, variant, icon: Icon } = STATUS[r.status];
              return (
                <Card key={r.id}>
                  <CardContent className="p-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <Badge variant={variant}>{t(`refunds.${labelKey}`)}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleString(dateLocale)}
                        </span>
                      </div>
                      <div className="text-sm">
                        {t("refunds.orderLabel")}{" "}
                        <span className="font-mono text-xs">{r.orderId.slice(0, 8)}…</span> —{" "}
                        <span className="font-bold">{formatVND(Number(r.amount))}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {t("refunds.reasonLabel")}: {r.reason}
                      </div>
                      {r.adminNote && (
                        <div className="text-xs mt-2 rounded border-l-2 border-primary bg-muted/40 px-2 py-1">
                          <span className="font-medium">{t("refunds.adminNote")}:</span> {r.adminNote}
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
        <h2 className="text-lg font-semibold">{t("refunds.myOrders")}</h2>
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              {t("refunds.emptyOrders")}
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
                        {new Date(order.createdAt).toLocaleString(dateLocale)}
                      </div>
                    </div>
                    {existing ? (
                      <Badge variant={STATUS[existing.status].variant}>
                        {t(`refunds.${STATUS[existing.status].labelKey}`)}
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRequestFor(order.id)}
                      >
                        {t("refunds.requestRefund")}
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
            <DialogTitle>{t("refunds.dialog.title")}</DialogTitle>
            <DialogDescription>{t("refunds.dialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="refundReason">
              {t("refunds.dialog.reasonLabel")} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="refundReason"
              rows={4}
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("refunds.dialog.reasonPlaceholder")}
            />
            <p className="text-xs text-muted-foreground text-right">
              {t("refunds.dialog.counter", { count: reason.length })}
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
              {t("refunds.dialog.cancel")}
            </Button>
            <Button
              disabled={reason.trim().length < 10 || createMutation.isPending}
              onClick={() => {
                if (!requestFor) return;
                createMutation.mutate({ orderId: requestFor, reason: reason.trim() });
              }}
            >
              {createMutation.isPending ? t("refunds.dialog.submitting") : t("refunds.dialog.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
