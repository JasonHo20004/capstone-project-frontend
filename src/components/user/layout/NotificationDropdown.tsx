import { useMemo } from 'react';
import { Bell, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useNotificationRealtime,
  useNotificationStats,
  useNotifications,
} from '@/hooks/api';
import { Link } from 'react-router-dom';

interface NotificationDropdownProps {
  userId: string | undefined;
  triggerClassName?: string;
  onNavigate?: () => void;
}

function formatTimestamp(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return d.toLocaleDateString('vi-VN');
}

export function NotificationDropdown({
  userId,
  triggerClassName,
  onNavigate,
}: NotificationDropdownProps) {
  const { data: stats } = useNotificationStats(userId);
  const { data: notificationsResponse } = useNotifications({
    userId,
    page: 1,
    limit: 10,
    unreadOnly: false,
    enabled: Boolean(userId),
  });

  useNotificationRealtime(userId);

  const notifications = useMemo(
    () => notificationsResponse?.notifications ?? [],
    [notificationsResponse],
  );
  const unreadCount = stats?.unread ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative h-10 w-10 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-200 cursor-pointer ${triggerClassName ?? ''}`}
          aria-label="Thông báo"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 rounded-xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/50 p-0"
        sideOffset={8}
      >
        <DropdownMenuLabel className="px-4 py-3 font-semibold text-slate-900">
          Thông báo
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageSquare className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">Không có thông báo nào</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b border-slate-100 last:border-b-0 transition-colors cursor-default ${
                  n.isRead ? 'bg-white' : 'bg-primary/5'
                }`}
              >
                <div className="flex gap-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      n.isRead ? 'bg-slate-100' : 'bg-primary/10'
                    }`}
                  >
                    <MessageSquare
                      className={`h-4 w-4 ${n.isRead ? 'text-slate-500' : 'text-primary'}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 line-clamp-1">{n.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.content}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {formatTimestamp(n.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <DropdownMenuSeparator />
        <div className="p-2">
          <Link
            to="/notifications"
            onClick={onNavigate}
            className="block text-center text-sm font-medium text-primary hover:underline py-2 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer"
          >
            Xem tất cả
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
