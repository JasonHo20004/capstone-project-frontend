import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { courseManagementService } from "@/lib/api/services/admin";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminLessonDetail() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: lessonResp } = useQuery({
    queryKey: ["adminLessonDetail", lessonId, searchParams.get("courseId")],
    queryFn: () => courseManagementService.getLessonById(searchParams.get("courseId")!, lessonId!),
    enabled: !!lessonId && !!searchParams.get("courseId"),
  });

  const lesson = lessonResp?.data;

  const [form, setForm] = useState({
    title: "",
    description: "",
    durationInSeconds: "",
    lessonOrder: "",
    materialsText: "",
    videoUrl: "",
  });

  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lesson) {
      const videoAsset = (lesson.mediaAssets || []).find((asset: any) => asset.assetType === 'VIDEO');
      setForm({
        title: lesson.title ?? "",
        description: lesson.description ?? "",
        durationInSeconds: String(lesson.durationInSeconds ?? ""),
        lessonOrder: String(lesson.lessonOrder ?? ""),
        materialsText: (lesson.materials || []).join("\n"),
        videoUrl: videoAsset?.assetUrl ?? "",
      });
    }
  }, [lesson]);

  const updateLessonMutation = useMutation({
    mutationFn: (data: any) => courseManagementService.updateLesson(searchParams.get("courseId")!, lessonId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLessonDetail", lessonId, searchParams.get("courseId")] });
      toast({
        title: "Cập nhật thành công",
        description: "Bài học đã được cập nhật.",
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => courseManagementService.deleteComment(searchParams.get("courseId")!, lessonId!, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLessonDetail", lessonId, searchParams.get("courseId")] });
    },
  });

  const uploadVideoMutation = useMutation({
    mutationFn: (file: File) => courseManagementService.uploadLessonVideo(searchParams.get("courseId")!, lessonId!, file),
    onSuccess: (response) => {
      const videoUrl = response.data.url;
      setForm((prevForm) => ({ ...prevForm, videoUrl }));
      setSelectedVideoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      queryClient.invalidateQueries({ queryKey: ["adminLessonDetail", lessonId, searchParams.get("courseId")] });
      toast({
        title: "Upload thành công",
        description: "Video đã được upload.",
      });
    },
  });

  const comments = lesson?.comments || [];

  const backHref = useMemo(() => {
    const courseId = searchParams.get("courseId");
    return courseId ? `/admin/courses/${courseId}?tab=lessons` : -1;
  }, [searchParams]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const mm = m.toString().padStart(2, "0");
    const ss = s.toString().padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
      if (!allowedTypes.includes(file.type)) {
        alert('Vui lòng chọn file video hợp lệ (MP4, MPEG, MOV, AVI, WebM)');
        return;
      }
      // Validate file size (max 500MB)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        alert('File video quá lớn. Vui lòng chọn file nhỏ hơn 500MB');
        return;
      }
      setSelectedVideoFile(file);
    }
  };

  const handleUploadVideo = () => {
    if (selectedVideoFile) {
      uploadVideoMutation.mutate(selectedVideoFile);
    }
  };

  const handleRemoveSelectedVideo = () => {
    setSelectedVideoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Bài học</h2>
          {lesson && (
            <div className="text-sm text-muted-foreground">
              Thứ tự: {lesson.lessonOrder ?? "N/A"} • Thời lượng: {formatDuration(lesson.durationInSeconds || 0)}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(backHref as any)}>Quay lại</Button>
        </div>
      </div>

      {lesson && (
        <div className="rounded border p-4 space-y-2">
          <div className="text-sm">Tiêu đề: {lesson.title}</div>
          <div className="text-sm">Mô tả: {lesson.description}</div>
          <div className="text-sm">Thứ tự: {lesson.lessonOrder ?? "N/A"}</div>
          <div className="text-sm">Thời lượng (giây): {lesson.durationInSeconds ?? "N/A"}</div>
          <div className="text-sm">Số bình luận: {lesson.commentCount ?? 0}</div>
          <div className="text-sm">Tài liệu:</div>
          <div className="space-y-1">
            {(lesson.materials || []).length === 0 ? (
              <div className="text-sm text-muted-foreground">Không có tài liệu</div>
            ) : (
              (lesson.materials || []).map((m: string, idx: number) => (
                <div key={idx} className="text-sm">• {m}</div>
              ))
            )}
          </div>
        </div>
      )}

      {(() => {
        // Check video from form (uploaded) or from lesson data (saved)
        const currentVideoUrl = form.videoUrl || (lesson?.mediaAssets || []).find((asset: any) => asset.assetType === 'VIDEO')?.assetUrl;

        return currentVideoUrl ? (
          <div className="rounded border p-4 space-y-2">
            <h3 className="text-xl font-semibold">Video bài học</h3>
            <video
              key={currentVideoUrl} // Force re-render when URL changes
              controls
              className="w-full max-w-3xl rounded"
              src={currentVideoUrl}
            >
              Trình duyệt của bạn không hỗ trợ video.
            </video>
          </div>
        ) : null;
      })()}

      <h2 className="text-2xl font-semibold">Chỉnh sửa thông tin bài học</h2>
      {lesson && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lsTitle">Tiêu đề</Label>
            <Input
              id="lsTitle"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lsOrder">Thứ tự</Label>
            <Input
              id="lsOrder"
              type="number"
              value={form.lessonOrder}
              onChange={(e) => setForm({ ...form, lessonOrder: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lsDuration">Thời lượng (giây)</Label>
            <Input
              id="lsDuration"
              type="number"
              value={form.durationInSeconds}
              onChange={(e) => setForm({ ...form, durationInSeconds: e.target.value })}
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="lsDesc">Mô tả</Label>
            <Textarea
              id="lsDesc"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="lsMaterials">Tài liệu (mỗi dòng một mục)</Label>
            <Textarea
              id="lsMaterials"
              rows={4}
              value={form.materialsText}
              onChange={(e) => setForm({ ...form, materialsText: e.target.value })}
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="lsVideoFile">Video bài học</Label>
            <div className="space-y-2">
              <Input
                ref={fileInputRef}
                id="lsVideoFile"
                type="file"
                accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm"
                onChange={handleVideoFileChange}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground">
                Chọn file video để upload (MP4, MPEG, MOV, AVI, WebM - tối đa 500MB)
              </p>

              {selectedVideoFile && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm flex-1">{selectedVideoFile.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {(selectedVideoFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRemoveSelectedVideo}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleUploadVideo}
                    disabled={uploadVideoMutation.isPending}
                  >
                    {uploadVideoMutation.isPending ? 'Đang upload...' : 'Upload'}
                  </Button>
                </div>
              )}

              {form.videoUrl && (
                <div className="text-sm text-muted-foreground">
                  Video hiện tại: {form.videoUrl.split('/').pop()}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 flex gap-2">
            <Button
              onClick={() => {
                const updateData: any = {
                  title: form.title,
                  description: form.description,
                  lessonOrder: form.lessonOrder === "" ? undefined : Number(form.lessonOrder),
                  durationInSeconds: form.durationInSeconds === "" ? undefined : Number(form.durationInSeconds),
                  materials: form.materialsText
                    .split("\n")
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0),
                };

                // Add mediaAssets if video URL is provided (from upload)
                if (form.videoUrl.trim()) {
                  updateData.mediaAssets = [
                    {
                      assetType: 'VIDEO',
                      assetUrl: form.videoUrl.trim(),
                    }
                  ];
                }

                updateLessonMutation.mutate(updateData);
              }}
              disabled={!form.title || updateLessonMutation.isPending}
            >
              {updateLessonMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded p-4">
        <div className="font-semibold">Bình luận</div>
        {comments.length === 0 ? (
          <div className="text-sm text-muted-foreground">Chưa có bình luận</div>
        ) : (
          <div className="space-y-2 mt-2">
            {comments.map((cm: any) => (
              <div key={cm.id} className="flex items-start justify-between">
                <div>
                  <div className="text-sm">{cm.user?.fullName || cm.userId}</div>
                  <div className="text-sm text-muted-foreground">{cm.content}</div>
                  {cm.createdAt && (
                    <div className="text-xs text-muted-foreground">
                      {new Date(cm.createdAt).toLocaleString("vi-VN")}
                    </div>
                  )}
                </div>
                <Button variant="outline" onClick={() => deleteCommentMutation.mutate(cm.id)}>
                  Xóa
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}