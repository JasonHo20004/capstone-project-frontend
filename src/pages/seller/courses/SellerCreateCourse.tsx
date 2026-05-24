import { useState, useRef } from 'react';
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
  { label: 'Thông tin cơ bản', icon: BookOpen },
  { label: 'Mô tả & danh mục', icon: GraduationCap },
  { label: 'Hình ảnh & Xác nhận', icon: ImageIcon },
];

export default function SellerCreateCourse() {
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
      toast.error('Chỉ chấp nhận JPEG, PNG, WEBP, GIF'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File không được vượt quá 5MB'); return;
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
      if (!formData.title.trim()) errs.title = 'Tiêu đề là bắt buộc';
      else if (formData.title.length > 100) errs.title = 'Tối đa 100 ký tự';
      if (!formData.price) errs.price = 'Giá là bắt buộc';
      else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) errs.price = 'Giá không hợp lệ';
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
            <span className="hidden sm:inline">Quay lại</span>
          </Button>
          <h1 className="text-base font-bold text-slate-900">Tạo khóa học mới</h1>
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
                      Bước {i + 1}
                    </div>
                    <div
                      className={`text-[11px] leading-tight mt-0.5 max-w-[90px] transition-colors ${
                        active ? 'text-slate-700' : 'text-slate-400'
                      }`}
                    >
                      {s.label}
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
                <h2 className="text-xl font-bold text-slate-900">Thông tin cơ bản</h2>
                <p className="text-sm text-slate-500 mt-1">Điền tiêu đề và giá cho khóa học của bạn</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold">
                  Tiêu đề khóa học <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="VD: IELTS Speaking Masterclass — Band 7.0+"
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
                      <DollarSign className="w-3.5 h-3.5" /> Giá (VNĐ) <span className="text-red-500">*</span>
                    </span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="500000"
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
                      <GraduationCap className="w-3.5 h-3.5" /> Trình độ
                    </span>
                  </Label>
                  <Select
                    {...(formData.courseLevel && { value: formData.courseLevel })}
                    onValueChange={(v) => handleChange('courseLevel', v)}
                    disabled={createCourseMutation.isPending}
                  >
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Chọn trình độ" />
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
                      Xóa level
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
                <h2 className="text-xl font-bold text-slate-900">Mô tả & Danh mục</h2>
                <p className="text-sm text-slate-500 mt-1">Giúp học viên hiểu khóa học của bạn</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Mô tả khóa học</Label>
                <Textarea
                  placeholder="Mô tả chi tiết: đối tượng, nội dung chính, kết quả đạt được..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  disabled={createCourseMutation.isPending}
                  rows={7}
                  className="rounded-xl resize-none text-base leading-relaxed"
                />
                <p className="text-xs text-slate-400">Mô tả hấp dẫn giúp tăng tỉ lệ đăng ký</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Danh mục</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => handleChange('category', v)}
                  disabled={createCourseMutation.isPending}
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400 mt-1.5">Hoặc nhập danh mục tùy chỉnh:</p>
                <Input
                  placeholder="VD: PTE, Cambridge..."
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
                <h2 className="text-xl font-bold text-slate-900">Hình ảnh & Xác nhận</h2>
                <p className="text-sm text-slate-500 mt-1">Thêm thumbnail và kiểm tra lại thông tin</p>
              </div>

              {/* Upload area */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Ảnh đại diện khóa học</Label>
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
                      <img src={formData.thumbnailPreview} alt="Thumbnail" className="h-full w-full object-cover" />
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                      <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-lg">
                        <Upload className="w-4 h-4 mr-1" /> Đổi ảnh
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={removeThumbnail} className="rounded-lg">
                        <X className="w-4 h-4 mr-1" /> Xóa
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
                      <p className="text-sm font-medium text-slate-600">Nhấn để tải ảnh lên</p>
                      <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WEBP, GIF • Tối đa 5MB</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Summary card */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Tóm tắt khóa học
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-400">Tiêu đề</span>
                    <p className="font-medium text-slate-800 mt-0.5 truncate">{formData.title || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Giá</span>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {formData.price ? `${Number(formData.price).toLocaleString('vi-VN')} đ` : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Danh mục</span>
                    <p className="font-medium text-slate-800 mt-0.5">{formData.category || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Trình độ</span>
                    <p className="font-medium text-slate-800 mt-0.5">{formData.courseLevel || '—'}</p>
                  </div>
                </div>
                {formData.description && (
                  <div>
                    <span className="text-xs text-slate-400">Mô tả</span>
                    <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">{formData.description}</p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-xs text-blue-700">
                Khóa học sẽ ở trạng thái <strong>DRAFT</strong> sau khi tạo. Bạn có thể thêm bài học, bài kiểm tra rồi submit để admin duyệt.
              </div>
            </div>
          )}

          {/* ── Bottom Navigation ── */}
          <div className="px-6 sm:px-8 py-5 border-t bg-slate-50/50 flex items-center justify-between">
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={goPrev} className="rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={() => navigate('/seller/courses')} className="rounded-xl text-slate-500">
                Hủy
              </Button>
            )}

            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={goNext} className="rounded-xl px-6">
                Tiếp theo <ArrowRight className="w-4 h-4 ml-2" />
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
                {createCourseMutation.isPending ? 'Đang tạo...' : 'Tạo khóa học'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
