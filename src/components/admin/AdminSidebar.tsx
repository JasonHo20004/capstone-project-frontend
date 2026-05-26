import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard,
  UserCheck,
  Tag,
  ClipboardList,
  Headphones,
  Crown,
  Percent,
  Landmark,
  ShieldAlert,
  Bell,
} from 'lucide-react';

const sidebarItems = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { title: 'Quản lý người dùng', href: '/admin/users', icon: Users },
  { title: 'Quản lý khóa học', href: '/admin/courses', icon: BookOpen },
  { title: 'Quản lý bài thi', href: '/admin/exams', icon: ClipboardList },
  { title: 'Quản lý Dictation', href: '/admin/dictation', icon: Headphones },
  { title: 'Giao dịch', href: '/admin/transactions', icon: CreditCard },
  { title: 'Hoa hồng', href: '/admin/commission', icon: Percent },
  { title: 'Rút tiền (Payout)', href: '/admin/withdrawals', icon: Landmark },
  { title: 'Đơn đăng ký', href: '/admin/applications', icon: UserCheck },
  { title: 'Kiểm duyệt bình luận', href: '/admin/moderation', icon: ShieldAlert },
  { title: 'Thông báo hệ thống', href: '/admin/notifications', icon: Bell },
  { title: 'Quản lý Tag', href: '/admin/tags', icon: Tag },
  { title: 'Gói người dùng', href: '/admin/user-plans', icon: Crown },
];

interface AdminSidebarProps {
  onNavigate?: () => void;
}

export default function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center border-b px-6 shrink-0">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
      </div>
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.href
            : location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
