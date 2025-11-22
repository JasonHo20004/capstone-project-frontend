import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  Pencil
} from 'lucide-react';
import { Course, CourseWithStats, CourseStatus } from '@/types/type';
import { courseManagementService } from '@/lib/api/services/admin';
import DataTable from '@/components/admin/DataTable';
import FilterSection from '@/components/admin/FilterSection';

export default function CoursesManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: coursesResp } = useQuery({
    queryKey: ['adminCourses'],
    queryFn: () => courseManagementService.getCourses(),
  });

  const courses = coursesResp?.data || [];

  const filteredCourses = courses.filter(course => {
    const sellerName = (((course as any).user?.fullName) || '').toLowerCase();
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sellerName.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    return matchesSearch && matchesStatus;
  });


  const updateCourseMutation = useMutation({
    mutationFn: (vars: { id: string; data: { status?: Course['status'] } }) =>
      courseManagementService.updateCourse(vars.id, vars.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="default">Đã xuất bản</Badge>;
      case 'ACTIVE':
        return <Badge variant="default">Hoạt động</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Chờ duyệt</Badge>;
      case 'REFUSE':
        return <Badge variant="destructive">Từ chối</Badge>;
      case 'INACTIVE':
        return <Badge variant="outline">Không hoạt động</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns = [
    {
      key: 'course',
      header: 'Khóa học',
      render: (course: Course) => (
        <div>
          <div className="font-medium">{course.title}</div>
          <div className="text-sm text-muted-foreground">
            Giảng viên: {(course as any).user?.fullName || 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'price',
      header: 'Giá',
      render: (course: Course) => formatCurrency(course.price)
    },
    {
      key: 'level',
      header: 'Trình độ',
      render: (course: Course) => course.courseLevel ? (
        <Badge variant="outline">{course.courseLevel}</Badge>
      ) : (
        <span className="text-muted-foreground">Chưa xác định</span>
      )
    },
    {
      key: 'rating',
      header: 'Đánh giá',
      render: (course: Course) => (
        <div className="flex items-center space-x-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span>{(course as CourseWithStats).averageRating?.toFixed(1) || 'N/A'}</span>
          <span className="text-muted-foreground">({course.ratingCount || 0})</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (course: Course) => getStatusBadge(course.status)
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (course: Course) => new Date(course.createdAt).toLocaleDateString('vi-VN')
    },
    {
      key: 'actions',
      header: 'Thao tác',
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
            <DropdownMenuItem onClick={() => navigate(`/admin/courses/${course.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              Xem chi tiết
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/admin/courses/${course.id}?tab=edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
            {course.status === CourseStatus.PENDING && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-green-600" onClick={() => updateCourseMutation.mutate({ id: course.id, data: { status: CourseStatus.ACTIVE } })}>
                  <Check className="mr-2 h-4 w-4" />
                  Duyệt khóa học
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={() => updateCourseMutation.mutate({ id: course.id, data: { status: CourseStatus.REFUSE } })}>
                  <X className="mr-2 h-4 w-4" />
                  Từ chối
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'PUBLISHED', label: 'Đã xuất bản' },
    { value: 'ACTIVE', label: 'Hoạt động' },
    { value: 'PENDING', label: 'Chờ duyệt' },
    { value: 'REFUSE', label: 'Từ chối' },
    { value: 'INACTIVE', label: 'Không hoạt động' }
  ];

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
            placeholder: "Lọc theo trạng thái"
          }
        ]}
      />

      <DataTable
        title="Danh sách khóa học"
        description={`Tổng cộng ${courses.length} khóa học`}
        data={filteredCourses}
        columns={columns}
        emptyMessage="Không tìm thấy khóa học nào"
      />

    </div>
  );
}