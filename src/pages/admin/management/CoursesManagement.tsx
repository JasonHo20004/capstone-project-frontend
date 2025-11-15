import { useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  MoreHorizontal, 
  Eye, 
  Check, 
  X,
  Star
} from 'lucide-react';
import { mockCourses } from '@/data/mock';
import { Course } from '@/types/type';
import DataTable from '@/components/admin/DataTable';
import FilterSection from '@/components/admin/FilterSection';

export default function CoursesManagement() {
  const [courses] = useState<Course[]>(mockCourses);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.courseSeller.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
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
            Giảng viên: {course.courseSeller.fullName}
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
          <span>{course.averageRating?.toFixed(1) || 'N/A'}</span>
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
            <DropdownMenuItem onClick={() => setSelectedCourse(course)}>
              <Eye className="mr-2 h-4 w-4" />
              Xem chi tiết
            </DropdownMenuItem>
            {course.status === 'PENDING' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-green-600">
                  <Check className="mr-2 h-4 w-4" />
                  Duyệt khóa học
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
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

      {/* Course Detail Dialog */}
      <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết khóa học</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về khóa học
            </DialogDescription>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedCourse.title}</h3>
                <p className="text-muted-foreground">
                  Giảng viên: {selectedCourse.courseSeller.fullName}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Giá</label>
                  <p className="text-lg">{formatCurrency(selectedCourse.price)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Trình độ</label>
                  <p className="text-lg">{selectedCourse.courseLevel || 'Chưa xác định'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Trạng thái</label>
                  <div className="mt-1">{getStatusBadge(selectedCourse.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Đánh giá</label>
                  <div className="flex items-center space-x-1 mt-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{selectedCourse.averageRating?.toFixed(1) || 'N/A'}</span>
                    <span className="text-muted-foreground">({selectedCourse.ratingCount || 0} đánh giá)</span>
                  </div>
                </div>
              </div>
              
              {selectedCourse.description && (
                <div>
                  <label className="text-sm font-medium">Mô tả</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCourse.description}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Ngày tạo</label>
                  <p className="text-sm">{new Date(selectedCourse.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Cập nhật lần cuối</label>
                  <p className="text-sm">{new Date(selectedCourse.updatedAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}