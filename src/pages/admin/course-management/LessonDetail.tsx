import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { courseManagementService } from "@/lib/api/services/admin";

export default function AdminLessonDetail() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

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
  });

  useEffect(() => {
    if (lesson) {
      setForm({
        title: lesson.title ?? "",
        description: lesson.description ?? "",
        durationInSeconds: String(lesson.durationInSeconds ?? ""),
        lessonOrder: String(lesson.lessonOrder ?? ""),
        materialsText: (lesson.materials || []).join("\n"),
      });
    }
  }, [lesson]);

  const updateLessonMutation = useMutation({
    mutationFn: (data: any) => courseManagementService.updateLesson(searchParams.get("courseId")!, lessonId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLessonDetail", lessonId, searchParams.get("courseId")] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => courseManagementService.deleteComment(searchParams.get("courseId")!, lessonId!, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLessonDetail", lessonId, searchParams.get("courseId")] });
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

          <div className="md:col-span-2 flex gap-2">
            <Button
              onClick={() =>
                updateLessonMutation.mutate({
                  title: form.title,
                  description: form.description,
                  lessonOrder: form.lessonOrder === "" ? undefined : Number(form.lessonOrder),
                  durationInSeconds: form.durationInSeconds === "" ? undefined : Number(form.durationInSeconds),
                  materials: form.materialsText
                    .split("\n")
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0),
                })
              }
              disabled={!form.title}
            >
              Lưu thay đổi
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