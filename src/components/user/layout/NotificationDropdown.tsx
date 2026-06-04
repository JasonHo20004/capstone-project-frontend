import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  Bell, MessageSquare, BookOpen, UserPlus, RefreshCw, Reply,
  CheckCircle2, XCircle, ClipboardCheck, Wallet, AlertCircle, ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useMarkNotificationAsRead,
  useNotificationRealtime,
  useNotificationStats,
  useNotifications,
} from '@/hooks/api';
import { Link, useNavigate } from 'react-router-dom';
import type { InAppNotification } from '@/domain';

interface NotificationDropdownProps {
  userId: string | undefined;
  triggerClassName?: string;
  onNavigate?: () => void;
}

// ============== Notification type config ==============

interface NotificationTypeConfig {
  icon: React.ElementType;
  labelKey: string;
  color: string;
  bgColor: string;
  bgColorUnread: string;
}

// Type keys are case-sensitive and must match the `type` column written by
// notification-service handlers. Some are lowercase (legacy: course_comment),
// some uppercase (newer: COURSE_APPROVED). Both forms are registered below;
// getNotificationTypeConfig also tolerates whichever the backend sends.
const NOTIFICATION_TYPE_MAP: Record<string, NotificationTypeConfig> = {
  course_comment: {
    icon: MessageSquare,
    labelKey: 'course_comment',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    bgColorUnread: 'bg-blue-100',
  },
  comment_reply: {
    icon: Reply,
    labelKey: 'comment_reply',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    bgColorUnread: 'bg-violet-100',
  },
  course_enrollment: {
    icon: UserPlus,
    labelKey: 'course_enrollment',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    bgColorUnread: 'bg-emerald-100',
  },
  course_update: {
    icon: RefreshCw,
    labelKey: 'course_update',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    bgColorUnread: 'bg-amber-100',
  },
  // ── Learning reminder (emitted by course-service inactivity cron) ────────
  COURSE_PROGRESS_REMINDER: {
    icon: BookOpen,
    labelKey: 'COURSE_PROGRESS_REMINDER',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    bgColorUnread: 'bg-indigo-100',
  },
  // ── Seller-specific events (emitted by course-service) ──────────────────
  COURSE_APPROVED: {
    icon: CheckCircle2,
    labelKey: 'COURSE_APPROVED',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    bgColorUnread: 'bg-emerald-100',
  },
  COURSE_REJECTED: {
    icon: XCircle,
    labelKey: 'COURSE_REJECTED',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    bgColorUnread: 'bg-red-100',
  },
  COURSE_SUBMITTED: {
    icon: ClipboardCheck,
    labelKey: 'COURSE_SUBMITTED',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    bgColorUnread: 'bg-amber-100',
  },
  // ── Wallet / withdrawal events (emitted by payment-service) ─────────────
  WITHDRAWAL_APPROVED: {
    icon: Wallet,
    labelKey: 'WITHDRAWAL_APPROVED',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    bgColorUnread: 'bg-emerald-100',
  },
  WITHDRAWAL_REJECTED: {
    icon: AlertCircle,
    labelKey: 'WITHDRAWAL_REJECTED',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    bgColorUnread: 'bg-red-100',
  },
  // ── Moderation alert (admin-facing) ─────────────────────────────────────
  comment_report: {
    icon: ShieldAlert,
    labelKey: 'comment_report',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    bgColorUnread: 'bg-red-100',
  },
};

const DEFAULT_TYPE_CONFIG: NotificationTypeConfig = {
  icon: Bell,
  labelKey: 'default',
  color: 'text-slate-600',
  bgColor: 'bg-slate-100',
  bgColorUnread: 'bg-slate-200',
};

export function getNotificationTypeConfig(type: string): NotificationTypeConfig {
  // Try exact match first; fall back to uppercase for legacy lowercase keys.
  return (
    NOTIFICATION_TYPE_MAP[type] ||
    NOTIFICATION_TYPE_MAP[type?.toUpperCase()] ||
    NOTIFICATION_TYPE_MAP[type?.toLowerCase()] ||
    DEFAULT_TYPE_CONFIG
  );
}

// ============== Navigation helper ==============

export function getNotificationLink(notification: InAppNotification): string | null {
  const meta = notification.metadata as Record<string, unknown> | null;
  const courseId = notification.courseId || (meta?.courseId as string);
  // Normalise so a string like "Course_Approved" still matches the cases below.
  const type = String(notification.type ?? '').toUpperCase();

  switch (type) {
    case 'COURSE_COMMENT':
    case 'COMMENT_REPLY':
      if (courseId && meta?.lessonId) {
        return `/courses/${courseId}/lessons/${meta.lessonId as string}`;
      }
      return courseId ? `/courses/${courseId}` : null;
    case 'COURSE_ENROLLMENT':
      return courseId ? `/seller/courses/${courseId}` : '/seller/learners';
    case 'COURSE_UPDATE':
      return courseId ? `/courses/${courseId}` : null;
    case 'COURSE_PROGRESS_REMINDER':
      // Learner nudge — send them straight to the course to resume.
      return courseId ? `/courses/${courseId}` : null;
    case 'COURSE_APPROVED':
    case 'COURSE_REJECTED':
    case 'COURSE_SUBMITTED':
      // Seller-facing detail page shows the rejection reason banner +
      // approval status — exactly where the seller wants to go on click.
      return courseId ? `/seller/courses/${courseId}` : '/seller/courses';
    case 'WITHDRAWAL_APPROVED':
    case 'WITHDRAWAL_REJECTED':
      // Finance page hosts the withdrawal history tab — anchor that tab.
      return '/seller/earnings?tab=withdrawals';
    case 'COMMENT_REPORT':
      return '/admin/moderation';
    default:
      return null;
  }
}

// ============== Timestamp formatter ==============

function formatTimestamp(dateStr: string, t: TFunction, dateLocale: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t('common:relativeTime.justNow');
  if (diffMins < 60) return t('common:relativeTime.minutesAgo', { count: diffMins });
  if (diffHours < 24) return t('common:relativeTime.hoursAgo', { count: diffHours });
  if (diffDays < 7) return t('common:relativeTime.daysAgo', { count: diffDays });
  return d.toLocaleDateString(dateLocale);
}

// ============== Component ==============

export function NotificationDropdown({
  userId,
  triggerClassName,
  onNavigate,
}: NotificationDropdownProps) {
  const { t, i18n } = useTranslation(['account', 'common']);
  const dateLocale = i18n.language?.startsWith('vi') ? 'vi-VN' : 'en-GB';
  const navigate = useNavigate();
  const { data: stats } = useNotificationStats();
  const { data: notificationsResponse } = useNotifications({
    page: 1,
    limit: 10,
    unreadOnly: false,
    enabled: Boolean(userId),
  });
  const { mutate: markRead } = useMarkNotificationAsRead();

  useNotificationRealtime(userId);

  const notifications = useMemo(
    () => notificationsResponse?.notifications ?? [],
    [notificationsResponse],
  );
  const unreadCount = stats?.unread ?? 0;

  const handleNotificationClick = (n: InAppNotification) => {
    if (!n.isRead) {
      markRead(n.id);
    }
    const link = getNotificationLink(n);
    if (link) {
      navigate(link);
      onNavigate?.();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative h-10 w-10 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-200 cursor-pointer ${triggerClassName ?? ''}`}
          aria-label={t('account:notifications.dropdown.ariaLabel')}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-96 rounded-xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 p-0"
        sideOffset={8}
      >
        <DropdownMenuLabel className="px-4 py-3 font-semibold text-slate-900 flex items-center justify-between">
          <span>{t('account:notifications.dropdown.title')}</span>
          {unreadCount > 0 && (
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {t('account:notifications.dropdown.newBadge', { count: unreadCount })}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Bell className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm text-slate-500">{t('account:notifications.dropdown.empty')}</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((n) => {
              const typeConfig = getNotificationTypeConfig(n.type);
              const IconComponent = typeConfig.icon;
              const link = getNotificationLink(n);
              const typeLabel = t(`account:notifications.dropdownTypes.${typeConfig.labelKey}`, {
                defaultValue: t('account:notifications.dropdownTypes.default'),
              });

              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`px-4 py-3 border-b border-slate-100 last:border-b-0 transition-all duration-200 ${
                    link ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'
                  } ${n.isRead ? 'bg-white' : 'bg-primary/5'}`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        n.isRead ? typeConfig.bgColor : typeConfig.bgColorUnread
                      }`}
                    >
                      <IconComponent
                        className={`h-4 w-4 ${typeConfig.color}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium line-clamp-1 ${n.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${typeConfig.bgColor} ${typeConfig.color}`}>
                          {typeLabel}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatTimestamp(n.createdAt, t, dateLocale)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <DropdownMenuSeparator />
        <div className="p-2">
          <Link
            to="/notifications"
            onClick={onNavigate}
            className="block text-center text-sm font-medium text-primary hover:underline py-2 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer"
          >
            {t('account:notifications.dropdown.viewAll')}
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
