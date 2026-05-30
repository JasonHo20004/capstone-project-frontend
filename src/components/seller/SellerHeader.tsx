import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, Link } from 'react-router-dom';
import {
  useNotificationRealtime,
  useNotificationStats,
  useNotifications,
} from '@/hooks/api';
import { useUser } from '@/hooks/api/use-user';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ThemeToggle from '@/components/ThemeToggle';

export default function SellerHeader() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('seller');
  const { user } = useUser();
  const userId = user?.id;

  const { data: stats } = useNotificationStats();
  const { data: notificationsResponse } = useNotifications({
    page: 1,
    limit: 5,
    unreadOnly: false,
    enabled: Boolean(userId),
  });

  useNotificationRealtime(userId);

  const latestNotifications = useMemo(
    () => notificationsResponse?.notifications ?? [],
    [notificationsResponse],
  );

  const unreadCount = stats?.unread ?? 0;

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card/80 backdrop-blur-sm px-6">
      <div className="flex items-center gap-4">
        <div className="relative w-64 sm:w-80 md:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('header.searchPlaceholder')}
            className="pl-10 bg-muted/50 border-transparent focus-visible:ring-primary/20"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() => navigate('/')}
        >
          <Home className="mr-2 h-4 w-4" />
          {t('header.backHome')}
        </Button>
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={t('header.notifications')}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-h-4 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>{t('header.notifications')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {latestNotifications.length === 0 ? (
              <div className="px-3 py-6 text-sm text-muted-foreground text-center">
                {t('header.noNotifications')}
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {latestNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-3 py-2 text-sm border-b last:border-b-0 ${n.isRead ? 'bg-background' : 'bg-primary/5'}`}
                  >
                    <div className="font-medium line-clamp-1">{n.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {n.content}
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString(
                        i18n.language === 'vi' ? 'vi-VN' : 'en-GB',
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <DropdownMenuSeparator />
            <div className="px-3 py-2 text-xs text-right">
              <Link to="/notifications" className="text-primary hover:underline">
                {t('header.viewAll')}
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}