import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Bell, Eye, Filter, Search, CheckCheck, Sparkles, Archive, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/hooks/api/use-user';
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotificationRealtime,
  useNotifications,
  useArchiveNotification,
} from '@/hooks/api';
import type { InAppNotification } from '@/domain';
import {
  getNotificationTypeConfig,
  getNotificationLink,
} from '@/components/user/layout/NotificationDropdown';
import { useAIInsights, type AIInsight } from '@/hooks/use-ai-insights';

const formatDate = (date: string) => {
  try {
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return date;
  }
};

const TYPE_FILTER_OPTIONS: { key: string; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'ai_insight', label: 'AI Insight' },
  { key: 'course_comment', label: 'Bình luận' },
  { key: 'comment_reply', label: 'Trả lời' },
  { key: 'course_enrollment', label: 'Đăng ký' },
  { key: 'course_update', label: 'Cập nhật' },
  // Seller-specific events emitted by course-service / payment-service.
  // Keys are uppercase to match what handlers write (see NotificationDropdown).
  { key: 'COURSE_APPROVED', label: 'Khoá học duyệt' },
  { key: 'COURSE_REJECTED', label: 'Khoá học bị từ chối' },
  { key: 'COURSE_SUBMITTED', label: 'Khoá học chờ duyệt' },
  { key: 'WITHDRAWAL_APPROVED', label: 'Rút tiền thành công' },
  { key: 'WITHDRAWAL_REJECTED', label: 'Rút tiền bị từ chối' },
];

// Mute control persists across reloads via localStorage. Pure UX —
// hides the unread highlight + bell pulse until the chosen deadline.
const MUTE_STORAGE_KEY = 'notifications.mutedUntil';
const MUTE_PRESETS: Array<{ label: string; hours: number }> = [
  { label: '1 giờ', hours: 1 },
  { label: '4 giờ', hours: 4 },
  { label: 'Đến cuối ngày', hours: 12 },
];

const AI_ACTION_LABEL: Record<string, string> = {
  SHOW_BANNER: 'AI Insight',
  SUGGEST_COURSE: 'Course Recommendation',
  UNLOCK_TIP: 'Study Tip',
  SEND_REMINDER: 'Study Reminder',
};

const AI_ACTION_COLOR: Record<string, { bg: string; text: string }> = {
  SHOW_BANNER: { bg: 'bg-blue-50', text: 'text-blue-600' },
  SUGGEST_COURSE: { bg: 'bg-violet-50', text: 'text-violet-600' },
  UNLOCK_TIP: { bg: 'bg-amber-50', text: 'text-amber-600' },
  SEND_REMINDER: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
};

export default function Notifications() {
  const { user } = useUser();
  const userId = user?.id;
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unseen' | 'seen'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data } = useNotifications({
    page: 1,
    limit: 50,
    unreadOnly: false,
    enabled: Boolean(userId),
  });

  const notificationsForUser: InAppNotification[] = useMemo(
    () => data?.notifications ?? [],
    [data],
  );

  const { mutate: markReadMutation } = useMarkNotificationAsRead();
  const { mutate: markAllReadMutation } = useMarkAllNotificationsAsRead();
  const { mutate: archiveMutation, isPending: isArchiving } = useArchiveNotification();

  // Mute lives client-side — read once on mount, write on user toggle.
  const [mutedUntil, setMutedUntil] = useState<Date | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(MUTE_STORAGE_KEY);
    if (!raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime()) || d.getTime() < Date.now()) {
      localStorage.removeItem(MUTE_STORAGE_KEY);
      return null;
    }
    return d;
  });
  const isMuted = !!mutedUntil && mutedUntil.getTime() > Date.now();

  const applyMute = (hours: number | null) => {
    if (hours == null) {
      localStorage.removeItem(MUTE_STORAGE_KEY);
      setMutedUntil(null);
      toast.success('Đã bật lại thông báo');
      return;
    }
    const until = new Date(Date.now() + hours * 60 * 60 * 1000);
    localStorage.setItem(MUTE_STORAGE_KEY, until.toISOString());
    setMutedUntil(until);
    toast.success(`Tạm ẩn thông báo đến ${until.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`);
  };

  useNotificationRealtime(userId);

  const { insights: aiInsights, markRead: markAIRead, markAllRead: markAllAIRead } = useAIInsights();

  const computedNotifications = useMemo(() => {
    return notificationsForUser
      .filter((n) => {
        const matchesSearch = (n.title + ' ' + n.content)
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesType = typeFilter === 'all' || n.type === typeFilter;
        const isSeen = n.isRead;
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'seen' && isSeen) ||
          (statusFilter === 'unseen' && !isSeen);
        return matchesSearch && matchesType && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [notificationsForUser, search, typeFilter, statusFilter]);

  const unreadCount = useMemo(() => {
    const regularUnread = notificationsForUser.reduce((acc, n) => acc + (n.isRead ? 0 : 1), 0);
    const aiUnread = aiInsights.filter((i) => !i.isRead).length;
    return regularUnread + aiUnread;
  }, [notificationsForUser, aiInsights]);

  const filteredAIInsights = useMemo<AIInsight[]>(() => {
    if (typeFilter !== 'all' && typeFilter !== 'ai_insight') return [];
    return aiInsights.filter((i) => {
      const matchSearch = (i.message + ' ' + i.evidence)
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'unseen' && !i.isRead) ||
        (statusFilter === 'seen' && i.isRead);
      return matchSearch && matchStatus;
    });
  }, [aiInsights, typeFilter, search, statusFilter]);

  const handleNotificationClick = (n: InAppNotification) => {
    if (!n.isRead) {
      markReadMutation(n.id);
    }
    const link = getNotificationLink(n);
    if (link) {
      navigate(link);
    }
  };

  return (
    <div className="bg-background space-y-6">
      {/* Header */}
      <section className="bg-white border border-slate-200 rounded-3xl py-8 px-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Thông báo của bạn
              </h1>
              <p className="text-slate-500 text-sm">
                {unreadCount > 0
                  ? `Có ${unreadCount} thông báo chưa đọc`
                  : 'Tất cả thông báo đã được đọc'}
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Quay lại
            </Button>
            {isMuted ? (
              <Button
                variant="outline"
                onClick={() => applyMute(null)}
                title={`Đang tắt thông báo đến ${mutedUntil?.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
              >
                <BellOff className="w-4 h-4 mr-2" /> Bật lại
              </Button>
            ) : (
              <div className="inline-flex rounded-md border bg-white">
                <span className="px-2 py-1.5 text-xs text-slate-500 self-center">Tạm tắt:</span>
                {MUTE_PRESETS.map((p) => (
                  <Button
                    key={p.hours}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 rounded-none border-l first:border-l-0"
                    onClick={() => applyMute(p.hours)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            )}
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                onClick={() => {
                  markAllReadMutation(undefined);
                  markAllAIRead();
                }}
              >
                <CheckCheck className="w-4 h-4 mr-2" /> Đọc tất cả
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="container mx-auto px-0">
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Sidebar filters */}
          <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 h-fit space-y-5">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">
                Bộ lọc
              </span>
            </div>

            {/* Status filter */}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Trạng thái
              </label>
              <div className="flex gap-2 mt-2">
                {[
                  { key: 'all', label: 'Tất cả' },
                  { key: 'unseen', label: 'Chưa đọc' },
                  { key: 'seen', label: 'Đã đọc' },
                ].map((opt) => (
                  <Button
                    key={opt.key}
                    variant={statusFilter === opt.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      setStatusFilter(opt.key as 'all' | 'unseen' | 'seen')
                    }
                    className="text-xs"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Type filter */}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Loại thông báo
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {TYPE_FILTER_OPTIONS.map((t) => (
                  <Button
                    key={t.key}
                    variant={typeFilter === t.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTypeFilter(t.key)}
                    className="text-xs"
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Tìm kiếm
              </label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nhập từ khóa..."
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Notification list */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-4">
            <div className="space-y-2">

              {/* ── AI Insights section ── */}
              {filteredAIInsights.map((insight) => {
                const colors = AI_ACTION_COLOR[insight.actionType] ?? AI_ACTION_COLOR.SHOW_BANNER;
                const label = AI_ACTION_LABEL[insight.actionType] ?? 'AI Insight';
                return (
                  <div
                    key={insight.id}
                    onClick={() => markAIRead(insight.id)}
                    className={`border rounded-xl p-4 flex items-start gap-4 transition-all duration-200 cursor-pointer hover:shadow-md ${
                      insight.isRead
                        ? 'bg-white border-slate-200'
                        : 'bg-blue-50/50 border-blue-200/60'
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors.bg}`}>
                      <Sparkles className={`h-5 w-5 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold text-base line-clamp-1 ${insight.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                          {insight.message}
                        </h3>
                        {!insight.isRead && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      {insight.evidence && (
                        <p className="text-slate-500 text-sm line-clamp-2">{insight.evidence}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${colors.bg} ${colors.text}`}>
                          {label}
                        </span>
                        <span className="text-xs text-slate-400">{formatDate(insight.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Divider between AI insights and regular notifications */}
              {filteredAIInsights.length > 0 && typeFilter === 'all' && computedNotifications.length > 0 && (
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Thông báo hệ thống</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>
              )}

              {/* Regular notifications — hidden when ai_insight filter is active */}
              {typeFilter !== 'ai_insight' && computedNotifications.length === 0 && filteredAIInsights.length === 0 && (
                <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">
                    Không có thông báo phù hợp
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    Thử thay đổi bộ lọc để xem thêm
                  </p>
                </div>
              )}

              {typeFilter === 'ai_insight' && filteredAIInsights.length === 0 && (
                <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-blue-300" />
                  </div>
                  <p className="text-slate-500 font-medium">Chưa có AI Insight nào</p>
                  <p className="text-slate-400 text-sm mt-1">AI sẽ gửi gợi ý khi phân tích kết quả học tập của bạn</p>
                </div>
              )}

              {typeFilter !== 'ai_insight' && computedNotifications.map((n) => {
                const typeConfig = getNotificationTypeConfig(n.type);
                const IconComponent = typeConfig.icon;
                const link = getNotificationLink(n);

                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`border rounded-xl p-4 flex items-start gap-4 transition-all duration-200 group ${
                      link
                        ? 'cursor-pointer hover:shadow-md hover:border-slate-300'
                        : 'cursor-default'
                    } ${n.isRead ? 'bg-white border-slate-200' : 'bg-primary/5 border-primary/20'}`}
                  >
                    {/* Icon */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        n.isRead
                          ? typeConfig.bgColor
                          : typeConfig.bgColorUnread
                      }`}
                    >
                      <IconComponent className={`h-5 w-5 ${typeConfig.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`font-semibold text-base line-clamp-1 ${
                            n.isRead ? 'text-slate-700' : 'text-slate-900'
                          }`}
                        >
                          {n.title}
                        </h3>
                        {!n.isRead && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-slate-500 text-sm line-clamp-2">
                        {n.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${typeConfig.bgColor} ${typeConfig.color}`}
                        >
                          {typeConfig.label}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDate(n.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!n.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            markReadMutation(n.id);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Đã đọc
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Lưu trữ"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-500 hover:text-slate-700"
                        disabled={isArchiving}
                        onClick={(e) => {
                          e.stopPropagation();
                          archiveMutation(n.id);
                        }}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}