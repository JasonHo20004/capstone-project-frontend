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
import { mockCourses, mockLessons, mockRatings, mockComments, mockUsers } from '@/data/mock';
import { formatVND } from '@/lib/utils';
import { toast } from 'sonner';

type Draft = Partial<{
  title: string;
  description: string;
  price: number;
  courseLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  status: 'PENDING' | 'ACTIVE' | 'REFUSE' | 'INACTIVE' | 'DELETE';
}>;

const DRAFT_KEY = (id: string) => `seller_course_draft_${id}`;

export default function SellerCourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const course = useMemo(() => mockCourses.find((c) => c.id === id), [id]);

  const lessons = useMemo(() => mockLessons.filter((l) => l.courseId === id), [id]);
  const ratings = useMemo(() => mockRatings.filter((r) => r.courseId === id), [id]);
  const lessonIds = useMemo(() => new Set(lessons.map((l) => l.id)), [lessons]);
  const comments = useMemo(() => mockComments.filter((c) => lessonIds.has(c.lessonId)), [lessonIds]);

  const seller = course?.courseSeller;
  const sellerName = seller?.fullName;

  const [draft, setDraft] = useState<Draft>({});
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [lessonUpdate, setLessonUpdate] = useState<Partial<{ title: string; description?: string; durationInSeconds?: number; materials: string[]; videoUrl?: string; lessonOrder?: number }>>({});
  const [refresh, setRefresh] = useState(0);

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

  if (!course) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Khoá học không tồn tại</h1>
        <Button onClick={() => navigate('/seller/courses')}>Quay lại danh sách</Button>
      </div>
    );
  }

  const merged = { ...course, ...draft };

  const saveDraft = () => {
    if (!id) return;
    localStorage.setItem(DRAFT_KEY(id), JSON.stringify(draft));
    toast.success('Đã lưu bản nháp cập nhật khoá học');
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
        return <Badge className="bg-yellow-600">Chờ duyệt</Badge>;
      case 'REFUSE':
        return <Badge variant="destructive">Từ chối</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-gray-600">Tạm dừng</Badge>;
      default:
        return <Badge variant="outline">Khác</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{merged.title}</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            Người bán: {sellerName} • Level: {merged.courseLevel} • Giá: {formatVND(merged.price)}
          </div>
        </div>
        {statusBadge(merged.status)}
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
              <div><span className="font-medium">Đánh giá TB:</span> {merged.averageRating ?? '-'} ({merged.ratingCount ?? 0})</div>
              <div><span className="font-medium">Bình luận:</span> {comments.length}</div>
              <div><span className="font-medium">Tạo lúc:</span> {new Date(merged.createdAt).toLocaleString()}</div>
              <div><span className="font-medium">Cập nhật:</span> {new Date(merged.updatedAt).toLocaleString()}</div>
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
                          const base = lessons.find((x) => x.id === selectedLessonId)!;
                          const mergedLesson = { ...base, ...lessonUpdate, materials: lessonUpdate.materials ?? base.materials };
                          return (
                            <div className="space-y-2">
                              <div><span className="font-medium">Tiêu đề:</span> {mergedLesson.title}</div>
                              <div><span className="font-medium">Mô tả:</span> {mergedLesson.description}</div>
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
                          const base = lessons.find((x) => x.id === selectedLessonId)!;
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
                        <CardTitle>Bình luận</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {mockComments.filter((c) => c.lessonId === selectedLessonId).map((c) => {
                            const u = mockUsers.find((u) => u.id === c.userId);
                            return (
                              <div key={c.id} className="rounded-lg border p-3">
                                <div className="text-sm font-medium">{u?.fullName || c.userId}</div>
                                <div className="text-sm text-muted-foreground">{c.content}</div>
                                <div className="text-xs">{new Date(c.createdAt).toLocaleString()}</div>
                              </div>
                            );
                          })}
                        </div>
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
                {ratings.map((r) => {
                  const u = mockUsers.find((u) => u.id === r.userId);
                  return (
                    <div key={r.id} className="rounded-lg border p-3">
                      <div className="font-medium">{u?.fullName || r.userId} • {r.score}★</div>
                      <div className="text-sm text-muted-foreground">{r.content || ''}</div>
                      <div className="text-xs">{new Date(r.createdAt).toLocaleString()}</div>
                    </div>
                  );
                })}
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
                  <Select value={draft.status ?? merged.status ?? ''} onValueChange={(v) => setDraft((d) => ({ ...d, status: v as any }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      {['PENDING','ACTIVE','REFUSE','INACTIVE','DELETE'].map((st) => (
                        <SelectItem key={st} value={st}>{st}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea rows={4} value={draft.description ?? merged.description ?? ''} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveDraft}>Lưu bản nháp</Button>
                <Button variant="secondary" onClick={clearDraft}>Xoá bản nháp</Button>
              </div>
              <p className="text-xs text-muted-foreground">Lưu ý: bản nháp được lưu trong trình duyệt (localStorage). Kết nối API sẽ cập nhật DB khi có backend.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
