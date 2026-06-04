import { useMemo, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Clock, CheckCircle2, XCircle, RefreshCw, Ban, Download, ExternalLink,
  ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { toast } from 'sonner';
import {
  useSellerWithdrawalHistory,
  useCancelWithdrawal,
  useRetryWithdrawal,
} from '@/hooks/api';
import type {
  WithdrawalRequest,
  WithdrawalRequestStatus,
} from '@/lib/api/services/withdrawal.service';
import type { TFunction } from 'i18next';

type StatusFilter = 'ALL' | WithdrawalRequestStatus;

interface Props {
  page: number;
  onPageChange: (p: number) => void;
  onExportCsv: () => void;
}

/**
 * Card-based replacement for the dense withdrawal DataTable: per-row
 * timeline, rejection banner with reason, inline Retry/Cancel CTAs, and
 * one-click proof preview/download. Each card is collapsible so the page
 * doesn't grow huge when there are many old withdrawals.
 */
export function WithdrawalHistoryTab({ page, onPageChange, onExportCsv }: Props) {
  const { t, i18n } = useTranslation('seller');
  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-GB';

  const { data: withdrawalsData } = useSellerWithdrawalHistory({ page, limit: 10 });
  const list = withdrawalsData?.data ?? [];

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState<WithdrawalRequest | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);

  const cancelMutation = useCancelWithdrawal();
  const retryMutation = useRetryWithdrawal();

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return list;
    return list.filter((r) => r.status === statusFilter);
  }, [list, statusFilter]);

  const handleCancel = async () => {
    if (!pendingCancel) return;
    try {
      await cancelMutation.mutateAsync(pendingCancel.id);
      toast.success(t('withdrawalHistory.toasts.cancelled'));
      setPendingCancel(null);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('withdrawalHistory.toasts.cancelFailed');
      toast.error(msg);
    }
  };

  const handleRetry = async (req: WithdrawalRequest) => {
    try {
      const res = await retryMutation.mutateAsync({ id: req.id });
      const newId = res?.data?.id?.slice(0, 8).toUpperCase();
      toast.success(
        newId
          ? t('withdrawalHistory.toasts.retriedWithId', { id: newId })
          : t('withdrawalHistory.toasts.retriedGeneric')
      );
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('withdrawalHistory.toasts.retryFailed');
      toast.error(msg);
    }
  };

  const handleDownloadProof = (url: string, id: string) => {
    // S3 image is cross-origin; <a download> won't trigger save dialog without
    // CORS allow. Opening in a tab lets the seller right-click → Save image.
    window.open(url, `_blank_proof_${id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="ALL">{t('withdrawalHistory.filter.all')}</option>
          <option value="PENDING">{t('withdrawalHistory.filter.pending')}</option>
          <option value="APPROVED">{t('withdrawalHistory.filter.approved')}</option>
          <option value="REJECTED">{t('withdrawalHistory.filter.rejected')}</option>
          <option value="CANCELLED">{t('withdrawalHistory.filter.cancelled')}</option>
        </select>
        <Button variant="outline" size="sm" onClick={onExportCsv} className="ml-auto">
          <Download className="w-4 h-4 mr-1.5" /> {t('withdrawalHistory.exportCsv')}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="w-10 h-10 opacity-30 mx-auto" />
            <p className="mt-2 text-sm font-medium">
              {statusFilter === 'ALL'
                ? t('withdrawalHistory.empty.noneTitle')
                : t('withdrawalHistory.empty.filteredTitle')}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {statusFilter === 'ALL'
                ? t('withdrawalHistory.empty.noneHint')
                : t('withdrawalHistory.empty.filteredHint')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <WithdrawalCard
              key={req.id}
              req={req}
              expanded={expandedId === req.id}
              onToggle={() => setExpandedId(expandedId === req.id ? null : req.id)}
              onCancel={() => setPendingCancel(req)}
              onRetry={() => handleRetry(req)}
              onPreviewProof={() => req.proofImageUrl && setProofPreviewUrl(req.proofImageUrl)}
              onDownloadProof={() => req.proofImageUrl && handleDownloadProof(req.proofImageUrl, req.id)}
              cancelPending={cancelMutation.isPending}
              retryPending={retryMutation.isPending}
              t={t}
              dateLocale={dateLocale}
            />
          ))}
        </div>
      )}

      {withdrawalsData && withdrawalsData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            {t('withdrawalHistory.pagination.prev')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('withdrawalHistory.pagination.page', { page, total: withdrawalsData.totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= withdrawalsData.totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            {t('withdrawalHistory.pagination.next')}
          </Button>
        </div>
      )}

      <AlertDialog open={!!pendingCancel} onOpenChange={(o) => !o && setPendingCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('withdrawalHistory.cancelDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              <Trans
                i18nKey="withdrawalHistory.cancelDialog.bodyHtml"
                ns="seller"
                components={{ strong: <strong /> }}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>
              {t('withdrawalHistory.cancelDialog.no')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleCancel(); }}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending
                ? t('withdrawalHistory.cancelDialog.cancelling')
                : t('withdrawalHistory.cancelDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!proofPreviewUrl} onOpenChange={(o) => !o && setProofPreviewUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('withdrawalHistory.proofDialog.title')}</DialogTitle>
            <DialogDescription>{t('withdrawalHistory.proofDialog.lead')}</DialogDescription>
          </DialogHeader>
          {proofPreviewUrl && (
            <div className="space-y-3">
              <img
                src={proofPreviewUrl}
                alt={t('withdrawalHistory.proofDialog.alt')}
                className="w-full max-h-[60vh] object-contain rounded border"
              />
              <Button asChild variant="outline" size="sm">
                <a href={proofPreviewUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> {t('withdrawalHistory.proofDialog.openInTab')}
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CardProps {
  req: WithdrawalRequest;
  expanded: boolean;
  onToggle: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onPreviewProof: () => void;
  onDownloadProof: () => void;
  cancelPending: boolean;
  retryPending: boolean;
  t: TFunction;
  dateLocale: string;
}

function WithdrawalCard({
  req, expanded, onToggle, onCancel, onRetry, onPreviewProof, onDownloadProof,
  cancelPending, retryPending, t, dateLocale,
}: CardProps) {
  const shortId = req.id.slice(0, 8).toUpperCase();
  const isStale =
    req.status === 'PENDING' &&
    Date.now() - new Date(req.createdAt).getTime() > 48 * 60 * 60 * 1000;
  const supportMail =
    `mailto:support@capstoneproject.com?subject=` +
    encodeURIComponent(t('withdrawalHistory.support.subject', { id: shortId })) +
    `&body=` +
    encodeURIComponent(
      t('withdrawalHistory.support.body', {
        id: shortId,
        amount: formatVND(req.amount),
        date: new Date(req.createdAt).toLocaleString(dateLocale),
      })
    );

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-muted-foreground">#WR-{shortId}</span>
              <StatusBadge status={req.status} t={t} />
            </div>
            <div className="mt-1 text-lg font-bold font-display">{formatVND(req.amount)}</div>
            <div className="text-xs text-muted-foreground">
              {req.bankName} • {req.accountName} •{' '}
              <span className="font-mono">{maskAccount(req.accountNumber)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {req.status === 'PENDING' && (
              <Button size="sm" variant="outline" onClick={onCancel} disabled={cancelPending}>
                <Ban className="w-3.5 h-3.5 mr-1" /> {t('withdrawalHistory.card.cancel')}
              </Button>
            )}
            {req.status === 'REJECTED' && (
              <Button size="sm" onClick={onRetry} disabled={retryPending}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> {t('withdrawalHistory.card.retry')}
              </Button>
            )}
            {req.proofImageUrl && (
              <Button size="sm" variant="outline" onClick={onDownloadProof}>
                <Download className="w-3.5 h-3.5 mr-1" /> {t('withdrawalHistory.card.proof')}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onToggle}>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {req.status === 'REJECTED' && req.adminNote && (
          <div className="rounded-lg border border-red-200 bg-red-50/60 dark:bg-red-900/10 p-3 space-y-2">
            <div className="text-xs font-semibold text-red-700 dark:text-red-400">
              {t('withdrawalHistory.card.rejectionReason')}
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{req.adminNote}</p>
            <div className="text-xs text-muted-foreground">{t('withdrawalHistory.card.rejectionNote')}</div>
          </div>
        )}

        {isStale && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-2 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span className="flex-1">
              {t('withdrawalHistory.card.stale')}{' '}
              <a href={supportMail} className="font-semibold underline">
                {t('withdrawalHistory.card.supportLink')}
              </a>
              .
            </span>
          </div>
        )}

        {expanded && (
          <div className="pt-3 border-t space-y-3">
            <Timeline req={req} onPreviewProof={onPreviewProof} t={t} dateLocale={dateLocale} />
            {req.retriedFromId && (
              <div className="text-xs text-muted-foreground">
                {t('withdrawalHistory.card.retriedFrom', {
                  id: req.retriedFromId.slice(0, 8).toUpperCase(),
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status, t }: { status: WithdrawalRequestStatus; t: TFunction }) {
  switch (status) {
    case 'PENDING':
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30">
          <Clock className="w-3 h-3 mr-1" /> {t('withdrawalHistory.status.PENDING')}
        </Badge>
      );
    case 'APPROVED':
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" /> {t('withdrawalHistory.status.APPROVED')}
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/30">
          <XCircle className="w-3 h-3 mr-1" /> {t('withdrawalHistory.status.REJECTED')}
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant="outline" className="bg-slate-500/10 text-slate-700 border-slate-500/30">
          <Ban className="w-3 h-3 mr-1" /> {t('withdrawalHistory.status.CANCELLED')}
        </Badge>
      );
  }
}

interface TimelineProps {
  req: WithdrawalRequest;
  onPreviewProof: () => void;
  t: TFunction;
  dateLocale: string;
}

function Timeline({ req, onPreviewProof, t, dateLocale }: TimelineProps) {
  const events: Array<{
    when: string;
    label: string;
    dot: string;
    detail?: React.ReactNode;
  }> = [];

  events.push({
    when: req.createdAt,
    label: t('withdrawalHistory.timeline.submitted'),
    dot: 'bg-blue-500',
  });

  if (req.status === 'APPROVED' && req.processedAt) {
    events.push({
      when: req.processedAt,
      label: t('withdrawalHistory.timeline.approved'),
      dot: 'bg-emerald-500',
      detail: req.proofImageUrl ? (
        <button
          onClick={onPreviewProof}
          className="text-xs text-emerald-700 dark:text-emerald-400 underline mt-1"
        >
          {t('withdrawalHistory.timeline.viewProof')}
        </button>
      ) : undefined,
    });
    // Soft ETA — admin's manual transfer triggers bank settlement, which takes 1–3 days.
    const eta = new Date(new Date(req.processedAt).getTime() + 3 * 24 * 60 * 60 * 1000);
    events.push({
      when: eta.toISOString(),
      label: t('withdrawalHistory.timeline.etaArrival'),
      dot: 'bg-slate-300',
    });
  } else if (req.status === 'REJECTED' && req.processedAt) {
    events.push({
      when: req.processedAt,
      label: t('withdrawalHistory.timeline.rejected'),
      dot: 'bg-red-500',
    });
  } else if (req.status === 'CANCELLED' && req.cancelledAt) {
    events.push({
      when: req.cancelledAt,
      label: t('withdrawalHistory.timeline.cancelled'),
      dot: 'bg-slate-400',
    });
  } else if (req.status === 'PENDING') {
    events.push({
      when: '',
      label: t('withdrawalHistory.timeline.waiting'),
      dot: 'bg-amber-500',
    });
  }

  return (
    <ol className="relative border-s border-slate-200 dark:border-slate-700 ms-2 space-y-3">
      {events.map((ev, i) => (
        <li key={i} className="ms-4">
          <span
            className={`absolute -start-1.5 mt-1.5 flex h-3 w-3 items-center justify-center rounded-full ${ev.dot}`}
          />
          {ev.when && (
            <div className="text-xs text-muted-foreground">
              {new Date(ev.when).toLocaleString(dateLocale)}
            </div>
          )}
          <div className="text-sm font-medium">{ev.label}</div>
          {ev.detail}
        </li>
      ))}
    </ol>
  );
}

function maskAccount(num: string): string {
  if (num.length <= 4) return num;
  return `${num.slice(0, 2)}••••${num.slice(-4)}`;
}
