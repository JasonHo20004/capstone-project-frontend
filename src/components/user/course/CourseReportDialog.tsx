import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Course, Report, User } from '@/types/type';
import { mockUsers } from '@/data/mock';
import { toast } from 'sonner';

type ReasonType = Report['reasonType'];

const REASONS: { value: ReasonType; label: string }[] = [
  { value: 'NOT_AS_DESCRIBED', label: 'Nội dung không như mô tả' },
  { value: 'INCOMPLETE_CONTENT', label: 'Nội dung thiếu/không đầy đủ' },
  { value: 'UNRESPONSIVE_INSTRUCTOR', label: 'Giảng viên không phản hồi' },
  { value: 'COPYRIGHT_VIOLATION', label: 'Vi phạm bản quyền' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Nội dung không phù hợp' },
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
  course: Course;
  userId: string; // current user id
  onSubmitted?: (report: Report) => void;
}

export default function CourseReportDialog({ open, onOpenChange, course, userId, onSubmitted }: CourseReportDialogProps) {
  const me: User | undefined = useMemo(() => mockUsers.find((u) => u.id === userId), [userId]);

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
    if (!me) {
      toast.error('Không xác định được người dùng hiện tại');
      return;
    }
    if (!content.trim()) {
      toast.error('Vui lòng nhập nội dung báo cáo');
      return;
    }
    setSubmitting(true);
    const report: Report = {
      id: `rep_${Date.now()}`,
      content: content.trim(),
      reasonType: reason,
      createdAt: new Date().toISOString(),
      userId: me.id,
      courseId: course.id,
      user: me,
      course,
    };

    const current = loadAllReports();
    const next = [report, ...current];
    saveAllReports(next);
    toast.success('Đã gửi báo cáo khóa học');
    setSubmitting(false);
    onSubmitted?.(report);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Viết báo cáo khóa học</DialogTitle>
          <DialogDescription>
            Báo cáo này sẽ được gửi tới quản trị viên để xem xét. Hãy mô tả vấn đề rõ ràng.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Lý do báo cáo</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as ReasonType)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn lý do" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nội dung báo cáo *</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Mô tả chi tiết vấn đề bạn gặp phải trong quá trình học."
              className="min-h-[140px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Hủy</Button>
          <Button className="bg-primary" onClick={handleSubmit} disabled={submitting}>Gửi báo cáo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}