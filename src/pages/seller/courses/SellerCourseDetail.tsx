import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatVND } from '@/lib/utils';
import { toast } from 'sonner';
import {
  useCourse, useUpdateCourse, useModules,
  useCreateModule, useUpdateModule, useDeleteModule, useReorderModules,
  usePublishCourse,
} from '@/hooks/api';
import { CourseMetadataTab } from '@/components/seller/CourseMetadataTab';
import { CourseModulesTab } from '@/components/seller/CourseModulesTab';
import { CourseFinalTestTab } from '@/components/seller/CourseFinalTestTab';
import { CourseReviewWorkflow } from '@/components/seller/CourseReviewWorkflow';
import { EmptyState } from '@/components/seller/EmptyState';
import { ErrorMessage } from '@/components/ui/error-message';
import {
  ArrowLeft, BookOpen, Star, Clock, GraduationCap,
  Layers, FileText, Settings, ClipboardCheck, ClipboardList,
  Eye, CheckCircle2, XCircle,
} from 'lucide-react';
import type { CourseStatus, CourseLevel, Lesson, Rating, CourseLesson } from '@/domain';

type Draft = Partial<{
  title: string;
  description: string;
  price: number;
  courseLevel: CourseLevel;
  status: CourseStatus;
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

const statusStyle: Record<string, { bg: string; text: string }> = {
  DRAFT:    { bg: 'bg-slate-100',   text: 'text-slate-700' },
  PENDING:  { bg: 'bg-amber-100',   text: 'text-amber-700' },
  ACTIVE:   { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  REFUSE:   { bg: 'bg-red-100',     text: 'text-red-700' },
  INACTIVE: { bg: 'bg-gray-100',    text: 'text-gray-600' },
};

export default function SellerCourseDetail() {
  const { t, i18n } = useTranslation('seller');
  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-GB';
  const { id } = useParams();
  const navigate = useNavigate();

  const statusConfig = useMemo<Record<string, { label: string; bg: string; text: string }>>(() => {
    const out: Record<string, { label: string; bg: string; text: string }> = {};
    for (const key of Object.keys(statusStyle)) {
      out[key] = { label: t(`courseDetail.status.${key}`), ...statusStyle[key] };
    }
    return out;
  }, [t]);

  const { data: course, isLoading, isError, error, refetch } = useCourse(id);
  const { data: modules = [], refetch: refetchModules } = useModules(id);
  const updateCourseMutation = useUpdateCourse();
  const createModuleMutation = useCreateModule();
  const updateModuleMutation = useUpdateModule();
  const deleteModuleMutation = useDeleteModule();
  const reorderModulesMutation = useReorderModules();
  const publishCourseMutation = usePublishCourse();

  const [draft, setDraft] = useState<Draft>({});
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  useEffect(() => {
    if (!id) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY(id));
      if (raw) setDraft(JSON.parse(raw) as Draft);
    } catch { /* ignore */ }
  }, [id]);

  const lessons: Lesson[] = useMemo(() => {
    if (!course?.lessons) return [];
    return (course.lessons as Array<CourseLesson | Lesson>)
      .map((item) => (item as CourseLesson).lesson ?? (item as Lesson))
      .filter((l): l is Lesson => !!l && typeof l.id === 'string')
      .slice()
      .sort((a, b) => (a.lessonOrder ?? 0) - (b.lessonOrder ?? 0));
  }, [course]);

  const unassignedLessons = useMemo(() => {
    const moduleIds = new Set((modules as ModuleData[]).flatMap((m) => m.lessons.map((l) => l.id)));
    return lessons.filter((l) => !moduleIds.has(l.id));
  }, [lessons, modules]);

  const ratings = useMemo(() => (course as any)?.ratings ?? [], [course]);
  const totalComments = useMemo(() => lessons.reduce((s, l) => s + (l.commentCount ?? 0), 0), [lessons]);
  const totalDuration = useMemo(() => lessons.reduce((s, l) => s + (l.durationInSeconds ?? 0), 0), [lessons]);
  const quizLessonCount = useMemo(
    () => (modules as ModuleData[]).reduce((s, m) => s + m.lessons.filter((l) => !!l.testId).length, 0)
      + unassignedLessons.filter((l) => !!l.testId).length,
    [modules, unassignedLessons]
  );

  const publishChecklist = useMemo(() => {
    const merged = { ...course, ...draft };
    const hasLessonWithContent = lessons.some(
      (l) => (l.durationInSeconds ?? 0) > 0 || !!l.testId
    );
    return [
      {
        key: 'thumbnail',
        label: t('courseDetail.checklist.thumbnail'),
        done: !!merged.thumbnailUrl || !!thumbnailFile,
        hint: t('courseDetail.checklist.thumbnailHint'),
      },
      {
        key: 'description',
        label: t('courseDetail.checklist.description'),
        done: !!(merged.description && merged.description.trim().length >= 20),
        hint: t('courseDetail.checklist.descriptionHint'),
      },
      {
        key: 'price',
        label: t('courseDetail.checklist.price'),
        done: typeof merged.price === 'number' && merged.price >= 0,
        hint: t('courseDetail.checklist.priceHint'),
      },
      {
        key: 'level',
        label: t('courseDetail.checklist.level'),
        done: !!merged.courseLevel,
        hint: t('courseDetail.checklist.levelHint'),
      },
      {
        key: 'lessons-min',
        label: t('courseDetail.checklist.lessonsMin'),
        done: lessons.length >= 3,
        hint: t('courseDetail.checklist.lessonsMinHint', { count: lessons.length }),
      },
      {
        key: 'lesson-content',
        label: t('courseDetail.checklist.lessonContent'),
        done: hasLessonWithContent,
        hint: t('courseDetail.checklist.lessonContentHint'),
      },
    ];
  }, [course, draft, thumbnailFile, lessons, t]);

  const handlePublish = async () => {
    if (!id) return;
    try {
      await publishCourseMutation.mutateAsync(id);
      refetch();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? t('courseDetail.publishError');
      toast.error(msg);
    }
  };
  const seller = useMemo(() => course?.courseSeller ?? (course as any)?.user ?? null, [course]);
  const averageRating = useMemo(() => {
    if (!course) return undefined;
    if (course.averageRating != null) {
      const v = Number(course.averageRating);
      return Number.isNaN(v) ? undefined : Number(v.toFixed(2));
    }
    const list = (course as any).ratings as { score: number }[] | undefined;
    if (!list?.length) return undefined;
    return Number((list.reduce((s, r) => s + (r.score || 0), 0) / list.length).toFixed(2));
  }, [course]);

  const saveDraft = async () => {
    if (!id) return;
    const hasDraft = Object.keys(draft).length > 0;
    if (!hasDraft && !thumbnailFile) {
      toast.info(t('courseDetail.noChanges'));
      return;
    }

    // Send as multipart when a new thumbnail file was picked; otherwise JSON.
    const data: FormData | Record<string, unknown> = thumbnailFile
      ? (() => {
          const fd = new FormData();
          if (draft.title !== undefined) fd.append('title', draft.title);
          if (draft.description !== undefined) fd.append('description', draft.description);
          if (draft.price !== undefined) fd.append('price', String(draft.price));
          if (draft.courseLevel !== undefined) fd.append('courseLevel', draft.courseLevel);
          if (draft.status !== undefined) fd.append('status', draft.status);
          fd.append('thumbnail', thumbnailFile);
          return fd;
        })()
      : {
          ...(draft.title !== undefined && { title: draft.title }),
          ...(draft.description !== undefined && { description: draft.description }),
          ...(draft.price !== undefined && { price: draft.price }),
          ...(draft.courseLevel !== undefined && { courseLevel: draft.courseLevel }),
          ...(draft.status !== undefined && { status: draft.status }),
        };

    try {
      await updateCourseMutation.mutateAsync({ id, data: data as never });
      localStorage.removeItem(DRAFT_KEY(id));
      setDraft({});
      setThumbnailFile(null);
      refetch();
    } catch {
      localStorage.setItem(DRAFT_KEY(id!), JSON.stringify(draft));
    }
  };

  const clearDraft = () => {
    if (!id) return;
    localStorage.removeItem(DRAFT_KEY(id));
    setDraft({});
    toast.info(t('courseDetail.draftCleared'));
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-5">
          <Skeleton className="w-48 aspect-video rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-3 mt-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-7 w-24 rounded-full" />)}
            </div>
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto py-20 space-y-4">
        <ErrorMessage
          message={error instanceof Error ? error.message : t('courseDetail.loadError')}
          onRetry={refetch}
        />
        <Button variant="outline" onClick={() => navigate('/seller/courses')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> {t('courseDetail.backToList')}
        </Button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-2xl mx-auto py-20">
        <EmptyState
          icon={<BookOpen className="w-8 h-8 text-slate-400" />}
          title={t('courseDetail.notFoundTitle')}
          actionLabel={t('courseDetail.backToList')}
          onAction={() => navigate('/seller/courses')}
        />
      </div>
    );
  }

  const merged = { ...course, ...draft };
  const st = statusConfig[merged.status] ?? statusConfig.DRAFT;
  const modulesTyped = modules as ModuleData[];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/seller/courses')}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors rounded-xl h-9 px-3 -ml-3"
            >
              <ArrowLeft className="w-4 h-4" /> {t('courseDetail.backToList')}
            </Button>
            {course && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/courses/${course.id}?preview=true`, '_blank')}
                className="rounded-xl"
                title={t('courseDetail.previewTitle')}
              >
                <Eye className="w-4 h-4 mr-1.5" /> {t('courseDetail.preview')}
              </Button>
            )}
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
                    {seller?.fullName ?? t('courseDetail.anonymousInstructor')}
                    {merged.courseLevel && <> • {t('courseDetail.level')} <span className="font-semibold text-slate-700">{merged.courseLevel}</span></>}
                  </p>
                </div>
                <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${st.bg} ${st.text}`}>
                  {st.label}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <StatPill icon={<GraduationCap className="w-3.5 h-3.5" />} label={t('courseDetail.pills.price')} value={formatVND(merged.price ?? 0)} />
                <StatPill icon={<Layers className="w-3.5 h-3.5" />} label={t('courseDetail.pills.module')} value={`${modulesTyped.length}`} />
                <StatPill icon={<BookOpen className="w-3.5 h-3.5" />} label={t('courseDetail.pills.lesson')} value={`${lessons.length - quizLessonCount}`} />
                <StatPill icon={<ClipboardList className="w-3.5 h-3.5" />} label={t('courseDetail.pills.test')} value={`${quizLessonCount}`} />
                <StatPill icon={<Clock className="w-3.5 h-3.5" />} label={t('courseDetail.pills.duration')} value={totalDuration > 0 ? t('courseDetail.minutes', { count: Math.round(totalDuration / 60) }) : '—'} />
                <StatPill icon={<Star className="w-3.5 h-3.5" />} label={t('courseDetail.pills.rating')} value={averageRating ? `${averageRating} ★` : '—'} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Tabs defaultValue="overview">
          <TabsList className="bg-white border shadow-sm rounded-xl p-1 mb-6">
            <TabsTrigger value="overview" className="rounded-lg gap-1.5 data-[state=active]:shadow-sm">
              <BookOpen className="w-4 h-4" /> {t('courseDetail.tabs.overview')}
            </TabsTrigger>
            <TabsTrigger value="lessons" className="rounded-lg gap-1.5 data-[state=active]:shadow-sm">
              <Layers className="w-4 h-4" /> {t('courseDetail.tabs.lessons')}
            </TabsTrigger>
            <TabsTrigger value="ratings" className="rounded-lg gap-1.5 data-[state=active]:shadow-sm">
              <Star className="w-4 h-4" /> {t('courseDetail.tabs.ratings')}
            </TabsTrigger>
            <TabsTrigger value="update" className="rounded-lg gap-1.5 data-[state=active]:shadow-sm">
              <Settings className="w-4 h-4" /> {t('courseDetail.tabs.update')}
            </TabsTrigger>
            <TabsTrigger value="final-test" className="rounded-lg gap-1.5 data-[state=active]:shadow-sm">
              <ClipboardCheck className="w-4 h-4" /> {t('courseDetail.tabs.finalTest')}
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <QuickStatCard icon={<Layers className="w-5 h-5 text-indigo-500" />} label={t('courseDetail.quickStats.module')} value={modulesTyped.length} />
              <QuickStatCard icon={<BookOpen className="w-5 h-5 text-blue-500" />} label={t('courseDetail.quickStats.lesson')} value={lessons.length - quizLessonCount} />
              <QuickStatCard icon={<ClipboardList className="w-5 h-5 text-amber-500" />} label={t('courseDetail.quickStats.test')} value={quizLessonCount} />
              <QuickStatCard icon={<Clock className="w-5 h-5 text-teal-500" />} label={t('courseDetail.quickStats.duration')} value={totalDuration > 0 ? t('courseDetail.minutes', { count: Math.round(totalDuration / 60) }) : '0'} />
              <QuickStatCard icon={<Star className="w-5 h-5 text-amber-500" />} label={t('courseDetail.quickStats.avgRating')} value={averageRating ?? '—'} />
            </div>
            <CourseReviewWorkflow
              course={{
                id: course.id,
                title: merged.title ?? course.title,
                description: (merged.description ?? course.description) ?? null,
                price: (merged.price ?? course.price) ?? null,
                courseLevel: (merged.courseLevel ?? course.courseLevel) ?? null,
                thumbnailUrl: (merged.thumbnailUrl ?? course.thumbnailUrl) ?? null,
                status: merged.status ?? course.status,
                submittedAt: course.submittedAt ?? null,
                approvedAt: course.approvedAt ?? null,
                rejectedAt: course.rejectedAt ?? null,
                rejectionReason: course.rejectionReason ?? null,
              }}
              checklist={publishChecklist}
              isSubmitting={publishCourseMutation.isPending}
              onSubmit={handlePublish}
            />

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" /> {t('courseDetail.descriptionTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {merged.description || <span className="italic text-slate-400">{t('courseDetail.descriptionEmpty')}</span>}
                </p>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-700">{t('courseDetail.detailInfo')}</h3>
                  <InfoRow label={t('courseDetail.info.level')} value={merged.courseLevel ?? '—'} />
                  <InfoRow label={t('courseDetail.info.category')} value={(merged as any).category ?? '—'} />
                  <InfoRow label={t('courseDetail.info.price')} value={formatVND(merged.price ?? 0)} />
                  <InfoRow label={t('courseDetail.info.status')} value={<span className={`${st.bg} ${st.text} px-2 py-0.5 rounded-full text-xs font-semibold`}>{st.label}</span>} />
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-700">{t('courseDetail.timeSection')}</h3>
                  <InfoRow label={t('courseDetail.time.createdAt')} value={merged.createdAt ? new Date(merged.createdAt).toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'} />
                  <InfoRow label={t('courseDetail.time.updatedAt')} value={merged.updatedAt ? new Date(merged.updatedAt).toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'} />
                  <InfoRow label={t('courseDetail.time.finalTest')} value={course.finalTestId ? <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 size={14} /> {t('courseDetail.time.hasFinalTest')}</span> : <span className="inline-flex items-center gap-1 text-red-500"><XCircle size={14} /> {t('courseDetail.time.noFinalTest')}</span>} />
                  <InfoRow label={t('courseDetail.time.comments')} value={`${totalComments}`} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Modules & Lessons */}
          <TabsContent value="lessons">
            <CourseModulesTab
              courseId={id!}
              modules={modulesTyped}
              unassignedLessons={unassignedLessons}
              createModuleMutation={createModuleMutation}
              updateModuleMutation={updateModuleMutation}
              deleteModuleMutation={deleteModuleMutation}
              reorderModulesMutation={reorderModulesMutation}
              refetchModules={refetchModules}
              refetch={refetch}
            />
          </TabsContent>

          {/* Ratings */}
          <TabsContent value="ratings" className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t('courseDetail.ratingsTitle')}</h2>
              <p className="text-sm text-slate-500">{t('courseDetail.ratingsCount', { count: ratings.length })}{averageRating ? t('courseDetail.ratingsAverage', { rating: averageRating }) : ''}</p>
            </div>
            {ratings.length === 0 ? (
              <Card className="border-2 border-dashed border-slate-200">
                <CardContent className="p-0">
                  <EmptyState
                    icon={<Star className="w-7 h-7 text-amber-400" />}
                    title={t('courseDetail.ratingsEmpty')}
                    description={t('courseDetail.ratingsEmptyDesc')}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {ratings.map((r: Rating) => (
                  <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-slate-800">{r.user?.fullName ?? t('courseDetail.anonymous')}</span>
                      <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                        {r.score} <Star className="w-3.5 h-3.5 fill-current" />
                      </div>
                    </div>
                    {r.content && <p className="text-sm text-slate-600 mt-2">{r.content}</p>}
                    <p className="text-xs text-slate-400 mt-2">{new Date(r.createdAt).toLocaleString(dateLocale)}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Update */}
          <TabsContent value="update">
            <CourseMetadataTab
              course={course}
              draft={draft}
              setDraft={setDraft}
              onSave={saveDraft}
              onClearDraft={clearDraft}
              isSaving={updateCourseMutation.isPending}
              statusConfig={statusConfig}
              thumbnailFile={thumbnailFile}
              setThumbnailFile={setThumbnailFile}
            />
          </TabsContent>

          {/* Final Test */}
          <TabsContent value="final-test" className="space-y-5">
            <CourseFinalTestTab
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
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">{icon}</div>
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
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
