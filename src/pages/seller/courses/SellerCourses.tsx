import { useMemo, useRef, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import DataTable from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MoreHorizontal, Eye, Sparkles, Trash2, BookOpen, Search, X, CornerDownLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatVND } from '@/lib/utils';
import { useSellerCourses, useDeleteCourse } from '@/hooks/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { useProfile } from '@/hooks/api/use-user';
import { toast } from 'sonner';
import type { Course } from '@/domain';

type SortKey = 'createdAt' | 'price' | 'rating';

export default function SellerCourses() {
  const navigate = useNavigate();
  const { t } = useTranslation('seller');
  const { user, isLoading: isProfileLoading } = useProfile();
  const currentUserId = user?.id ?? '';

  // Two-tier search state:
  //   - searchInput: what the seller is currently typing (free, no refetch)
  //   - appliedSearch: what's actually sent to the backend (commit on Enter)
  // Only the latter is in the query key, so each keystroke no longer
  // re-fires the request or flashes a full-screen loading spinner.
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [level, setLevel] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');

  const [pendingDeleteCourse, setPendingDeleteCourse] = useState<Course | null>(null);

  const {
    data: sellerCoursesResponse,
    isLoading: isCoursesLoading,
    isFetching: isCoursesFetching,
    isError: isCoursesError,
    error: coursesError,
    refetch: refetchCourses,
  } = useSellerCourses('', {
    status: status === 'ALL' ? undefined : (status as Course['status']),
    search: appliedSearch.trim() || undefined,
    level: level === 'ALL' ? undefined : level,
    limit: 100,
  });

  const deleteMutation = useDeleteCourse();

  const myCourses: Course[] = Array.isArray(sellerCoursesResponse)
    ? sellerCoursesResponse
    : (sellerCoursesResponse as { data?: Course[] })?.data ?? [];

  // Levels seeded from currently fetched data (server-side filter still applies).
  const levels = useMemo(() => {
    const s = new Set<string>();
    myCourses.forEach((c) => c.courseLevel && s.add(c.courseLevel));
    return ['ALL', ...Array.from(s)];
  }, [myCourses]);

  // Client-side sort over the already-filtered server response.
  const sortedCourses = useMemo(() => {
    const list = [...myCourses];
    list.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        case 'rating':
          return (Number(b.ratingCount) || 0) - (Number(a.ratingCount) || 0);
        case 'createdAt':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return list;
  }, [myCourses, sortBy]);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'ACTIVE':
        return <Badge className="bg-green-600">{t('courses.status.ACTIVE')}</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-600">{t('courses.status.PENDING')}</Badge>;
      case 'REFUSE':
        return <Badge variant="destructive">{t('courses.status.REFUSE')}</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-gray-600">{t('courses.status.INACTIVE')}</Badge>;
      case 'DRAFT':
        return <Badge className="bg-muted text-foreground">{t('courses.status.DRAFT')}</Badge>;
      default:
        return <Badge variant="outline">{st}</Badge>;
    }
  };

  const confirmDelete = async () => {
    if (!pendingDeleteCourse) return;
    try {
      await deleteMutation.mutateAsync(pendingDeleteCourse.id);
      toast.success(t('courses.deleted'));
      setPendingDeleteCourse(null);
      refetchCourses();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err instanceof Error ? err.message : t('courses.genericError'));
      toast.error(msg);
    }
  };

  if (!currentUserId && !isProfileLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">{t('courses.title')}</h1>
        <p className="text-muted-foreground">{t('courses.notLoggedIn')}</p>
      </div>
    );
  }

  // Only block the page on the truly first load (no data yet). On every
  // subsequent refetch (search committed, filter changed) the old rows stay
  // visible thanks to keepPreviousData; a subtle isFetching indicator hints
  // the table is updating.
  if ((isCoursesLoading && !sellerCoursesResponse) || isProfileLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner text={t('courses.loading')} />
      </div>
    );
  }

  if (isCoursesError && !sellerCoursesResponse) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">{t('courses.title')}</h1>
        <ErrorMessage
          message={coursesError instanceof Error ? coursesError.message : t('courses.loadError')}
          onRetry={refetchCourses}
        />
      </div>
    );
  }

  const isRefetching = isCoursesFetching && !isCoursesLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">{t('courses.title')}</h1>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('courses.sortPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">{t('courses.sort.createdAt')}</SelectItem>
              <SelectItem value="price">{t('courses.sort.price')}</SelectItem>
              <SelectItem value="rating">{t('courses.sort.rating')}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => navigate('/seller/courses/new')} className="rounded-xl shadow-lg shadow-primary/20">
            <Sparkles className="mr-2 h-4 w-4" />
            {t('courses.create')}
          </Button>
        </div>
      </div>

      <CourseFiltersBar
        searchInput={searchInput}
        appliedSearch={appliedSearch}
        onSearchInput={setSearchInput}
        onSearchSubmit={() => setAppliedSearch(searchInput.trim())}
        onSearchClear={() => {
          setSearchInput('');
          setAppliedSearch('');
        }}
        status={status}
        onStatusChange={setStatus}
        level={level}
        onLevelChange={setLevel}
        levels={levels}
        onResetAll={() => {
          setSearchInput('');
          setAppliedSearch('');
          setStatus('ALL');
          setLevel('ALL');
        }}
      />

      <DataTable<Course>
        title={`${t('courses.table.title')}${isRefetching ? t('courses.table.loadingSuffix') : ''}`}
        description={
          appliedSearch
            ? t('courses.table.filtering', { search: appliedSearch })
            : t('courses.table.description')
        }
        data={sortedCourses}
        columns={[
          {
            key: 'thumbnail',
            header: '',
            className: 'w-20',
            render: (item) =>
              item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="h-12 w-16 rounded object-cover bg-muted"
                  loading="lazy"
                />
              ) : (
                <div className="h-12 w-16 rounded bg-muted flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
              ),
          },
          {
            key: 'title',
            header: t('courses.table.headerTitle'),
            render: (item) => (
              <div className="space-y-0.5">
                <div className="font-medium">{item.title}</div>
                {item.category && (
                  <div className="text-xs text-muted-foreground">{item.category}</div>
                )}
              </div>
            ),
          },
          { key: 'courseLevel', header: t('courses.table.headerLevel'), render: (item) => item.courseLevel || '-' },
          { key: 'price', header: t('courses.table.headerPrice'), render: (item) => formatVND(Number(item.price)) },
          {
            key: 'rating',
            header: t('courses.table.headerRating'),
            render: (item) =>
              item.ratingCount ? t('courses.ratingCount', { count: item.ratingCount }) : <span className="text-muted-foreground">—</span>,
          },
          { key: 'status', header: t('courses.table.headerStatus'), render: (item) => getStatusBadge(item.status) },
          {
            key: 'actions',
            header: t('courses.table.headerActions'),
            className: 'w-20',
            render: (item) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/seller/courses/${item.id}`)}>
                    <Eye className="mr-2 h-4 w-4" /> {t('courses.viewDetail')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setPendingDeleteCourse(item)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> {t('courses.deleteAction')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
        emptyMessage={t('courses.empty')}
      />

      <AlertDialog
        open={!!pendingDeleteCourse}
        onOpenChange={(open) => !open && setPendingDeleteCourse(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('courses.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                <Trans
                  i18nKey="courses.deleteDialog.subject"
                  ns="seller"
                  values={{ title: pendingDeleteCourse?.title }}
                  components={{ strong: <strong /> }}
                />
              </span>
              {pendingDeleteCourse &&
              (pendingDeleteCourse.status === 'ACTIVE' || pendingDeleteCourse.status === 'PENDING') ? (
                <span className="block text-destructive">
                  <Trans
                    i18nKey="courses.deleteDialog.warning"
                    ns="seller"
                    components={{ strong: <strong /> }}
                  />
                </span>
              ) : (
                <span className="block">{t('courses.deleteDialog.irreversible')}</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>{t('courses.deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? t('courses.deleteDialog.deleting') : t('courses.deleteDialog.deletePermanent')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Filters bar ───────────────────────────────────────────────────────────
// Custom UX (better than the shared FilterSection for this page):
//   - Search input with leading icon + clearable X button
//   - Pending hint "↵ Enter" when typed text hasn't been applied yet
//   - Esc clears the input
//   - Active filter chips below — each removable independently
//   - "Xoá tất cả bộ lọc" link when ≥1 filter is active

interface CourseFiltersBarProps {
  searchInput: string;
  appliedSearch: string;
  onSearchInput: (v: string) => void;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  status: string;
  onStatusChange: (v: string) => void;
  level: string;
  onLevelChange: (v: string) => void;
  levels: string[];
  onResetAll: () => void;
}

const STATUS_OPTIONS = [
  { value: 'ALL', labelKey: 'courses.filters.allStatuses' },
  { value: 'ACTIVE', labelKey: 'courses.status.ACTIVE' },
  { value: 'PENDING', labelKey: 'courses.status.PENDING' },
  { value: 'REFUSE', labelKey: 'courses.status.REFUSE' },
  { value: 'INACTIVE', labelKey: 'courses.status.INACTIVE' },
  { value: 'DRAFT', labelKey: 'courses.status.DRAFT' },
];

function CourseFiltersBar({
  searchInput, appliedSearch, onSearchInput, onSearchSubmit, onSearchClear,
  status, onStatusChange, level, onLevelChange, levels, onResetAll,
}: CourseFiltersBarProps) {
  const { t } = useTranslation('seller');
  const inputRef = useRef<HTMLInputElement>(null);
  const hasPending = searchInput.trim() !== appliedSearch.trim();
  const hasInput = searchInput.length > 0;
  const hasAnyFilter = appliedSearch !== '' || status !== 'ALL' || level !== 'ALL';

  const statusLabel = (() => {
    const opt = STATUS_OPTIONS.find((o) => o.value === status);
    return opt ? t(opt.labelKey) : status;
  })();

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={searchInput}
            onChange={(e) => onSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSearchSubmit();
              } else if (e.key === 'Escape' && hasInput) {
                e.preventDefault();
                onSearchClear();
              }
            }}
            placeholder={t('courses.filters.searchPlaceholder')}
            className="pl-9 pr-24"
          />
          {/* Right-side adornments: pending hint + clear button */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {hasPending && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                <CornerDownLeft className="w-3 h-3" /> {t('courses.filters.enter')}
              </span>
            )}
            {hasInput && (
              <button
                type="button"
                aria-label={t('courses.filters.clearSearchAria')}
                onClick={() => {
                  onSearchClear();
                  inputRef.current?.focus();
                }}
                className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-slate-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t('courses.filters.statusPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{t(o.labelKey)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={level} onValueChange={onLevelChange}>
          <SelectTrigger className="w-full md:w-[140px]">
            <SelectValue placeholder={t('courses.filters.levelPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {levels.map((l) => (
              <SelectItem key={l} value={l}>{l === 'ALL' ? t('courses.filters.allLevels') : l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active filter chips */}
      {hasAnyFilter && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{t('courses.filters.filteringLabel')}</span>
          {appliedSearch && (
            <FilterChip label={t('courses.filters.searchChip', { search: appliedSearch })} onRemove={onSearchClear} />
          )}
          {status !== 'ALL' && (
            <FilterChip label={statusLabel} onRemove={() => onStatusChange('ALL')} />
          )}
          {level !== 'ALL' && (
            <FilterChip label={t('courses.filters.levelChip', { level })} onRemove={() => onLevelChange('ALL')} />
          )}
          <button
            type="button"
            onClick={onResetAll}
            className="text-xs text-primary hover:underline ml-1"
          >
            {t('courses.filters.clearAll')}
          </button>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  const { t } = useTranslation('seller');
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
      {label}
      <button
        type="button"
        aria-label={t('courses.filters.removeAria', { label })}
        onClick={onRemove}
        className="rounded-full hover:bg-primary/20 p-0.5"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
