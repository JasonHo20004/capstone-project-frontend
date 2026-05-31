import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  ClipboardList, ExternalLink,
} from 'lucide-react';
import type { Lesson } from '@/domain';
import { EmptyState } from './EmptyState';
import AddQuizLessonDialog from './AddQuizLessonDialog';
import { useReorderLessons } from '@/hooks/api';

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

function SortableLessonRow({
  lesson,
  index,
  onClick,
  t,
}: {
  lesson: Lesson;
  index: number;
  onClick: () => void;
  t: TFunction;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="bg-white">
      <LessonRow lesson={lesson} index={index} onClick={onClick} t={t} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

function LessonRow({
  lesson,
  index,
  onClick,
  dragHandleProps,
  t,
}: {
  lesson: Lesson;
  index: number;
  onClick: () => void;
  dragHandleProps?: Record<string, unknown>;
  t: TFunction;
}) {
  const isQuiz = !!lesson.testId;
  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-3 px-4 py-3 hover:bg-blue-50/50 transition-all cursor-pointer"
    >
      {dragHandleProps && (
        <button
          {...dragHandleProps}
          onClick={(e) => e.stopPropagation()}
          className="touch-none p-1 -ml-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing"
          title={t('courseModulesTab.dragToSort')}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      )}
      <div
        className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center flex-shrink-0 transition-colors ${
          isQuiz
            ? 'bg-amber-50 group-hover:bg-amber-100 text-amber-600'
            : 'bg-blue-50 group-hover:bg-blue-100 text-blue-600'
        }`}
      >
        {lesson.lessonOrder ?? index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-slate-800 truncate">{lesson.title}</h4>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
          {lesson.durationInSeconds ? (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {t('courseModulesTab.minutes', { count: Math.round(lesson.durationInSeconds / 60) })}
            </span>
          ) : null}
          {isQuiz ? (
            <span className="flex items-center gap-1 text-amber-600">
              <ClipboardList className="w-3 h-3" /> {t('courseModulesTab.quiz')}
            </span>
          ) : lesson.videoUrl ? (
            <span className="flex items-center gap-1 text-emerald-600">
              <Play className="w-3 h-3" /> {t('courseModulesTab.video')}
            </span>
          ) : null}
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> {lesson.commentCount ?? 0}
          </span>
        </div>
      </div>
      {isQuiz ? (
        <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 transition-colors flex-shrink-0" />
      ) : (
        <Pencil className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
      )}
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
  onAddQuiz,
  onEdit,
  onDelete,
  onReorderLessons,
  updatePending,
  deletePending,
  navigate,
  t,
}: {
  mod: ModuleData;
  modIdx: number;
  courseId: string;
  expanded: boolean;
  onToggle: () => void;
  onAddLesson: () => void;
  onAddQuiz: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReorderLessons: (moduleId: string, lessons: Lesson[]) => void;
  updatePending: boolean;
  deletePending: boolean;
  navigate: (path: string) => void;
  t: TFunction;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: mod.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const lessonSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleLessonDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = mod.lessons.findIndex((l) => l.id === active.id);
    const newIndex = mod.lessons.findIndex((l) => l.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(mod.lessons, oldIndex, newIndex).map((l, i) => ({
      ...l,
      lessonOrder: i + 1,
    }));
    onReorderLessons(mod.id, reordered);
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

        <span className="text-xs text-slate-400 flex-shrink-0">
          {t('courseModulesTab.lessonCount', { count: mod.lessons.length })}
        </span>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600" onClick={onAddLesson} title={t('courseModulesTab.addLesson')}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-amber-600" onClick={onAddQuiz} title={t('courseModulesTab.addQuiz')}>
            <ClipboardList className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600" onClick={onEdit} title={t('courseModulesTab.editModule')} disabled={updatePending}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-red-600" onClick={onDelete} title={t('courseModulesTab.deleteModule')} disabled={deletePending}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="divide-y divide-slate-50">
          {mod.lessons.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-slate-400 italic">{t('courseModulesTab.noLessons')}</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <Button size="sm" variant="outline" className="text-xs rounded-lg" onClick={onAddLesson}>
                  <Plus className="w-3 h-3 mr-1" /> {t('courseModulesTab.addLesson')}
                </Button>
                <Button size="sm" variant="outline" className="text-xs rounded-lg text-amber-700 border-amber-200 hover:bg-amber-50" onClick={onAddQuiz}>
                  <ClipboardList className="w-3 h-3 mr-1" /> {t('courseModulesTab.addQuiz')}
                </Button>
              </div>
            </div>
          ) : (
            <DndContext sensors={lessonSensors} collisionDetection={closestCenter} onDragEnd={handleLessonDragEnd}>
              <SortableContext items={mod.lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                {mod.lessons.map((l, i) => (
                  <SortableLessonRow
                    key={l.id}
                    lesson={l}
                    index={i}
                    t={t}
                    onClick={() =>
                      navigate(
                        l.testId
                          ? `/seller/tests/${l.testId}`
                          : `/seller/courses/${courseId}/lessons/${l.id}`
                      )
                    }
                  />
                ))}
              </SortableContext>
            </DndContext>
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
  const { t } = useTranslation('seller');

  const [localModules, setLocalModules] = useState<ModuleData[]>(modules);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDescription, setNewModuleDescription] = useState('');
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState('');
  const [editModuleDescription, setEditModuleDescription] = useState('');
  const [addQuizModuleId, setAddQuizModuleId] = useState<string | null>(null);
  const [pendingDeleteModuleId, setPendingDeleteModuleId] = useState<string | null>(null);
  const reorderLessonsMutation = useReorderLessons();

  const handleReorderLessons = (moduleId: string, reordered: Lesson[]) => {
    const previous = localModules;
    setLocalModules((mods) =>
      mods.map((m) => (m.id === moduleId ? { ...m, lessons: reordered } : m))
    );
    reorderLessonsMutation.mutate(
      {
        courseId,
        lessons: reordered.map(({ id, lessonOrder }) => ({ id, lessonOrder: lessonOrder ?? 0 })),
      },
      {
        onError: () => {
          setLocalModules(previous);
          toast.error(t('courseModulesTab.toastReorderLessonsFailed'));
        },
        onSuccess: () => {
          refetchModules();
        },
      }
    );
  };

  const quizDialogModule = addQuizModuleId
    ? localModules.find((m) => m.id === addQuizModuleId)
    : null;
  const pendingDeleteModule = pendingDeleteModuleId
    ? localModules.find((m) => m.id === pendingDeleteModuleId)
    : null;

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
          toast.error(t('courseModulesTab.toastReorderModulesFailed'));
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

  const confirmDeleteModule = async () => {
    if (!pendingDeleteModuleId) return;
    try {
      await deleteModuleMutation.mutateAsync({ courseId, moduleId: pendingDeleteModuleId });
      setPendingDeleteModuleId(null);
      refetchModules();
      refetch();
    } catch { /* toast handled by hook */ }
  };

  const isEmpty = localModules.length === 0 && unassignedLessons.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{t('courseModulesTab.header')}</h2>
          <p className="text-sm text-slate-500">
            {t('courseModulesTab.summary', { moduleCount: localModules.length, unassignedCount: unassignedLessons.length })}
          </p>
        </div>
        <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)} className="rounded-xl shadow-sm">
          <FolderPlus className="mr-2 h-4 w-4" /> {t('courseModulesTab.createModule')}
        </Button>
      </div>

      {isEmpty ? (
        <Card className="border-2 border-dashed border-slate-200">
          <CardContent className="p-0">
            <EmptyState
              icon={<Layers className="w-7 h-7 text-indigo-400" />}
              title={t('courseModulesTab.emptyTitle')}
              description={t('courseModulesTab.emptyDescription')}
              actionLabel={t('courseModulesTab.createFirstModule')}
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
                    <div className="px-4 py-3 space-y-2">
                      <Input
                        className="h-8 text-sm rounded-lg"
                        value={editModuleTitle}
                        onChange={(e) => setEditModuleTitle(e.target.value)}
                        placeholder={t('courseModulesTab.moduleNamePlaceholder')}
                        autoFocus
                      />
                      <Textarea
                        className="text-sm rounded-lg"
                        rows={2}
                        value={editModuleDescription}
                        onChange={(e) => setEditModuleDescription(e.target.value)}
                        placeholder={t('courseModulesTab.moduleDescPlaceholder')}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs" onClick={() => setEditingModuleId(null)}>
                          {t('courseModulesTab.cancel')}
                        </Button>
                        <Button size="sm" className="h-8 rounded-lg text-xs" onClick={() => handleUpdateModule(mod.id)} disabled={updateModuleMutation.isPending}>
                          <Save className="w-3 h-3 mr-1" /> {t('courseModulesTab.save')}
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
                    onAddQuiz={() => setAddQuizModuleId(mod.id)}
                    onEdit={() => { setEditingModuleId(mod.id); setEditModuleTitle(mod.title); setEditModuleDescription(mod.description ?? ''); }}
                    onDelete={() => setPendingDeleteModuleId(mod.id)}
                    onReorderLessons={handleReorderLessons}
                    updatePending={updateModuleMutation.isPending}
                    deletePending={deleteModuleMutation.isPending}
                    navigate={navigate}
                    t={t}
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
                  {t('courseModulesTab.unassignedTitle')}
                  <span className="text-xs text-slate-400">({unassignedLessons.length})</span>
                </h3>
              </div>
              <div className="divide-y divide-slate-50">
                {unassignedLessons.map((l, i) => (
                  <LessonRow
                    key={l.id}
                    lesson={l}
                    index={i}
                    t={t}
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
              <FolderPlus className="w-5 h-5 text-indigo-500" /> {t('courseModulesTab.createDialogTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">{t('courseModulesTab.moduleNameLabel')}</label>
              <Input
                className="rounded-xl"
                placeholder={t('courseModulesTab.moduleNameExample')}
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">{t('courseModulesTab.moduleDescLabel')}</label>
              <Textarea
                className="rounded-xl"
                rows={2}
                placeholder={t('courseModulesTab.moduleDescExample')}
                value={newModuleDescription}
                onChange={(e) => setNewModuleDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" className="rounded-xl" onClick={() => setIsCreateDialogOpen(false)}>{t('courseModulesTab.cancel')}</Button>
            <Button
              className="rounded-xl"
              onClick={handleCreateModule}
              disabled={!newModuleTitle.trim() || createModuleMutation.isPending}
            >
              {createModuleMutation.isPending ? t('courseModulesTab.creating') : t('courseModulesTab.createModuleButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {quizDialogModule && (
        <AddQuizLessonDialog
          open={!!addQuizModuleId}
          onOpenChange={(o) => { if (!o) setAddQuizModuleId(null); }}
          courseId={courseId}
          moduleId={quizDialogModule.id}
          existingLessons={quizDialogModule.lessons}
          onSuccess={() => { setAddQuizModuleId(null); refetchModules(); refetch(); }}
        />
      )}

      <AlertDialog open={!!pendingDeleteModuleId} onOpenChange={(o) => !o && setPendingDeleteModuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              {t('courseModulesTab.confirmDeleteTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Trans
                i18nKey="courseModulesTab.confirmDeleteDesc"
                ns="seller"
                values={{ title: pendingDeleteModule?.title ?? '' }}
                components={{ strong: <strong className="text-slate-900" />, em: <em /> }}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteModuleMutation.isPending}>{t('courseModulesTab.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteModuleMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteModule();
              }}
            >
              {deleteModuleMutation.isPending ? t('courseModulesTab.deleting') : t('courseModulesTab.deleteModuleButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
