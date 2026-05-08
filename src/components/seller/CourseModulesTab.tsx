import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import {
  Plus, Pencil, Save, Trash2, FolderOpen, FolderPlus, Layers, BookOpen,
  ChevronDown, ChevronRight, Clock, Play, MessageSquare, GripVertical,
} from 'lucide-react';
import type { Lesson } from '@/domain';
import { EmptyState } from './EmptyState';

interface ModuleData {
  id: string;
  title: string;
  description?: string | null;
  moduleOrder: number;
  courseId: string;
  lessons: Lesson[];
}

interface Props {
  courseId: string;
  modules: ModuleData[];
  unassignedLessons: Lesson[];
  createModuleMutation: any;
  updateModuleMutation: any;
  deleteModuleMutation: any;
  reorderModulesMutation: any;
  refetchModules: () => void;
  refetch: () => void;
}

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

function SortableModuleItem({
  mod,
  modIdx,
  courseId,
  expanded,
  onToggle,
  onAddLesson,
  onEdit,
  onDelete,
  updatePending,
  deletePending,
  navigate,
}: {
  mod: ModuleData;
  modIdx: number;
  courseId: string;
  expanded: boolean;
  onToggle: () => void;
  onAddLesson: () => void;
  onEdit: () => void;
  onDelete: () => void;
  updatePending: boolean;
  deletePending: boolean;
  navigate: (path: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: mod.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
        <button
          className="touch-none p-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <button onClick={onToggle} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
        </button>

        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
          {mod.moduleOrder ?? modIdx + 1}
        </div>

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
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600" onClick={onAddLesson} title="Thêm bài học">
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600" onClick={onEdit} title="Sửa module" disabled={updatePending}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-red-600" onClick={onDelete} title="Xóa module" disabled={deletePending}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="divide-y divide-slate-50">
          {mod.lessons.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-slate-400 italic">Chưa có bài học trong module này</p>
              <Button size="sm" variant="outline" className="mt-2 text-xs rounded-lg" onClick={onAddLesson}>
                <Plus className="w-3 h-3 mr-1" /> Thêm bài học
              </Button>
            </div>
          ) : (
            mod.lessons.map((l, i) => (
              <LessonRow
                key={l.id}
                lesson={l}
                index={i}
                onClick={() => navigate(`/seller/courses/${courseId}/lessons/${l.id}`)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function CourseModulesTab({
  courseId,
  modules,
  unassignedLessons,
  createModuleMutation,
  updateModuleMutation,
  deleteModuleMutation,
  reorderModulesMutation,
  refetchModules,
  refetch,
}: Props) {
  const navigate = useNavigate();

  const [localModules, setLocalModules] = useState<ModuleData[]>(modules);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDescription, setNewModuleDescription] = useState('');
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState('');
  const [editModuleDescription, setEditModuleDescription] = useState('');

  useEffect(() => {
    setLocalModules(modules);
  }, [modules]);

  useEffect(() => {
    if (modules.length > 0) {
      setExpandedModules(new Set(modules.map((m) => m.id)));
    }
  }, [modules]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localModules.findIndex((m) => m.id === active.id);
    const newIndex = localModules.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(localModules, oldIndex, newIndex).map((m, i) => ({
      ...m,
      moduleOrder: i + 1,
    }));

    const previous = localModules;
    setLocalModules(reordered);

    reorderModulesMutation.mutate(
      { courseId, modules: reordered.map(({ id, moduleOrder }) => ({ id, moduleOrder })) },
      {
        onError: () => {
          setLocalModules(previous);
          toast.error('Không thể sắp xếp lại module. Đã hoàn tác.');
        },
      }
    );
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const handleCreateModule = async () => {
    if (!newModuleTitle.trim()) return;
    try {
      await createModuleMutation.mutateAsync({
        courseId,
        data: { title: newModuleTitle.trim(), description: newModuleDescription.trim() || undefined },
      });
      setNewModuleTitle('');
      setNewModuleDescription('');
      setIsCreateDialogOpen(false);
      refetchModules();
    } catch { /* toast handled by hook */ }
  };

  const handleUpdateModule = async (moduleId: string) => {
    if (!editModuleTitle.trim()) return;
    try {
      await updateModuleMutation.mutateAsync({
        courseId,
        moduleId,
        data: { title: editModuleTitle.trim(), description: editModuleDescription.trim() || undefined },
      });
      setEditingModuleId(null);
      refetchModules();
    } catch { /* toast handled by hook */ }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Xóa module này? Các bài học bên trong sẽ trở thành bài học chưa phân loại.')) return;
    try {
      await deleteModuleMutation.mutateAsync({ courseId, moduleId });
      refetchModules();
      refetch();
    } catch { /* toast handled by hook */ }
  };

  const isEmpty = localModules.length === 0 && unassignedLessons.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Module & Bài học</h2>
          <p className="text-sm text-slate-500">
            {localModules.length} module • {unassignedLessons.length} bài học chưa phân loại
          </p>
        </div>
        <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)} className="rounded-xl shadow-sm">
          <FolderPlus className="mr-2 h-4 w-4" /> Tạo Module
        </Button>
      </div>

      {isEmpty ? (
        <Card className="border-2 border-dashed border-slate-200">
          <CardContent className="p-0">
            <EmptyState
              icon={<Layers className="w-7 h-7 text-indigo-400" />}
              title="Chưa có module nào"
              description="Tạo module để tổ chức bài học theo chủ đề."
              actionLabel="Tạo module đầu tiên"
              onAction={() => setIsCreateDialogOpen(true)}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={localModules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
              {localModules.map((mod, modIdx) =>
                editingModuleId === mod.id ? (
                  <div key={mod.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="flex items-center gap-3 px-4 py-3">
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
                    </div>
                  </div>
                ) : (
                  <SortableModuleItem
                    key={mod.id}
                    mod={mod}
                    modIdx={modIdx}
                    courseId={courseId}
                    expanded={expandedModules.has(mod.id)}
                    onToggle={() => toggleModule(mod.id)}
                    onAddLesson={() => navigate(`/seller/courses/${courseId}/lessons/create?moduleId=${mod.id}`)}
                    onEdit={() => { setEditingModuleId(mod.id); setEditModuleTitle(mod.title); setEditModuleDescription(mod.description ?? ''); }}
                    onDelete={() => handleDeleteModule(mod.id)}
                    updatePending={updateModuleMutation.isPending}
                    deletePending={deleteModuleMutation.isPending}
                    navigate={navigate}
                  />
                )
              )}
            </SortableContext>
          </DndContext>

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
                  <LessonRow
                    key={l.id}
                    lesson={l}
                    index={i}
                    onClick={() => navigate(`/seller/courses/${courseId}/lessons/${l.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
            <Button variant="outline" className="rounded-xl" onClick={() => setIsCreateDialogOpen(false)}>Hủy</Button>
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
    </div>
  );
}
