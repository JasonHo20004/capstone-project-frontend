import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Flag, Pencil, Save, X } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  userId: string;
  parentCommentId: string | null;
  createdAt: string;
  editedAt?: string | null;
  user?: { fullName?: string; profilePicture?: string };
}

type ReportReason = 'SPAM' | 'ABUSE' | 'SCAM' | 'MISINFORMATION' | 'OFF_TOPIC' | 'OTHER';

interface DiscussionSectionProps {
  fetchComments: (page: number, limit: number) => Promise<{ comments: Comment[]; total: number }>;
  postComment: (content: string, parentCommentId?: string) => Promise<unknown>;
  /** Edit own comment. Optional — if omitted, edit UI hides. */
  editComment?: (commentId: string, content: string) => Promise<unknown>;
  /** Flag a comment as inappropriate. Optional — if omitted, report UI hides. */
  reportComment?: (
    commentId: string,
    payload: { reasonType: ReportReason; note?: string }
  ) => Promise<unknown>;
  title?: string;
  subtitle?: string;
}

function getCurrentUser() {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub || payload.userId || payload.id,
      fullName: payload.fullName || payload.name || 'Bạn',
      profilePicture: payload.profilePicture || null,
    };
  } catch {
    return null;
  }
}

const REASON_LABELS: Record<ReportReason, string> = {
  SPAM: 'Spam / Quảng cáo',
  ABUSE: 'Xúc phạm / Quấy rối',
  SCAM: 'Lừa đảo',
  MISINFORMATION: 'Sai thông tin',
  OFF_TOPIC: 'Lạc đề',
  OTHER: 'Khác',
};

export default function DiscussionSection({
  fetchComments: fetchCommentsFn,
  postComment: postCommentFn,
  editComment: editCommentFn,
  reportComment: reportCommentFn,
  title,
  subtitle,
}: DiscussionSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Edit state — only one comment editable at a time.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Report state — drives the modal dialog.
  const [reportingComment, setReportingComment] = useState<Comment | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>('SPAM');
  const [reportNote, setReportNote] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  const COMMENTS_PER_PAGE = 10;
  const currentUser = useMemo(() => getCurrentUser(), []);
  const totalPages = Math.max(1, Math.ceil(total / COMMENTS_PER_PAGE));

  const loadComments = useCallback((pageNum: number) => {
    setLoading(true);
    fetchCommentsFn(pageNum, COMMENTS_PER_PAGE)
      .then((res) => {
        setComments(res.comments ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fetchCommentsFn]);

  useEffect(() => { loadComments(page); }, [loadComments, page]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setComments([]);
    setPage(p);
  };

  const handlePost = (content: string, parentCommentId?: string) => {
    if (!content.trim()) return;
    setIsPosting(true);
    postCommentFn(content.trim(), parentCommentId)
      .then(() => {
        setCommentText('');
        setReplyingTo(null);
        toast.success(parentCommentId ? 'Đã gửi trả lời' : 'Đã gửi bình luận');
        setPage(1);
        loadComments(1);
      })
      .catch(() => toast.error('Lỗi khi gửi'))
      .finally(() => setIsPosting(false));
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditingText(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const submitEdit = async (commentId: string) => {
    if (!editCommentFn) return;
    const trimmed = editingText.trim();
    if (!trimmed) {
      toast.error('Nội dung không được để trống');
      return;
    }
    setIsSavingEdit(true);
    try {
      await editCommentFn(commentId, trimmed);
      toast.success('Đã cập nhật bình luận');
      cancelEdit();
      loadComments(page);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Lỗi khi cập nhật bình luận';
      toast.error(msg);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const openReport = (comment: Comment) => {
    setReportingComment(comment);
    setReportReason('SPAM');
    setReportNote('');
  };

  const submitReport = async () => {
    if (!reportingComment || !reportCommentFn) return;
    setIsReporting(true);
    try {
      await reportCommentFn(reportingComment.id, {
        reasonType: reportReason,
        note: reportNote.trim() || undefined,
      });
      toast.success('Đã gửi báo cáo. Cám ơn bạn!');
      setReportingComment(null);
      loadComments(page);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không thể gửi báo cáo';
      toast.error(msg);
    } finally {
      setIsReporting(false);
    }
  };

  const topLevelComments = comments.filter((c) => !c.parentCommentId);

  const renderAvatar = (user: Comment['user'], small = false) => {
    const size = small ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
    if (user?.profilePicture) {
      return <img src={user.profilePicture} alt="" className={`${size} rounded-full object-cover flex-shrink-0`} />;
    }
    return (
      <div className={`${size} rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0`}>
        {(user?.fullName ?? '?')[0]}
      </div>
    );
  };

  const renderCurrentUserAvatar = (small = false) => {
    const size = small ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
    if (currentUser?.profilePicture) {
      return <img src={currentUser.profilePicture} alt="" className={`${size} rounded-full object-cover flex-shrink-0`} />;
    }
    return (
      <div className={`${size} rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0`}>
        {(currentUser?.fullName ?? '?')[0]}
      </div>
    );
  };

  const toggleExpandReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const REPLY_PREVIEW_COUNT = 2;

  const renderComment = (comment: Comment, isReply = false) => {
    const allReplies = comments.filter((r) => r.parentCommentId === comment.id);
    const isExpanded = expandedReplies.has(comment.id);
    const replies = isExpanded ? allReplies : allReplies.slice(0, REPLY_PREVIEW_COUNT);
    const hiddenCount = allReplies.length - REPLY_PREVIEW_COUNT;
    const isActive = replyingTo?.id === comment.id;
    const isOwn = !!currentUser && comment.userId === currentUser.id;
    const isEditing = editingId === comment.id;
    const canEdit = !!editCommentFn && isOwn;
    const canReport = !!reportCommentFn && !isOwn;

    return (
      <div key={comment.id}>
        <div className={`flex items-start ${isReply ? 'gap-2.5 py-2' : 'gap-3 p-4 bg-slate-50 rounded-xl'}`}>
          {renderAvatar(comment.user, isReply)}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`${isReply ? 'text-xs' : 'text-sm'} font-medium text-slate-700`}>
                {comment.user?.fullName ?? 'Người dùng'}
              </span>
              {comment.editedAt && (
                <span
                  className={`${isReply ? 'text-[10px]' : 'text-[11px]'} text-slate-400 italic`}
                  title={`Đã chỉnh sửa lúc ${new Date(comment.editedAt).toLocaleString('vi-VN')}`}
                >
                  (đã chỉnh sửa)
                </span>
              )}
              <span className={`${isReply ? 'text-[10px]' : 'text-xs'} text-slate-400 ml-auto`}>
                {new Date(comment.createdAt).toLocaleString('vi-VN')}
              </span>
            </div>

            {isEditing ? (
              <div className="mt-2 space-y-2">
                <textarea
                  autoFocus
                  rows={3}
                  className="w-full rounded-lg resize-none text-sm border border-indigo-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  maxLength={2000}
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => submitEdit(comment.id)}
                    disabled={isSavingEdit || !editingText.trim() || editingText.trim() === comment.content}
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    {isSavingEdit ? 'Đang lưu…' : 'Lưu'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={isSavingEdit}>
                    <X className="w-3.5 h-3.5 mr-1" /> Huỷ
                  </Button>
                  <span className="text-xs text-slate-400 ml-auto">
                    {editingText.length}/2000
                  </span>
                </div>
              </div>
            ) : (
              <p className={`${isReply ? 'text-xs' : 'text-sm'} text-slate-600 mt-1 whitespace-pre-wrap`}>
                {comment.content}
              </p>
            )}

            {!isEditing && (
              <div className="flex items-center gap-3 mt-1.5">
                <button
                  className={`${isReply ? 'text-[11px]' : 'text-xs'} text-slate-400 hover:text-indigo-600 font-medium transition-colors`}
                  onClick={() => setReplyingTo(isActive ? null : comment)}
                >
                  {isActive ? 'Hủy' : 'Trả lời'}
                </button>
                {canEdit && (
                  <button
                    className={`${isReply ? 'text-[11px]' : 'text-xs'} text-slate-400 hover:text-indigo-600 font-medium transition-colors inline-flex items-center gap-1`}
                    onClick={() => startEdit(comment)}
                  >
                    <Pencil className="w-3 h-3" /> Sửa
                  </button>
                )}
                {canReport && (
                  <button
                    className={`${isReply ? 'text-[11px]' : 'text-xs'} text-slate-400 hover:text-red-500 font-medium transition-colors inline-flex items-center gap-1`}
                    onClick={() => openReport(comment)}
                    title="Báo cáo bình luận không phù hợp"
                  >
                    <Flag className="w-3 h-3" /> Báo cáo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="ml-12 pl-4 border-l-2 border-indigo-200 space-y-1 mt-2">
            {replies.map((r) => renderComment(r, true))}
            {!isExpanded && hiddenCount > 0 && (
              <button
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium py-1 flex items-center gap-1 transition-colors"
                onClick={() => toggleExpandReplies(comment.id)}
              >
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
                Xem thêm {hiddenCount} trả lời
              </button>
            )}
            {isExpanded && hiddenCount > 0 && (
              <button
                className="text-xs text-slate-400 hover:text-slate-600 font-medium py-1 flex items-center gap-1 transition-colors"
                onClick={() => toggleExpandReplies(comment.id)}
              >
                <span className="material-symbols-outlined text-[14px]">expand_less</span>
                Ẩn bớt
              </button>
            )}
          </div>
        )}

        {/* Inline reply input */}
        {replyingTo && replyingTo.id === comment.id && (
          <div className="ml-12 pl-4 border-l-2 border-indigo-300 pt-2">
            <div className="flex items-start gap-2">
              {renderCurrentUserAvatar(true)}
              <div className="flex-1">
                <p className="text-[11px] text-slate-500 mb-1">
                  {"Trả lời "}<span className="font-semibold text-indigo-600">@{replyingTo.user?.fullName ?? 'Người dùng'}</span>
                  <button className="ml-2 text-red-400 hover:text-red-500 inline-flex items-center" onClick={() => setReplyingTo(null)}><X size={12} /></button>
                </p>
                <div className="flex gap-1.5">
                  <textarea
                    autoFocus
                    placeholder="Viết câu trả lời..."
                    className="rounded-lg resize-none min-h-[36px] text-xs flex-1 border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                    rows={1}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const parentId = replyingTo.id;
                        handlePost(commentText, parentId);
                      }
                    }}
                  />
                  <button
                    className="h-9 w-9 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex-shrink-0 transition-colors"
                    disabled={!commentText.trim() || isPosting}
                    onClick={() => {
                      const parentId = replyingTo.id;
                      handlePost(commentText, parentId);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-600">forum</span>
          {title || 'Thảo luận'} ({total})
        </h3>
        <p className="text-xs text-slate-400 mt-1">{subtitle || 'Chia sẻ kinh nghiệm, hỏi đáp'}</p>
      </div>

      <div className="p-6 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-slate-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-24" />
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : topLevelComments.length > 0 ? (
          <div className="space-y-3">
            {topLevelComments.map((c) => renderComment(c))}
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-5xl text-slate-200 block mb-3">chat_bubble_outline</span>
            <p className="text-sm text-slate-400 italic">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 pt-2">
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${
                  p === page
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => goToPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        )}

        {/* Top-level comment input */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {renderCurrentUserAvatar()}
            </div>
            <div className="flex-1 flex gap-2">
              <textarea
                placeholder="Viết bình luận về bài thi này..."
                className="rounded-xl resize-none min-h-[44px] flex-1 border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                rows={1}
                value={!replyingTo ? commentText : ''}
                onChange={(e) => { if (!replyingTo) setCommentText(e.target.value); }}
                onFocus={() => { if (replyingTo) setReplyingTo(null); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !replyingTo) {
                    e.preventDefault();
                    handlePost(commentText);
                  }
                }}
              />
              <button
                className="h-11 w-11 flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex-shrink-0 transition-colors"
                disabled={!commentText.trim() || isPosting || !!replyingTo}
                onClick={() => { if (!replyingTo) handlePost(commentText); }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 ml-12">Nhấn Enter để gửi, Shift+Enter để xuống dòng.</p>
        </div>
      </div>

      {/* Report dialog */}
      <Dialog open={!!reportingComment} onOpenChange={(o) => !o && setReportingComment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Flag className="w-5 h-5" /> Báo cáo bình luận
            </DialogTitle>
            <DialogDescription>
              Bình luận sẽ được ẩn tạm thời nếu nhiều người báo cáo. Admin sẽ xem xét và quyết định.
            </DialogDescription>
          </DialogHeader>
          {reportingComment && (
            <div className="space-y-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="text-xs text-slate-500 mb-1">
                  {reportingComment.user?.fullName ?? 'Người dùng'} • {new Date(reportingComment.createdAt).toLocaleString('vi-VN')}
                </div>
                <p className="text-slate-700 line-clamp-3 whitespace-pre-wrap">{reportingComment.content}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Lý do</label>
                <Select value={reportReason} onValueChange={(v) => setReportReason(v as ReportReason)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(REASON_LABELS) as ReportReason[]).map((k) => (
                      <SelectItem key={k} value={k}>{REASON_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Ghi chú thêm <span className="text-xs text-slate-400 font-normal">(tuỳ chọn)</span>
                </label>
                <Textarea
                  rows={3}
                  maxLength={500}
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="Mô tả thêm để admin hiểu bối cảnh…"
                />
                <p className="text-[11px] text-slate-400 text-right">{reportNote.length}/500</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportingComment(null)} disabled={isReporting}>
              Huỷ
            </Button>
            <Button
              onClick={submitReport}
              disabled={isReporting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isReporting ? 'Đang gửi…' : 'Gửi báo cáo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
