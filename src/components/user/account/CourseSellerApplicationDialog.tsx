import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('account');
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
      toast.warning(t('sellerApplication.toasts.expertiseExists'));
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
        toast.warning(t('sellerApplication.toasts.filesTooLarge'));
      }

      const remainingSlots = Math.max(0, 10 - certFiles.length);
      if (validFiles.length > remainingSlots) {
        toast.warning(t('sellerApplication.toasts.maxImages'));
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
      toast.error(t('sellerApplication.toasts.blocked'));
      return;
    }
    if (certFiles.length === 0) {
      toast.error(t('sellerApplication.toasts.certRequired'));
      return;
    }
    if (expertise.length === 0) {
      toast.error(t('sellerApplication.toasts.expertiseRequired'));
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
          <DialogTitle>{t('sellerApplication.title')}</DialogTitle>
          <DialogDescription>
            {t('sellerApplication.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {existingApplication?.status === ApplicationStatus.PENDING && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">{t('sellerApplication.pending.title')}</p>
                <p className="text-amber-800/80 mt-1">
                  {t('sellerApplication.pending.message')}
                </p>
              </div>
            </div>
          )}

          {existingApplication?.status === ApplicationStatus.APPROVED && (
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-900">
              <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">{t('sellerApplication.approved.title')}</p>
                <p className="text-green-800/80 mt-1">{t('sellerApplication.approved.message')}</p>
              </div>
            </div>
          )}

          {isRejected && (
            <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-900">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm space-y-1">
                <p className="font-medium">{t('sellerApplication.rejected.title')}</p>
                {existingApplication?.rejectionReason && (
                  <p className="text-rose-800/90">
                    <span className="font-medium">{t('sellerApplication.rejected.reason')}</span>
                    {existingApplication.rejectionReason}
                  </p>
                )}
                <p className="text-rose-800/80">
                  {t('sellerApplication.rejected.canResubmit')}
                </p>
              </div>
            </div>
          )}

          <fieldset disabled={isBlocked} className="space-y-6 disabled:opacity-60">
            <div className="space-y-3">
              <Label>{t('sellerApplication.expertiseLabel')}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={t('sellerApplication.expertisePlaceholder')}
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
                  {t('sellerApplication.add')}
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
                  <span className="text-sm text-muted-foreground italic">{t('sellerApplication.noExpertise')}</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label>{t('sellerApplication.certLabel')}</Label>

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
                <p className="text-sm font-medium">{t('sellerApplication.certUploadTitle')}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('sellerApplication.certUploadHint')}
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
              <Label htmlFor="seller-application-message">{t('sellerApplication.messageLabel')}</Label>
              <Textarea
                id="seller-application-message"
                placeholder={t('sellerApplication.messagePlaceholder')}
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
              {isBlocked ? t('sellerApplication.close') : t('sellerApplication.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isBlocked || createApplicationMutation.isPending}
            >
              {createApplicationMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {isRejected ? t('sellerApplication.resubmit') : t('sellerApplication.submit')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
