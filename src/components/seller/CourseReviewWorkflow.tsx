import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trans } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Rocket,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock3,
  History,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { useCourseReviewHistory } from '@/hooks/api';
import { formatVND } from '@/lib/utils';

interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  /** When the item fails, this short text helps the seller know what to do. */
  hint?: string;
}

interface Props {
  course: {
    id: string;
    title: string;
    description?: string | null;
    price?: number | null;
    courseLevel?: string | null;
    thumbnailUrl?: string | null;
    status: string;
    submittedAt?: string | null;
    approvedAt?: string | null;
    rejectedAt?: string | null;
    rejectionReason?: string | null;
  };
  checklist: ChecklistItem[];
  isSubmitting: boolean;
  onSubmit: () => void;
}

const STATUS_REQUIRES_RESUBMIT = (s: string) => s === 'DRAFT' || s === 'REFUSE';

/**
 * Seller's submit-for-review experience: checklist + confirmation modal,
 * rejection banner, pending-state SLA hint, and the full audit timeline.
 * Centralising it here keeps SellerCourseDetail.tsx focused on layout.
 */
export function CourseReviewWorkflow({ course, checklist, isSubmitting, onSubmit }: Props) {
  const { t, i18n } = useTranslation('seller');
  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-GB';
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Only fetch the timeline when there's actually something to show — saves
  // a round-trip for fresh DRAFT courses that have never been submitted.
  const hasAnyHistory = Boolean(
    course.submittedAt || course.approvedAt || course.rejectedAt
  );
  const { data: historyResp, isLoading: historyLoading } = useCourseReviewHistory(
    course.id,
    hasAnyHistory
  );
  const history = historyResp?.data ?? [];

  const allChecksDone = checklist.every((c) => c.done);
  const failedChecks = checklist.filter((c) => !c.done);

  const showChecklist = STATUS_REQUIRES_RESUBMIT(course.status);
  const showRejectionBanner = course.status === 'REFUSE' && !!course.rejectionReason;
  const showPendingPanel = course.status === 'PENDING';

  // Days since submission — used by the SLA hint. We treat 3+ days as "delayed"
  // and show a soft escalation prompt rather than a hard error.
  const submittedDaysAgo = useMemo(() => {
    if (!course.submittedAt) return null;
    const ms = Date.now() - new Date(course.submittedAt).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  }, [course.submittedAt]);

  return (
    <div className="space-y-4">
      {showRejectionBanner && (
        <Card className="border-red-200 bg-red-50/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <ShieldAlert className="w-4 h-4" /> {t('reviewWorkflow.rejection.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-white border border-red-100 p-3 text-sm text-slate-700 whitespace-pre-wrap">
              <span className="block text-xs font-semibold text-red-700 mb-1">{t('reviewWorkflow.rejection.reasonLabel')}</span>
              {course.rejectionReason}
            </div>
            {course.rejectedAt && (
              <p className="text-xs text-slate-500">
                {t('reviewWorkflow.rejection.rejectedAt', { date: new Date(course.rejectedAt).toLocaleString(dateLocale) })}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={!allChecksDone || isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                {allChecksDone ? t('reviewWorkflow.rejection.resubmit') : t('reviewWorkflow.rejection.fixContent')}
              </Button>
              {!allChecksDone && (
                <span className="text-xs text-slate-500 self-center">
                  {t('reviewWorkflow.rejection.completeBelow')}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {showPendingPanel && (
        <Card className="border-amber-200 bg-amber-50/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <Clock3 className="w-4 h-4" /> {t('reviewWorkflow.pending.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-slate-700">
              <Trans i18nKey="reviewWorkflow.pending.body" ns="seller" components={{ strong: <strong /> }} />
            </p>
            {course.submittedAt && (
              <p className="text-xs text-slate-500">
                {t('reviewWorkflow.pending.submittedAt', { date: new Date(course.submittedAt).toLocaleString(dateLocale) })}
                {submittedDaysAgo !== null && submittedDaysAgo > 0 && (
                  <> • {t('reviewWorkflow.pending.daysAgo', { count: submittedDaysAgo })}</>
                )}
              </p>
            )}
            {submittedDaysAgo !== null && submittedDaysAgo >= 3 && (
              <div className="flex items-start gap-2 rounded-md bg-amber-100/60 p-2 text-xs text-amber-900">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  {t('reviewWorkflow.pending.delayed')}
                </span>
              </div>
            )}
            <p className="text-xs text-slate-500 pt-2 border-t">
              {t('reviewWorkflow.pending.cancelHint')}
            </p>
          </CardContent>
        </Card>
      )}

      {showChecklist && !showRejectionBanner && (
        <Card
          className={`border ${
            allChecksDone ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-200 bg-amber-50/30'
          } shadow-sm`}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Rocket className={`w-4 h-4 ${allChecksDone ? 'text-emerald-600' : 'text-amber-600'}`} />
              {t('reviewWorkflow.checklist.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Checklist items={checklist} />
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-xs text-slate-500">
                {allChecksDone
                  ? t('reviewWorkflow.checklist.ready')
                  : t('reviewWorkflow.checklist.remaining', { count: failedChecks.length })}
              </p>
              <Button
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={!allChecksDone || isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? t('reviewWorkflow.checklist.submitting') : t('reviewWorkflow.checklist.submit')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showRejectionBanner && (
        <Card className="border-amber-100 bg-amber-50/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {t('reviewWorkflow.recheckTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Checklist items={checklist} />
          </CardContent>
        </Card>
      )}

      {hasAnyHistory && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" /> {t('reviewWorkflow.history.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <p className="text-sm text-slate-500">{t('reviewWorkflow.history.loading')}</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-slate-500">{t('reviewWorkflow.history.empty')}</p>
            ) : (
              <ol className="relative border-s border-slate-200 ms-2 space-y-4">
                {history.map((h) => (
                  <TimelineRow key={h.id} entry={h} />
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('reviewWorkflow.confirm.title')}</DialogTitle>
            <DialogDescription>
              {t('reviewWorkflow.confirm.description')}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[40vh] -mr-2 pr-2">
            <div className="space-y-3 text-sm">
              <Row label={t('reviewWorkflow.confirm.titleLabel')} value={course.title} />
              <Row label={t('reviewWorkflow.confirm.levelLabel')} value={course.courseLevel || '—'} />
              <Row label={t('reviewWorkflow.confirm.priceLabel')} value={course.price != null ? formatVND(course.price) : '—'} />
              <div>
                <div className="text-xs text-slate-500 mb-1">{t('reviewWorkflow.confirm.descriptionLabel')}</div>
                <div className="text-slate-700 whitespace-pre-wrap text-sm border rounded-md p-2 bg-slate-50 max-h-32 overflow-auto">
                  {course.description || <em className="text-slate-400">{t('reviewWorkflow.confirm.descriptionEmpty')}</em>}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">{t('reviewWorkflow.confirm.checklistLabel')}</div>
                <Checklist items={checklist} compact />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmitting}>{t('reviewWorkflow.confirm.cancel')}</Button>
            </DialogClose>
            <Button
              onClick={() => {
                setConfirmOpen(false);
                onSubmit();
              }}
              disabled={isSubmitting || !checklist.every((c) => c.done)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? t('reviewWorkflow.confirm.submitting') : t('reviewWorkflow.confirm.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Checklist({ items, compact = false }: { items: ChecklistItem[]; compact?: boolean }) {
  return (
    <ul className={compact ? 'space-y-1' : 'space-y-1.5'}>
      {items.map((c) => (
        <li key={c.key} className="flex items-start gap-2 text-sm">
          {c.done ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <span className={c.done ? 'text-slate-700' : 'text-slate-500'}>{c.label}</span>
            {!c.done && c.hint && (
              <div className="text-xs text-slate-400 mt-0.5">{c.hint}</div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800 text-right truncate">{value}</span>
    </div>
  );
}

interface HistoryEntry {
  id: string;
  fromStatus: string;
  toStatus: string;
  actorRole: string;
  reason: string | null;
  createdAt: string;
}

// Quality-flag lifecycle markers stored in the history `reason` column.
// Format is either "MARKER" or "MARKER|<human text>".
const QF_MARKERS = ['QF_OPEN', 'QF_CONFIRMED', 'QF_CLEARED', 'QF_AUTODRAFT'] as const;
type QfMarker = (typeof QF_MARKERS)[number];

function parseQualityFlag(reason: string | null): { marker: QfMarker; text: string } | null {
  if (!reason) return null;
  for (const marker of QF_MARKERS) {
    if (reason === marker || reason.startsWith(`${marker}|`)) {
      const idx = reason.indexOf('|');
      return { marker, text: idx >= 0 ? reason.slice(idx + 1).trim() : '' };
    }
  }
  return null;
}

function TimelineRow({ entry }: { entry: HistoryEntry }) {
  const { t, i18n } = useTranslation('seller');
  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-GB';
  const meta = describeTransition(entry, t);
  // Strip the QF marker prefix so the seller sees clean text (or nothing for
  // marker-only rows like QF_CONFIRMED / QF_CLEARED).
  const qf = parseQualityFlag(entry.reason);
  const displayReason = qf ? qf.text : entry.reason;
  return (
    <li className="ms-4">
      <span
        className={`absolute -start-1.5 mt-1.5 flex h-3 w-3 items-center justify-center rounded-full ${meta.dot}`}
      />
      <div className="text-xs text-slate-500">
        {new Date(entry.createdAt).toLocaleString(dateLocale)}
      </div>
      <div className={`text-sm font-medium ${meta.tone}`}>{meta.label}</div>
      {displayReason && (
        <div className="mt-1 text-xs text-slate-600 bg-slate-50 border rounded-md p-2 whitespace-pre-wrap">
          {displayReason}
        </div>
      )}
    </li>
  );
}

function describeTransition(e: HistoryEntry, t: TFunction): { label: string; dot: string; tone: string } {
  // Quality-flag rows ride on ACTIVE→ACTIVE (or ACTIVE→DRAFT for auto-draft)
  // transitions — detect them first so they aren't mislabelled "Admin approved".
  const qf = parseQualityFlag(e.reason);
  if (qf) {
    switch (qf.marker) {
      case 'QF_OPEN':
        return { label: t('reviewWorkflow.transition.qualityFlagOpen'), dot: 'bg-orange-500', tone: 'text-orange-700' };
      case 'QF_CONFIRMED':
        return { label: t('reviewWorkflow.transition.qualityFlagConfirmed'), dot: 'bg-sky-500', tone: 'text-sky-700' };
      case 'QF_CLEARED':
        return { label: t('reviewWorkflow.transition.qualityFlagCleared'), dot: 'bg-teal-500', tone: 'text-teal-700' };
      case 'QF_AUTODRAFT':
        return { label: t('reviewWorkflow.transition.qualityFlagAutoDraft'), dot: 'bg-red-500', tone: 'text-red-700' };
    }
  }
  if (e.toStatus === 'PENDING' && e.actorRole === 'seller') {
    return { label: t('reviewWorkflow.transition.sellerSubmit'), dot: 'bg-amber-500', tone: 'text-amber-700' };
  }
  if (e.toStatus === 'ACTIVE') {
    return { label: t('reviewWorkflow.transition.adminApprove'), dot: 'bg-emerald-500', tone: 'text-emerald-700' };
  }
  if (e.toStatus === 'REFUSE') {
    return { label: t('reviewWorkflow.transition.adminReject'), dot: 'bg-red-500', tone: 'text-red-700' };
  }
  if (e.toStatus === 'DRAFT' && e.fromStatus === 'PENDING') {
    return { label: t('reviewWorkflow.transition.sellerCancel'), dot: 'bg-slate-400', tone: 'text-slate-700' };
  }
  if (e.toStatus === 'INACTIVE') {
    return { label: t('reviewWorkflow.transition.inactive'), dot: 'bg-slate-400', tone: 'text-slate-700' };
  }
  return {
    label: t('reviewWorkflow.transition.statusChange', { from: e.fromStatus, to: e.toStatus }),
    dot: 'bg-slate-300',
    tone: 'text-slate-700',
  };
}
