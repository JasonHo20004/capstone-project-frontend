import { Link, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Shield,
  FileText,
  Receipt,
} from 'lucide-react';
import {
  applicationManagementService,
  moderationService,
  refundService,
} from '@/lib/api/services/admin';
import { useAdminWithdrawalSummary } from '@/hooks/api';

type PendingKey = 'applications' | 'withdrawals' | 'moderation' | 'refunds';

const sidebarItems: {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  pendingKey?: PendingKey;
}[] = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { title: 'Quản lý người dùng', href: '/admin/users', icon: Users },
  { title: 'Quản lý khóa học', href: '/admin/courses', icon: BookOpen },
  { title: 'Quản lý bài thi', href: '/admin/exams', icon: ClipboardList },
  { title: 'Quản lý Dictation', href: '/admin/dictation', icon: Headphones },
  { title: 'Giao dịch', href: '/admin/transactions', icon: CreditCard },
  { title: 'Hoa hồng', href: '/admin/commission', icon: Percent },
  { title: 'Rút tiền (Payout)', href: '/admin/withdrawals', icon: Landmark, pendingKey: 'withdrawals' },
  { title: 'Hoàn tiền', href: '/admin/refunds', icon: Receipt, pendingKey: 'refunds' },
  { title: 'Đơn đăng ký', href: '/admin/applications', icon: UserCheck, pendingKey: 'applications' },
  { title: 'Kiểm duyệt bình luận', href: '/admin/moderation', icon: ShieldAlert, pendingKey: 'moderation' },
  { title: 'Nhật ký quản trị', href: '/admin/audit-logs', icon: FileText },
  { title: 'Thông báo hệ thống', href: '/admin/notifications', icon: Bell },
  { title: 'Quản lý Tag', href: '/admin/tags', icon: Tag },
  { title: 'Gói người dùng', href: '/admin/user-plans', icon: Crown },
];

interface AdminSidebarProps {
  /**
   * Called when a nav link is clicked. Used by the mobile Sheet to auto-close.
   * On desktop the sidebar stays mounted (collapsed-on-hover).
   */
  onNavigate?: () => void;
  /**
   * Force the expanded layout (no collapse-on-hover). The mobile Sheet sets
   * this true so labels are always visible inside the drawer.
   */
  forceExpanded?: boolean;
}

function usePendingCounts(): Record<PendingKey, number> {
  // 60s polling, paused when tab hidden — keeps badges fresh without bloat.
  const applicationsQ = useQuery({
    queryKey: ['sidebarPendingApplications'],
    queryFn: () => applicationManagementService.getApplications({ status: 'PENDING' }),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  });

  const moderationQ = useQuery({
    queryKey: ['sidebarModerationSummary'],
    queryFn: () => moderationService.getSummary(),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  });

  const refundsQ = useQuery({
    queryKey: ['sidebarPendingRefunds'],
    queryFn: () => refundService.listAdmin({ status: 'PENDING', page: 1, limit: 1 }),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  });

  const withdrawalSummary = useAdminWithdrawalSummary();

  return {
    applications: applicationsQ.data?.data?.length ?? 0,
    withdrawals: withdrawalSummary.data?.pendingCount ?? 0,
    moderation: moderationQ.data?.data?.pending ?? 0,
    refunds: refundsQ.data?.pagination?.total ?? 0,
  };
}

export default function AdminSidebar({ onNavigate, forceExpanded = false }: AdminSidebarProps) {
  const location = useLocation();
  const pending = usePendingCounts();
  const queryClient = useQueryClient();

  // Mirror SellerSidebar: clicking a link refreshes any cached queries so the
  // landed page starts with fresh data.
  const handleNavClick = () => {
    queryClient.invalidateQueries();
    onNavigate?.();
  };

  return (
    <aside
      className={cn(
        'group flex h-full flex-col bg-card border-r border-border/60',
        'overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] hover:shadow-[4px_0_24px_rgba(0,0,0,0.06)]',
        forceExpanded
          ? 'w-64'
          : 'w-20 hover:w-64 transition-[width] duration-300 ease-soft',
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-border/60 px-5 flex-shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div
          className={cn(
            'overflow-hidden whitespace-nowrap transition-all duration-300',
            forceExpanded
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0',
          )}
        >
          <h2 className="font-semibold font-display tracking-tight leading-tight">Admin Panel</h2>
          <p className="text-[10px] text-muted-foreground leading-tight">Quản trị hệ thống</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3 overflow-y-auto overflow-x-hidden">
        {sidebarItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.href
            : location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
          const count = item.pendingKey ? pending[item.pendingKey] : 0;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={handleNavClick}
              title={item.title}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <span className="relative shrink-0">
                <item.icon
                  className={cn(
                    'h-5 w-5',
                    isActive ? 'text-primary-foreground' : '',
                  )}
                />
                {/* Dot indicator visible while sidebar is collapsed */}
                {count > 0 && !forceExpanded && (
                  <span
                    className={cn(
                      'absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full ring-2 ring-card',
                      'bg-red-500 group-hover:opacity-0 transition-opacity',
                    )}
                    aria-hidden="true"
                  />
                )}
              </span>
              <span
                className={cn(
                  'flex-1 whitespace-nowrap transition-all duration-300',
                  forceExpanded
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0',
                )}
              >
                {item.title}
              </span>
              {/* Full badge with count, visible when sidebar is expanded */}
              {count > 0 && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold min-w-[20px] transition-opacity duration-300',
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-red-500 text-white',
                    forceExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                  )}
                  aria-label={`${count} mục chờ xử lý`}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
