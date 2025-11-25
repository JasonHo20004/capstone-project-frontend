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
} from 'lucide-react';

const sidebarItems = [
  { title: 'Dashboard', href: '/seller', icon: LayoutDashboard },
  { title: 'Khoá học của tôi', href: '/seller/courses', icon: BookOpen },
  { title: 'Phí hằng tháng', href: '/seller/fees', icon: CreditCard },
  { title: 'Người học', href: '/seller/learners', icon: Users },
  { title: 'Bình luận', href: '/seller/comments', icon: MessageSquare },
  { title: 'Hồ sơ', href: '/seller/profile', icon: User },
];

export default function SellerSidebar() {
  const location = useLocation();
  const queryClient = useQueryClient();

  const handleNavClick = () => {
    // Invalidate all queries to refetch data when navigating
    queryClient.invalidateQueries();
  };

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center border-b px-6">
        <h2 className="text-lg font-semibold">Seller Panel</h2>
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