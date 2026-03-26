import { useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, X, ArrowLeft, BookOpen, Film, FileText, Hash } from 'lucide-react';
import { useCreateLesson, useCourse, useModules } from '@/hooks/api';

export default function CreateLessonPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get('moduleId') || undefined;
  const navigate = useNavigate();

  const { data: course } = useCourse(courseId);
  const { data: modules = [] } = useModules(courseId);
  const createLessonMutation = useCreateLesson();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find module name if moduleId is provided
  const moduleName = useMemo(() => {
    if (!moduleId || !modules) return null;
    const mod = (modules as any[]).find((m) => m.id === moduleId);
    return mod?.title ?? null;
  }, [moduleId, modules]);

  // Calculate next lesson order
  const existingLessons = useMemo(() => {
    if (!course?.lessons) return [];
    return (course.lessons as any[])
      .map((item: any) => item.lesson ?? item)
      .filter((l: any) => !!l && typeof l.id === 'string');
  }, [course]);

  const nextLessonOrder = useMemo(() => {
    if (existingLessons.length === 0) return 1;
    const maxOrder = Math.max(...existingLessons.map((l: any) => l.lessonOrder ?? 0));
    return maxOrder + 1;
  }, [existingLessons]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    lessonOrder: nextLessonOrder,
    durationInSeconds: '',
    videoFile: null as File | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề bài học là bắt buộc';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Tiêu đề không được vượt quá 100 ký tự';
    }
    if (formData.lessonOrder < 1) {
      newErrors.lessonOrder = 'Thứ tự bài học phải lớn hơn 0';
    }
    if (formData.videoFile) {
      const maxSize = 100 * 1024 * 1024;
      if (formData.videoFile.size > maxSize) {
        newErrors.videoFile = 'Kích thước video không được vượt quá 100MB';
      }
      const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
      if (!allowedTypes.includes(formData.videoFile.type)) {
        newErrors.videoFile = 'Chỉ chấp nhận file video (MP4, MPEG, MOV, AVI, WEBM)';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string | number | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleChange('videoFile', file);

      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      videoEl.onloadedmetadata = () => {
        URL.revokeObjectURL(videoEl.src);
        if (videoEl.duration && isFinite(videoEl.duration)) {
          const durationSec = Math.round(videoEl.duration);
          setFormData((prev) => ({ ...prev, durationInSeconds: durationSec.toString() }));
          setErrors((prev) => { const n = { ...prev }; delete n['durationInSeconds']; return n; });
        }
      };
      videoEl.src = URL.createObjectURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !courseId) return;

    const fd = new FormData();
    fd.append('title', formData.title.trim());
    if (formData.description.trim()) fd.append('description', formData.description.trim());
    if (formData.lessonOrder) fd.append('lessonOrder', formData.lessonOrder.toString());
    if (formData.durationInSeconds) fd.append('durationInSeconds', formData.durationInSeconds);
    if (formData.videoFile) fd.append('video', formData.videoFile);
    if (moduleId) fd.append('moduleId', moduleId);

    createLessonMutation.mutate(
      { courseId, formData: fd },
      {
        onSuccess: () => {
          navigate(`/seller/courses/${courseId}`, { state: { tab: 'lessons' } });
        },
      }
    );
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => navigate(`/seller/courses/${courseId}`)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại {course?.title ?? 'khóa học'}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Tạo bài học mới</h1>
              <p className="text-sm text-slate-500">
                {course?.title}
                {moduleName && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium">
                    📁 {moduleName}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">
                <FileText className="w-4 h-4 text-blue-500" />
                Thông tin cơ bản
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold text-slate-700">
                  Tiêu đề bài học <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  className="rounded-xl h-11"
                  placeholder="VD: Bài 1: Giới thiệu về IELTS Writing"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  disabled={createLessonMutation.isPending}
                  maxLength={100}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-slate-700">Mô tả</Label>
                <Textarea
                  id="description"
                  className="rounded-xl"
                  placeholder="Mô tả chi tiết về nội dung bài học..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  disabled={createLessonMutation.isPending}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lessonOrder" className="text-sm font-semibold text-slate-700">
                  <Hash className="w-3.5 h-3.5 inline mr-1" />
                  Thứ tự bài học <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lessonOrder"
                  className="rounded-xl h-11 max-w-[200px]"
                  type="number"
                  value={formData.lessonOrder || nextLessonOrder}
                  onChange={(e) => handleChange('lessonOrder', parseInt(e.target.value) || 1)}
                  disabled={createLessonMutation.isPending}
                  min="1"
                />
                <p className="text-xs text-slate-400">
                  Bài học tiếp theo sẽ có thứ tự: {nextLessonOrder}. Bạn có thể thay đổi nếu muốn.
                </p>
                {errors.lessonOrder && <p className="text-sm text-red-500">{errors.lessonOrder}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Video Upload */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">
                <Film className="w-4 h-4 text-teal-500" />
                Video bài giảng
              </div>

              {/* Duration display */}
              {formData.videoFile && formData.durationInSeconds && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl text-sm">
                  <span className="text-emerald-600 font-medium">✓ Thời lượng tự động:</span>
                  <span className="font-bold text-emerald-700">
                    {Math.floor(parseFloat(formData.durationInSeconds) / 60)} phút {Math.round(parseFloat(formData.durationInSeconds) % 60)} giây
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Video bài học (tùy chọn)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm"
                  onChange={handleFileChange}
                  disabled={createLessonMutation.isPending}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-300 transition-all text-center group"
                >
                  <div className="p-4 bg-blue-50 group-hover:bg-blue-100 rounded-2xl mb-4 transition-colors">
                    <Upload className="w-7 h-7 text-blue-500" />
                  </div>
                  {formData.videoFile ? (
                    <div className="space-y-2 w-full">
                      <p className="text-sm font-semibold text-slate-800">{formData.videoFile.name}</p>
                      <p className="text-xs text-slate-500">
                        {(formData.videoFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChange('videoFile', null);
                          setFormData((prev) => ({ ...prev, durationInSeconds: '' }));
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="mt-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Xóa file
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-slate-700">Kéo thả hoặc nhấn để tải lên video</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Hỗ trợ MP4, MPEG, MOV, AVI, WEBM (Tối đa 100MB)
                      </p>
                    </>
                  )}
                </div>
                {errors.videoFile && <p className="text-sm text-red-500">{errors.videoFile}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => navigate(`/seller/courses/${courseId}`)}
              disabled={createLessonMutation.isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Hủy
            </Button>
            <Button
              type="submit"
              className="rounded-xl px-8 shadow-sm"
              disabled={createLessonMutation.isPending}
            >
              {createLessonMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Tạo bài học
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
