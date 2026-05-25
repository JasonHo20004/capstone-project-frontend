import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pencil,
  BookOpen,
  Users,
  Star,
  CalendarDays,
  Phone,
  Mail,
  Award,
  GraduationCap,
  Target,
  Wallet as WalletIcon,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { useProfile, useSellerOwnProfile } from '@/hooks/api/use-user';
import { useSellerDashboard } from '@/hooks/api';
import { ErrorMessage } from '@/components/ui/error-message';
import EditSellerProfileDialog from '@/components/seller/account/EditSellerProfileDialog';

/** Format an internal english-level enum into something human-readable. */
function formatEnglishLevel(raw?: string | null): string {
  if (!raw) return '—';
  if (raw.startsWith('IELTS_')) {
    const score = raw.replace('IELTS_', '').replace('_', '.');
    return `IELTS ${score}`;
  }
  if (raw.length <= 3) return raw.toUpperCase();
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase().replace(/_/g, ' ');
}

function formatDateVN(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN');
}

export default function SellerProfile() {
  const { user, isLoading: isLoadingUser, error: userError } = useProfile();
  const { data: dashboardStats, isLoading: isLoadingStats } = useSellerDashboard();
  const { data: sellerProfile, isLoading: isLoadingSeller } = useSellerOwnProfile();
  const [editOpen, setEditOpen] = useState(false);

  if (userError) {
    return <ErrorMessage message="Không thể tải thông tin hồ sơ. Vui lòng thử lại sau." />;
  }
  if (!isLoadingUser && !user) {
    return <ErrorMessage message="Không tìm thấy thông tin người dùng." />;
  }

  const financial = dashboardStats?.financial;
  const allowance = Number(financial?.allowance ?? 0);
  const pendingBalance = Number(financial?.pendingBalance ?? 0);
  const totalEarnings = Number(financial?.totalEarnings ?? 0);

  const isActive = sellerProfile?.isActive ?? true;
  const expertise = sellerProfile?.expertise ?? [];
  const certification = sellerProfile?.certification ?? [];

  const coursesCount = dashboardStats?.coursesCount ?? 0;
  const learnersCount = dashboardStats?.learnersCount ?? 0;
  const averageRating = dashboardStats?.averageRating ?? 0;
  const learningGoals = user?.learningGoals ?? [];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="overflow-hidden">
        <div className="h-28 sm:h-36 bg-gradient-to-br from-primary/80 via-primary to-violet-600" />
        <CardContent className="p-6 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <UserAvatar
                src={user?.profilePicture}
                name={user?.fullName ?? 'Seller'}
                className="h-24 w-24 ring-4 ring-background"
              />
              <div className="space-y-1 sm:pb-1">
                {isLoadingUser ? (
                  <>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl font-semibold">{user?.fullName || 'Seller'}</h1>
                      <Badge variant="secondary" className="bg-violet-100 text-violet-700 border-0">
                        <GraduationCap className="h-3 w-3 mr-1" /> Giảng viên
                      </Badge>
                      {isActive ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0">
                          <ShieldCheck className="h-3 w-3 mr-1" /> Đang hoạt động
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <ShieldAlert className="h-3 w-3 mr-1" /> Tạm khoá
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> {user?.email}
                    </p>
                    {user?.createdAt && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <CalendarDays className="h-3 w-3" /> Tham gia từ {formatDateVN(user.createdAt)}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="sm:pb-1">
              <Button
                onClick={() => setEditOpen(true)}
                variant="outline"
                disabled={isLoadingSeller || !sellerProfile}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Chỉnh sửa hồ sơ
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inactive banner */}
      {!isLoadingSeller && sellerProfile && !isActive && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">Tài khoản Seller đang bị tạm khoá</p>
              <p className="text-xs text-muted-foreground mt-1">
                Bạn vẫn xem được hồ sơ nhưng tạm thời không thể xuất bản khoá học hoặc rút tiền.
                Nếu cho rằng đây là nhầm lẫn, vui lòng liên hệ quản trị viên.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<BookOpen className="h-4 w-4 text-primary" />}
          label="Khoá học"
          value={isLoadingStats ? null : coursesCount.toLocaleString('vi-VN')}
          tint="primary"
        />
        <StatCard
          icon={<Users className="h-4 w-4 text-emerald-600" />}
          label="Người học"
          value={isLoadingStats ? null : learnersCount.toLocaleString('vi-VN')}
          tint="emerald"
        />
        <StatCard
          icon={<Star className="h-4 w-4 text-amber-600" />}
          label="Đánh giá TB"
          value={isLoadingStats ? null : averageRating > 0 ? averageRating.toFixed(1) : '—'}
          hint={averageRating > 0 ? '/ 5.0' : undefined}
          tint="amber"
        />
        <StatCard
          icon={<WalletIcon className="h-4 w-4 text-violet-600" />}
          label="Tổng doanh thu"
          value={isLoadingStats ? null : formatVND(totalEarnings)}
          tint="violet"
        />
      </div>

      {/* Wallet + Personal info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <WalletIcon className="h-4 w-4 text-primary" /> Ví giảng viên
            </CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link to="/seller/earnings" className="text-xs">
                Xem chi tiết
                <ArrowUpRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Số dư có thể rút</p>
              {isLoadingStats ? (
                <Skeleton className="h-7 w-32 mt-1" />
              ) : (
                <p className="text-2xl font-bold font-display text-emerald-700">
                  {formatVND(allowance)}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
              <div>
                <p className="text-[11px] text-muted-foreground">Đang chờ clearance</p>
                <p className="text-sm font-semibold text-amber-600">
                  {isLoadingStats ? '—' : formatVND(pendingBalance)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Tổng đã nhận</p>
                <p className="text-sm font-semibold">
                  {isLoadingStats ? '—' : formatVND(totalEarnings)}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">
              Nguồn thu nhập: chia hoa hồng từ học viên mua khoá học.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow
              icon={<Phone className="h-3.5 w-3.5" />}
              label="Số điện thoại"
              value={user?.phoneNumber || '—'}
            />
            <InfoRow
              icon={<CalendarDays className="h-3.5 w-3.5" />}
              label="Ngày sinh"
              value={formatDateVN(user?.dateOfBirth)}
            />
            <InfoRow
              icon={<GraduationCap className="h-3.5 w-3.5" />}
              label="Trình độ tiếng Anh"
              value={
                <Badge variant="outline" className="font-normal">
                  {formatEnglishLevel(user?.englishLevel)}
                </Badge>
              }
            />
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <Target className="h-3.5 w-3.5" /> Mục tiêu học tập
              </p>
              {learningGoals.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {learningGoals.map((g) => (
                    <Badge key={g} variant="secondary" className="font-normal">
                      {g}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">Chưa cập nhật</span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground pt-2 border-t">
              Cần sửa thông tin cá nhân?{' '}
              <Link to="/profile" className="text-primary hover:underline">
                Đi tới trang tài khoản
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expertise + Certifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-primary" /> Chuyên môn & Kỹ năng
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSeller ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-20" />
                ))}
              </div>
            ) : expertise.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {expertise.map((e) => (
                  <Badge key={e} variant="secondary" className="font-normal">
                    <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                    {e}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Chưa có chuyên môn. Bấm "Chỉnh sửa hồ sơ" để thêm.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" /> Chứng chỉ
              {certification.length > 0 && (
                <span className="text-xs text-muted-foreground font-normal">
                  ({certification.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSeller ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
                ))}
              </div>
            ) : certification.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {certification.map((url, idx) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Nhấn để xem ảnh gốc"
                    className="block aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-white hover:shadow-md hover:border-primary/40 transition-all"
                  >
                    <img
                      src={url}
                      alt={`Chứng chỉ ${idx + 1}`}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Chưa có chứng chỉ. Bấm "Chỉnh sửa hồ sơ" để tải lên.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {sellerProfile && (
        <EditSellerProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={{
            certification: sellerProfile.certification ?? [],
            expertise: sellerProfile.expertise ?? [],
          }}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

const tintMap = {
  primary: 'border-primary/20 bg-primary/5',
  emerald: 'border-emerald-500/20 bg-emerald-500/5',
  amber: 'border-amber-500/20 bg-amber-500/5',
  violet: 'border-violet-500/20 bg-violet-500/5',
} as const;

function StatCard({
  icon,
  label,
  value,
  hint,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  hint?: string;
  tint: keyof typeof tintMap;
}) {
  return (
    <Card className={tintMap[tint]}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div className="rounded-md bg-background/60 p-1.5">{icon}</div>
        </div>
        <div className="text-xl font-bold font-display leading-tight">
          {value === null ? <Skeleton className="h-7 w-16" /> : value}
          {hint && value !== null && (
            <span className="text-xs text-muted-foreground font-normal ml-1">{hint}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium truncate text-right">{value}</div>
    </div>
  );
}
