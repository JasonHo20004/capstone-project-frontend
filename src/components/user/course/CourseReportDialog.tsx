import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Report } from "@/domain";
import type { CourseDetail } from '@/lib/api/services';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/api/use-user';

type ReasonType = Report['reasonType'];

const REASONS: { value: ReasonType; labelKey: string }[] = [
  { value: 'NOT_AS_DESCRIBED', labelKey: 'NOT_AS_DESCRIBED' },
  { value: 'INCOMPLETE_CONTENT', labelKey: 'INCOMPLETE_CONTENT' },
  { value: 'UNRESPONSIVE_INSTRUCTOR', labelKey: 'UNRESPONSIVE_INSTRUCTOR' },
  { value: 'COPYRIGHT_VIOLATION', labelKey: 'COPYRIGHT_VIOLATION' },
  { value: 'INAPPROPRIATE_CONTENT', labelKey: 'INAPPROPRIATE_CONTENT' },
];

const STORAGE_KEY = 'skillboost_course_reports_v1';

function loadAllReports(): Report[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAllReports(reports: Report[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    // ignore
  }
}

interface CourseReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CourseDetail;
  userId: string; // current user id
  onSubmitted?: (report: Report) => void;
}

export default function CourseReportDialog({ open, onOpenChange, course, userId, onSubmitted }: CourseReportDialogProps) {
  const { t } = useTranslation('courses');
  const { user: me } = useProfile();

  const [reason, setReason] = useState<ReasonType>('NOT_AS_DESCRIBED');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason('NOT_AS_DESCRIBED');
      setContent('');
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = () => {
    const reporterId = me?.id ?? userId;
    if (!reporterId) {
      toast.error(t('reportDialog.toasts.unknownUser'));
      return;
    }
    if (!content.trim()) {
      toast.error(t('reportDialog.toasts.contentRequired'));
      return;
    }
    setSubmitting(true);
    const report: Report = {
      id: `rep_${Date.now()}`,
      content: content.trim(),
      reasonType: reason,
      createdAt: new Date().toISOString(),
      userId: reporterId,
      courseId: course.id,
      user: me ?? undefined,
    };

    const current = loadAllReports();
    const next = [report, ...current];
    saveAllReports(next);
    toast.success(t('reportDialog.toasts.submitted'));
    setSubmitting(false);
    onSubmitted?.(report);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('reportDialog.title')}</DialogTitle>
          <DialogDescription>{t('reportDialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('reportDialog.reasonLabel')}</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as ReasonType)}>
              <SelectTrigger>
                <SelectValue placeholder={t('reportDialog.reasonPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{t(`reportDialog.reasons.${r.labelKey}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('reportDialog.contentLabel')}</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('reportDialog.contentPlaceholder')}
              className="min-h-[140px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>{t('reportDialog.cancel')}</Button>
          <Button className="bg-primary" onClick={handleSubmit} disabled={submitting}>{t('reportDialog.submit')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}