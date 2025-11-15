import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { CourseSellerApplication, User } from '@/types/type';
import { mockUsers } from '@/data/mock';

const STORAGE_KEY = 'skillboost_course_seller_applications_v1';

function loadApplications(): CourseSellerApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr as CourseSellerApplication[];
  } catch {
    return [];
  }
}

function saveApplications(apps: CourseSellerApplication[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSubmitted?: (app: CourseSellerApplication) => void;
}

export default function CourseSellerApplicationDialog({ open, onOpenChange, userId, onSubmitted }: Props) {
  const me: User | undefined = useMemo(() => mockUsers.find((u) => u.id === userId), [userId]);

  const [certInput, setCertInput] = useState('');
  const [expInput, setExpInput] = useState('');
  const [certification, setCertification] = useState<string[]>([]);
  const [expertise, setExpertise] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setCertInput('');
      setExpInput('');
      setCertification([]);
      setExpertise([]);
      setMessage('');
      setSubmitting(false);
    }
  }, [open]);

  const addCert = () => {
    const v = certInput.trim();
    if (!v) return;
    if (certification.includes(v)) {
      toast.warning('Chứng chỉ đã tồn tại');
      return;
    }
    setCertification((prev) => [...prev, v]);
    setCertInput('');
  };

  const removeCert = (c: string) => {
    setCertification((prev) => prev.filter((x) => x !== c));
  };

  const addExp = () => {
    const v = expInput.trim();
    if (!v) return;
    if (expertise.includes(v)) {
      toast.warning('Chuyên môn đã tồn tại');
      return;
    }
    setExpertise((prev) => [...prev, v]);
    setExpInput('');
  };

  const removeExp = (e: string) => {
    setExpertise((prev) => prev.filter((x) => x !== e));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (certification.length === 0 && expertise.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 chứng chỉ hoặc 1 chuyên môn');
      return;
    }
    setSubmitting(true);
    try {
      const now = new Date();
      const newApp: CourseSellerApplication = {
        id: `csa_${now.getTime()}`,
        userId,
        certification,
        expertise,
        message: message.trim() || undefined,
        status: 'PENDING',
        createdAt: now.toISOString(),
        user: me || {
          id: userId,
          email: '',
          fullName: 'Người dùng',
          learningGoals: [],
          dateOfBirth: now.toISOString(),
          createdAt: now.toISOString(),
        },
      };

      const apps = loadApplications();
      saveApplications([newApp, ...apps]);
      toast.success('Đã gửi đơn đăng ký giảng viên!');
      onSubmitted?.(newApp);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error('Gửi đơn thất bại, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nộp đơn trở thành người bán khóa học</DialogTitle>
          <DialogDescription>
            Cung cấp chứng chỉ, chuyên môn và lời nhắn để đội ngũ admin xét duyệt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Chứng chỉ</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nhập chứng chỉ (VD: TESOL, CELTA)"
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addCert(); }}
              />
              <Button variant="default" onClick={addCert}>Thêm</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {certification.length > 0 ? (
                certification.map((c) => (
                  <Badge key={c} variant="secondary" className="cursor-pointer" onClick={() => removeCert(c)}>
                    {c}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có chứng chỉ</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Chuyên môn</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nhập chuyên môn (VD: Business English)"
                value={expInput}
                onChange={(e) => setExpInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addExp(); }}
              />
              <Button variant="default" onClick={addExp}>Thêm</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {expertise.length > 0 ? (
                expertise.map((e) => (
                  <Badge key={e} variant="secondary" className="cursor-pointer" onClick={() => removeExp(e)}>
                    {e}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có chuyên môn</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Lời nhắn</Label>
            <Textarea
              placeholder="Chia sẻ kinh nghiệm giảng dạy và mong muốn của bạn..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Hủy</Button>
            <Button variant="default" onClick={handleSubmit} disabled={submitting}>Gửi đơn</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}