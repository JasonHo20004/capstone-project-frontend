import { useMemo, useRef, useState } from 'react';
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
        return <Badge className="bg-green-600">Đang hoạt động</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-600">Chờ duyệt</Badge>;
      case 'REFUSE':
        return <Badge variant="destructive">Bị từ chối</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-gray-600">Tạm dừng</Badge>;
      case 'DRAFT':
        return <Badge className="bg-muted text-foreground">Bản nháp</Badge>;
      default:
        return <Badge variant="outline">{st}</Badge>;
    }
  };

  const confirmDelete = async () => {
    if (!pendingDeleteCourse) return;
    try {
      await deleteMutation.mutateAsync(pendingDeleteCourse.id);
      toast.success('Đã xoá khoá học');
      setPendingDeleteCourse(null);
      refetchCourses();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err instanceof Error ? err.message : 'Có lỗi xảy ra');
      toast.error(msg);
    }
  };

  if (!currentUserId && !isProfileLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Quản lý khoá học của tôi</h1>
        <p className="text-muted-foreground">Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.</p>
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
        <LoadingSpinner text="Đang tải khoá học..." />
      </div>
    );
  }

  if (isCoursesError && !sellerCoursesResponse) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Quản lý khoá học của tôi</h1>
        <ErrorMessage
          message={coursesError instanceof Error ? coursesError.message : 'Không thể tải danh sách khoá học.'}
          onRetry={refetchCourses}
        />
      </div>
    );
  }

  const isRefetching = isCoursesFetching && !isCoursesLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Quản lý khoá học của tôi</h1>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Mới tạo gần đây</SelectItem>
              <SelectItem value="price">Giá cao → thấp</SelectItem>
              <SelectItem value="rating">Nhiều đánh giá</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => navigate('/seller/courses/new')} className="rounded-xl shadow-lg shadow-primary/20">
            <Sparkles className="mr-2 h-4 w-4" />
            Tạo khoá học mới
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
        title={`Khoá học${isRefetching ? ' • đang tải...' : ''}`}
        description={
          appliedSearch
            ? `Đang lọc theo "${appliedSearch}" — xoá ô tìm kiếm và Enter để bỏ lọc`
            : 'Danh sách khoá học của bạn'
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
            header: 'Tiêu đề',
            render: (item) => (
              <div className="space-y-0.5">
                <div className="font-medium">{item.title}</div>
                {item.category && (
                  <div className="text-xs text-muted-foreground">{item.category}</div>
                )}
              </div>
            ),
          },
          { key: 'courseLevel', header: 'Level', render: (item) => item.courseLevel || '-' },
          { key: 'price', header: 'Giá', render: (item) => formatVND(Number(item.price)) },
          {
            key: 'rating',
            header: 'Đánh giá',
            render: (item) =>
              item.ratingCount ? `${item.ratingCount} đánh giá` : <span className="text-muted-foreground">—</span>,
          },
          { key: 'status', header: 'Trạng thái', render: (item) => getStatusBadge(item.status) },
          {
            key: 'actions',
            header: 'Hành động',
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
                    <Eye className="mr-2 h-4 w-4" /> Xem chi tiết
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setPendingDeleteCourse(item)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Xoá khoá học
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
        emptyMessage="Bạn chưa có khoá học nào."
      />

      <AlertDialog
        open={!!pendingDeleteCourse}
        onOpenChange={(open) => !open && setPendingDeleteCourse(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá khoá học?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Bạn sắp xoá khoá học <strong>{pendingDeleteCourse?.title}</strong>.
              </span>
              {pendingDeleteCourse &&
              (pendingDeleteCourse.status === 'ACTIVE' || pendingDeleteCourse.status === 'PENDING') ? (
                <span className="block text-destructive">
                  ⚠️ Khoá học này có thể đã có học viên mua. Hệ thống sẽ <strong>tự động hoàn tiền</strong> cho buyer và <strong>thu hồi quyền truy cập</strong> của họ. Hành động này không thể hoàn tác.
                </span>
              ) : (
                <span className="block">Hành động này không thể hoàn tác.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Đang xoá...' : 'Xoá vĩnh viễn'}
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
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'REFUSE', label: 'Bị từ chối' },
  { value: 'INACTIVE', label: 'Tạm dừng' },
  { value: 'DRAFT', label: 'Bản nháp' },
];

function CourseFiltersBar({
  searchInput, appliedSearch, onSearchInput, onSearchSubmit, onSearchClear,
  status, onStatusChange, level, onLevelChange, levels, onResetAll,
}: CourseFiltersBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasPending = searchInput.trim() !== appliedSearch.trim();
  const hasInput = searchInput.length > 0;
  const hasAnyFilter = appliedSearch !== '' || status !== 'ALL' || level !== 'ALL';

  const statusLabel = STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;

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
            placeholder="Tìm theo tiêu đề khoá học..."
            className="pl-9 pr-24"
          />
          {/* Right-side adornments: pending hint + clear button */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {hasPending && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                <CornerDownLeft className="w-3 h-3" /> Enter
              </span>
            )}
            {hasInput && (
              <button
                type="button"
                aria-label="Xoá ô tìm kiếm"
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
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={level} onValueChange={onLevelChange}>
          <SelectTrigger className="w-full md:w-[140px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            {levels.map((l) => (
              <SelectItem key={l} value={l}>{l === 'ALL' ? 'Tất cả level' : l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active filter chips */}
      {hasAnyFilter && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Đang lọc:</span>
          {appliedSearch && (
            <FilterChip label={`Tìm: "${appliedSearch}"`} onRemove={onSearchClear} />
          )}
          {status !== 'ALL' && (
            <FilterChip label={statusLabel} onRemove={() => onStatusChange('ALL')} />
          )}
          {level !== 'ALL' && (
            <FilterChip label={`Level ${level}`} onRemove={() => onLevelChange('ALL')} />
          )}
          <button
            type="button"
            onClick={onResetAll}
            className="text-xs text-primary hover:underline ml-1"
          >
            Xoá tất cả
          </button>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
      {label}
      <button
        type="button"
        aria-label={`Xoá ${label}`}
        onClick={onRemove}
        className="rounded-full hover:bg-primary/20 p-0.5"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
