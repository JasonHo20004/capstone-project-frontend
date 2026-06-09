import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  MessageSquare,
  User,
  DollarSign,
  ClipboardList,
} from 'lucide-react';

const sidebarItems = [
  { labelKey: 'sidebar.nav.dashboard', href: '/seller', icon: LayoutDashboard },
  { labelKey: 'sidebar.nav.courses', href: '/seller/courses', icon: BookOpen },
  { labelKey: 'sidebar.nav.tests', href: '/seller/tests', icon: ClipboardList },
  { labelKey: 'sidebar.nav.earnings', href: '/seller/earnings', icon: DollarSign },
  { labelKey: 'sidebar.nav.monthlyReport', href: '/seller/monthly-report', icon: FileText },
  { labelKey: 'sidebar.nav.learners', href: '/seller/learners', icon: Users },
  { labelKey: 'sidebar.nav.comments', href: '/seller/comments', icon: MessageSquare },
  { labelKey: 'sidebar.nav.profile', href: '/seller/profile', icon: User },
] as const;

export default function SellerSidebar() {
  const location = useLocation();
  const { t } = useTranslation('seller');
  const queryClient = useQueryClient();

  const handleNavClick = () => {
    queryClient.invalidateQueries();
  };

  return (
    <aside
      className={cn(
        'group fixed inset-y-0 left-0 z-40 flex flex-col bg-card border-r border-border/60',
        'overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] hover:shadow-[4px_0_24px_rgba(0,0,0,0.06)]',
        'w-20 hover:w-64 transition-[width] duration-300 ease-soft',
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-border/60 px-5 flex-shrink-0">
        <img
          src="/logo.png"
          alt={t('sidebar.brand.title')}
          className="h-9 w-9 rounded-lg object-contain flex-shrink-0"
        />
        <div className="overflow-hidden whitespace-nowrap opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          <h2 className="font-semibold font-display tracking-tight leading-tight">{t('sidebar.brand.title')}</h2>
          <p className="text-[10px] text-muted-foreground leading-tight">{t('sidebar.brand.subtitle')}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3 overflow-y-auto overflow-x-hidden">
        {sidebarItems.map((item) => {
          const isActive = location.pathname === item.href;
          const label = t(item.labelKey);
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={handleNavClick}
              title={label}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 shrink-0',
                  isActive ? 'text-primary-foreground' : '',
                )}
              />
              <span className="whitespace-nowrap opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
