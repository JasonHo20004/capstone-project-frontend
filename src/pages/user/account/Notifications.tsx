import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Bell, BookmarkCheck, Eye, Filter, Search, CheckCheck, Sparkles, Bookmark, BellOff, Inbox, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/hooks/api/use-user';
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotificationRealtime,
  useNotifications,
  useArchiveNotification,
  useUnarchiveNotification,
} from '@/hooks/api';
import type { InAppNotification } from '@/domain';
import {
  getNotificationTypeConfig,
  getNotificationLink,
} from '@/components/user/layout/NotificationDropdown';
import { useAIInsights, type AIInsight } from '@/hooks/use-ai-insights';

// Mute control persists across reloads via localStorage. Pure UX —
// hides the unread highlight + bell pulse until the chosen deadline.
const MUTE_STORAGE_KEY = 'notifications.mutedUntil';

const TYPE_FILTER_KEYS = [
  'all',
  'ai_insight',
  'course_comment',
  'comment_reply',
  'course_enrollment',
  'course_update',
  // Seller-specific events emitted by course-service / payment-service.
  // Keys are uppercase to match what handlers write (see NotificationDropdown).
  'COURSE_APPROVED',
  'COURSE_REJECTED',
  'COURSE_SUBMITTED',
  'WITHDRAWAL_APPROVED',
  'WITHDRAWAL_REJECTED',
] as const;

const MUTE_PRESETS: Array<{ key: string; hours: number }> = [
  { key: '1h', hours: 1 },
  { key: '4h', hours: 4 },
  { key: 'endOfDay', hours: 12 },
];

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
  const { t, i18n } = useTranslation('account');
  const dateLocale = i18n.language?.startsWith('vi') ? 'vi-VN' : 'en-GB';

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleString(dateLocale, {
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

  const formatTime = (date: Date) =>
    date.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unseen' | 'seen'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [view, setView] = useState<'inbox' | 'saved'>('inbox');

  const { data } = useNotifications({
    page: 1,
    limit: 50,
    unreadOnly: false,
    isArchived: view === 'saved',
    enabled: Boolean(userId),
  });

  const notificationsForUser: InAppNotification[] = useMemo(
    () => data?.notifications ?? [],
    [data],
  );

  const { mutate: markReadMutation } = useMarkNotificationAsRead();
  const { mutate: markAllReadMutation } = useMarkAllNotificationsAsRead();
  const { mutate: archiveMutation, isPending: isArchiving } = useArchiveNotification();
  const { mutate: unarchiveMutation, isPending: isUnarchiving } = useUnarchiveNotification();

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
      toast.success(t('notifications.mute.toastUnmuted'));
      return;
    }
    const until = new Date(Date.now() + hours * 60 * 60 * 1000);
    localStorage.setItem(MUTE_STORAGE_KEY, until.toISOString());
    setMutedUntil(until);
    toast.success(t('notifications.mute.toastMuted', { time: formatTime(until) }));
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
                {t('notifications.header.title')}
              </h1>
              <p className="text-slate-500 text-sm">
                {unreadCount > 0
                  ? t('notifications.header.unreadCount', { count: unreadCount })
                  : t('notifications.header.allRead')}
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Button variant="outline" onClick={() => navigate(-1)}>
              {t('notifications.header.back')}
            </Button>
            {isMuted ? (
              <Button
                variant="outline"
                onClick={() => applyMute(null)}
                title={t('notifications.header.mutedTitle', {
                  time: mutedUntil ? formatTime(mutedUntil) : '',
                })}
              >
                <BellOff className="w-4 h-4 mr-2" /> {t('notifications.header.unmute')}
              </Button>
            ) : (
              <div className="inline-flex rounded-md border bg-white">
                <span className="px-2 py-1.5 text-xs text-slate-500 self-center">
                  {t('notifications.header.muteLabel')}
                </span>
                {MUTE_PRESETS.map((p) => (
                  <Button
                    key={p.key}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 rounded-none border-l first:border-l-0"
                    onClick={() => applyMute(p.hours)}
                  >
                    {t(`notifications.mute.presets.${p.key}`)}
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
                <CheckCheck className="w-4 h-4 mr-2" /> {t('notifications.header.markAllRead')}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* View tabs: inbox vs saved (lưu trữ) */}
      <section className="container mx-auto px-0">
        <div
          role="tablist"
          aria-label={t('notifications.view.ariaLabel')}
          className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === 'inbox'}
            onClick={() => setView('inbox')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              view === 'inbox'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-4 h-4" /> {t('notifications.view.inbox')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'saved'}
            onClick={() => setView('saved')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              view === 'saved'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" /> {t('notifications.view.saved')}
          </button>
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
                {t('notifications.filtersPanel.title')}
              </span>
            </div>

            {/* Status filter */}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {t('notifications.filtersPanel.status')}
              </label>
              <div className="flex gap-2 mt-2">
                {(['all', 'unseen', 'seen'] as const).map((key) => (
                  <Button
                    key={key}
                    variant={statusFilter === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(key)}
                    className="text-xs"
                  >
                    {t(`notifications.status.${key}`)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Type filter */}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {t('notifications.filtersPanel.type')}
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {TYPE_FILTER_KEYS.map((key) => (
                  <Button
                    key={key}
                    variant={typeFilter === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTypeFilter(key)}
                    className="text-xs"
                  >
                    {t(`notifications.types.${key}`)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {t('notifications.filtersPanel.search')}
              </label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('notifications.filtersPanel.searchPlaceholder')}
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
                const label = t(`notifications.aiActions.${insight.actionType}`, {
                  defaultValue: t('notifications.aiActions.default'),
                });
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
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                    {t('notifications.systemDivider')}
                  </span>
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
                    {t('notifications.emptyRegular.title')}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    {t('notifications.emptyRegular.hint')}
                  </p>
                </div>
              )}

              {typeFilter === 'ai_insight' && filteredAIInsights.length === 0 && (
                <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-blue-300" />
                  </div>
                  <p className="text-slate-500 font-medium">{t('notifications.emptyAi.title')}</p>
                  <p className="text-slate-400 text-sm mt-1">{t('notifications.emptyAi.hint')}</p>
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
                          <Eye className="w-3.5 h-3.5 mr-1" /> {t('notifications.actions.markRead')}
                        </Button>
                      )}
                      {view === 'inbox' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          title={t('notifications.actions.archiveTitle')}
                          aria-label={t('notifications.actions.archiveAria')}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-500 hover:text-primary"
                          disabled={isArchiving}
                          onClick={(e) => {
                            e.stopPropagation();
                            archiveMutation(n.id, {
                              onSuccess: () => toast.success(t('notifications.toasts.archiveSuccess')),
                              onError: () => toast.error(t('notifications.toasts.archiveError')),
                            });
                          }}
                        >
                          <Bookmark className="w-3.5 h-3.5 mr-1" /> {t('notifications.actions.archive')}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          title={t('notifications.actions.unarchiveTitle')}
                          aria-label={t('notifications.actions.unarchiveAria')}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-500 hover:text-primary"
                          disabled={isUnarchiving}
                          onClick={(e) => {
                            e.stopPropagation();
                            unarchiveMutation(n.id, {
                              onSuccess: () => toast.success(t('notifications.toasts.unarchiveSuccess')),
                              onError: () => toast.error(t('notifications.toasts.unarchiveError')),
                            });
                          }}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" /> {t('notifications.actions.unarchive')}
                        </Button>
                      )}
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