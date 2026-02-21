import { useState, useRef } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateCourse } from '@/hooks/api';
import { CourseLevel } from "@/domain";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const COURSE_LEVELS: CourseLevel[] = [
  CourseLevel.A1,
  CourseLevel.A2,
  CourseLevel.B1,
  CourseLevel.B2,
  CourseLevel.C1,
  CourseLevel.C2,
];

export default function CreateCourseDialog({ open, onOpenChange, onSuccess }: Props) {
  const createCourseMutation = useCreateCourse();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    courseLevel: undefined as CourseLevel | undefined,
    thumbnailFile: null as File | null,
    thumbnailPreview: null as string | null,
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề khóa học là bắt buộc';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Tiêu đề không được vượt quá 100 ký tự';
    }

    if (formData.price === '') {
      newErrors.price = 'Giá khóa học là bắt buộc';
    } else {
      const priceNum = parseFloat(formData.price);
      if (isNaN(priceNum) || priceNum < 0) {
        newErrors.price = 'Giá phải là số không âm';
      }
    }

    if (formData.courseLevel !== undefined && !COURSE_LEVELS.includes(formData.courseLevel)) {
      newErrors.courseLevel = 'Level không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form field changes
  const handleChange = (field: string, value: string | undefined) => {
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

  // Handle thumbnail file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận file ảnh (JPEG, PNG, WEBP, GIF)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File ảnh không được vượt quá 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        thumbnailFile: file,
        thumbnailPreview: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Remove thumbnail
  const removeThumbnail = () => {
    setFormData((prev) => ({
      ...prev,
      thumbnailFile: null,
      thumbnailPreview: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger file input
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // If there's a thumbnail file, use FormData; otherwise use JSON
    if (formData.thumbnailFile) {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('price', formData.price);
      if (formData.description.trim()) {
        formDataToSend.append('description', formData.description.trim());
      }
      if (formData.category.trim()) {
        formDataToSend.append('category', formData.category.trim());
      }
      if (formData.courseLevel) {
        formDataToSend.append('courseLevel', formData.courseLevel);
      }
      formDataToSend.append('image', formData.thumbnailFile);

      // Submit with FormData
      createCourseMutation.mutate(formDataToSend, {
        onSuccess: () => {
          // Reset form
          setFormData({
            title: '',
            description: '',
            price: '',
            category: '',
            courseLevel: undefined,
            thumbnailFile: null,
            thumbnailPreview: null,
          });
          setErrors({});
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          onOpenChange(false);
          onSuccess?.();
        },
      });
    } else {
      // Submit with JSON (backward compatible)
      const payload = {
        title: formData.title.trim(),
        price: parseFloat(formData.price),
        ...(formData.description.trim() && { description: formData.description.trim() }),
        ...(formData.category.trim() && { category: formData.category.trim() }),
        ...(formData.courseLevel && { courseLevel: formData.courseLevel as CourseLevel }),
      };

      createCourseMutation.mutate(payload, {
        onSuccess: () => {
          // Reset form
          setFormData({
            title: '',
            description: '',
            price: '',
            category: '',
            courseLevel: undefined,
            thumbnailFile: null,
            thumbnailPreview: null,
          });
          setErrors({});
          onOpenChange(false);
          onSuccess?.();
        },
      });
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setFormData({
        title: '',
        description: '',
        price: '',
        category: '',
        courseLevel: undefined,
        thumbnailFile: null,
        thumbnailPreview: null,
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
          <DialogTitle>Tạo khóa học mới</DialogTitle>
          <DialogDescription>
            Điền thông tin để tạo khóa học mới. Khóa học sẽ ở trạng thái DRAFT sau khi tạo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Tiêu đề khóa học <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="VD: IELTS Speaking Masterclass"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              disabled={createCourseMutation.isPending}
              maxLength={100}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              placeholder="Mô tả chi tiết về khóa học..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={createCourseMutation.isPending}
              rows={4}
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">
              Giá (VNĐ) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              placeholder="VD: 500000"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              disabled={createCourseMutation.isPending}
              min="0"
              step="1000"
              className={errors.price ? 'border-destructive' : ''}
            />
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Danh mục</Label>
            <Input
              id="category"
              placeholder="VD: IELTS, TOEFL, Business English"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              disabled={createCourseMutation.isPending}
              maxLength={100}
            />
          </div>

          {/* Course Level */}
          <div className="space-y-2">
            <Label htmlFor="courseLevel">Level</Label>
            <Select
              {...(formData.courseLevel && { value: formData.courseLevel })}
              onValueChange={(value) => handleChange('courseLevel', value)}
              disabled={createCourseMutation.isPending}
            >
              <SelectTrigger id="courseLevel" className={errors.courseLevel ? 'border-destructive' : ''}>
                <SelectValue placeholder="Chọn level (tùy chọn)" />
              </SelectTrigger>
              <SelectContent>
                {COURSE_LEVELS.map((level) => (
                  <SelectItem key={level} value={level as string}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.courseLevel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleChange('courseLevel', undefined)}
                disabled={createCourseMutation.isPending}
                className="h-8 text-xs"
              >
                Xóa level
              </Button>
            )}
            {errors.courseLevel && (
              <p className="text-sm text-destructive">{errors.courseLevel}</p>
            )}
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail khóa học</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
              id="thumbnail"
              disabled={createCourseMutation.isPending}
            />
            {formData.thumbnailPreview ? (
              <div className="relative w-full">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
                  <img
                    src={formData.thumbnailPreview}
                    alt="Thumbnail preview"
                    className="h-full w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8"
                    onClick={removeThumbnail}
                    disabled={createCourseMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formData.thumbnailFile?.name} ({(formData.thumbnailFile?.size || 0) / 1024 / 1024} MB)
                </p>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={triggerFileUpload}
                disabled={createCourseMutation.isPending}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Chọn ảnh thumbnail (Tối đa 5MB)
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Hỗ trợ: JPEG, PNG, WEBP, GIF
            </p>
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createCourseMutation.isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={createCourseMutation.isPending}>
              {createCourseMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Tạo khóa học
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

