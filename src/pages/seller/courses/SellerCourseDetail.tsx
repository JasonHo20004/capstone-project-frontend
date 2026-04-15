import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatVND } from '@/lib/utils';
import { toast } from 'sonner';
import { useCourse, useUpdateCourse, useModules, useCreateModule, useUpdateModule, useDeleteModule } from '@/hooks/api';

import FinalTestTab from '@/components/seller/FinalTestTab';
import {
  ArrowLeft, BookOpen, Star, MessageSquare, Clock, Users, GraduationCap,
  Plus, Play, FileText, Settings, ClipboardCheck, Pencil, Save, RotateCcw,
  FolderPlus, ChevronDown, ChevronRight, Trash2, FolderOpen, Layers,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import type { CourseStatus, CourseLevel, Lesson, Comment, Rating, CourseLesson } from "@/domain";

type Draft = Partial<{
  title: string;
  description: string;
  price: number;
  courseLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  status: 'PENDING' | 'ACTIVE' | 'REFUSE' | 'INACTIVE' | 'DRAFT';
}>;

interface ModuleData {
  id: string;
  title: string;
  description?: string | null;
  moduleOrder: number;
  courseId: string;
  lessons: Lesson[];
}

const DRAFT_KEY = (id: string) => `seller_course_draft_${id}`;

const statusConfig: Record<string, { label: string; emoji: string; bg: string; text: string }> = {
  DRAFT:     { label: 'Bản nháp',       emoji: '📝', bg: 'bg-slate-100',   text: 'text-slate-700' },
  PENDING:   { label: 'Chờ duyệt',      emoji: '⏳', bg: 'bg-amber-100',   text: 'text-amber-700' },
  ACTIVE:    { label: 'Hoạt động',      emoji: '✅', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  REFUSE:    { label: 'Bị từ chối',      emoji: '❌', bg: 'bg-red-100',     text: 'text-red-700' },
  INACTIVE:  { label: 'Tạm ngưng',       emoji: '⏸️', bg: 'bg-gray-100',    text: 'text-gray-600' },
};

export default function SellerCourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: course, isLoading, isError, error, refetch } = useCourse(id);
  const updateCourseMutation = useUpdateCourse();
  const { data: modules = [], refetch: refetchModules } = useModules(id);
  const createModuleMutation = useCreateModule();
  const updateModuleMutation = useUpdateModule();
  const deleteModuleMutation = useDeleteModule();

  const lessons: Lesson[] = useMemo(() => {
    if (!course?.lessons) return [];
    return (course.lessons as Array<CourseLesson | Lesson>)
      .map((item) => (item as CourseLesson).lesson ? (item as CourseLesson).lesson : item as Lesson)
      .filter((l): l is Lesson => !!l && typeof l.id === 'string')
      .slice()
      .sort((a, b) => (a.lessonOrder ?? 0) - (b.lessonOrder ?? 0));
  }, [course]);

  // Unassigned lessons (not in any module)
  const unassignedLessons = useMemo(() => {
    const moduleIds = new Set((modules as ModuleData[]).flatMap((m) => m.lessons.map((l) => l.id)));
    return lessons.filter((l) => !moduleIds.has(l.id));
  }, [lessons, modules]);

  const ratings = useMemo(
    () => (course as { ratings?: Rating[] })?.ratings ?? [],
    [course],
  );
  const totalComments = useMemo(
    () => lessons.reduce((sum, lesson) => sum + (lesson.commentCount ?? 0), 0),
    [lessons],
  );

  const seller = useMemo(() => {
    if (!course) return null;
    return course.courseSeller ?? course.user ?? null;
  }, [course]);
  const sellerName = seller?.fullName as string | undefined;

  const averageRating = useMemo(() => {
    if (!course) return undefined;
    if (course.averageRating != null) {
      const value = Number(course.averageRating);
      return Number.isNaN(value) ? undefined : Number(value.toFixed(2));
    }
    const ratingList = (course as { ratings?: { score: number }[] }).ratings;
    if (!ratingList || ratingList.length === 0) return undefined;
    const sum = ratingList.reduce((acc, r) => acc + (r.score || 0), 0);
    return Number((sum / ratingList.length).toFixed(2));
  }, [course]);

  const totalDuration = useMemo(
    () => lessons.reduce((sum, l) => sum + (l.durationInSeconds ?? 0), 0),
    [lessons],
  );

  const [draft, setDraft] = useState<Draft>({});



  // Module state
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [isCreateModuleDialogOpen, setIsCreateModuleDialogOpen] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDescription, setNewModuleDescription] = useState('');
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState('');
  const [editModuleDescription, setEditModuleDescription] = useState('');

  useEffect(() => {
    if (!id) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY(id));
      if (raw) setDraft(JSON.parse(raw) as Draft);
    } catch { /* ignore */ }
  }, [id]);

  // Auto-expand all modules on load
  useEffect(() => {
    if (modules && (modules as ModuleData[]).length > 0) {
      setExpandedModules(new Set((modules as ModuleData[]).map((m) => m.id)));
    }
  }, [modules]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const handleCreateModule = async () => {
    if (!newModuleTitle.trim() || !id) return;
    try {
      await createModuleMutation.mutateAsync({
        courseId: id,
        data: { title: newModuleTitle.trim(), description: newModuleDescription.trim() || undefined },
      });
      setNewModuleTitle('');
      setNewModuleDescription('');
      setIsCreateModuleDialogOpen(false);
      refetchModules();
    } catch (err) {
      console.error('Failed to create module:', err);
    }
  };

  const handleUpdateModule = async (moduleId: string) => {
    if (!editModuleTitle.trim() || !id) return;
    try {
      await updateModuleMutation.mutateAsync({
        courseId: id,
        moduleId,
        data: { title: editModuleTitle.trim(), description: editModuleDescription.trim() || undefined },
      });
      setEditingModuleId(null);
      refetchModules();
    } catch (err) {
      console.error('Failed to update module:', err);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!id) return;
    if (!confirm('Xóa module này? Các bài học bên trong sẽ trở thành bài học chưa phân loại.')) return;
    try {
      await deleteModuleMutation.mutateAsync({ courseId: id, moduleId });
      refetchModules();
      refetch();
    } catch (err) {
      console.error('Failed to delete module:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner text="Đang tải thông tin khoá học..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto py-20 space-y-4">
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Không thể tải dữ liệu khoá học.'}
          onRetry={refetch}
        />
        <Button variant="outline" onClick={() => navigate('/seller/courses')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
        </Button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">Khoá học không tồn tại</h1>
        <Button variant="outline" onClick={() => navigate('/seller/courses')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
        </Button>
      </div>
    );
  }

  const merged = { ...course, ...draft };
  const st = statusConfig[merged.status] ?? statusConfig.DRAFT;

  const saveDraft = async () => {
    if (!id) return;
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
        localStorage.removeItem(DRAFT_KEY(id));
        setDraft({});
        refetch();
      } catch (err) {
        localStorage.setItem(DRAFT_KEY(id), JSON.stringify(draft));
        console.error('Failed to update course:', err);
      }
    } else {
      toast.info('Không có thay đổi nào để lưu.');
    }
  };

  const clearDraft = () => {
    if (!id) return;
    localStorage.removeItem(DRAFT_KEY(id));
    setDraft({});
    toast.info('Đã xoá bản nháp, trở về dữ liệu gốc');
  };

  const modulesTyped = modules as ModuleData[];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-slate-50 to-white">
      {/* ── Premium Header ── */}
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="py-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/seller/courses')}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors rounded-xl h-9 px-3 -ml-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại danh sách</span>
            </Button>
          </div>

          <div className="pb-6 flex flex-col sm:flex-row items-start gap-5">
            <div className="w-full sm:w-48 aspect-video rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/20 flex-shrink-0">
              {merged.thumbnailUrl ? (
                <img src={merged.thumbnailUrl} alt={merged.title} className="h-full w-full object-cover" />
              ) : (
                <BookOpen className="w-10 h-10 text-white/70" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-slate-900 truncate">{merged.title}</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    {sellerName ?? 'Giảng viên ẩn danh'}
                    {merged.courseLevel && <> • Level <span className="font-semibold text-slate-700">{merged.courseLevel}</span></>}
                  </p>
                </div>
                <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${st.bg} ${st.text}`}>
                  {st.emoji} {st.label}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <StatPill icon={<GraduationCap className="w-3.5 h-3.5" />} label="Giá" value={formatVND(merged.price ?? 0)} />
                <StatPill icon={<Layers className="w-3.5 h-3.5" />} label="Module" value={`${modulesTyped.length}`} />
                <StatPill icon={<BookOpen className="w-3.5 h-3.5" />} label="Bài học" value={`${lessons.length}`} />
                <StatPill icon={<Clock className="w-3.5 h-3.5" />} label="Thời lượng" value={totalDuration > 0 ? `${Math.round(totalDuration / 60)} phút` : '—'} />
                <StatPill icon={<Star className="w-3.5 h-3.5" />} label="Đánh giá" value={averageRating ? `${averageRating} ★` : '—'} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Tabs defaultValue="overview">
          <TabsList className="bg-white border shadow-sm rounded-xl p-1 mb-6">
            <TabsTrigger value="overview" className="rounded-lg gap-1.5 data-[state=active]:shadow-sm">
              <BookOpen className="w-4 h-4" /> Tổng quan
            </TabsTrigger>
            <TabsTrigger value="lessons" className="rounded-lg gap-1.5 data-[state=active]:shadow-sm">
              <Layers className="w-4 h-4" /> Module & Bài học
            </TabsTrigger>
            <TabsTrigger value="ratings" className="rounded-lg gap-1.5 data-[state=active]:shadow-sm">
              <Star className="w-4 h-4" /> Đánh giá
            </TabsTrigger>
            <TabsTrigger value="update" className="rounded-lg gap-1.5 data-[state=active]:shadow-sm">
              <Settings className="w-4 h-4" /> Cập nhật
            </TabsTrigger>
            <TabsTrigger value="final-test" className="rounded-lg gap-1.5 data-[state=active]:shadow-sm">
              <ClipboardCheck className="w-4 h-4" /> Bài kiểm tra
            </TabsTrigger>
          </TabsList>

          {/* ─── Tab: Overview ─── */}
          <TabsContent value="overview" className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <QuickStatCard icon={<Layers className="w-5 h-5 text-indigo-500" />} label="Module" value={modulesTyped.length} />
              <QuickStatCard icon={<BookOpen className="w-5 h-5 text-blue-500" />} label="Bài học" value={lessons.length} />
              <QuickStatCard icon={<Clock className="w-5 h-5 text-teal-500" />} label="Thời lượng" value={totalDuration > 0 ? `${Math.round(totalDuration / 60)} phút` : '0'} />
              <QuickStatCard icon={<Star className="w-5 h-5 text-amber-500" />} label="Đánh giá TB" value={averageRating ?? '—'} />
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" /> Mô tả khóa học
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {merged.description || <span className="italic text-slate-400">Chưa có mô tả. Hãy thêm mô tả ở tab "Cập nhật".</span>}
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-700">Thông tin chi tiết</h3>
                  <InfoRow label="Trình độ" value={merged.courseLevel ?? '—'} />
                  <InfoRow label="Danh mục" value={(merged as any).category ?? '—'} />
                  <InfoRow label="Giá" value={formatVND(merged.price ?? 0)} />
                  <InfoRow label="Trạng thái" value={<span className={`${st.bg} ${st.text} px-2 py-0.5 rounded-full text-xs font-semibold`}>{st.emoji} {st.label}</span>} />
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-700">Thời gian</h3>
                  <InfoRow label="Ngày tạo" value={merged.createdAt ? new Date(merged.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'} />
                  <InfoRow label="Cập nhật" value={merged.updatedAt ? new Date(merged.updatedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'} />
                  <InfoRow label="Bài kiểm tra" value={course.finalTestId ? '✅ Đã có' : '❌ Chưa có'} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Tab: Module & Lessons ─── */}
          <TabsContent value="lessons" className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Module & Bài học</h2>
                <p className="text-sm text-slate-500">{modulesTyped.length} module • {lessons.length} bài học</p>
              </div>
              <Button variant="outline" onClick={() => setIsCreateModuleDialogOpen(true)} className="rounded-xl shadow-sm">
                <FolderPlus className="mr-2 h-4 w-4" /> Tạo Module
              </Button>
            </div>

            {modulesTyped.length === 0 && unassignedLessons.length === 0 ? (
              <Card className="border-2 border-dashed border-slate-200">
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Layers className="w-7 h-7 text-indigo-400" />
                  </div>
                  <h3 className="font-semibold text-slate-700">Chưa có module nào</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                    Tạo module để tổ chức bài học theo chủ đề.
                  </p>
                  <Button className="mt-4 rounded-xl" onClick={() => setIsCreateModuleDialogOpen(true)}>
                    <FolderPlus className="mr-2 h-4 w-4" /> Tạo module đầu tiên
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Module list */}
                {modulesTyped.map((mod, modIdx) => (
                  <div key={mod.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    {/* Module header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                      <button
                        onClick={() => toggleModule(mod.id)}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {expandedModules.has(mod.id) ? (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        )}
                      </button>

                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {mod.moduleOrder ?? modIdx + 1}
                      </div>

                      {editingModuleId === mod.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            className="h-8 text-sm rounded-lg flex-1"
                            value={editModuleTitle}
                            onChange={(e) => setEditModuleTitle(e.target.value)}
                            placeholder="Tên module"
                            autoFocus
                          />
                          <Button size="sm" className="h-8 rounded-lg text-xs" onClick={() => handleUpdateModule(mod.id)} disabled={updateModuleMutation.isPending}>
                            <Save className="w-3 h-3 mr-1" /> Lưu
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs" onClick={() => setEditingModuleId(null)}>
                            Hủy
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-800 text-sm">
                              <FolderOpen className="w-4 h-4 inline mr-1.5 text-indigo-500" />
                              {mod.title}
                            </h3>
                            {mod.description && (
                              <p className="text-xs text-slate-500 mt-0.5 truncate">{mod.description}</p>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 flex-shrink-0">{mod.lessons.length} bài học</span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              size="sm" variant="ghost"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600"
                              onClick={() => navigate(`/seller/courses/${id}/lessons/create?moduleId=${mod.id}`)}
                              title="Thêm bài học vào module"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm" variant="ghost"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600"
                              onClick={() => { setEditingModuleId(mod.id); setEditModuleTitle(mod.title); setEditModuleDescription(mod.description ?? ''); }}
                              title="Sửa module"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm" variant="ghost"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                              onClick={() => handleDeleteModule(mod.id)}
                              title="Xóa module"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Module lessons */}
                    {expandedModules.has(mod.id) && (
                      <div className="divide-y divide-slate-50">
                        {mod.lessons.length === 0 ? (
                          <div className="px-4 py-6 text-center">
                            <p className="text-sm text-slate-400 italic">Chưa có bài học trong module này</p>
                            <Button
                              size="sm" variant="outline" className="mt-2 text-xs rounded-lg"
                              onClick={() => navigate(`/seller/courses/${id}/lessons/create?moduleId=${mod.id}`)}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Thêm bài học
                            </Button>
                          </div>
                        ) : (
                          mod.lessons.map((l, i) => (
                            <LessonRow key={l.id} lesson={l} index={i} onClick={() => navigate(`/seller/courses/${id}/lessons/${l.id}`)} />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Unassigned lessons */}
                {unassignedLessons.length > 0 && (
                  <div className="bg-white rounded-xl border border-dashed border-slate-300 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <h3 className="font-semibold text-slate-600 text-sm flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        Bài học chưa phân loại
                        <span className="text-xs text-slate-400">({unassignedLessons.length})</span>
                      </h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {unassignedLessons.map((l, i) => (
                        <LessonRow key={l.id} lesson={l} index={i} onClick={() => navigate(`/seller/courses/${id}/lessons/${l.id}`)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Create Module Dialog */}
            <Dialog open={isCreateModuleDialogOpen} onOpenChange={setIsCreateModuleDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FolderPlus className="w-5 h-5 text-indigo-500" /> Tạo Module mới
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Tên module *</label>
                    <Input
                      className="rounded-xl"
                      placeholder="VD: Module 1: Foundation Skills"
                      value={newModuleTitle}
                      onChange={(e) => setNewModuleTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Mô tả (tùy chọn)</label>
                    <Textarea
                      className="rounded-xl"
                      rows={2}
                      placeholder="Mô tả ngắn về nội dung module"
                      value={newModuleDescription}
                      onChange={(e) => setNewModuleDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button variant="outline" className="rounded-xl" onClick={() => setIsCreateModuleDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button
                    className="rounded-xl"
                    onClick={handleCreateModule}
                    disabled={!newModuleTitle.trim() || createModuleMutation.isPending}
                  >
                    {createModuleMutation.isPending ? 'Đang tạo...' : 'Tạo Module'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>



          </TabsContent>

          {/* ─── Tab: Ratings ─── */}
          <TabsContent value="ratings" className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Đánh giá từ học viên</h2>
              <p className="text-sm text-slate-500">{ratings.length} đánh giá{averageRating ? ` • Trung bình: ${averageRating} ★` : ''}</p>
            </div>

            {ratings.length === 0 ? (
              <Card className="border-2 border-dashed border-slate-200">
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Star className="w-7 h-7 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-slate-700">Chưa có đánh giá</h3>
                  <p className="text-sm text-slate-500 mt-1">Đánh giá sẽ xuất hiện khi học viên hoàn thành khóa học.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {ratings.map((r) => (
                  <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-slate-800">{r.user?.fullName ?? 'Ẩn danh'}</span>
                      <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                        {r.score} <Star className="w-3.5 h-3.5 fill-current" />
                      </div>
                    </div>
                    {r.content && <p className="text-sm text-slate-600 mt-2">{r.content}</p>}
                    <p className="text-xs text-slate-400 mt-2">{new Date(r.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── Tab: Update ─── */}
          <TabsContent value="update" className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Cập nhật khóa học</h2>
              <p className="text-sm text-slate-500">Chỉnh sửa thông tin và trạng thái khóa học</p>
            </div>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Tiêu đề</label>
                    <Input className="rounded-xl h-11" value={draft.title ?? merged.title ?? ''} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Giá (VNĐ)</label>
                    <Input className="rounded-xl h-11" type="number" value={draft.price ?? merged.price ?? 0} onChange={(e) => setDraft((d) => ({ ...d, price: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Level</label>
                    <Select value={draft.courseLevel ?? merged.courseLevel ?? ''} onValueChange={(v) => setDraft((d) => ({ ...d, courseLevel: v as CourseLevel }))}>
                      <SelectTrigger className="rounded-xl h-11">
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
                    <label className="text-sm font-semibold text-slate-700">Trạng thái</label>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${st.bg} ${st.text}`}>
                        {st.emoji} {st.label}
                      </span>
                      {(['DRAFT', 'REFUSE', 'INACTIVE'] as string[]).includes(merged.status) && (
                        <Button
                          size="sm" variant="default" className="text-xs rounded-lg"
                          onClick={() => { setDraft((d) => ({ ...d, status: 'PENDING' as CourseStatus })); toast.info('Nhấn "Lưu" để gửi duyệt.'); }}
                        >
                          🚀 Gửi duyệt
                        </Button>
                      )}
                      {merged.status === 'ACTIVE' && (
                        <Button
                          size="sm" variant="outline" className="text-xs rounded-lg text-orange-600 border-orange-300 hover:bg-orange-50"
                          onClick={() => { setDraft((d) => ({ ...d, status: 'INACTIVE' as CourseStatus })); toast.info('Nhấn "Lưu" để tạm ngưng.'); }}
                        >
                          ⏸️ Tạm ngưng
                        </Button>
                      )}
                    </div>
                    {merged.status === 'PENDING' && (
                      <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">⏳ Đang chờ admin duyệt.</p>
                    )}
                    {merged.status === 'REFUSE' && (
                      <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">❌ Bị từ chối. Hãy sửa rồi gửi lại.</p>
                    )}
                    {draft.status && draft.status !== merged.status && (
                      <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
                        ⚡ Sẽ chuyển sang <strong>{draft.status === 'PENDING' ? 'Chờ duyệt' : 'Tạm ngưng'}</strong> khi bạn lưu.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Mô tả</label>
                  <Textarea className="rounded-xl" rows={5} value={draft.description ?? merged.description ?? ''} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button className="rounded-xl px-6 shadow-sm" onClick={saveDraft} disabled={updateCourseMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {updateCourseMutation.isPending ? 'Đang lưu...' : 'Lưu & cập nhật'}
                  </Button>
                  <Button variant="outline" className="rounded-xl" onClick={clearDraft}>
                    <RotateCcw className="w-4 h-4 mr-2" /> Xoá bản nháp
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Tab: Final test ─── */}
          <TabsContent value="final-test" className="space-y-5">
            <FinalTestTab
              courseId={id!}
              finalTestId={course.finalTestId}
              onTestLinked={() => refetch()}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ── Helper components ── */

function LessonRow({ lesson, index, onClick }: { lesson: Lesson; index: number; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-4 px-4 py-3 hover:bg-blue-50/50 transition-all cursor-pointer"
    >
      <div className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center flex-shrink-0 transition-colors">
        {lesson.lessonOrder ?? index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-slate-800 truncate">{lesson.title}</h4>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
          {lesson.durationInSeconds ? (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {Math.round(lesson.durationInSeconds / 60)} phút
            </span>
          ) : null}
          {lesson.videoUrl && (
            <span className="flex items-center gap-1 text-emerald-600">
              <Play className="w-3 h-3" /> Video
            </span>
          )}
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> {lesson.commentCount ?? 0}
          </span>
        </div>
      </div>
      <Pencil className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
    </div>
  );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full">
      {icon}
      <span>{label}:</span>
      <span className="font-semibold text-slate-700">{value}</span>
    </div>
  );
}

function QuickStatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className="text-lg font-bold text-slate-800">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{typeof value === 'string' ? value : value}</span>
    </div>
  );
}
