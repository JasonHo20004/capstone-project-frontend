import { useState, useRef, useMemo, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, X } from 'lucide-react';
import { useCreateLesson } from '@/hooks/api';
import type { Lesson } from "@/domain";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  moduleId?: string;
  existingLessons: Lesson[];
  onSuccess?: () => void;
}

export default function CreateLessonDialog({
  open,
  onOpenChange,
  courseId,
  moduleId,
  existingLessons,
  onSuccess,
}: Props) {
  const createLessonMutation = useCreateLesson();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate next lesson order (auto-increment)
  const nextLessonOrder = useMemo(() => {
    if (existingLessons.length === 0) return 1;
    const maxOrder = Math.max(...existingLessons.map((l) => l.lessonOrder ?? 0));
    return maxOrder + 1;
  }, [existingLessons]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    lessonOrder: 1,
    durationInSeconds: '',
    videoFile: null as File | null,
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update lesson order when dialog opens or nextLessonOrder changes
  useEffect(() => {
    if (open) {
      setFormData((prev) => ({ ...prev, lessonOrder: nextLessonOrder }));
    }
  }, [open, nextLessonOrder]);

  // Validate form
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
      const maxSize = 1024 * 1024 * 1024; // 1GB
      if (formData.videoFile.size > maxSize) {
        newErrors.videoFile = 'Kích thước video không được vượt quá 1GB';
      }
      const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
      if (!allowedTypes.includes(formData.videoFile.type)) {
        newErrors.videoFile = 'Chỉ chấp nhận file video (MP4, MPEG, MOV, AVI, WEBM)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form field changes
  const handleChange = (field: string, value: string | number | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle video file selection + auto-detect duration
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleChange('videoFile', file);

      // Auto-detect video duration using HTML5 video element
      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      videoEl.onloadedmetadata = () => {
        URL.revokeObjectURL(videoEl.src);
        if (videoEl.duration && isFinite(videoEl.duration)) {
          const durationSec = Math.round(videoEl.duration);
          setFormData((prev) => ({ ...prev, durationInSeconds: durationSec.toString() }));
          // Clear duration error if any
          setErrors((prev) => {
            const next = { ...prev };
            delete next['durationInSeconds'];
            return next;
          });
        }
      };
      videoEl.src = URL.createObjectURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Create FormData for multipart/form-data
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title.trim());
    if (formData.description.trim()) {
      formDataToSend.append('description', formData.description.trim());
    }
    if (formData.lessonOrder) {
      formDataToSend.append('lessonOrder', formData.lessonOrder.toString());
    }
    if (formData.durationInSeconds) {
      formDataToSend.append('durationInSeconds', formData.durationInSeconds);
    }
    if (formData.videoFile) {
      formDataToSend.append('video', formData.videoFile);
    }
    if (moduleId) {
      formDataToSend.append('moduleId', moduleId);
    }

    // Submit
    createLessonMutation.mutate(
      { courseId, formData: formDataToSend },
      {
        onSuccess: () => {
          // Reset form - lessonOrder will be updated by useEffect
          setFormData({
            title: '',
            description: '',
            lessonOrder: 1,
            durationInSeconds: '',
            videoFile: null,
          });
          setErrors({});
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setFormData({
        title: '',
        description: '',
        lessonOrder: 1,
        durationInSeconds: '',
        videoFile: null,
      });
      setErrors({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo bài học mới</DialogTitle>
          <DialogDescription>
            Điền thông tin để tạo bài học mới cho khóa học này.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Tiêu đề bài học <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="VD: Bài 1: Giới thiệu về IELTS Writing"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              disabled={createLessonMutation.isPending}
              maxLength={100}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              placeholder="Mô tả chi tiết về bài học..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={createLessonMutation.isPending}
              rows={4}
            />
          </div>

          {/* Lesson Order */}
          <div className="space-y-2">
            <Label htmlFor="lessonOrder">
              Thứ tự bài học <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lessonOrder"
              type="number"
              placeholder="VD: 1"
              value={formData.lessonOrder}
              onChange={(e) => handleChange('lessonOrder', parseInt(e.target.value) || 1)}
              disabled={createLessonMutation.isPending}
              min="1"
              className={errors.lessonOrder ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">
              Bài học tiếp theo sẽ có thứ tự: {nextLessonOrder}. Bạn có thể thay đổi nếu muốn.
            </p>
            {errors.lessonOrder && (
              <p className="text-sm text-destructive">{errors.lessonOrder}</p>
            )}
          </div>

          {/* Duration - auto-detected from video */}
          {formData.videoFile && formData.durationInSeconds && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg text-sm">
              <span className="text-emerald-600 font-medium">✓ Thời lượng tự động:</span>
              <span className="font-bold text-emerald-700">
                {Math.floor(parseFloat(formData.durationInSeconds) / 60)} phút {Math.round(parseFloat(formData.durationInSeconds) % 60)} giây
              </span>
            </div>
          )}

          {/* Video Upload */}
          <div className="space-y-2">
            <Label htmlFor="video">Video bài học (tùy chọn)</Label>
            <input
              ref={fileInputRef}
              type="file"
              id="video"
              accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm"
              onChange={handleFileChange}
              disabled={createLessonMutation.isPending}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors text-center"
            >
              <div className="p-3 bg-primary/10 rounded-full mb-3">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              {formData.videoFile ? (
                <div className="space-y-2 w-full">
                  <p className="text-sm font-medium">{formData.videoFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(formData.videoFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChange('videoFile', null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="mt-2"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Xóa file
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium">Nhấn để tải lên video</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hỗ trợ MP4, MPEG, MOV, AVI, WEBM (Tối đa 100MB)
                  </p>
                </>
              )}
            </div>
            {errors.videoFile && (
              <p className="text-sm text-destructive">{errors.videoFile}</p>
            )}
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createLessonMutation.isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={createLessonMutation.isPending}>
              {createLessonMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Tạo bài học
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

