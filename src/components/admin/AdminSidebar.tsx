import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard,
  FileText,
  Bell,
  Settings,
  UserCheck,
  AlertTriangle,
  Package,
  ScrollText,
  Tag
} from 'lucide-react';

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Quản lý người dùng',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Quản lý khóa học',
    href: '/admin/courses',
    icon: BookOpen,
  },
  // {
  //   title: 'Doanh thu',
  //   href: '/admin/revenue',
  //   icon: FileText,
  // },
  {
    title: 'Giao dịch',
    href: '/admin/transactions',
    icon: CreditCard,
  },
  {
    title: 'Đơn đăng ký',
    href: '/admin/applications',
    icon: UserCheck,
  },
  {
    title: 'Quản lý Tag',
    href: '/admin/tags',
    icon: Tag,
  },
  // {
  //   title: 'Báo cáo vi phạm',
  //   href: '/admin/reports',
  //   icon: AlertTriangle,
  // },
  // {
  //   title: 'Thông báo',
  //   href: '/admin/notifications',
  //   icon: Bell,
  // },
  // {
  //   title: 'Gói đăng ký',
  //   href: '/admin/subscription-plans',
  //   icon: Package,
  // },
  // {
  //   title: 'Hợp đồng',
  //   href: '/admin/subscription-contracts',
  //   icon: ScrollText,
  // },
  // {
  //   title: 'Cài đặt',
  //   href: '/admin/settings',
  //   icon: Settings,
  // },
];

export default function AdminSidebar() {
  const location = useLocation();
  const queryClient = useQueryClient();

  const handleNavClick = () => {
    // Invalidate all queries to refetch data when navigating
    queryClient.invalidateQueries();
  };

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center border-b px-6">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {sidebarItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={handleNavClick}
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