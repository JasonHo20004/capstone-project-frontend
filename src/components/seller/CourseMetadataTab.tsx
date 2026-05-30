import { useEffect, useRef, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, RotateCcw, Upload, X, AlertTriangle, SendHorizontal, PauseCircle, Clock, XCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { CourseLevel, CourseStatus } from '@/domain';

type Draft = Partial<{
  title: string;
  description: string;
  price: number;
  courseLevel: CourseLevel;
  status: CourseStatus;
}>;

interface StatusInfo {
  label: string;
  emoji: string;
  bg: string;
  text: string;
}

interface Props {
  course: any;
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  onSave: () => void;
  onClearDraft: () => void;
  isSaving: boolean;
  statusConfig: Record<string, StatusInfo>;
  /** Optional new thumbnail file (transient — not persisted to localStorage). */
  thumbnailFile: File | null;
  setThumbnailFile: (file: File | null) => void;
}

export function CourseMetadataTab({
  course,
  draft,
  setDraft,
  onSave,
  onClearDraft,
  isSaving,
  statusConfig,
  thumbnailFile,
  setThumbnailFile,
}: Props) {
  const { t } = useTranslation('seller');
  const merged = { ...course, ...draft };
  const st = statusConfig[merged.status] ?? statusConfig.DRAFT;
  const isDirty = Object.keys(draft).length > 0 || !!thumbnailFile;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Generate (and clean up) preview URL whenever a new file is picked.
  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreview(null);
      return;
    }
    const url = URL.createObjectURL(thumbnailFile);
    setThumbnailPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnailFile]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handlePickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('metadataTab.toasts.imageTooLarge'));
      return;
    }
    if (!/^image\/(jpe?g|png|webp)$/.test(file.type)) {
      toast.error(t('metadataTab.toasts.imageType'));
      return;
    }
    setThumbnailFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Price-change warning: changes to ACTIVE course price don't affect existing buyers.
  const priceChanged =
    draft.price !== undefined &&
    course?.price !== undefined &&
    Number(draft.price) !== Number(course.price);
  const showPriceWarning = priceChanged && course?.status === 'ACTIVE';

  return (
    <>
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{t('metadataTab.title')}</h2>
          <p className="text-sm text-slate-500">{t('metadataTab.subtitle')}</p>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">{t('metadataTab.fields.title')}</label>
                <Input
                  className="rounded-xl h-11"
                  value={draft.title ?? merged.title ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  maxLength={100}
                />
                <div className="flex justify-end">
                  <span className="text-xs text-slate-400">
                    {(draft.title ?? merged.title ?? '').length}/100
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">{t('metadataTab.fields.price')}</label>
                <Input
                  className="rounded-xl h-11"
                  type="number"
                  value={draft.price ?? merged.price ?? 0}
                  onChange={(e) => setDraft((d) => ({ ...d, price: Number(e.target.value) }))}
                />
                {showPriceWarning && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <Trans i18nKey="metadataTab.priceWarning" ns="seller" components={{ strong: <strong /> }} />
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">{t('metadataTab.fields.level')}</label>
                <Select
                  value={draft.courseLevel ?? merged.courseLevel ?? ''}
                  onValueChange={(v) => setDraft((d) => ({ ...d, courseLevel: v as CourseLevel }))}
                >
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder={t('metadataTab.fields.levelPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lv) => (
                      <SelectItem key={lv} value={lv}>{lv}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">{t('metadataTab.fields.status')}</label>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${st.bg} ${st.text}`}>
                    {st.emoji} {st.label}
                  </span>
                  {(['DRAFT', 'REFUSE', 'INACTIVE'] as string[]).includes(merged.status) && (
                    <Button
                      size="sm"
                      variant="default"
                      className="text-xs rounded-lg"
                      onClick={() => {
                        setDraft((d) => ({ ...d, status: 'PENDING' as CourseStatus }));
                        toast.info(t('metadataTab.statusActions.submitToast'));
                      }}
                    >
                      <SendHorizontal size={14} className="mr-1" /> {t('metadataTab.statusActions.submit')}
                    </Button>
                  )}
                  {merged.status === 'ACTIVE' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs rounded-lg text-orange-600 border-orange-300 hover:bg-orange-50"
                      onClick={() => {
                        setDraft((d) => ({ ...d, status: 'INACTIVE' as CourseStatus }));
                        toast.info(t('metadataTab.statusActions.suspendToast'));
                      }}
                    >
                      <PauseCircle size={14} className="mr-1" /> {t('metadataTab.statusActions.suspend')}
                    </Button>
                  )}
                </div>
                {merged.status === 'PENDING' && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg flex items-center gap-1"><Clock size={12} /> {t('metadataTab.statusHints.pending')}</p>
                )}
                {merged.status === 'REFUSE' && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg flex items-center gap-1"><XCircle size={12} /> {t('metadataTab.statusHints.refuse')}</p>
                )}
                {draft.status && draft.status !== merged.status && (
                  <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
                    <Zap size={12} className="inline mr-1" /> <Trans i18nKey="metadataTab.statusChange" ns="seller" values={{ status: draft.status === 'PENDING' ? t('metadataTab.pendingLabel') : t('metadataTab.inactiveLabel') }} components={{ strong: <strong /> }} />
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">{t('metadataTab.fields.description')}</label>
              <Textarea
                className="rounded-xl"
                rows={5}
                value={draft.description ?? merged.description ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">{t('metadataTab.fields.thumbnail')}</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePickFile}
              />
              <div className="flex items-start gap-4 flex-wrap">
                <div className="h-28 w-44 rounded-xl overflow-hidden border bg-muted flex items-center justify-center relative shrink-0">
                  {thumbnailPreview ? (
                    <img src={thumbnailPreview} alt={t('metadataTab.thumbnail.newAlt')} className="w-full h-full object-cover" />
                  ) : merged.thumbnailUrl ? (
                    <img src={merged.thumbnailUrl} alt={t('metadataTab.thumbnail.currentAlt')} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('metadataTab.thumbnail.empty')}</span>
                  )}
                  {thumbnailPreview && (
                    <span className="absolute top-1 left-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {t('metadataTab.thumbnail.newBadge')}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {merged.thumbnailUrl || thumbnailPreview ? t('metadataTab.thumbnail.change') : t('metadataTab.thumbnail.upload')}
                  </Button>
                  {thumbnailFile && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setThumbnailFile(null)}
                      disabled={isSaving}
                      className="text-destructive"
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t('metadataTab.thumbnail.cancelNew')}
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">{t('metadataTab.thumbnail.formats')}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button className="rounded-xl px-6 shadow-sm" onClick={onSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? t('metadataTab.save.saving') : t('metadataTab.save.save')}
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={onClearDraft}>
                <RotateCcw className="w-4 h-4 mr-2" /> {t('metadataTab.clearDraft')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
