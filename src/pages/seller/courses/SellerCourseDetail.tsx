import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatVND } from '@/lib/utils';
import { toast } from 'sonner';
import { useCourse, useLesson, useUpdateCourse } from '@/hooks/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import type { CourseStatus, CourseLevel } from '@/types/type';

type Draft = Partial<{
  title: string;
  description: string;
  price: number;
  courseLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  status: 'PENDING' | 'ACTIVE' | 'REFUSE' | 'INACTIVE' | 'DELETE' | 'PUBLISHED' | 'DRAFT';
}>;

const DRAFT_KEY = (id: string) => `seller_course_draft_${id}`;

export default function SellerCourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: course, isLoading, isError, error, refetch } = useCourse(id);
  const updateCourseMutation = useUpdateCourse();

  const lessons = useMemo(
    () => (course?.lessons ?? []).slice().sort((a, b) => (a.lessonOrder ?? 0) - (b.lessonOrder ?? 0)),
    [course],
  );
  const ratings = useMemo(() => course?.ratings ?? [], [course]);
  const totalComments = useMemo(
    () => lessons.reduce((sum, lesson) => sum + (lesson.commentCount ?? 0), 0),
    [lessons],
  );

  const seller = useMemo(() => {
    if (!course) return null;
    // Ưu tiên courseSeller, fallback sang user (tương tự trang user CourseDetail)
    return (course as any).courseSeller || (course as any).user || null;
  }, [course]);
  const sellerName = seller?.fullName as string | undefined;

  // Tính điểm trung bình từ ratings nếu backend chưa set averageRating
  const averageRating = useMemo(() => {
    if (!course) return undefined;
    if ((course as any).averageRating != null) {
      const value = Number((course as any).averageRating);
      return Number.isNaN(value) ? undefined : Number(value.toFixed(2));
    }

    const ratingList = (course as any).ratings as { score: number }[] | undefined;
    if (!ratingList || ratingList.length === 0) return undefined;

    const sum = ratingList.reduce((acc, r) => acc + (r.score || 0), 0);
    const avg = sum / ratingList.length;
    return Number(avg.toFixed(2));
  }, [course]);

  const [draft, setDraft] = useState<Draft>({});
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [lessonUpdate, setLessonUpdate] = useState<Partial<{ title: string; description?: string; durationInSeconds?: number; materials: string[]; videoUrl?: string; lessonOrder?: number }>>({});
  const [refresh, setRefresh] = useState(0);

  // Fetch lesson details with comments when a lesson is selected
  const { data: lessonDetail } = useLesson(id, selectedLessonId || undefined);

  useEffect(() => {
    if (!id) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY(id));
      if (raw) setDraft(JSON.parse(raw) as Draft);
    } catch {}
  }, [id]);

  useEffect(() => {
    if (!selectedLessonId) return;
    try {
      const raw = localStorage.getItem(`seller_lesson_update_${selectedLessonId}`);
      if (raw) setLessonUpdate(JSON.parse(raw));
      else setLessonUpdate({});
    } catch {}
  }, [selectedLessonId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner text="Đang tải thông tin khoá học..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Không thể tải dữ liệu khoá học.'}
          onRetry={refetch}
        />
        <Button onClick={() => navigate('/seller/courses')}>Quay lại danh sách</Button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Khoá học không tồn tại</h1>
        <Button onClick={() => navigate('/seller/courses')}>Quay lại danh sách</Button>
      </div>
    );
  }

  const merged = { ...course, ...draft };

  const saveDraft = async () => {
    if (!id) return;
    
    // If there are changes, update via API
    const hasChanges = Object.keys(draft).length > 0;
    if (hasChanges) {
      try {
        await updateCourseMutation.mutateAsync({
          id,
          data: {
            ...(draft.title !== undefined && { title: draft.title }),
            ...(draft.description !== undefined && { description: draft.description }),
            ...(draft.price !== undefined && { price: draft.price }),
            ...(draft.courseLevel !== undefined && { courseLevel: draft.courseLevel as CourseLevel }),
            ...(draft.status !== undefined && { status: draft.status as CourseStatus }),
          },
        });
        // Clear draft after successful update
        localStorage.removeItem(DRAFT_KEY(id));
        setDraft({});
        refetch();
      } catch (error) {
        // If API fails, still save to localStorage as backup
        localStorage.setItem(DRAFT_KEY(id), JSON.stringify(draft));
        console.error('Failed to update course:', error);
      }
    } else {
      localStorage.setItem(DRAFT_KEY(id), JSON.stringify(draft));
      toast.success('Đã lưu bản nháp cập nhật khoá học');
    }
  };

  const clearDraft = () => {
    if (!id) return;
    localStorage.removeItem(DRAFT_KEY(id));
    setDraft({});
    toast.info('Đã xoá bản nháp, trở về dữ liệu gốc');
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'ACTIVE':
        return <Badge className="bg-green-600">Đang hoạt động</Badge>;
      case 'PENDING':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className="bg-yellow-600">Chờ duyệt</Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Khóa học đang chờ admin duyệt. Sau khi được duyệt, khóa học sẽ chuyển sang trạng thái ACTIVE và có thể được người học mua.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'REFUSE':
        return <Badge variant="destructive">Từ chối</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-gray-600">Tạm dừng</Badge>;
      case 'PUBLISHED':
        return <Badge className="bg-blue-600">Đã xuất bản</Badge>;
      case 'DRAFT':
        return <Badge className="bg-muted text-foreground">Bản nháp</Badge>;
      case 'DELETE':
        return <Badge variant="destructive">Đã xoá</Badge>;
      default:
        return <Badge variant="outline">Khác</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{merged.title}</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            Người bán: {sellerName ?? 'Giảng viên ẩn danh'} • Level: {merged.courseLevel ?? '—'} • Giá:{' '}
            {formatVND(merged.price ?? 0)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/seller/courses')}>
            Quay lại danh sách
          </Button>
          {statusBadge(merged.status)}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="lessons">Bài học</TabsTrigger>
          <TabsTrigger value="ratings">Đánh giá</TabsTrigger>
          <TabsTrigger value="update">Cập nhật</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin khoá học</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium">Mô tả:</span> {merged.description}</div>
              <div>
                <span className="font-medium">Đánh giá TB:</span>{' '}
                {averageRating != null && averageRating > 0 ? averageRating.toFixed(2) : '-'}
                {' '}
                ({(merged as any).ratingCount ?? (course as any)?.ratings?.length ?? 0})
              </div>
              <div><span className="font-medium">Bình luận:</span> {totalComments}</div>
              <div>
                <span className="font-medium">Tạo lúc:</span>{' '}
                {merged.createdAt ? new Date(merged.createdAt as any).toLocaleString('vi-VN') : '-'}
              </div>
              <div>
                <span className="font-medium">Cập nhật:</span>{' '}
                {merged.updatedAt ? new Date(merged.updatedAt as any).toLocaleString('vi-VN') : '-'}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách bài học ({lessons.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lessons.map((l) => {
                  const raw = localStorage.getItem(`seller_lesson_update_${l.id}`);
                  const u = raw ? JSON.parse(raw) : undefined;
                  const m = { ...l, ...(u || {}), materials: (u?.materials ?? l.materials) };
                  return (
                    <div key={l.id} className="rounded-lg border p-3 cursor-pointer" onClick={() => setSelectedLessonId(l.id)}>
                      <div className="font-medium">{m.lessonOrder ? `${m.lessonOrder}. ` : ''}{m.title}</div>
                      <div className="text-sm text-muted-foreground">{m.description}</div>
                      <div className="text-sm">Thời lượng: {m.durationInSeconds ? Math.round(m.durationInSeconds / 60) + ' phút' : '-'}</div>
                      <div className="text-sm">Tài liệu: {(m.materials || []).join(', ') || '-'}</div>
                      <div className="text-sm">Bình luận: {l.commentCount ?? 0}</div>
                      {m.videoUrl && (
                        <div className="text-sm">Video: {m.videoUrl}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Dialog open={!!selectedLessonId} onOpenChange={(o) => !o && setSelectedLessonId(null)}>
            <DialogContent className="w-full sm:max-w-[640px] md:max-w-[900px] lg:max-w-[1100px] max-h-[85vh] overflow-y-auto">
              {selectedLessonId && (
                <>
                  <DialogHeader>
                    <DialogTitle>
                      {lessons.find((x) => x.id === selectedLessonId)?.title}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Thông tin bài học</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {(() => {
                          const base = lessons.find((x) => x.id === selectedLessonId);
                          if (!base) {
                            return <p className="text-muted-foreground">Không có dữ liệu bài học.</p>;
                          }
                          const mergedLesson = { ...base, ...lessonUpdate, materials: lessonUpdate.materials ?? base.materials };
                          return (
                            <div className="space-y-2">
                              <div><span className="font-medium">Tiêu đề:</span> {mergedLesson.title}</div>
                              <div><span className="font-medium">Mô tả:</span> {mergedLesson.description || '-'}</div>
                              <div><span className="font-medium">Thứ tự:</span> {mergedLesson.lessonOrder ?? '-'}</div>
                              <div><span className="font-medium">Thời lượng:</span> {mergedLesson.durationInSeconds ? Math.round(mergedLesson.durationInSeconds / 60) + ' phút' : '-'}</div>
                              <div><span className="font-medium">Tài liệu:</span> {(mergedLesson.materials || []).join(', ') || '-'}</div>
                              <div><span className="font-medium">Video:</span> {mergedLesson.videoUrl || '-'}</div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Cập nhật bài học</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {(() => {
                          const base = lessons.find((x) => x.id === selectedLessonId);
                          if (!base) {
                            return <p className="text-muted-foreground">Không có dữ liệu bài học để cập nhật.</p>;
                          }
                          return (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Tiêu đề</label>
                                  <Input value={lessonUpdate.title ?? base.title ?? ''} onChange={(e) => setLessonUpdate((d) => ({ ...d, title: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Thứ tự</label>
                                  <Input type="number" value={lessonUpdate.lessonOrder ?? base.lessonOrder ?? 0} onChange={(e) => setLessonUpdate((d) => ({ ...d, lessonOrder: Number(e.target.value) }))} />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Thời lượng (giây)</label>
                                  <Input type="number" value={lessonUpdate.durationInSeconds ?? base.durationInSeconds ?? 0} onChange={(e) => setLessonUpdate((d) => ({ ...d, durationInSeconds: Number(e.target.value) }))} />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Video URL</label>
                                  <Input value={lessonUpdate.videoUrl ?? base.videoUrl ?? ''} onChange={(e) => setLessonUpdate((d) => ({ ...d, videoUrl: e.target.value }))} />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Mô tả</label>
                                <Textarea rows={4} value={lessonUpdate.description ?? base.description ?? ''} onChange={(e) => setLessonUpdate((d) => ({ ...d, description: e.target.value }))} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Tài liệu (phân tách bằng dấu phẩy)</label>
                                <Input value={(lessonUpdate.materials ?? base.materials ?? []).join(', ')} onChange={(e) => setLessonUpdate((d) => ({ ...d, materials: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) }))} />
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => { localStorage.setItem(`seller_lesson_update_${selectedLessonId}`, JSON.stringify(lessonUpdate)); setRefresh((n) => n + 1); toast.success('Đã lưu cập nhật bài học'); }}>Lưu cập nhật</Button>
                                <Button variant="secondary" onClick={() => { localStorage.removeItem(`seller_lesson_update_${selectedLessonId}`); setLessonUpdate({}); setRefresh((n) => n + 1); toast.info('Đã khôi phục về dữ liệu gốc'); }}>Khôi phục về gốc</Button>
                              </div>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Bình luận ({lessonDetail?.comments?.length ?? lessons.find((x) => x.id === selectedLessonId)?.commentCount ?? 0})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {lessonDetail?.comments && lessonDetail.comments.length > 0 ? (
                          <div className="space-y-3">
                            {lessonDetail.comments.map((comment: any) => (
                              <div key={comment.id} className="rounded-lg border p-3">
                                <div className="flex items-start gap-3">
                                  {comment.user?.profilePicture && (
                                    <img
                                      src={comment.user.profilePicture}
                                      alt={comment.user.fullName || 'User'}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">
                                      {comment.user?.fullName || 'Người dùng ẩn danh'}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {comment.content}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {new Date(comment.createdAt).toLocaleString('vi-VN')}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Chưa có bình luận nào cho bài học này.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="ratings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Đánh giá ({ratings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ratings.map((r) => (
                  <div key={r.id} className="rounded-lg border p-3">
                    <div className="font-medium">
                      {r.user?.fullName ?? 'Người dùng ẩn danh'} • {r.score}★
                    </div>
                    <div className="text-sm text-muted-foreground">{r.content || ''}</div>
                    <div className="text-xs">{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="update" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cập nhật khoá học (bản nháp)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tiêu đề</label>
                  <Input value={draft.title ?? merged.title ?? ''} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Giá</label>
                  <Input type="number" value={draft.price ?? merged.price ?? 0} onChange={(e) => setDraft((d) => ({ ...d, price: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Level</label>
                  <Select value={draft.courseLevel ?? merged.courseLevel ?? ''} onValueChange={(v) => setDraft((d) => ({ ...d, courseLevel: v as any }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn level" />
                    </SelectTrigger>
                    <SelectContent>
                      {['A1','A2','B1','B2','C1','C2'].map((lv) => (
                        <SelectItem key={lv} value={lv}>{lv}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trạng thái</label>
                  <div className="flex items-center gap-2">
                    <Select 
                      value={draft.status ?? merged.status ?? ''} 
                      onValueChange={(v) => {
                        // Prevent seller from selecting ACTIVE
                        if (v === 'ACTIVE') {
                          toast.error('Bạn không thể tự chuyển khóa học sang ACTIVE. Chỉ admin mới có thể duyệt khóa học.');
                          return;
                        }
                        setDraft((d) => ({ ...d, status: v as any }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        {['DRAFT', 'INACTIVE', 'PENDING', 'PUBLISHED', 'REFUSE'].map((st) => (
                          <SelectItem key={st} value={st}>{st}</SelectItem>
                        ))}
                        {/* ACTIVE is not available for seller selection */}
                      </SelectContent>
                    </Select>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-muted-foreground cursor-help">ℹ️</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Bạn có thể chọn các trạng thái như DRAFT, INACTIVE, PENDING, PUBLISHED. Trạng thái ACTIVE chỉ có thể được đặt bởi admin sau khi duyệt khóa học.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea rows={4} value={draft.description ?? merged.description ?? ''} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveDraft}>Lưu & cập nhật khoá học</Button>
                <Button variant="secondary" onClick={clearDraft}>Xoá bản nháp</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Khi bạn nhấn &quot;Lưu & cập nhật khoá học&quot;, hệ thống sẽ gọi API để cập nhật dữ liệu khoá học trong database.
                Nếu API lỗi, bản nháp sẽ được lưu tạm vào trình duyệt (localStorage) để bạn không mất nội dung.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
