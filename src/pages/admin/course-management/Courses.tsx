
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Eye,
  Check,
  X,
  Star,
  Pencil,
} from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Course, CourseWithStats } from "@/domain";
import { CourseStatus } from "@/domain";
import { courseManagementService, auditLogService } from '@/lib/api/services/admin';
import DataTable from '@/components/admin/DataTable';
import FilterSection from '@/components/admin/FilterSection';
import { useCourses } from '@/hooks/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { toast } from 'sonner';

export default function CoursesManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all");
  const [approveTarget, setApproveTarget] = useState<Course | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (searchTerm) next.set("q", searchTerm); else next.delete("q");
    if (statusFilter && statusFilter !== "all") next.set("status", statusFilter);
    else next.delete("status");
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]);

  const {
    data: coursesResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useCourses({
    page: 1,
    limit: 50,
    search: searchTerm || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter as Course['status'],
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const courses = coursesResponse?.data ?? [];
  const totalCourses = coursesResponse?.total ?? courses.length;

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    return courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.sellerName ?? course.courseSeller?.fullName ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [courses, searchTerm, statusFilter]);

  const updateCourseMutation = useMutation({
    mutationFn: (vars: { id: string; data: { status?: Course["status"] } }) =>
      courseManagementService.updateCourse(vars.id, vars.data),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      refetch();
      if (vars.data.status === CourseStatus.ACTIVE) {
        toast.success('Đã duyệt khóa học');
        setApproveTarget(null);
      }
    },
    onError: () => {
      toast.error('Thao tác thất bại');
    },
  });

  // Bulk selection — mirrors ApplicationsManagement pattern.
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);

  const pendingSelectedCourses = useMemo(() => {
    const idSet = new Set(selectedIds);
    return courses.filter((c) => idSet.has(c.id) && c.status === CourseStatus.PENDING);
  }, [courses, selectedIds]);

  const runBulkApprove = async () => {
    if (pendingSelectedCourses.length === 0) {
      toast.error('Không có khóa học PENDING nào trong lựa chọn');
      return;
    }
    setBulkProgress({ done: 0, total: pendingSelectedCourses.length });
    let success = 0;
    let failed = 0;
    for (const [i, course] of pendingSelectedCourses.entries()) {
      try {
        await courseManagementService.updateCourse(course.id, {
          status: CourseStatus.ACTIVE,
        });
        auditLogService
          .record({
            action: 'COURSE_APPROVE',
            entityType: 'COURSE',
            entityId: course.id,
            reason: 'Bulk approval',
            metadata: { bulk: true, title: course.title },
          })
          .catch((err) => console.error('[Audit] bulk course approve log failed:', err));
        success++;
      } catch {
        failed++;
      }
      setBulkProgress({ done: i + 1, total: pendingSelectedCourses.length });
    }
    queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
    refetch();
    setBulkProgress(null);
    setBulkConfirmOpen(false);
    setSelectedIds([]);
    toast.success(
      `Hoàn tất: ${success} duyệt thành công${failed > 0 ? `, ${failed} thất bại` : ''}`
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="default">Hoạt động</Badge>;
      case "PENDING":
        return <Badge variant="secondary">Chờ duyệt</Badge>;
      case "REFUSE":
        return <Badge variant="destructive">Từ chối</Badge>;
      case "INACTIVE":
        return <Badge variant="outline">Không hoạt động</Badge>;
      case 'DRAFT':
        return <Badge variant="outline">Bản nháp</Badge>;
      case 'DELETE':
        return <Badge variant="destructive">Đã xoá</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns = [
    {
      key: "course",
      header: "Khóa học",
      render: (course: Course) => (
        <div>
          <div className="font-medium">{course.title}</div>
          <div className="text-sm text-muted-foreground">
            Giảng viên: {course.sellerName || course.courseSeller?.fullName || 'Chưa xác định'}
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Giá",
      render: (course: Course) => formatCurrency(course.price),
    },
    {
      key: "level",
      header: "Trình độ",
      render: (course: Course) =>
        course.courseLevel ? (
          <Badge variant="outline">{course.courseLevel}</Badge>
        ) : (
          <span className="text-muted-foreground">Chưa xác định</span>
        ),
    },
    {
      key: "rating",
      header: "Đánh giá",
      render: (course: Course) => (
        <div className="flex items-center space-x-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span>
            {(course as CourseWithStats).averageRating?.toFixed(1) || "N/A"}
          </span>
          <span className="text-muted-foreground">
            ({course.ratingCount || 0})
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (course: Course) => getStatusBadge(course.status),
    },
    {
      key: "createdAt",
      header: "Ngày tạo",
      render: (course: Course) =>
        new Date(course.createdAt).toLocaleDateString("vi-VN"),
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (course: Course) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Mở menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigate(`/admin/courses/${course.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Xem chi tiết
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate(`/admin/courses/${course.id}?tab=edit`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
            {course.status === CourseStatus.PENDING && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-green-600"
                  onClick={() => setApproveTarget(course)}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Duyệt khóa học
                </DropdownMenuItem>
                {/* Rejection now requires a written reason — handled on the
                    detail page where we can render a textarea. */}
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => navigate(`/admin/courses/${course.id}`)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Từ chối (mở chi tiết)
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'ACTIVE', label: 'Hoạt động' },
    { value: 'PENDING', label: 'Chờ duyệt' },
    { value: 'REFUSE', label: 'Từ chối' },
    { value: 'INACTIVE', label: 'Không hoạt động' },
    { value: 'DRAFT', label: 'Bản nháp' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý khóa học</h1>
        <LoadingSpinner text="Đang tải khoá học..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý khóa học</h1>
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Không thể tải danh sách khoá học.'}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý khóa học</h1>
        <p className="text-muted-foreground">
          Quản lý tất cả khóa học trong hệ thống
        </p>
      </div>

      <FilterSection
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm kiếm theo tên khóa học hoặc giảng viên..."
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: statusOptions,
            placeholder: "Lọc theo trạng thái",
          },
        ]}
      />

      <DataTable
        title="Danh sách khóa học"
        description={`Tổng cộng ${totalCourses} khóa học`}
        data={filteredCourses}
        columns={columns}
        emptyMessage="Không tìm thấy khóa học nào"
        selectable
        getRowId={(course) => course.id}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={() => {
          const pendingCount = pendingSelectedCourses.length;
          return (
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 border-green-600 hover:bg-green-50"
              disabled={pendingCount === 0}
              onClick={() => setBulkConfirmOpen(true)}
              title={pendingCount === 0 ? 'Không có khóa học PENDING trong lựa chọn' : undefined}
            >
              <Check className="mr-1 h-4 w-4" /> Duyệt {pendingCount} khóa học chờ
            </Button>
          );
        }}
      />

      {/* Bulk approve confirmation */}
      <Dialog
        open={bulkConfirmOpen}
        onOpenChange={(open) => !open && !bulkProgress && setBulkConfirmOpen(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Duyệt {pendingSelectedCourses.length} khóa học?</DialogTitle>
            <DialogDescription>
              Các khóa học PENDING được chọn sẽ chuyển sang trạng thái ACTIVE và hiển thị công khai
              cho học viên mua ngay. Khóa học không ở trạng thái PENDING sẽ được bỏ qua.
            </DialogDescription>
          </DialogHeader>
          {pendingSelectedCourses.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-md border bg-muted/30 p-2 text-sm">
              {pendingSelectedCourses.slice(0, 10).map((c) => (
                <div key={c.id} className="truncate py-0.5">• {c.title}</div>
              ))}
              {pendingSelectedCourses.length > 10 && (
                <div className="text-xs text-muted-foreground pt-1">
                  ... và {pendingSelectedCourses.length - 10} khóa khác
                </div>
              )}
            </div>
          )}
          {bulkProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Đang xử lý...</span>
                <span>{bulkProgress.done}/{bulkProgress.total}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkConfirmOpen(false)}
              disabled={!!bulkProgress}
            >
              Hủy
            </Button>
            <Button
              onClick={runBulkApprove}
              disabled={!!bulkProgress || pendingSelectedCourses.length === 0}
            >
              {bulkProgress ? 'Đang xử lý...' : 'Xác nhận duyệt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duyệt khóa học</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn sắp công khai khóa học <strong>{approveTarget?.title}</strong> ra trang chính —
              học viên có thể nhìn thấy và mua ngay. Vui lòng đảm bảo nội dung đã được rà soát.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateCourseMutation.isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={updateCourseMutation.isPending}
              onClick={() =>
                approveTarget &&
                updateCourseMutation.mutate({
                  id: approveTarget.id,
                  data: { status: CourseStatus.ACTIVE },
                })
              }
            >
              <Check className="mr-2 h-4 w-4" />
              Xác nhận duyệt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
