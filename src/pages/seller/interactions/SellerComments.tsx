import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useSellerComments,
  useSellerCommentsSummary,
  useDeleteSellerComment,
  useSellerCourses,
} from '@/hooks/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import {
  ExternalLink, Trash2, MessageSquare, CheckCircle2, Clock, Search, X,
  CornerDownLeft, RefreshCw, Send, Reply, Inbox, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { courseService } from '@/lib/api/services/course.service';
import type { SellerComment } from '@/lib/api/services/seller.service';
import type { Course } from '@/domain';

type StatusFilter = 'all' | 'unanswered' | 'answered';
const PAGE_SIZE = 20;
const REPLY_MAX = 2000;

/** Compact human-friendly time: "vừa xong" → "Hôm qua" → date. */
function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (min < 1) return 'vừa xong';
  if (min < 60) return `${min} phút trước`;
  if (hr < 24) return `${hr} giờ trước`;
  if (day === 1) return 'Hôm qua';
  if (day < 7) return `${day} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

function getInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function SellerComments() {
  const navigate = useNavigate();
  const listTopRef = useRef<HTMLDivElement>(null);

  // ── State ──────────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [courseId, setCourseId] = useState<string>('ALL');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<SellerComment | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isPostingReply, setIsPostingReply] = useState(false);
  // Locally-answered IDs bridge the gap between "user just replied" and the
  // next refetch so the badge updates immediately.
  const [locallyAnswered, setLocallyAnswered] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  // Real BE pagination: hand `page` + `limit` to the API and trust its totals.
  const {
    data: commentsData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useSellerComments({
    search: appliedSearch,
    page,
    limit: PAGE_SIZE,
    courseId: courseId === 'ALL' ? undefined : courseId,
    status,
  });

  const { data: summary, refetch: refetchSummary } = useSellerCommentsSummary();
  const { data: coursesResp } = useSellerCourses('', { limit: 100 });

  const courseOptions = useMemo(() => {
    const list = Array.isArray(coursesResp)
      ? coursesResp
      : (coursesResp as { data?: Course[] })?.data ?? [];
    return list.map((c) => ({ value: c.id, label: c.title }));
  }, [coursesResp]);

  const courseTitleById = useMemo(() => {
    const map = new Map<string, string>();
    courseOptions.forEach((c) => map.set(c.value, c.label));
    return map;
  }, [courseOptions]);

  const deleteMutation = useDeleteSellerComment();

  const rows = useMemo(() => {
    const list = commentsData?.comments ?? [];
    if (locallyAnswered.size === 0) return list;
    return list.map((c) =>
      locallyAnswered.has(c.id) && c.isAnswered === false
        ? { ...c, isAnswered: true }
        : c
    );
  }, [commentsData?.comments, locallyAnswered]);

  const pagination = commentsData?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);

  // Clamp page back into range when filters shrink the result set.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const isRefetching = isFetching && !isLoading;
  const hasAnyFilter = appliedSearch !== '' || courseId !== 'ALL' || status !== 'all';

  // ── Handlers ───────────────────────────────────────────────────────────
  const applySearch = () => {
    setAppliedSearch(searchInput.trim());
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput('');
    setAppliedSearch('');
    setPage(1);
    searchRef.current?.focus();
  };

  const resetAll = () => {
    setSearchInput('');
    setAppliedSearch('');
    setCourseId('ALL');
    setStatus('all');
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
    refetchSummary();
  };

  const goToPage = (p: number) => {
    setPage(p);
    requestAnimationFrame(() => {
      listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      toast.success('Đã xoá bình luận');
      setPendingDelete(null);
      refetchSummary();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không thể xoá bình luận';
      toast.error(msg);
    }
  };

  const startReply = (comment: SellerComment) => {
    setReplyingId(comment.id);
    setReplyText('');
  };

  const cancelReply = () => {
    setReplyingId(null);
    setReplyText('');
  };

  const submitReply = async (comment: SellerComment) => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    setIsPostingReply(true);
    try {
      const parentId = comment.parentCommentId ?? comment.id;
      await courseService.postComment(comment.courseId, comment.lessonId, trimmed, parentId);
      setLocallyAnswered((prev) => {
        const next = new Set(prev);
        next.add(parentId);
        return next;
      });
      toast.success('Đã gửi trả lời');
      cancelReply();
      refetch();
      refetchSummary();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Lỗi khi gửi trả lời';
      toast.error(msg);
    } finally {
      setIsPostingReply(false);
    }
  };

  // ── Render guards (after every hook) ──────────────────────────────────
  if (isLoading && !commentsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !commentsData) {
    return (
      <ErrorMessage
        message="Không thể tải danh sách bình luận. Vui lòng thử lại sau."
        onRetry={refetch}
      />
    );
  }

  const hasInput = searchInput.length > 0;
  const hasPending = searchInput.trim() !== appliedSearch.trim();
  const statusLabelMap: Record<StatusFilter, string> = {
    all: 'Tất cả',
    unanswered: 'Chưa trả lời',
    answered: 'Đã trả lời',
  };

  const jumpToUnanswered = () => {
    if (!summary || summary.unanswered === 0) return;
    setStatus('unanswered');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Bình luận của người học</h1>
          <p className="text-sm text-muted-foreground">
            Trả lời nhanh, xoá bình luận không phù hợp, theo dõi mức độ tương tác.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tổng bình luận</p>
              <p className="text-xl font-bold font-display">{summary?.total ?? '—'}</p>
            </div>
          </CardContent>
        </Card>
        {summary && summary.unanswered > 0 ? (
          <button
            type="button"
            onClick={jumpToUnanswered}
            className="text-left rounded-lg border border-amber-300 bg-amber-50/40 hover:bg-amber-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 transition-colors"
            aria-label={`Có ${summary.unanswered} bình luận chưa trả lời, bấm để xem`}
          >
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center relative">
                <Clock className="w-5 h-5 text-amber-700" />
                <span className="absolute -top-1 -right-1 inline-flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-amber-500/60 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Chưa trả lời</p>
                <p className="text-xl font-bold font-display text-amber-700">{summary.unanswered}</p>
                <p className="text-[10px] text-amber-700/70 mt-0.5">Bấm để xem ngay</p>
              </div>
            </div>
          </button>
        ) : (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Chưa trả lời</p>
                <p className="text-xl font-bold font-display text-amber-700">
                  {summary?.unanswered ?? '—'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Đã trả lời</p>
              <p className="text-xl font-bold font-display text-emerald-700">
                {summary?.answered ?? '—'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters bar */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applySearch();
                } else if (e.key === 'Escape' && hasInput) {
                  e.preventDefault();
                  clearSearch();
                }
              }}
              placeholder="Tìm theo nội dung bình luận..."
              className="pl-9 pr-24"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {hasPending && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  <CornerDownLeft className="w-3 h-3" /> Enter
                </span>
              )}
              {hasInput && (
                <button
                  type="button"
                  aria-label="Xoá ô tìm kiếm"
                  onClick={clearSearch}
                  className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-slate-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <Select
            value={courseId}
            onValueChange={(v) => {
              setCourseId(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue placeholder="Lọc theo khoá học" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả khoá học</SelectItem>
              {courseOptions.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as StatusFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả {summary ? `(${summary.total})` : ''}</SelectItem>
              <SelectItem value="unanswered">
                Chưa trả lời {summary ? `(${summary.unanswered})` : ''}
              </SelectItem>
              <SelectItem value="answered">
                Đã trả lời {summary ? `(${summary.answered})` : ''}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasAnyFilter && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Đang lọc:</span>
            {appliedSearch && (
              <FilterChip label={`Tìm: "${appliedSearch}"`} onRemove={clearSearch} />
            )}
            {courseId !== 'ALL' && (
              <FilterChip
                label={courseTitleById.get(courseId) ?? 'Khoá học'}
                onRemove={() => { setCourseId('ALL'); setPage(1); }}
              />
            )}
            {status !== 'all' && (
              <FilterChip
                label={statusLabelMap[status]}
                onRemove={() => { setStatus('all'); setPage(1); }}
              />
            )}
            <button
              type="button"
              onClick={resetAll}
              className="text-xs text-primary hover:underline ml-1"
            >
              Xoá tất cả
            </button>
          </div>
        )}
      </div>

      {/* Comment list */}
      <div ref={listTopRef} className="space-y-3 scroll-mt-4">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span>{total.toLocaleString('vi-VN')} bình luận</span>
          {isRefetching && <span>• đang tải...</span>}
        </div>

        {rows.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-10 h-10 opacity-30 mx-auto" />
              <p className="mt-3 text-sm font-medium">
                {hasAnyFilter ? 'Không có bình luận khớp bộ lọc' : 'Chưa có bình luận nào'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {hasAnyFilter
                  ? 'Thử bỏ bớt bộ lọc.'
                  : 'Khi học viên bắt đầu bình luận trên khoá học của bạn, bình luận sẽ hiển thị tại đây.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          rows.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              isReplying={replyingId === c.id}
              replyText={replyText}
              isPostingReply={isPostingReply}
              onReplyChange={setReplyText}
              onStartReply={() => startReply(c)}
              onCancelReply={cancelReply}
              onSubmitReply={() => submitReply(c)}
              onJump={() => navigate(`/seller/courses/${c.courseId}/lessons/${c.lessonId}`)}
              onDelete={() => setPendingDelete(c)}
            />
          ))
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Trước
            </Button>
            <span className="text-sm text-muted-foreground">
              Trang {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              Tiếp <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá bình luận?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Nội dung sẽ bị xoá vĩnh viễn và không thể hoàn tác. Nếu đây là
                bình luận có chứa câu hỏi hợp lệ, hãy cân nhắc trả lời thay vì xoá.
              </span>
              {pendingDelete && (
                <span className="block text-xs text-muted-foreground border-l-2 pl-2 mt-2 italic">
                  "{pendingDelete.content.slice(0, 200)}
                  {pendingDelete.content.length > 200 ? '…' : ''}"
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Đang xoá…' : 'Xoá'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary max-w-xs">
      <span className="truncate">{label}</span>
      <button
        type="button"
        aria-label={`Xoá ${label}`}
        onClick={onRemove}
        className="rounded-full hover:bg-primary/20 p-0.5 flex-shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

interface CommentRowProps {
  comment: SellerComment;
  isReplying: boolean;
  replyText: string;
  isPostingReply: boolean;
  onReplyChange: (v: string) => void;
  onStartReply: () => void;
  onCancelReply: () => void;
  onSubmitReply: () => void;
  onJump: () => void;
  onDelete: () => void;
}

function CommentRow({
  comment, isReplying, replyText, isPostingReply,
  onReplyChange, onStartReply, onCancelReply, onSubmitReply, onJump, onDelete,
}: CommentRowProps) {
  const remaining = REPLY_MAX - replyText.length;
  const counterClass =
    remaining < 0
      ? 'text-destructive font-semibold'
      : remaining < 100
        ? 'text-amber-600 font-medium'
        : 'text-muted-foreground';

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header row: avatar + name/badge + meta */}
        <div className="flex items-start gap-3">
          {comment.userProfilePicture ? (
            <img
              src={comment.userProfilePicture}
              alt={comment.userName}
              className="w-9 h-9 rounded-full object-cover shrink-0 border"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold border border-primary/20">
              {getInitials(comment.userName)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-medium text-slate-700">{comment.userName}</span>
              <CommentStatusBadge comment={comment} />
              <span className="text-muted-foreground">•</span>
              <span
                className="text-muted-foreground"
                title={new Date(comment.createdAt).toLocaleString('vi-VN')}
              >
                {relativeTime(comment.createdAt)}
              </span>
            </div>
            <p
              className="text-[11px] text-muted-foreground/80 truncate mt-0.5"
              title={`${comment.courseTitle} → ${comment.lessonTitle}`}
            >
              {comment.courseTitle} <span className="opacity-60">→</span> {comment.lessonTitle}
            </p>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
          {comment.isReply && (
            <span className="text-xs text-muted-foreground mr-1">↳</span>
          )}
          {comment.content}
        </p>

        {/* Action row */}
        <div className="flex items-center gap-1">
          {!comment.isOwn && (
            <Button size="sm" variant="ghost" onClick={onStartReply} disabled={isReplying}>
              <Reply className="w-3.5 h-3.5 mr-1" /> Trả lời
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onJump} title="Mở bài học để xem ngữ cảnh">
            <ExternalLink className="w-3.5 h-3.5 mr-1" /> Mở
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive ml-auto"
            onClick={onDelete}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Xoá
          </Button>
        </div>

        {/* Inline reply */}
        {isReplying && (
          <div className="pt-2 border-t space-y-2">
            <Textarea
              autoFocus
              rows={2}
              placeholder="Viết câu trả lời… (Ctrl+Enter để gửi)"
              value={replyText}
              onChange={(e) => onReplyChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  onSubmitReply();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  onCancelReply();
                }
              }}
              maxLength={REPLY_MAX}
              className="text-sm resize-none"
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={onSubmitReply}
                disabled={isPostingReply || !replyText.trim()}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {isPostingReply ? 'Đang gửi…' : 'Gửi'}
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancelReply} disabled={isPostingReply}>
                Huỷ
              </Button>
              <span className={`text-xs ml-auto ${counterClass}`}>
                {replyText.length}/{REPLY_MAX}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact status indicator:
 *   - Own reply / own top-level: "Của bạn" (teal)
 *   - Student top-level + no seller reply: "Chưa trả lời" (amber)
 *   - Student top-level + seller replied: "Đã trả lời" (emerald)
 *   - Student replies under another student: no badge
 */
function CommentStatusBadge({ comment }: { comment: SellerComment }) {
  if (comment.isOwn) {
    return (
      <Badge variant="outline" className="bg-teal-500/10 text-teal-700 border-teal-500/30 text-xs">
        <MessageSquare className="w-3 h-3 mr-1" /> Của bạn
      </Badge>
    );
  }
  if (comment.isAnswered === true) {
    return (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-xs">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Đã trả lời
      </Badge>
    );
  }
  if (comment.isAnswered === false) {
    return (
      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs">
        <Clock className="w-3 h-3 mr-1" /> Chưa trả lời
      </Badge>
    );
  }
  return null;
}
