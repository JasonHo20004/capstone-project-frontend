import { useState, useRef } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  X,
  Upload,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  DollarSign,
  GraduationCap,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCreateCourse } from '@/hooks/api';
import { CourseLevel } from '@/domain';

const COURSE_LEVELS: { value: CourseLevel; label: string; desc: string }[] = [
  { value: CourseLevel.A1, label: 'A1', desc: 'Beginner' },
  { value: CourseLevel.A2, label: 'A2', desc: 'Elementary' },
  { value: CourseLevel.B1, label: 'B1', desc: 'Intermediate' },
  { value: CourseLevel.B2, label: 'B2', desc: 'Upper Intermediate' },
  { value: CourseLevel.C1, label: 'C1', desc: 'Advanced' },
  { value: CourseLevel.C2, label: 'C2', desc: 'Proficiency' },
];

const CATEGORIES = [
  'IELTS Preparation',
  'TOEFL Preparation',
  'TOEIC Preparation',
  'Business English',
  'Conversation',
  'Grammar',
  'Vocabulary',
  'Pronunciation',
  'Academic Writing',
  'General English',
];

const STEPS = [
  { labelKey: 'basic', icon: BookOpen },
  { labelKey: 'description', icon: GraduationCap },
  { labelKey: 'media', icon: ImageIcon },
];

export default function SellerCreateCourse() {
  const { t, i18n } = useTranslation('seller');
  const navigate = useNavigate();
  const createCourseMutation = useCreateCourse();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    courseLevel: undefined as CourseLevel | undefined,
    thumbnailFile: null as File | null,
    thumbnailPreview: null as string | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error(t('createCourse.toasts.imageType')); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('createCourse.toasts.imageTooLarge')); return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, thumbnailFile: file, thumbnailPreview: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const removeThumbnail = () => {
    setFormData((prev) => ({ ...prev, thumbnailFile: null, thumbnailPreview: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!formData.title.trim()) errs.title = t('createCourse.errors.titleRequired');
      else if (formData.title.length > 100) errs.title = t('createCourse.errors.titleTooLong');
      if (!formData.price) errs.price = t('createCourse.errors.priceRequired');
      else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) errs.price = t('createCourse.errors.priceInvalid');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const goPrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = () => {
    if (!validateStep(0)) { setStep(0); return; }
    if (!validateStep(2)) { setStep(2); return; }

    // Send as multipart so the thumbnail file is actually uploaded.
    const fd = new FormData();
    fd.append('title', formData.title.trim());
    fd.append('price', formData.price);
    if (formData.description.trim()) fd.append('description', formData.description.trim());
    if (formData.category.trim()) fd.append('category', formData.category.trim());
    if (formData.courseLevel) fd.append('courseLevel', formData.courseLevel);
    if (formData.thumbnailFile) fd.append('thumbnail', formData.thumbnailFile);

    createCourseMutation.mutate(fd, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['seller-courses'] });
        navigate('/seller/courses');
      },
    });
  };

  const stepDone = (s: number) => {
    if (s === 0) return !!formData.title.trim() && !!formData.price;
    if (s === 1) return !!formData.description.trim();
    if (s === 2) return !!formData.thumbnailFile;
    return false;
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-slate-50 to-white">
      {/* ── Top Bar ── */}
      <div className="border-b bg-white/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/seller/courses')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors rounded-xl h-9 px-3 -ml-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('createCourse.backToList')}</span>
          </Button>
          <h1 className="text-base font-bold text-slate-900">{t('createCourse.topTitle')}</h1>
          <div className="w-20" /> {/* spacer */}
        </div>
      </div>

      {/* ── Horizontal Stepper ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-2">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const done = stepDone(i);
            const active = step === i;
            const past = step > i;
            return (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                {/* Step circle + label */}
                <button
                  type="button"
                  onClick={() => { if (i < step || stepDone(step) || i <= step) setStep(i); }}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div
                    className={`
                      w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm
                      ${done || past
                        ? 'bg-emerald-500 text-white shadow-emerald-200'
                        : active
                          ? 'bg-primary text-white shadow-primary/30 scale-110'
                          : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                      }
                    `}
                  >
                    {done || past ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <s.icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-xs font-bold transition-colors ${
                        active ? 'text-primary' : done || past ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {t('createCourse.stepLabel', { n: i + 1 })}
                    </div>
                    <div
                      className={`text-[11px] leading-tight mt-0.5 max-w-[90px] transition-colors ${
                        active ? 'text-slate-700' : 'text-slate-400'
                      }`}
                    >
                      {t(`createCourse.steps.${s.labelKey}`)}
                    </div>
                  </div>
                </button>

                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="flex-1 mx-3 mt-[-20px]">
                    <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          step > i ? 'bg-emerald-400 w-full' : step === i && stepDone(i) ? 'bg-emerald-300 w-full' : 'w-0'
                        }`}
                        style={{ width: step > i ? '100%' : step === i && stepDone(i) ? '100%' : '0%' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Form Content ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Step 1: Basic Info */}
          {step === 0 && (
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t('createCourse.step1.title')}</h2>
                <p className="text-sm text-slate-500 mt-1">{t('createCourse.step1.subtitle')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold">
                  {t('createCourse.step1.titleLabel')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder={t('createCourse.step1.titlePlaceholder')}
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  disabled={createCourseMutation.isPending}
                  maxLength={100}
                  className={`h-12 rounded-xl text-base ${errors.title ? 'border-red-400' : ''}`}
                />
                <div className="flex justify-between">
                  {errors.title ? <p className="text-sm text-red-500">{errors.title}</p> : <span />}
                  <span className="text-xs text-slate-400">{formData.title.length}/100</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-semibold">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" /> {t('createCourse.step1.priceLabel')} <span className="text-red-500">*</span>
                    </span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder={t('createCourse.step1.pricePlaceholder')}
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    disabled={createCourseMutation.isPending}
                    min="0"
                    step="1000"
                    className={`h-12 rounded-xl text-base ${errors.price ? 'border-red-400' : ''}`}
                  />
                  {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" /> {t('createCourse.step1.levelLabel')}
                    </span>
                  </Label>
                  <Select
                    {...(formData.courseLevel && { value: formData.courseLevel })}
                    onValueChange={(v) => handleChange('courseLevel', v)}
                    disabled={createCourseMutation.isPending}
                  >
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder={t('createCourse.step1.levelPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {COURSE_LEVELS.map((lv) => (
                        <SelectItem key={lv.value} value={lv.value}>
                          <span className="font-semibold">{lv.label}</span>
                          <span className="text-muted-foreground ml-1.5">— {lv.desc}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.courseLevel && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleChange('courseLevel', undefined)} className="h-7 text-xs">
                      {t('createCourse.step1.clearLevel')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Description & Category */}
          {step === 1 && (
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t('createCourse.step2.title')}</h2>
                <p className="text-sm text-slate-500 mt-1">{t('createCourse.step2.subtitle')}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t('createCourse.step2.descLabel')}</Label>
                <Textarea
                  placeholder={t('createCourse.step2.descPlaceholder')}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  disabled={createCourseMutation.isPending}
                  rows={7}
                  className="rounded-xl resize-none text-base leading-relaxed"
                />
                <p className="text-xs text-slate-400">{t('createCourse.step2.descHint')}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t('createCourse.step2.categoryLabel')}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => handleChange('category', v)}
                  disabled={createCourseMutation.isPending}
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder={t('createCourse.step2.categoryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400 mt-1.5">{t('createCourse.step2.customCategoryHint')}</p>
                <Input
                  placeholder={t('createCourse.step2.customCategoryPlaceholder')}
                  value={CATEGORIES.includes(formData.category) ? '' : formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  disabled={createCourseMutation.isPending}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Step 3: Thumbnail & Confirm */}
          {step === 2 && (
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t('createCourse.step3.title')}</h2>
                <p className="text-sm text-slate-500 mt-1">{t('createCourse.step3.subtitle')}</p>
              </div>

              {/* Upload area */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">{t('createCourse.step3.thumbnailLabel')}</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={createCourseMutation.isPending}
                />
                {formData.thumbnailPreview ? (
                  <div className="relative group">
                    <div className="aspect-video w-full overflow-hidden rounded-xl border-2 border-slate-200">
                      <img src={formData.thumbnailPreview} alt={t('createCourse.step3.thumbnailAlt')} className="h-full w-full object-cover" />
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                      <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-lg">
                        <Upload className="w-4 h-4 mr-1" /> {t('createCourse.step3.changeImage')}
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={removeThumbnail} className="rounded-lg">
                        <X className="w-4 h-4 mr-1" /> {t('createCourse.step3.remove')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/[0.02] transition-all cursor-pointer group"
                  >
                    <div className="w-14 h-14 bg-slate-100 group-hover:bg-primary/10 rounded-2xl flex items-center justify-center transition-colors">
                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-600">{t('createCourse.step3.uploadHint')}</p>
                      <p className="text-xs text-slate-400 mt-1">{t('createCourse.step3.uploadFormats')}</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Summary card */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {t('createCourse.step3.summaryTitle')}
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-400">{t('createCourse.step3.summaryTitleLabel')}</span>
                    <p className="font-medium text-slate-800 mt-0.5 truncate">{formData.title || t('createCourse.step3.empty')}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('createCourse.step3.summaryPrice')}</span>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {formData.price ? t('createCourse.step3.priceUnit', { amount: Number(formData.price).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-GB') }) : t('createCourse.step3.empty')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('createCourse.step3.summaryCategory')}</span>
                    <p className="font-medium text-slate-800 mt-0.5">{formData.category || t('createCourse.step3.empty')}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('createCourse.step3.summaryLevel')}</span>
                    <p className="font-medium text-slate-800 mt-0.5">{formData.courseLevel || t('createCourse.step3.empty')}</p>
                  </div>
                </div>
                {formData.description && (
                  <div>
                    <span className="text-xs text-slate-400">{t('createCourse.step3.summaryDescription')}</span>
                    <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">{formData.description}</p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-xs text-blue-700">
                <Trans i18nKey="createCourse.step3.draftNotice" ns="seller" components={{ strong: <strong /> }} />
              </div>
            </div>
          )}

          {/* ── Bottom Navigation ── */}
          <div className="px-6 sm:px-8 py-5 border-t bg-slate-50/50 flex items-center justify-between">
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={goPrev} className="rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-2" /> {t('createCourse.nav.back')}
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={() => navigate('/seller/courses')} className="rounded-xl text-slate-500">
                {t('createCourse.nav.cancel')}
              </Button>
            )}

            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={goNext} className="rounded-xl px-6">
                {t('createCourse.nav.next')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={createCourseMutation.isPending}
                className="rounded-xl px-8 shadow-lg shadow-primary/20"
              >
                {createCourseMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {createCourseMutation.isPending ? t('createCourse.nav.submitting') : t('createCourse.nav.submit')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
