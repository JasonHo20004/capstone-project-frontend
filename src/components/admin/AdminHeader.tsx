import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Search,
  Home,
  User,
  LogOut,
  CheckCheck,
  Menu,
  LayoutDashboard,
  Users as UsersIcon,
  BookOpen,
  CreditCard,
  ClipboardList,
  UserCheck,
  ShieldAlert,
  Landmark,
  Bell as BellIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
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
  type SearchScope = "users" | "courses" | "transactions" | "applications";
  const [searchScope, setSearchScope] = useState<SearchScope>("users");
  const [paletteOpen, setPaletteOpen] = useState(false);

  // ⌘K / Ctrl+K opens the command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const goto = (path: string) => {
    setPaletteOpen(false);
    navigate(path);
  };

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
    const q = encodeURIComponent(term);
    const routes: Record<SearchScope, string> = {
      users: `/admin/users?q=${q}`,
      courses: `/admin/courses?q=${q}`,
      transactions: `/admin/transactions?q=${q}`,
      applications: `/admin/applications?q=${q}`,
    };
    navigate(routes[searchScope]);
  };

  const scopeLabel: Record<SearchScope, string> = {
    users: "Người dùng",
    courses: "Khóa học",
    transactions: "Giao dịch",
    applications: "Đơn đăng ký",
  };

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead.mutate(notificationId);
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card/80 backdrop-blur-sm px-4 sm:px-6">
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
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full max-w-xl">
          <Select value={searchScope} onValueChange={(v) => setSearchScope(v as SearchScope)}>
            <SelectTrigger className="w-[150px] shrink-0" aria-label="Phạm vi tìm kiếm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="users">Người dùng</SelectItem>
              <SelectItem value="courses">Khóa học</SelectItem>
              <SelectItem value="transactions">Giao dịch</SelectItem>
              <SelectItem value="applications">Đơn đăng ký</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Tìm ${scopeLabel[searchScope].toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-16"
              aria-label={`Tìm kiếm ${scopeLabel[searchScope]}`}
            />
            <kbd className="hidden sm:inline-flex absolute right-2 top-1/2 -translate-y-1/2 h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 pointer-events-none">
              ⌘K
            </kbd>
          </div>
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

      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Gõ để điều hướng hoặc tìm kiếm..." />
        <CommandList>
          <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>
          <CommandGroup heading="Điều hướng">
            <CommandItem onSelect={() => goto("/admin")}>
              <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
            </CommandItem>
            <CommandItem onSelect={() => goto("/admin/users")}>
              <UsersIcon className="mr-2 h-4 w-4" /> Quản lý người dùng
            </CommandItem>
            <CommandItem onSelect={() => goto("/admin/courses")}>
              <BookOpen className="mr-2 h-4 w-4" /> Quản lý khóa học
            </CommandItem>
            <CommandItem onSelect={() => goto("/admin/exams")}>
              <ClipboardList className="mr-2 h-4 w-4" /> Quản lý bài thi
            </CommandItem>
            <CommandItem onSelect={() => goto("/admin/transactions")}>
              <CreditCard className="mr-2 h-4 w-4" /> Giao dịch
            </CommandItem>
            <CommandItem onSelect={() => goto("/admin/withdrawals")}>
              <Landmark className="mr-2 h-4 w-4" /> Rút tiền (Payout)
            </CommandItem>
            <CommandItem onSelect={() => goto("/admin/applications")}>
              <UserCheck className="mr-2 h-4 w-4" /> Đơn đăng ký
            </CommandItem>
            <CommandItem onSelect={() => goto("/admin/moderation")}>
              <ShieldAlert className="mr-2 h-4 w-4" /> Kiểm duyệt bình luận
            </CommandItem>
            <CommandItem onSelect={() => goto("/admin/notifications")}>
              <BellIcon className="mr-2 h-4 w-4" /> Thông báo hệ thống
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Hành động nhanh">
            <CommandItem onSelect={() => goto("/admin/applications?status=PENDING")}>
              <UserCheck className="mr-2 h-4 w-4" /> Xem đơn đăng ký chờ duyệt
              <CommandShortcut>PENDING</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => goto("/admin/withdrawals")}>
              <Landmark className="mr-2 h-4 w-4" /> Xem yêu cầu rút tiền
            </CommandItem>
            <CommandItem onSelect={() => goto("/")}>
              <Home className="mr-2 h-4 w-4" /> Về trang chủ người dùng
            </CommandItem>
            <CommandItem onSelect={() => { setPaletteOpen(false); logout(); }}>
              <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
