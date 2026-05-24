import { useMemo, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import FilterSection from '@/components/admin/FilterSection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { MoreHorizontal, Eye, Sparkles, Trash2, BookOpen } from 'lucide-react';
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

  // Server-side filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [level, setLevel] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');

  const [pendingDeleteCourse, setPendingDeleteCourse] = useState<Course | null>(null);

  const {
    data: sellerCoursesResponse,
    isLoading: isCoursesLoading,
    isError: isCoursesError,
    error: coursesError,
    refetch: refetchCourses,
  } = useSellerCourses('', {
    status: status === 'ALL' ? undefined : (status as Course['status']),
    search: search.trim() || undefined,
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

  if (isCoursesLoading || isProfileLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner text="Đang tải khoá học..." />
      </div>
    );
  }

  if (isCoursesError) {
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

      <FilterSection
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm kiếm theo tiêu đề"
        filters={[
          {
            value: status,
            onChange: setStatus,
            options: [
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'ACTIVE', label: 'Đang hoạt động' },
              { value: 'PENDING', label: 'Chờ duyệt' },
              { value: 'REFUSE', label: 'Bị từ chối' },
              { value: 'INACTIVE', label: 'Tạm dừng' },
              { value: 'DRAFT', label: 'Bản nháp' },
            ],
            placeholder: 'Trạng thái',
          },
          {
            value: level,
            onChange: setLevel,
            options: levels.map((l) => ({ value: l, label: l === 'ALL' ? 'Tất cả level' : l })),
            placeholder: 'Level',
          },
        ]}
      />

      <DataTable<Course>
        title="Khoá học"
        description="Danh sách khoá học của bạn"
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
