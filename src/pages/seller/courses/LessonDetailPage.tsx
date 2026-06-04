import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft, BookOpen, Pencil, Save, RotateCcw, MessageSquare,
  Clock, Hash, Film, FileText, Link2, Upload, X, CheckCircle2, Plus, Trash2, Send, AlertTriangle,
} from 'lucide-react';
import { useCourse, useLesson, useUpdateLesson, useDeleteLesson } from '@/hooks/api';
import { courseService } from '@/lib/api/services/course.service';
import { sellerService } from '@/lib/api/services';
import { toast } from 'sonner';

interface Comment {
  id: string;
  content: string;
  userId: string;
  parentCommentId: string | null;
  createdAt: string;
  editedAt?: string | null;
  user?: { fullName?: string; profilePicture?: string };
}

export default function LessonDetailPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('seller');
  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-GB';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: course } = useCourse(courseId);
  const { data: lessonDetail } = useLesson(courseId, lessonId);
  const updateLessonMutation = useUpdateLesson();
  const deleteLessonMutation = useDeleteLesson();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Edit state
  const [form, setForm] = useState<{
    title: string;
    description: string;
    lessonOrder: number;
    durationInSeconds: number;
    videoUrl: string;
    materials: string[];
  }>({
    title: '',
    description: '',
    lessonOrder: 0,
    durationInSeconds: 0,
    videoUrl: '',
    materials: [],
  });

  const [isDirty, setIsDirty] = useState(false);
  const [videoMode, setVideoMode] = useState<'url' | 'upload'>('url');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDragging, setVideoDragging] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [fetchedComments, setFetchedComments] = useState<Comment[]>([]);
  const [courseSellerId, setCourseSellerId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [pendingDeleteComment, setPendingDeleteComment] = useState<Comment | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  // Inline edit state — only one comment editable at a time.
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isSavingCommentEdit, setIsSavingCommentEdit] = useState(false);

  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const submitEditComment = async (commentId: string, originalContent: string) => {
    if (!courseId || !lessonId) return;
    const trimmed = editingCommentText.trim();
    if (!trimmed) {
      toast.error(t('lessonDetail.toastEmptyContent'));
      return;
    }
    if (trimmed === originalContent) {
      cancelEditComment();
      return;
    }
    setIsSavingCommentEdit(true);
    try {
      await courseService.editComment(courseId, lessonId, commentId, trimmed);
      toast.success(t('lessonDetail.toastCommentUpdated'));
      cancelEditComment();
      fetchComments();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('lessonDetail.toastCommentUpdateFailed');
      toast.error(msg);
    } finally {
      setIsSavingCommentEdit(false);
    }
  };

  /**
   * Moderation: course owner can delete any comment on their course
   * (their own or a student's). Uses the seller-scoped delete endpoint so
   * authorization is enforced server-side.
   */
  const handleDeleteComment = async () => {
    if (!pendingDeleteComment) return;
    setIsDeletingComment(true);
    try {
      await sellerService.deleteComment(pendingDeleteComment.id);
      toast.success(t('lessonDetail.toastCommentDeleted'));
      setPendingDeleteComment(null);
      fetchComments();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('lessonDetail.toastCommentDeleteFailed');
      toast.error(msg);
    } finally {
      setIsDeletingComment(false);
    }
  };

  // Fetch comments from dedicated endpoint (enriched with user info)
  const fetchComments = () => {
    if (!courseId || !lessonId) return;
    courseService.getComments(courseId, lessonId)
      .then((res: any) => {
        setFetchedComments(res.data?.comments ?? []);
        setCourseSellerId(res.data?.courseSellerId ?? null);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchComments();
  }, [courseId, lessonId]);

  // Populate form when lesson data loads
  useEffect(() => {
    if (lessonDetail) {
      const lesson = lessonDetail as any;
      // Video URL is stored in MediaAsset table, not directly on Lesson
      const videoAsset = lesson.mediaAssets?.find((a: any) => a.assetType === 'VIDEO');
      setForm({
        title: lesson.title ?? '',
        description: lesson.description ?? '',
        lessonOrder: lesson.lessonOrder ?? 0,
        durationInSeconds: lesson.durationInSeconds ?? 0,
        videoUrl: videoAsset?.assetUrl ?? '',
        materials: lesson.materials ?? [],
      });
    }
  }, [lessonDetail]);

  const handleChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleVideoFile = (file: File) => {
    const validTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('lessonDetail.toastInvalidVideoFormat'));
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error(t('lessonDetail.toastVideoTooLarge'));
      return;
    }
    setVideoFile(file);
    setIsDirty(true);

    // Auto-detect duration
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (video.duration && isFinite(video.duration)) {
        setForm((prev) => ({ ...prev, durationInSeconds: Math.round(video.duration) }));
      }
    };
    video.src = url;
  };

  const handleSave = () => {
    if (!lessonId || !courseId) return;

    const fd = new FormData();
    fd.append('title', form.title.trim());
    fd.append('description', form.description.trim());
    fd.append('durationInSeconds', form.durationInSeconds.toString());
    fd.append('lessonOrder', form.lessonOrder.toString());
    fd.append('materials', JSON.stringify(form.materials.filter(Boolean)));

    // If user uploaded a new video file, attach it
    if (videoFile) {
      fd.append('video', videoFile);
    }

    updateLessonMutation.mutate(
      { courseId, lessonId, formData: fd },
      {
        onSuccess: () => {
          setIsDirty(false);
          setVideoFile(null);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || t('lessonDetail.toastUpdateLessonFailed'));
        },
      }
    );
  };

  const handleReset = () => {
    if (!lessonId) return;
    localStorage.removeItem(`seller_lesson_update_${lessonId}`);
    if (lessonDetail) {
      const lesson = lessonDetail as any;
      const videoAsset = lesson.mediaAssets?.find((a: any) => a.assetType === 'VIDEO');
      setForm({
        title: lesson.title ?? '',
        description: lesson.description ?? '',
        lessonOrder: lesson.lessonOrder ?? 0,
        durationInSeconds: lesson.durationInSeconds ?? 0,
        videoUrl: videoAsset?.assetUrl ?? '',
        materials: lesson.materials ?? [],
      });
    }
    setVideoFile(null);
    setIsDirty(false);
    toast.info(t('lessonDetail.toastRestored'));
  };

  const comments: Comment[] = fetchedComments;

  const formatDuration = (seconds: number) => {
    if (!seconds) return t('lessonDetail.duration.zero');
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0
      ? t('lessonDetail.duration.minutesSeconds', { m, s })
      : t('lessonDetail.duration.minutes', { m });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return t('lessonDetail.fileSizeKB', { value: (bytes / 1024).toFixed(1) });
    return t('lessonDetail.fileSizeMB', { value: (bytes / (1024 * 1024)).toFixed(1) });
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/seller/courses/${courseId}`)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors mb-4 rounded-xl h-9 px-3 -ml-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('lessonDetail.backTo', { title: course?.title ?? t('lessonDetail.backFallback') })}</span>
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{form.title || t('lessonDetail.pageTitleFallback')}</h1>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5" /> {t('lessonDetail.orderLabel', { n: form.lessonOrder })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {formatDuration(form.durationInSeconds)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={() => setShowDeleteDialog(true)}
                disabled={deleteLessonMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                {t('lessonDetail.deleteLesson')}
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={handleReset} disabled={!isDirty}>
                <RotateCcw className="w-4 h-4 mr-1.5" /> {t('lessonDetail.restore')}
              </Button>
              <Button size="sm" className="rounded-xl" onClick={handleSave} disabled={!isDirty || updateLessonMutation.isPending}>
                <Save className="w-4 h-4 mr-1.5" /> {updateLessonMutation.isPending ? t('lessonDetail.saving') : t('lessonDetail.saveUpdate')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Basic Info Card */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">
              <Pencil className="w-4 h-4 text-blue-500" />
              {t('lessonDetail.infoTitle')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">{t('lessonDetail.labelTitle')}</Label>
                <Input className="rounded-xl h-11" value={form.title} onChange={(e) => handleChange('title', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  <Hash className="w-3.5 h-3.5 inline mr-1" /> {t('lessonDetail.labelOrder')}
                </Label>
                <Input className="rounded-xl h-11" type="number" value={form.lessonOrder} onChange={(e) => handleChange('lessonOrder', Number(e.target.value))} min="1" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  <Clock className="w-3.5 h-3.5 inline mr-1" /> {t('lessonDetail.labelDurationSec')}
                </Label>
                <Input className="rounded-xl h-11" type="number" value={form.durationInSeconds} onChange={(e) => handleChange('durationInSeconds', Number(e.target.value))} />
                {form.durationInSeconds > 0 && (
                  <p className="text-xs text-emerald-600 font-medium">{t('lessonDetail.approxDuration', { value: formatDuration(form.durationInSeconds) })}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">
                <FileText className="w-3.5 h-3.5 inline mr-1" /> {t('lessonDetail.labelDescription')}
              </Label>
              <Textarea className="rounded-xl" rows={4} placeholder={t('lessonDetail.descriptionPlaceholder')} value={form.description} onChange={(e) => handleChange('description', e.target.value)} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-slate-700">
                  <Link2 className="w-3.5 h-3.5 inline mr-1" />
                  {t('lessonDetail.materialsLabel', { count: form.materials.length })}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-8 text-xs gap-1.5"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, materials: [...prev.materials, ''] }));
                    setIsDirty(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5" /> {t('lessonDetail.addLink')}
                </Button>
              </div>
              {form.materials.length === 0 && (
                <p className="text-xs text-slate-400 italic">{t('lessonDetail.noMaterials')}</p>
              )}
              <div className="space-y-2">
                {form.materials.map((mat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium w-6">{idx + 1}.</span>
                    <Input
                      className="rounded-xl h-10 flex-1"
                      placeholder={t('lessonDetail.materialPlaceholder')}
                      value={mat}
                      onChange={(e) => {
                        const updated = [...form.materials];
                        updated[idx] = e.target.value;
                        setForm((prev) => ({ ...prev, materials: updated }));
                        setIsDirty(true);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl flex-shrink-0"
                      onClick={() => {
                        const updated = form.materials.filter((_, i) => i !== idx);
                        setForm((prev) => ({ ...prev, materials: updated }));
                        setIsDirty(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video Card — dual mode */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <Film className="w-4 h-4 text-teal-500" />
                {t('lessonDetail.videoSection')}
              </div>
              {/* Mode toggle */}
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setVideoMode('url')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    videoMode === 'url' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Link2 className="w-3 h-3 inline mr-1" /> {t('lessonDetail.modeUrl')}
                </button>
                <button
                  onClick={() => setVideoMode('upload')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    videoMode === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Upload className="w-3 h-3 inline mr-1" /> {t('lessonDetail.modeUpload')}
                </button>
              </div>
            </div>

            {/* Existing video badge (URL mode) */}
            {form.videoUrl && videoMode === 'url' && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-emerald-700">{t('lessonDetail.currentVideo')}</p>
                  <p className="text-xs text-emerald-600 truncate">{form.videoUrl}</p>
                </div>
              </div>
            )}

            {/* URL mode */}
            {videoMode === 'url' && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">{t('lessonDetail.videoUrlLabel')}</Label>
                <Input
                  className="rounded-xl h-11"
                  placeholder={t('lessonDetail.videoUrlPlaceholder')}
                  value={form.videoUrl}
                  onChange={(e) => handleChange('videoUrl', e.target.value)}
                />
                <p className="text-xs text-slate-400">{t('lessonDetail.videoUrlHint')}</p>
              </div>
            )}

            {/* Upload mode */}
            {videoMode === 'upload' && (
              <div className="space-y-3">
                {!videoFile ? (
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      videoDragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setVideoDragging(true); }}
                    onDragLeave={() => setVideoDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setVideoDragging(false);
                      const file = e.dataTransfer.files[0];
                      if (file) handleVideoFile(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 mx-auto mb-3 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">{t('lessonDetail.dropPrompt')}</p>
                    <p className="text-xs text-slate-400 mt-1">{t('lessonDetail.dropHint')}</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleVideoFile(file);
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <Film className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{videoFile.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(videoFile.size)}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-500" onClick={() => setVideoFile(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {form.videoUrl && (
                  <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <Film className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                      <Trans
                        i18nKey="lessonDetail.oldVideoNotice"
                        ns="seller"
                        values={{ url: form.videoUrl.length > 60 ? form.videoUrl.slice(0, 60) + '...' : form.videoUrl }}
                        components={{ strong: <span className="font-medium" /> }}
                      />
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Video preview */}
            {form.videoUrl && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500">{t('lessonDetail.preview')}</p>
                <div className="rounded-xl overflow-hidden bg-black aspect-video">
                  <video src={form.videoUrl} controls className="w-full h-full" preload="metadata" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comments Card */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">
              <MessageSquare className="w-4 h-4 text-amber-500" />
              {t('lessonDetail.commentsHeader', { count: comments.length })}
            </div>

            {comments.length > 0 ? (
              <div className="space-y-3">
                {/* Render only top-level comments */}
                {comments.filter((c) => !c.parentCommentId).map((comment) => {
                  const isSeller = courseSellerId && comment.userId === courseSellerId;
                  const replies = comments.filter((r) => r.parentCommentId === comment.id);
                  return (
                    <div key={comment.id} className="space-y-0">
                      {/* Parent comment */}
                      <div className={`flex items-start gap-3 p-4 rounded-xl ${isSeller ? 'bg-teal-50 border border-teal-100' : 'bg-slate-50'}`}>
                        {comment.user?.profilePicture ? (
                          <img src={comment.user.profilePicture} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isSeller ? 'bg-teal-100 text-teal-600' : 'bg-blue-100 text-blue-600'}`}>
                            {(comment.user?.fullName ?? '?')[0]}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700">{comment.user?.fullName ?? t('lessonDetail.userFallback')}</span>
                            {isSeller && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-700 border border-teal-200">
                                {t('lessonDetail.instructorBadge')}
                              </span>
                            )}
                            {comment.editedAt && (
                              <span
                                className="text-[11px] text-slate-400 italic"
                                title={t('lessonDetail.editedTooltip', { time: new Date(comment.editedAt).toLocaleString(dateLocale) })}
                              >
                                {t('lessonDetail.editedLabel')}
                              </span>
                            )}
                            <span className="text-xs text-slate-400 ml-auto">{new Date(comment.createdAt).toLocaleString(dateLocale)}</span>
                          </div>
                          {editingCommentId === comment.id ? (
                            <div className="mt-2 space-y-2">
                              <Textarea
                                autoFocus
                                rows={3}
                                className="text-sm"
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                maxLength={2000}
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  disabled={isSavingCommentEdit || !editingCommentText.trim() || editingCommentText.trim() === comment.content}
                                  onClick={() => submitEditComment(comment.id, comment.content)}
                                >
                                  {isSavingCommentEdit ? t('lessonDetail.savingShort') : t('lessonDetail.save')}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={cancelEditComment} disabled={isSavingCommentEdit}>
                                  {t('lessonDetail.cancel')}
                                </Button>
                                <span className="text-xs text-slate-400 ml-auto">{editingCommentText.length}/2000</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{comment.content}</p>
                          )}
                          {editingCommentId !== comment.id && (
                            <div className="flex items-center gap-3 mt-2">
                              <button
                                className="text-xs text-slate-400 hover:text-teal-600 font-medium transition-colors"
                                onClick={() => setReplyingTo(replyingTo?.id === comment.id ? null : comment)}
                              >
                                {replyingTo?.id === comment.id ? t('lessonDetail.cancelShort') : t('lessonDetail.replyBtn')}
                              </button>
                              {/* Edit only on seller's own comments — backend
                                  rejects edits from anyone else (gaslighting). */}
                              {isSeller && (
                                <button
                                  className="text-xs text-slate-400 hover:text-teal-600 font-medium transition-colors inline-flex items-center gap-1"
                                  onClick={() => startEditComment(comment)}
                                >
                                  <Pencil className="w-3 h-3" /> {t('lessonDetail.edit')}
                                </button>
                              )}
                              <button
                                className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors inline-flex items-center gap-1"
                                onClick={() => setPendingDeleteComment(comment)}
                                title={isSeller ? t('lessonDetail.deleteOwnTitle') : t('lessonDetail.deleteViolationTitle')}
                              >
                                <Trash2 className="w-3 h-3" /> {t('lessonDetail.delete')}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Replies */}
                      {replies.length > 0 && (
                        <div className="ml-8 pl-4 border-l-2 border-slate-200 space-y-2 pt-2">
                          {replies.map((reply) => {
                            const isReplySeller = courseSellerId && reply.userId === courseSellerId;
                            return (
                              <div key={reply.id} className={`flex items-start gap-2.5 p-3 rounded-lg ${isReplySeller ? 'bg-teal-50/60' : 'bg-slate-50/60'}`}>
                                {reply.user?.profilePicture ? (
                                  <img src={reply.user.profilePicture} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                                ) : (
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isReplySeller ? 'bg-teal-100 text-teal-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {(reply.user?.fullName ?? '?')[0]}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-slate-700">{reply.user?.fullName ?? t('lessonDetail.userFallback')}</span>
                                    {isReplySeller && (
                                      <span className="inline-flex items-center px-1.5 py-0 rounded-full text-[9px] font-semibold bg-teal-100 text-teal-700">
                                        {t('lessonDetail.instructorBadge')}
                                      </span>
                                    )}
                                    {reply.editedAt && (
                                      <span
                                        className="text-[9px] text-slate-400 italic"
                                        title={t('lessonDetail.editedTooltip', { time: new Date(reply.editedAt).toLocaleString(dateLocale) })}
                                      >
                                        {t('lessonDetail.editedLabel')}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-400 ml-auto">{new Date(reply.createdAt).toLocaleString(dateLocale)}</span>
                                  </div>
                                  {editingCommentId === reply.id ? (
                                    <div className="mt-1 space-y-2">
                                      <Textarea
                                        autoFocus
                                        rows={2}
                                        className="text-xs"
                                        value={editingCommentText}
                                        onChange={(e) => setEditingCommentText(e.target.value)}
                                        maxLength={2000}
                                      />
                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          className="h-7 text-xs"
                                          disabled={isSavingCommentEdit || !editingCommentText.trim() || editingCommentText.trim() === reply.content}
                                          onClick={() => submitEditComment(reply.id, reply.content)}
                                        >
                                          {isSavingCommentEdit ? t('lessonDetail.savingShort') : t('lessonDetail.save')}
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelEditComment} disabled={isSavingCommentEdit}>
                                          {t('lessonDetail.cancel')}
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-wrap">{reply.content}</p>
                                  )}
                                  {editingCommentId !== reply.id && (
                                    <div className="flex items-center gap-3 mt-1">
                                      <button
                                        className="text-[11px] text-slate-400 hover:text-teal-600 font-medium transition-colors"
                                        onClick={() => setReplyingTo(replyingTo?.id === reply.id ? null : reply)}
                                      >
                                        {replyingTo?.id === reply.id ? t('lessonDetail.cancelShort') : t('lessonDetail.replyBtn')}
                                      </button>
                                      {isReplySeller && (
                                        <button
                                          className="text-[11px] text-slate-400 hover:text-teal-600 font-medium transition-colors inline-flex items-center gap-1"
                                          onClick={() => startEditComment(reply)}
                                        >
                                          <Pencil className="w-3 h-3" /> {t('lessonDetail.edit')}
                                        </button>
                                      )}
                                      <button
                                        className="text-[11px] text-slate-400 hover:text-red-500 font-medium transition-colors inline-flex items-center gap-1"
                                        onClick={() => setPendingDeleteComment(reply)}
                                        title={isReplySeller ? t('lessonDetail.deleteOwnTitle') : t('lessonDetail.deleteViolationTitle')}
                                      >
                                        <Trash2 className="w-3 h-3" /> {t('lessonDetail.delete')}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Inline reply input for this comment */}
                      {replyingTo && (replyingTo.id === comment.id || replies.some((r) => r.id === replyingTo.id)) && (
                        <div className="ml-8 pl-4 border-l-2 border-teal-200 pt-2">
                          <div className="flex items-start gap-2">
                            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                              S
                            </div>
                            <div className="flex-1">
                              <p className="text-[11px] text-slate-500 mb-1">
                                <Trans
                                  i18nKey="lessonDetail.replyingTo"
                                  ns="seller"
                                  values={{ name: replyingTo.user?.fullName ?? t('lessonDetail.userFallback') }}
                                  components={{ span: <span className="font-semibold text-teal-600" /> }}
                                />
                                <button className="ml-2 text-red-400 hover:text-red-500 inline-flex" onClick={() => setReplyingTo(null)}><X size={16} /></button>
                              </p>
                              <div className="flex gap-1.5">
                                <Textarea
                                  autoFocus
                                  placeholder={t('lessonDetail.replyPlaceholder')}
                                  className="rounded-lg resize-none min-h-[36px] text-xs flex-1"
                                  rows={1}
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      if (commentText.trim() && courseId && lessonId) {
                                        const parentId = replyingTo.parentCommentId ?? replyingTo.id;
                                        setIsPostingComment(true);
                                        courseService.postComment(courseId, lessonId, commentText.trim(), parentId)
                                          .then(() => { setCommentText(''); setReplyingTo(null); toast.success(t('lessonDetail.toastReplySent')); fetchComments(); })
                                          .catch(() => toast.error(t('lessonDetail.toastSendFailed')))
                                          .finally(() => setIsPostingComment(false));
                                      }
                                    }
                                  }}
                                />
                                <Button
                                  size="icon"
                                  className="rounded-lg h-[36px] w-[36px] flex-shrink-0"
                                  disabled={!commentText.trim() || isPostingComment}
                                  onClick={() => {
                                    if (commentText.trim() && courseId && lessonId) {
                                      const parentId = replyingTo.parentCommentId ?? replyingTo.id;
                                      setIsPostingComment(true);
                                      courseService.postComment(courseId, lessonId, commentText.trim(), parentId)
                                        .then(() => { setCommentText(''); setReplyingTo(null); toast.success(t('lessonDetail.toastReplySent')); fetchComments(); })
                                        .catch(() => toast.error(t('lessonDetail.toastSendFailed')))
                                        .finally(() => setIsPostingComment(false));
                                    }
                                  }}
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400 italic">{t('lessonDetail.noComments')}</p>
              </div>
            )}
            {/* Top-level comment input */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  S
                </div>
                <div className="flex-1 flex gap-2">
                  <Textarea
                    placeholder={t('lessonDetail.newCommentPlaceholder')}
                    className="rounded-xl resize-none min-h-[44px] flex-1"
                    rows={1}
                    value={!replyingTo ? commentText : ''}
                    onChange={(e) => { if (!replyingTo) setCommentText(e.target.value); }}
                    onFocus={() => { if (replyingTo) setReplyingTo(null); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !replyingTo) {
                        e.preventDefault();
                        if (commentText.trim() && courseId && lessonId) {
                          setIsPostingComment(true);
                          courseService.postComment(courseId, lessonId, commentText.trim())
                            .then(() => { setCommentText(''); toast.success(t('lessonDetail.toastCommentSent')); fetchComments(); })
                            .catch(() => toast.error(t('lessonDetail.toastCommentSendFailed')))
                            .finally(() => setIsPostingComment(false));
                        }
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="rounded-xl h-[44px] w-[44px] flex-shrink-0"
                    disabled={!commentText.trim() || isPostingComment || !!replyingTo}
                    onClick={() => {
                      if (commentText.trim() && courseId && lessonId && !replyingTo) {
                        setIsPostingComment(true);
                        courseService.postComment(courseId, lessonId, commentText.trim())
                          .then(() => { setCommentText(''); toast.success(t('lessonDetail.toastCommentSent')); fetchComments(); })
                          .catch(() => toast.error(t('lessonDetail.toastCommentSendFailed')))
                          .finally(() => setIsPostingComment(false));
                      }
                    }}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2 ml-12">{t('lessonDetail.submitHint')}</p>
            </div>

          </CardContent>
        </Card>

        {/* Bottom nav */}
        <div className="flex items-center justify-end pt-2 pb-8">
          {isDirty && (
            <Button className="rounded-xl px-6 shadow-sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" /> {t('lessonDetail.saveUpdate')}
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              {t('lessonDetail.confirmDeleteLessonTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                <Trans
                  i18nKey="lessonDetail.confirmDeleteLessonLine1"
                  ns="seller"
                  values={{ title: form.title }}
                  components={{ strong: <strong className="text-slate-900" /> }}
                />
              </span>
              <span className="block">
                <Trans
                  i18nKey="lessonDetail.confirmDeleteLessonLine2"
                  ns="seller"
                  components={{ strong: <strong /> }}
                />
              </span>
              {course?.status === 'ACTIVE' && (
                <span className="block text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 text-sm">
                  <AlertTriangle size={14} className="inline mr-1" /> {t('lessonDetail.confirmDeleteLessonActiveWarn')}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLessonMutation.isPending}>{t('lessonDetail.cancelShort')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteLessonMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (!courseId || !lessonId) return;
                deleteLessonMutation.mutate(
                  { courseId, lessonId },
                  {
                    onSuccess: () => {
                      setShowDeleteDialog(false);
                      navigate(`/seller/courses/${courseId}`);
                    },
                  }
                );
              }}
            >
              {deleteLessonMutation.isPending ? t('lessonDetail.deleting') : t('lessonDetail.deletePermanent')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!pendingDeleteComment}
        onOpenChange={(o) => !o && setPendingDeleteComment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" /> {t('lessonDetail.confirmDeleteCommentTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                {t('lessonDetail.confirmDeleteCommentDesc')}
              </span>
              {pendingDeleteComment && (
                <span className="block text-xs text-slate-600 border-l-2 border-slate-200 pl-2 mt-2">
                  "{pendingDeleteComment.content.slice(0, 200)}"
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingComment}>{t('lessonDetail.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingComment}
              onClick={(e) => { e.preventDefault(); handleDeleteComment(); }}
            >
              {isDeletingComment ? t('lessonDetail.deletingComment') : t('lessonDetail.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
