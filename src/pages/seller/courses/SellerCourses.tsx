import { useMemo, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import FilterSection from '@/components/admin/FilterSection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatVND } from '@/lib/utils';
import { useSellerCourses } from '@/hooks/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { useProfile } from '@/hooks/api/use-user';
import type { Course } from '@/types/type';

export default function SellerCourses() {
  const navigate = useNavigate();
  const { user, isLoading: isProfileLoading } = useProfile();
  const currentUserId = user?.id ?? localStorage.getItem('currentUserId') ?? '';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [level, setLevel] = useState<string>('ALL');

  const {
    data: sellerCoursesResponse,
    isLoading: isCoursesLoading,
    isError: isCoursesError,
    error: coursesError,
    refetch: refetchCourses,
  } = useSellerCourses(currentUserId, {
    status: status === 'ALL' ? undefined : (status as Course['status']),
  });

  const myCourses = sellerCoursesResponse?.data ?? [];

  const levels = useMemo(() => {
    const s = new Set<string>();
    myCourses.forEach((c) => c.courseLevel && s.add(c.courseLevel));
    return ['ALL', ...Array.from(s)];
  }, [myCourses]);

  const filtered = useMemo(() => {
    return myCourses.filter((c) => {
      const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
      const matchStatus = status === 'ALL' ? true : c.status === status;
      const matchLevel = level === 'ALL' ? true : c.courseLevel === level;
      return matchSearch && matchStatus && matchLevel;
    });
  }, [myCourses, search, status, level]);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'ACTIVE':
        return <Badge className="bg-green-600">Đang hoạt động</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-600">Chờ duyệt</Badge>;
      case 'REFUSE':
        return <Badge variant="destructive">Từ chối</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-gray-600">Tạm dừng</Badge>;
      case 'PUBLISHED':
        return <Badge className="bg-blue-600">Đã xuất bản</Badge>;
      case 'DRAFT':
        return <Badge className="bg-muted text-foreground">Bản nháp</Badge>;
      case 'DELETE':
        return <Badge variant="destructive">Đã xoá</Badge>;
      default:
        return <Badge variant="outline">Khác</Badge>;
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
      <h1 className="text-2xl font-semibold">Quản lý khoá học của tôi</h1>

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
              { value: 'REFUSE', label: 'Từ chối' },
              { value: 'INACTIVE', label: 'Tạm dừng' },
              { value: 'PUBLISHED', label: 'Đã xuất bản' },
              { value: 'DRAFT', label: 'Bản nháp' },
              { value: 'DELETE', label: 'Đã xoá' },
            ],
            placeholder: 'Trạng thái'
          },
          {
            value: level,
            onChange: setLevel,
            options: levels.map((l) => ({ value: l, label: l === 'ALL' ? 'Tất cả level' : l })),
            placeholder: 'Level'
          }
        ]}
      />

      <DataTable
        title="Khoá học"
        description="Danh sách khoá học của bạn"
        data={filtered}
        columns={[
          { key: 'title', header: 'Tiêu đề' },
          { key: 'courseLevel', header: 'Level' },
          { key: 'price', header: 'Giá', render: (item) => formatVND(item.price) },
          { key: 'averageRating', header: 'Đánh giá TB', render: (item) => `${item.averageRating ?? '-'} (${item.ratingCount ?? 0})` },
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
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }
        ]}
        emptyMessage="Bạn chưa có khoá học nào."
      />
    </div>
  );
}