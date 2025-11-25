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
import { Badge } from '@/components/ui/badge';
import { X, Upload, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateSellerApplication } from '@/hooks/api/use-user';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string; // (Có thể không cần dùng nếu API tự lấy từ token)
  onSubmitted?: (app: any) => void;
}

export default function CourseSellerApplicationDialog({ open, onOpenChange, onSubmitted }: Props) {
  // Hook mutation
  const createApplicationMutation = useCreateSellerApplication();

  // State cho Chuyên môn (Text Array)
  const [expInput, setExpInput] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);

  // State cho Chứng chỉ (File Array) - Thay đổi logic tại đây
  const [certFiles, setCertFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers cho Chuyên môn (Expertise)
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

  // Handlers cho Chứng chỉ (Files)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to Array
      const newFiles = Array.from(e.target.files);
      
      // Validate (VD: tối đa 5 file, mỗi file 5MB)
      const validFiles = newFiles.filter(f => f.size <= 5 * 1024 * 1024);
      
      if (validFiles.length < newFiles.length) {
        toast.warning('Một số file quá lớn (>5MB) đã bị bỏ qua.');
      }

      setCertFiles(prev => [...prev, ...validFiles]);
    }
    // Reset value để cho phép chọn lại file cũ nếu muốn
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (indexToRemove: number) => {
    setCertFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Submit Form
  const handleSubmit = () => {
    // Validation
    if (certFiles.length === 0) {
      toast.error('Vui lòng tải lên ít nhất 1 ảnh chứng chỉ.');
      return;
    }
    if (expertise.length === 0) {
      toast.error('Vui lòng nhập ít nhất 1 chuyên môn.');
      return;
    }

    // Tạo FormData
    const formData = new FormData();

    // 1. Append Files
    // Lưu ý: Tên field 'images' phải khớp với cấu hình middleware uploadImages ở backend
    // (Ví dụ backend dùng: upload.array('images'))
    certFiles.forEach((file) => {
      formData.append('images', file); 
    });

    // 2. Append Expertise
    // Gửi từng item expertise với cùng key để backend (multer/body-parser) nhận thành mảng
    expertise.forEach((exp) => {
      formData.append('expertise', exp);
    });

    // Gọi API
    createApplicationMutation.mutate(formData, {
      onSuccess: (data) => {
        onSubmitted?.(data);
        onOpenChange(false);
        // Reset form
        setExpertise([]);
        setCertFiles([]);
      }
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
          
          {/* 1. Phần Chuyên môn (Text Tags) */}
          <div className="space-y-3">
            <Label>Chuyên môn & Kỹ năng</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nhập chuyên môn (VD: IELTS 8.0, Business English...)"
                value={expInput}
                onChange={(e) => setExpInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addExp(); }}
                disabled={createApplicationMutation.isPending}
              />
              <Button variant="secondary" onClick={addExp} type="button" disabled={createApplicationMutation.isPending}>
                Thêm
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {expertise.map((e) => (
                <Badge key={e} variant="outline" className="pl-3 pr-1 py-1 flex items-center gap-1">
                  {e}
                  <button onClick={() => removeExp(e)} className="hover:bg-destructive/20 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {expertise.length === 0 && (
                <span className="text-sm text-muted-foreground italic">Chưa có chuyên môn nào.</span>
              )}
            </div>
          </div>

          {/* 2. Phần Chứng chỉ (File Upload) */}
          <div className="space-y-3">
            <Label>Ảnh Chứng chỉ / Bằng cấp</Label>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple // Cho phép chọn nhiều file
              accept="image/*" // Chỉ nhận ảnh
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
              <p className="text-xs text-muted-foreground mt-1">Hỗ trợ JPG, PNG (Tối đa 5MB/file)</p>
            </div>

            {/* Danh sách file đã chọn */}
            {certFiles.length > 0 && (
              <div className="grid gap-2 mt-2">
                {certFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        {/* Preview ảnh nhỏ */}
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt="preview" 
                          className="h-full w-full object-cover rounded"
                        />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>
                    <Button 
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

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createApplicationMutation.isPending}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={createApplicationMutation.isPending}>
              {createApplicationMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Nộp đơn
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}