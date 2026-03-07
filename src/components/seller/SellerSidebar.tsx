import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  BookOpen,
  CreditCard,
  Users,
  MessageSquare,
  User,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';

const sidebarItems = [
  { title: 'Tổng quan', href: '/seller', icon: LayoutDashboard },
  { title: 'Khoá học của tôi', href: '/seller/courses', icon: BookOpen },
  { title: 'Phí hằng tháng', href: '/seller/fees', icon: CreditCard },
  { title: 'Người học', href: '/seller/learners', icon: Users },
  { title: 'Bình luận', href: '/seller/comments', icon: MessageSquare },
  { title: 'Hồ sơ', href: '/seller/profile', icon: User },
] as const;

export default function SellerSidebar() {
  const location = useLocation();
  const queryClient = useQueryClient();

  const handleNavClick = () => {
    queryClient.invalidateQueries();
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold font-display tracking-tight">Giảng viên</h2>
          <p className="text-[10px] text-muted-foreground">Quản lý khoá học</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 p-4">
        {sidebarItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary-foreground' : '')} />
              <span className="flex-1">{item.title}</span>
              {isActive && <ChevronRight className="h-4 w-4 shrink-0 opacity-80" />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
