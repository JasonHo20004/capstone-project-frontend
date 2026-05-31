import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Loader2, ImageOff } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateSellerProfile } from '@/hooks/api/use-user';
import type { CourseSellerProfile } from '@/domain';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current profile values — used to seed the form. */
  profile: Pick<CourseSellerProfile, 'certification' | 'expertise'>;
}

interface PreviewFile {
  file: File;
  previewUrl: string;
}

export default function EditSellerProfileDialog({ open, onOpenChange, profile }: Props) {
  const { t } = useTranslation('seller');
  const mutation = useUpdateSellerProfile();

  const [expertise, setExpertise] = useState<string[]>(profile.expertise ?? []);
  const [expInput, setExpInput] = useState('');

  // Two lists: existing URLs the seller wants to KEEP, and new files to upload.
  const [keptCerts, setKeptCerts] = useState<string[]>(profile.certification ?? []);
  const [newFiles, setNewFiles] = useState<PreviewFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Mirror `newFiles` so unmount cleanup sees the latest blob URLs, not the
  // stale list captured by an empty-dep effect closure.
  const newFilesRef = useRef<PreviewFile[]>([]);
  useEffect(() => {
    newFilesRef.current = newFiles;
  }, [newFiles]);

  // Re-seed state every time the dialog opens so we start from the latest server data.
  useEffect(() => {
    if (open) {
      setExpertise(profile.expertise ?? []);
      setKeptCerts(profile.certification ?? []);
      setExpInput('');
      newFilesRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setNewFiles([]);
    }
  }, [open, profile]);

  // Cleanup any outstanding blob URLs on unmount.
  useEffect(() => {
    return () => {
      newFilesRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  const addExp = () => {
    const v = expInput.trim();
    if (!v) return;
    if (expertise.includes(v)) {
      toast.warning(t('editProfile.errors.duplicateExpertise'));
      return;
    }
    setExpertise((prev) => [...prev, v]);
    setExpInput('');
  };

  const removeExp = (e: string) => {
    setExpertise((prev) => prev.filter((x) => x !== e));
  };

  const removeKeptCert = (url: string) => {
    setKeptCerts((prev) => prev.filter((u) => u !== url));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const incoming = Array.from(e.target.files);
    const validFiles = incoming.filter((f) => f.size <= 5 * 1024 * 1024);
    if (validFiles.length < incoming.length) {
      toast.warning(t('editProfile.errors.fileTooLarge'));
    }

    const remainingSlots = Math.max(0, 10 - (keptCerts.length + newFiles.length));
    if (validFiles.length > remainingSlots) {
      toast.warning(t('editProfile.errors.maxImages'));
      validFiles.splice(remainingSlots);
    }

    const previews: PreviewFile[] = validFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setNewFiles((prev) => [...prev, ...previews]);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeNewFile = (idx: number) => {
    setNewFiles((prev) => {
      const target = prev[idx];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = () => {
    const totalCerts = keptCerts.length + newFiles.length;
    if (totalCerts === 0) {
      toast.error(t('editProfile.errors.atLeastOneCert'));
      return;
    }
    if (expertise.length === 0) {
      toast.error(t('editProfile.errors.atLeastOneExpertise'));
      return;
    }

    const formData = new FormData();
    newFiles.forEach(({ file }) => formData.append('images', file));
    keptCerts.forEach((url) => formData.append('certification', url));
    expertise.forEach((exp) => formData.append('expertise', exp));

    mutation.mutate(formData, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const isPending = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('editProfile.title')}</DialogTitle>
          <DialogDescription>{t('editProfile.lead')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Expertise */}
          <div className="space-y-3">
            <Label>{t('editProfile.expertiseLabel')}</Label>
            <div className="flex gap-2">
              <Input
                placeholder={t('editProfile.expertisePlaceholder')}
                value={expInput}
                onChange={(e) => setExpInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addExp();
                  }
                }}
                disabled={isPending}
              />
              <Button variant="secondary" onClick={addExp} type="button" disabled={isPending}>
                {t('editProfile.add')}
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
                    disabled={isPending}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {expertise.length === 0 && (
                <span className="text-sm text-muted-foreground italic">
                  {t('editProfile.noExpertise')}
                </span>
              )}
            </div>
          </div>

          {/* Existing certificates */}
          {keptCerts.length > 0 && (
            <div className="space-y-3">
              <Label>{t('editProfile.existingCerts')}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {keptCerts.map((url) => (
                  <div
                    key={url}
                    className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-white"
                  >
                    <img
                      src={url}
                      alt={t('editProfile.certAlt')}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeKeptCert(url)}
                      disabled={isPending}
                      className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={t('editProfile.removeCertTitle')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload new certificates */}
          <div className="space-y-3">
            <Label>{t('editProfile.addNewCerts')}</Label>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
            />
            <div
              onClick={() => !isPending && fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors text-center"
            >
              <div className="p-3 bg-primary/10 rounded-full mb-2">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-medium">{t('editProfile.uploadPrompt')}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('editProfile.uploadHint')}
              </p>
            </div>

            {newFiles.length > 0 && (
              <div className="grid gap-2 mt-2">
                {newFiles.map((p, idx) => (
                  <div
                    key={p.previewUrl}
                    className="flex items-center justify-between p-3 border rounded-lg bg-card"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img src={p.previewUrl} alt={t('editProfile.previewAlt')} className="h-full w-full object-cover" />
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
                      onClick={() => removeNewFile(idx)}
                      disabled={isPending}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {keptCerts.length + newFiles.length === 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-600">
                <ImageOff className="w-3.5 h-3.5" />
                {t('editProfile.errors.atLeastOneCert')}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              {t('editProfile.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || expertise.length === 0 || keptCerts.length + newFiles.length === 0}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('editProfile.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
