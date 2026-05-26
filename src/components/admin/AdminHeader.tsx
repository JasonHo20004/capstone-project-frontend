import { useMemo, useState } from "react";
import { Bell, Search, Home, User, LogOut, CheckCheck, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  useNotificationRealtime,
  useNotificationStats,
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "@/hooks/api";
import { useUser } from "@/hooks/api/use-user";
import { useAuth } from "@/hooks/api/use-auth";
import { Link, useNavigate } from "react-router-dom";

interface AdminHeaderProps {
  onOpenSidebar?: () => void;
}

export default function AdminHeader({ onOpenSidebar }: AdminHeaderProps) {
  const navigate = useNavigate();
  const { user } = useUser();
  const { logout, isLoggingOut } = useAuth();
  const userId = user?.id;
  const [searchTerm, setSearchTerm] = useState("");

  const { data: stats } = useNotificationStats();
  const { data: notificationsResponse } = useNotifications({
    page: 1,
    limit: 5,
    unreadOnly: false,
    enabled: Boolean(userId),
  });
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  useNotificationRealtime(userId);

  const latestNotifications = useMemo(
    () => notificationsResponse?.notifications ?? [],
    [notificationsResponse]
  );

  const unreadCount = stats?.unread ?? 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;
    navigate(`/admin/users?q=${encodeURIComponent(term)}`);
  };

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead.mutate(notificationId);
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-4 flex-1">
        {onOpenSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Mở menu"
            onClick={onOpenSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm người dùng theo tên / email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label="Tìm kiếm người dùng"
          />
        </form>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() => navigate("/")}
        >
          <Home className="mr-2 h-4 w-4" />
          Về trang chủ
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Thông báo"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-h-4 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="px-0 py-0">Thông báo</DropdownMenuLabel>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => markAllAsRead.mutate()}
                  disabled={markAllAsRead.isPending}
                >
                  <CheckCheck className="mr-1 h-3 w-3" />
                  Đánh dấu tất cả
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            {latestNotifications.length === 0 ? (
              <div className="px-3 py-6 text-sm text-muted-foreground text-center">
                Không có thông báo nào
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {latestNotifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleNotificationClick(n.id, n.isRead)}
                    className={`block w-full text-left px-3 py-2 text-sm border-b last:border-b-0 hover:bg-accent transition-colors ${
                      n.isRead ? "bg-background" : "bg-primary/5"
                    }`}
                  >
                    <div className="font-medium line-clamp-1">{n.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {n.content}
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </button>
                ))}
              </div>
            )}
            <DropdownMenuSeparator />
            <div className="px-3 py-2 text-xs text-right">
              <Link
                to="/admin/notifications"
                className="text-primary hover:underline"
              >
                Xem tất cả thông báo →
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <UserAvatar src={user?.profilePicture} name={user?.fullName} className="h-8 w-8" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.fullName || "Quản trị viên"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || ""}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Hồ sơ</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => logout()}
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
