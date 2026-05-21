import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateSellerApplication } from '@/hooks/api/use-user';
import type { CourseSellerApplication } from '@/domain';
import { ApplicationStatus } from '@/domain/enums';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Latest application of the current user, if any. Used to gate re-submission and show feedback. */
  existingApplication?: CourseSellerApplication | null;
  onSubmitted?: (app: CourseSellerApplication) => void;
}

interface PreviewFile {
  file: File;
  previewUrl: string;
}

export default function CourseSellerApplicationDialog({
  open,
  onOpenChange,
  existingApplication,
  onSubmitted,
}: Props) {
  const createApplicationMutation = useCreateSellerApplication();

  const [expInput, setExpInput] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [certFiles, setCertFiles] = useState<PreviewFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Block re-submit while a previous application is still pending or already approved.
  const isBlocked = useMemo(() => {
    if (!existingApplication) return false;
    return (
      existingApplication.status === ApplicationStatus.PENDING ||
      existingApplication.status === ApplicationStatus.APPROVED
    );
  }, [existingApplication]);

  const isRejected = existingApplication?.status === ApplicationStatus.REJECTED;

  // Cleanup blob URLs on unmount so previews don't leak between sessions.
  useEffect(() => {
    return () => {
      certFiles.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset form state whenever dialog is closed.
  useEffect(() => {
    if (!open) {
      certFiles.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setCertFiles([]);
      setExpertise([]);
      setExpInput('');
      setMessage('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const addExp = () => {
    const v = expInput.trim();
    if (!v) return;
    if (expertise.includes(v)) {
      toast.warning('Chuyên môn này đã tồn tại');
      return;
    }
    setExpertise((prev) => [...prev, v]);
    setExpInput('');
  };

  const removeExp = (e: string) => {
    setExpertise((prev) => prev.filter((x) => x !== e));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter((f) => f.size <= 5 * 1024 * 1024);

      if (validFiles.length < newFiles.length) {
        toast.warning('Một số file quá lớn (>5MB) đã bị bỏ qua.');
      }

      const remainingSlots = Math.max(0, 10 - certFiles.length);
      if (validFiles.length > remainingSlots) {
        toast.warning('Chỉ được tải lên tối đa 10 ảnh.');
        validFiles.splice(remainingSlots);
      }

      const previews: PreviewFile[] = validFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      setCertFiles((prev) => [...prev, ...previews]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (indexToRemove: number) => {
    setCertFiles((prev) => {
      const target = prev[indexToRemove];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = () => {
    if (isBlocked) {
      toast.error('Bạn không thể nộp đơn lúc này.');
      return;
    }
    if (certFiles.length === 0) {
      toast.error('Vui lòng tải lên ít nhất 1 ảnh chứng chỉ.');
      return;
    }
    if (expertise.length === 0) {
      toast.error('Vui lòng nhập ít nhất 1 chuyên môn.');
      return;
    }

    const formData = new FormData();
    certFiles.forEach(({ file }) => formData.append('images', file));
    expertise.forEach((exp) => formData.append('expertise', exp));
    if (message.trim()) formData.append('message', message.trim());

    createApplicationMutation.mutate(formData, {
      onSuccess: (response) => {
        onSubmitted?.(response.data);
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nộp đơn trở thành Giảng viên</DialogTitle>
          <DialogDescription>
            Vui lòng cung cấp thông tin chuyên môn và hình ảnh chứng chỉ để chúng tôi xét duyệt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {existingApplication?.status === ApplicationStatus.PENDING && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Đơn của bạn đang chờ duyệt</p>
                <p className="text-amber-800/80 mt-1">
                  Vui lòng đợi quản trị viên xét duyệt. Bạn sẽ không thể nộp đơn mới cho đến khi có kết quả.
                </p>
              </div>
            </div>
          )}

          {existingApplication?.status === ApplicationStatus.APPROVED && (
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-900">
              <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Đơn của bạn đã được duyệt</p>
                <p className="text-green-800/80 mt-1">Bạn đã là giảng viên, không cần nộp đơn nữa.</p>
              </div>
            </div>
          )}

          {isRejected && (
            <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-900">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm space-y-1">
                <p className="font-medium">Đơn trước đã bị từ chối</p>
                {existingApplication?.rejectionReason && (
                  <p className="text-rose-800/90">
                    <span className="font-medium">Lý do: </span>
                    {existingApplication.rejectionReason}
                  </p>
                )}
                <p className="text-rose-800/80">
                  Bạn có thể nộp lại đơn mới sau khi khắc phục các vấn đề trên.
                </p>
              </div>
            </div>
          )}

          <fieldset disabled={isBlocked} className="space-y-6 disabled:opacity-60">
            <div className="space-y-3">
              <Label>Chuyên môn & Kỹ năng</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập chuyên môn (VD: IELTS 8.0, Business English...)"
                  value={expInput}
                  onChange={(e) => setExpInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addExp();
                    }
                  }}
                  disabled={createApplicationMutation.isPending}
                />
                <Button
                  variant="secondary"
                  onClick={addExp}
                  type="button"
                  disabled={createApplicationMutation.isPending}
                >
                  Thêm
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[32px]">
                {expertise.map((e) => (
                  <Badge key={e} variant="outline" className="pl-3 pr-1 py-1 flex items-center gap-1">
                    {e}
                    <button
                      type="button"
                      onClick={() => removeExp(e)}
                      className="hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {expertise.length === 0 && (
                  <span className="text-sm text-muted-foreground italic">Chưa có chuyên môn nào.</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Ảnh Chứng chỉ / Bằng cấp</Label>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
              />

              <div
                onClick={triggerFileUpload}
                className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors text-center"
              >
                <div className="p-3 bg-primary/10 rounded-full mb-3">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium">Nhấn để tải lên ảnh chứng chỉ</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Hỗ trợ JPG, PNG, WebP (tối đa 5MB/file, 10 ảnh)
                </p>
              </div>

              {certFiles.length > 0 && (
                <div className="grid gap-2 mt-2">
                  {certFiles.map((p, idx) => (
                    <div
                      key={p.previewUrl}
                      className="flex items-center justify-between p-3 border rounded-lg bg-card"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <img
                            src={p.previewUrl}
                            alt="preview"
                            className="h-full w-full object-cover rounded"
                          />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-medium truncate">{p.file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(p.file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(idx)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="seller-application-message">Lời nhắn cho quản trị viên (tuỳ chọn)</Label>
              <Textarea
                id="seller-application-message"
                placeholder="Giới thiệu ngắn về kinh nghiệm giảng dạy, lý do bạn muốn trở thành giảng viên..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={1000}
                disabled={createApplicationMutation.isPending}
              />
              <p className="text-xs text-muted-foreground text-right">{message.length}/1000</p>
            </div>
          </fieldset>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createApplicationMutation.isPending}
            >
              {isBlocked ? 'Đóng' : 'Hủy'}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isBlocked || createApplicationMutation.isPending}
            >
              {createApplicationMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {isRejected ? 'Nộp lại đơn' : 'Nộp đơn'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}