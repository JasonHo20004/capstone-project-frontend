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
  Wallet as WalletIcon,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  ImageIcon,
} from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { useProfile, useSellerOwnProfile } from '@/hooks/api/use-user';
import { useSellerDashboard } from '@/hooks/api';
import { ErrorMessage } from '@/components/ui/error-message';
import EditSellerProfileDialog from '@/components/seller/account/EditSellerProfileDialog';
import { useTranslation } from 'react-i18next';

function formatEnglishLevel(raw?: string | null): string {
  if (!raw) return '—';
  if (raw.startsWith('IELTS_')) {
    const score = raw.replace('IELTS_', '').replace('_', '.');
    return `IELTS ${score}`;
  }
  if (raw.length <= 3) return raw.toUpperCase();
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase().replace(/_/g, ' ');
}

function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(locale);
}

export default function SellerProfile() {
  const { t, i18n } = useTranslation('seller');
  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-GB';
  const { user, isLoading: isLoadingUser, error: userError } = useProfile();
  const { data: dashboardStats, isLoading: isLoadingStats } = useSellerDashboard();
  const { data: sellerProfile, isLoading: isLoadingSeller } = useSellerOwnProfile();
  const [editOpen, setEditOpen] = useState(false);

  if (userError) {
    return <ErrorMessage message={t('profile.loadError')} />;
  }
  if (!isLoadingUser && !user) {
    return <ErrorMessage message={t('profile.notFound')} />;
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

  return (
    <div className="space-y-6">
      {/* ─── Hero ───────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden border-border/40 shadow-[var(--shadow-md)]">
        <div className="relative h-32 sm:h-40 bg-hero-gradient">
          <div
            className="absolute inset-0 opacity-40 mix-blend-overlay"
            style={{
              background:
                'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.18) 0%, transparent 45%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.10) 0%, transparent 50%)',
            }}
          />
          <div className="absolute right-4 top-4">
            <Button
              onClick={() => setEditOpen(true)}
              size="sm"
              variant="secondary"
              disabled={isLoadingSeller || !sellerProfile}
              className="bg-white/90 hover:bg-white text-primary border-0 shadow-sm backdrop-blur"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              {t('profile.editProfile')}
            </Button>
          </div>
        </div>

        <CardContent className="p-6 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14">
            <UserAvatar
              src={user?.profilePicture}
              name={user?.fullName ?? t('profile.fallbackName')}
              className="h-28 w-28 ring-4 ring-white shadow-[var(--shadow-md)]"
            />
            <div className="flex-1 space-y-2 sm:pb-1">
              {isLoadingUser ? (
                <>
                  <Skeleton className="h-7 w-56" />
                  <Skeleton className="h-4 w-64" />
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    <h1 className="text-2xl font-bold font-display tracking-tight">
                      {user?.fullName || t('profile.fallbackName')}
                    </h1>
                    <Badge className="bg-primary/10 text-primary border-0 hover:bg-primary/15">
                      <GraduationCap className="h-3 w-3 mr-1" /> {t('profile.badges.instructor')}
                    </Badge>
                    {isActive ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-0 hover:bg-emerald-100">
                        <ShieldCheck className="h-3 w-3 mr-1" /> {t('profile.badges.active')}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <ShieldAlert className="h-3 w-3 mr-1" /> {t('profile.badges.suspended')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> {user?.email}
                    </span>
                    {user?.createdAt && (
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" /> {t('profile.joined', { date: formatDate(user.createdAt, dateLocale) })}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Inactive banner ────────────────────────────────────────────── */}
      {!isLoadingSeller && sellerProfile && !isActive && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">
                {t('profile.suspendedBanner.title')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('profile.suspendedBanner.body')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── KPI Stats ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<BookOpen className="h-4 w-4" />}
          label={t('profile.stats.courses')}
          value={isLoadingStats ? null : coursesCount.toLocaleString(dateLocale)}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label={t('profile.stats.learners')}
          value={isLoadingStats ? null : learnersCount.toLocaleString(dateLocale)}
        />
        <StatCard
          icon={<Star className="h-4 w-4" />}
          label={t('profile.stats.avgRating')}
          value={isLoadingStats ? null : averageRating > 0 ? averageRating.toFixed(1) : '—'}
          hint={averageRating > 0 ? '/ 5.0' : undefined}
        />
        <StatCard
          icon={<WalletIcon className="h-4 w-4" />}
          label={t('profile.stats.totalRevenue')}
          value={isLoadingStats ? null : formatVND(totalEarnings)}
        />
      </div>

      {/* ─── Trust: Expertise + Certifications (seller's "calling card") ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2 border-border/40 shadow-[var(--shadow-sm)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-primary" /> {t('profile.expertise.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSeller ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-20" />
                ))}
              </div>
            ) : expertise.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {expertise.map((e) => (
                  <span
                    key={e}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/15"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {e}
                  </span>
                ))}
              </div>
            ) : (
              <EmptyHint
                icon={<Sparkles className="h-4 w-4" />}
                text={t('profile.expertise.empty')}
              />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-border/40 shadow-[var(--shadow-sm)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" /> {t('profile.certification.title')}
              {certification.length > 0 && (
                <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-normal">
                  {certification.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSeller ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
                ))}
              </div>
            ) : certification.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {certification.map((url, idx) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t('profile.certification.viewOriginal')}
                    className="group relative block aspect-[4/3] rounded-lg overflow-hidden border border-border/60 bg-muted/30 hover:border-primary/40 hover:shadow-[var(--shadow-md)] transition-all"
                  >
                    <img
                      src={url}
                      alt={t('profile.certification.alt', { index: idx + 1 })}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur rounded p-1 shadow">
                      <ArrowUpRight className="h-3 w-3 text-primary" />
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <EmptyHint
                icon={<ImageIcon className="h-4 w-4" />}
                text={t('profile.certification.empty')}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Wallet + Personal info ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/15 bg-gradient-to-br from-primary/[0.04] to-transparent shadow-[var(--shadow-sm)]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <WalletIcon className="h-4 w-4 text-primary" /> {t('profile.wallet.title')}
            </CardTitle>
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="text-primary hover:text-primary hover:bg-primary/10"
            >
              <Link to="/seller/earnings" className="text-xs">
                {t('profile.wallet.viewDetails')}
                <ArrowUpRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">{t('profile.wallet.withdrawable')}</p>
              {isLoadingStats ? (
                <Skeleton className="h-9 w-40 mt-1" />
              ) : (
                <p className="text-3xl font-bold font-display text-foreground tracking-tight mt-0.5">
                  {formatVND(allowance)}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/40">
              <div>
                <p className="text-xs text-muted-foreground">{t('profile.wallet.pending')}</p>
                <p className="text-sm font-semibold text-amber-600 mt-0.5">
                  {isLoadingStats ? '—' : formatVND(pendingBalance)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('profile.wallet.totalReceived')}</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {isLoadingStats ? '—' : formatVND(totalEarnings)}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              {t('profile.wallet.source')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-[var(--shadow-sm)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('profile.personal.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              icon={<Phone className="h-3.5 w-3.5" />}
              label={t('profile.personal.phone')}
              value={user?.phoneNumber || '—'}
            />
            <InfoRow
              icon={<CalendarDays className="h-3.5 w-3.5" />}
              label={t('profile.personal.dateOfBirth')}
              value={formatDate(user?.dateOfBirth, dateLocale)}
            />
            <InfoRow
              icon={<GraduationCap className="h-3.5 w-3.5" />}
              label={t('profile.personal.level')}
              value={
                <Badge variant="outline" className="font-normal">
                  {formatEnglishLevel(user?.englishLevel)}
                </Badge>
              }
            />
            <p className="text-xs text-muted-foreground pt-3 border-t border-border/40">
              {t('profile.personal.editHint')}
              <Link to="/profile" className="text-primary hover:underline font-medium">
                {t('profile.personal.goToAccount')}
              </Link>
            </p>
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

// ─── Sub-components ─────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  hint?: string;
}) {
  return (
    <Card className="border-border/40 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-primary/30 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <div className="rounded-md bg-primary/10 p-1.5 text-primary">{icon}</div>
        </div>
        <div className="text-2xl font-bold font-display leading-none tracking-tight">
          {value === null ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <>
              {value}
              {hint && (
                <span className="text-xs text-muted-foreground font-normal ml-1 tracking-normal">
                  {hint}
                </span>
              )}
            </>
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
    <div className="grid grid-cols-[110px_1fr] items-center gap-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium truncate text-right">{value}</div>
    </div>
  );
}

function EmptyHint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-4 rounded-lg bg-muted/40 border border-dashed border-border/60 text-sm text-muted-foreground">
      <span className="text-muted-foreground/70">{icon}</span>
      <span className="italic">{text}</span>
    </div>
  );
}
