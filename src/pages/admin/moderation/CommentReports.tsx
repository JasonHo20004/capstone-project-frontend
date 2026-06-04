import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Flag, Check, Trash2, X, Clock, MessageSquare, ExternalLink, ShieldAlert,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import {
  moderationService,
  auditLogService,
  type CommentReportStatus,
  type CommentReportReason,
  type CommentReportAction,
  type ModerationReport,
} from '@/lib/api/services/admin';

type Tab = CommentReportStatus;

const REASON_LABELS: Record<CommentReportReason, string> = {
  SPAM: 'Spam / Quảng cáo',
  ABUSE: 'Xúc phạm / Quấy rối',
  SCAM: 'Lừa đảo',
  MISINFORMATION: 'Sai thông tin',
  OFF_TOPIC: 'Lạc đề',
  OTHER: 'Khác',
};

export default function CommentReports() {
  const [tab, setTab] = useState<Tab>('PENDING');
  const [page, setPage] = useState(1);
  const [pendingResolve, setPendingResolve] = useState<{
    report: ModerationReport;
    action: CommentReportAction;
  } | null>(null);
  const [resolveNote, setResolveNote] = useState('');

  const queryClient = useQueryClient();

  const summaryQuery = useQuery({
    queryKey: ['moderation', 'summary'],
    queryFn: () => moderationService.getSummary(),
    staleTime: 30_000,
    select: (r) => r.data,
  });

  const listQuery = useQuery({
    queryKey: ['moderation', 'reports', { tab, page }],
    queryFn: () => moderationService.listReports({ status: tab, page, limit: 20 }),
    staleTime: 30_000,
  });

  const resolveMutation = useMutation({
    mutationFn: (vars: { reportId: string; action: CommentReportAction; note?: string }) =>
      moderationService.resolve(vars.reportId, { action: vars.action, note: vars.note }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
      toast.success(
        vars.action === 'remove'
          ? 'Đã xoá bình luận'
          : vars.action === 'keep'
          ? 'Đã giữ bình luận'
          : 'Đã bỏ qua báo cáo'
      );
      auditLogService
        .record({
          action: 'COMMENT_MODERATE',
          entityType: 'COMMENT',
          entityId: pendingResolve?.report.commentId,
          reason: vars.note,
          metadata: {
            reportId: vars.reportId,
            resolveAction: vars.action,
            reasonType: pendingResolve?.report.reasonType,
            authorEmail: pendingResolve?.report.comment.author.fullName,
          },
        })
        .catch((err) => console.error('[Audit] moderation log failed:', err));
      setPendingResolve(null);
      setResolveNote('');
    },
    onError: (err) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không thể xử lý báo cáo';
      toast.error(msg);
    },
  });

  const reports = listQuery.data?.data ?? [];
  const totalPages = listQuery.data?.totalPages ?? 1;
  const summary = summaryQuery.data ?? { pending: 0, kept: 0, removed: 0, dismissed: 0 };

  const tabs = useMemo(
    () =>
      [
        { value: 'PENDING' as const, label: 'Chờ xử lý', count: summary.pending },
        { value: 'RESOLVED_KEPT' as const, label: 'Đã giữ', count: summary.kept },
        { value: 'RESOLVED_REMOVED' as const, label: 'Đã xoá', count: summary.removed },
        { value: 'DISMISSED' as const, label: 'Đã bỏ qua', count: summary.dismissed },
      ] satisfies Array<{ value: Tab; label: string; count: number }>,
    [summary]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-7 h-7 text-red-500" />
          Kiểm duyệt bình luận
        </h1>
        <p className="text-muted-foreground">
          Xem xét các báo cáo từ học viên. Bình luận có ≥3 báo cáo được tự động ẩn cho đến khi bạn xử lý.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as Tab);
          setPage(1);
        }}
      >
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="gap-2">
              {t.label}
              {t.count > 0 && (
                <Badge variant={t.value === 'PENDING' ? 'destructive' : 'secondary'} className="text-[10px]">
                  {t.count}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((t) => (
          <TabsContent key={t.value} value={t.value} className="space-y-3 mt-6">
            {listQuery.isLoading ? (
              <div className="flex justify-center py-12"><LoadingSpinner /></div>
            ) : reports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="w-10 h-10 mx-auto opacity-30" />
                  <p className="mt-3 text-sm font-medium">Không có báo cáo nào</p>
                </CardContent>
              </Card>
            ) : (
              reports.map((r) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  isPending={t.value === 'PENDING'}
                  isWorking={resolveMutation.isPending}
                  onResolve={(action) => {
                    setResolveNote('');
                    setPendingResolve({ report: r, action });
                  }}
                />
              ))
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Trước
                </Button>
                <span className="text-sm text-muted-foreground">
                  Trang {page} / {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Tiếp
                </Button>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <AlertDialog open={!!pendingResolve} onOpenChange={(o) => !o && setPendingResolve(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingResolve?.action === 'remove' && 'Xoá bình luận?'}
              {pendingResolve?.action === 'keep' && 'Giữ bình luận?'}
              {pendingResolve?.action === 'dismiss' && 'Bỏ qua báo cáo?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {pendingResolve?.action === 'remove' && (
                <span className="block">
                  Bình luận sẽ bị xoá vĩnh viễn cùng các trả lời con. Tất cả báo cáo liên quan sẽ đóng.
                </span>
              )}
              {pendingResolve?.action === 'keep' && (
                <span className="block">
                  Giữ bình luận. Nếu đang bị tự động ẩn, sẽ hiển thị lại. Tất cả báo cáo liên quan sẽ đóng.
                </span>
              )}
              {pendingResolve?.action === 'dismiss' && (
                <span className="block">
                  Chỉ đóng báo cáo này (không động đến bình luận). Các báo cáo khác vẫn còn.
                </span>
              )}
              {pendingResolve && (
                <span className="block text-xs text-muted-foreground border-l-2 pl-2 mt-2 italic">
                  "{pendingResolve.report.comment.content.slice(0, 200)}"
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Ghi chú (tuỳ chọn)</label>
            <Textarea
              rows={3}
              maxLength={500}
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              placeholder="Ghi chú nội bộ về quyết định…"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resolveMutation.isPending}>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              disabled={resolveMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (!pendingResolve) return;
                resolveMutation.mutate({
                  reportId: pendingResolve.report.id,
                  action: pendingResolve.action,
                  note: resolveNote.trim() || undefined,
                });
              }}
              className={
                pendingResolve?.action === 'remove'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {resolveMutation.isPending ? 'Đang xử lý…' : 'Xác nhận'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ReportCardProps {
  report: ModerationReport;
  isPending: boolean;
  isWorking: boolean;
  onResolve: (action: CommentReportAction) => void;
}

function ReportCard({ report, isPending, isWorking, onResolve }: ReportCardProps) {
  const c = report.comment;
  const lessonHref = `/admin/courses/${c.lesson.course.id}?lessonId=${c.lesson.id}`;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
          <Flag className="w-4 h-4 text-red-500" />
          <Badge variant="destructive" className="text-xs">{REASON_LABELS[report.reasonType]}</Badge>
          {c.hiddenAt && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs">
              Đã tự động ẩn
            </Badge>
          )}
          <span className="text-xs font-normal text-muted-foreground ml-auto inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> {new Date(report.createdAt).toLocaleString('vi-VN')}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs text-muted-foreground mb-1">
            <span className="font-medium text-slate-700">{c.author.fullName}</span> •{' '}
            {new Date(c.createdAt).toLocaleString('vi-VN')}
          </div>
          <p className="text-sm whitespace-pre-wrap">{c.content}</p>
        </div>

        {report.note && (
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold">Ghi chú từ {report.reporter.fullName}:</span> {report.note}
          </div>
        )}

        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <a
            href={lessonHref}
            target="_blank"
            rel="noreferrer"
            className="hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            {c.lesson.course.title} → {c.lesson.title}
          </a>
        </div>

        {!isPending && report.resolutionNote && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            <span className="font-semibold">Ghi chú giải quyết:</span> {report.resolutionNote}
            {report.resolvedAt && (
              <span className="ml-2">• {new Date(report.resolvedAt).toLocaleString('vi-VN')}</span>
            )}
          </div>
        )}

        {isPending && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="destructive"
              disabled={isWorking}
              onClick={() => onResolve('remove')}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Xoá bình luận
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isWorking}
              onClick={() => onResolve('keep')}
            >
              <Check className="w-3.5 h-3.5 mr-1" /> Giữ bình luận
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isWorking}
              onClick={() => onResolve('dismiss')}
            >
              <X className="w-3.5 h-3.5 mr-1" /> Bỏ qua
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
