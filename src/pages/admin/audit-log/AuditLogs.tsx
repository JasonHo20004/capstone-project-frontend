import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DataTable from "@/components/admin/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  auditLogService,
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITIES,
  type AdminAuditAction,
  type AdminAuditEntity,
  type AdminAuditLog,
} from "@/lib/api/services/admin";
import { Search as SearchIcon, FileText, Eye } from "lucide-react";

const ACTION_LABELS: Record<AdminAuditAction, string> = {
  WALLET_ADJUST: "Điều chỉnh ví",
  USER_STATUS_CHANGE: "Đổi trạng thái user",
  USER_DELETE: "Xóa user",
  APPLICATION_APPROVE: "Duyệt đơn seller",
  APPLICATION_REJECT: "Từ chối đơn seller",
  COURSE_APPROVE: "Duyệt khoá học",
  COURSE_REJECT: "Từ chối khoá học",
  COMMENT_MODERATE: "Kiểm duyệt bình luận",
  WITHDRAWAL_APPROVE: "Duyệt rút tiền",
  WITHDRAWAL_REJECT: "Từ chối rút tiền",
  REFUND_APPROVE: "Duyệt hoàn tiền",
  REFUND_REJECT: "Từ chối hoàn tiền",
  OTHER: "Khác",
};

const ENTITY_LABELS: Record<AdminAuditEntity, string> = {
  USER: "Người dùng",
  WALLET: "Ví",
  APPLICATION: "Đơn đăng ký",
  COURSE: "Khoá học",
  COMMENT: "Bình luận",
  WITHDRAWAL: "Rút tiền",
  REFUND: "Hoàn tiền",
  OTHER: "Khác",
};

const ACTION_VARIANT: Record<AdminAuditAction, "default" | "destructive" | "secondary"> = {
  WALLET_ADJUST: "secondary",
  USER_STATUS_CHANGE: "destructive",
  USER_DELETE: "destructive",
  APPLICATION_APPROVE: "default",
  APPLICATION_REJECT: "destructive",
  COURSE_APPROVE: "default",
  COURSE_REJECT: "destructive",
  COMMENT_MODERATE: "secondary",
  WITHDRAWAL_APPROVE: "default",
  WITHDRAWAL_REJECT: "destructive",
  REFUND_APPROVE: "default",
  REFUND_REJECT: "destructive",
  OTHER: "secondary",
};

export default function AuditLogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [action, setAction] = useState<AdminAuditAction | "all">(
    (searchParams.get("action") as AdminAuditAction) ?? "all",
  );
  const [entityType, setEntityType] = useState<AdminAuditEntity | "all">(
    (searchParams.get("entityType") as AdminAuditEntity) ?? "all",
  );
  const [entityId, setEntityId] = useState(searchParams.get("entityId") ?? "");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminAuditLog | null>(null);

  const filters = {
    page,
    limit: 50,
    action: action !== "all" ? action : undefined,
    entityType: entityType !== "all" ? entityType : undefined,
    entityId: entityId || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["adminAuditLogs", filters],
    queryFn: () => auditLogService.list(filters),
  });

  const logs = data?.data ?? [];
  const pagination = data?.pagination;

  const applyFilters = () => {
    const next = new URLSearchParams();
    if (action !== "all") next.set("action", action);
    if (entityType !== "all") next.set("entityType", entityType);
    if (entityId) next.set("entityId", entityId);
    setSearchParams(next, { replace: true });
    setPage(1);
  };

  const resetFilters = () => {
    setAction("all");
    setEntityType("all");
    setEntityId("");
    setSearchParams(new URLSearchParams(), { replace: true });
    setPage(1);
  };

  const columns = [
    {
      key: "createdAt",
      header: "Thời gian",
      sortValue: (log: AdminAuditLog) => new Date(log.createdAt),
      render: (log: AdminAuditLog) => (
        <div className="text-sm">{new Date(log.createdAt).toLocaleString("vi-VN")}</div>
      ),
    },
    {
      key: "actor",
      header: "Admin",
      sortValue: (log: AdminAuditLog) => log.actorEmail,
      render: (log: AdminAuditLog) => (
        <div className="text-sm font-medium">{log.actorEmail}</div>
      ),
    },
    {
      key: "action",
      header: "Hành động",
      sortValue: (log: AdminAuditLog) => log.action,
      render: (log: AdminAuditLog) => (
        <Badge variant={ACTION_VARIANT[log.action]}>{ACTION_LABELS[log.action]}</Badge>
      ),
    },
    {
      key: "entity",
      header: "Đối tượng",
      render: (log: AdminAuditLog) => (
        <div className="text-sm">
          <div>{ENTITY_LABELS[log.entityType]}</div>
          {log.entityId && (
            <div className="text-xs text-muted-foreground font-mono">
              {log.entityId.slice(0, 8)}…
            </div>
          )}
        </div>
      ),
    },
    {
      key: "reason",
      header: "Lý do",
      render: (log: AdminAuditLog) => (
        <div className="text-sm text-muted-foreground line-clamp-2 max-w-md">
          {log.reason || "—"}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (log: AdminAuditLog) => (
        <Button variant="ghost" size="sm" onClick={() => setSelected(log)}>
          <Eye className="h-4 w-4 mr-1" /> Chi tiết
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nhật ký quản trị</h1>
          <p className="text-muted-foreground">
            Lịch sử mọi hành động nhạy cảm của admin (điều chỉnh ví, duyệt/từ chối, kiểm duyệt...)
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Hành động</Label>
              <Select
                value={action}
                onValueChange={(v) => setAction(v as AdminAuditAction | "all")}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả hành động</SelectItem>
                  {ADMIN_AUDIT_ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {ACTION_LABELS[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Loại đối tượng</Label>
              <Select
                value={entityType}
                onValueChange={(v) => setEntityType(v as AdminAuditEntity | "all")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  {ADMIN_AUDIT_ENTITIES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {ENTITY_LABELS[e]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1 min-w-[220px]">
              <Label className="text-xs text-muted-foreground">ID đối tượng</Label>
              <Input
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="VD: uuid của user/course/withdrawal..."
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
            </div>
            <div className="flex gap-2 ml-auto">
              <Button onClick={applyFilters}>
                <SearchIcon className="mr-2 h-4 w-4" /> Tìm
              </Button>
              <Button variant="outline" onClick={resetFilters}>
                Xóa lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Nhật ký"
        description={`Tổng ${pagination?.total ?? 0} entry`}
        data={logs}
        columns={columns}
        emptyMessage="Chưa có entry nào"
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

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết nhật ký</DialogTitle>
            <DialogDescription>Toàn bộ thông tin của entry</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Thời gian</Label>
                  <p>{new Date(selected.createdAt).toLocaleString("vi-VN")}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Admin</Label>
                  <p className="font-medium">{selected.actorEmail}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Hành động</Label>
                  <Badge variant={ACTION_VARIANT[selected.action]} className="mt-1">
                    {ACTION_LABELS[selected.action]}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">IP</Label>
                  <p className="font-mono text-xs">{selected.ipAddress || "—"}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Đối tượng</Label>
                  <p>
                    {ENTITY_LABELS[selected.entityType]}
                    {selected.entityId && (
                      <span className="ml-2 text-xs text-muted-foreground font-mono">
                        {selected.entityId}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Lý do</Label>
                <p className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/30 p-3">
                  {selected.reason || "—"}
                </p>
              </div>
              {selected.metadata && Object.keys(selected.metadata).length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Metadata</Label>
                  <pre className="mt-1 max-h-60 overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
                    {JSON.stringify(selected.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
