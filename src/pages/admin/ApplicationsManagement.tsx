import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MoreHorizontal, 
  Eye, 
  Check, 
  X, 
  FileText,
  User
} from 'lucide-react';
import { mockCourseSellerApplications } from '@/data/admin-mock';
import { CourseSellerApplication } from '@/types/admin';
import DataTable from '@/components/admin/DataTable';
import FilterSection from '@/components/admin/FilterSection';

export default function ApplicationsManagement() {
  const [applications] = useState<CourseSellerApplication[]>(mockCourseSellerApplications);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<CourseSellerApplication | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNote, setReviewNote] = useState('');

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Chờ duyệt</Badge>;
      case 'APPROVED':
        return <Badge variant="default">Đã duyệt</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Từ chối</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleReview = (application: CourseSellerApplication, status: 'APPROVED' | 'REJECTED') => {
    setSelectedApplication(application);
    setReviewStatus(status);
    setReviewDialogOpen(true);
  };

  const submitReview = () => {
    // Handle review submission logic here
    console.log('Review submitted:', {
      applicationId: selectedApplication?.id,
      status: reviewStatus,
      note: reviewNote
    });
    setReviewDialogOpen(false);
    setReviewNote('');
  };

  const columns = [
    {
      key: 'applicant',
      header: 'Người nộp đơn',
      render: (app: CourseSellerApplication) => (
        <div>
          <div className="font-medium">{app.user.fullName}</div>
          <div className="text-sm text-muted-foreground">{app.user.email}</div>
        </div>
      )
    },
    {
      key: 'expertise',
      header: 'Chuyên môn',
      render: (app: CourseSellerApplication) => (
        <div className="text-sm">
          {app.expertise.length > 0 ? app.expertise.join(', ') : 'Chưa có'}
        </div>
      )
    },
    {
      key: 'certificates',
      header: 'Chứng chỉ',
      render: (app: CourseSellerApplication) => (
        <div className="text-sm">
          {app.certification.length > 0 ? (
            <Badge variant="outline">{app.certification.length} chứng chỉ</Badge>
          ) : (
            <span className="text-muted-foreground">Chưa có</span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (app: CourseSellerApplication) => getStatusBadge(app.status)
    },
    {
      key: 'createdAt',
      header: 'Ngày nộp',
      render: (app: CourseSellerApplication) => new Date(app.createdAt).toLocaleDateString('vi-VN')
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (app: CourseSellerApplication) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Mở menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setSelectedApplication(app)}>
              <Eye className="mr-2 h-4 w-4" />
              Xem chi tiết
            </DropdownMenuItem>
            {app.status === 'PENDING' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-green-600"
                  onClick={() => handleReview(app, 'APPROVED')}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Duyệt đơn
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => handleReview(app, 'REJECTED')}
                >
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
    { value: 'PENDING', label: 'Chờ duyệt' },
    { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'REJECTED', label: 'Từ chối' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý đơn đăng ký</h1>
        <p className="text-muted-foreground">
          Duyệt và quản lý các đơn đăng ký trở thành giảng viên
        </p>
      </div>

      <FilterSection
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm kiếm theo tên hoặc email..."
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
        title="Danh sách đơn đăng ký"
        description={`Tổng cộng ${applications.length} đơn đăng ký`}
        data={filteredApplications}
        columns={columns}
        emptyMessage="Không tìm thấy đơn đăng ký nào"
      />

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApplication && !reviewDialogOpen} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn đăng ký</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về đơn đăng ký trở thành giảng viên
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Thông tin cá nhân
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Họ và tên</label>
                    <p className="text-sm text-muted-foreground">{selectedApplication.user.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground">{selectedApplication.user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Số điện thoại</label>
                    <p className="text-sm text-muted-foreground">{selectedApplication.user.phoneNumber || 'Chưa cung cấp'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Trạng thái</label>
                    <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Thông tin nghề nghiệp
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Chuyên môn</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedApplication.expertise.length > 0 ? selectedApplication.expertise.join(', ') : 'Chưa có'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Chứng chỉ</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedApplication.certification.length > 0 ? selectedApplication.certification.join(', ') : 'Chưa có chứng chỉ'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tin nhắn</label>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedApplication.message || 'Chưa có tin nhắn'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Thông tin đơn đăng ký</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Ngày nộp đơn</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedApplication.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedApplication.status === 'PENDING' && (
                <div className="flex space-x-2 pt-4 border-t">
                  <Button 
                    className="flex-1"
                    onClick={() => handleReview(selectedApplication, 'APPROVED')}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Duyệt đơn
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => handleReview(selectedApplication, 'REJECTED')}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Từ chối
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewStatus === 'APPROVED' ? 'Duyệt đơn đăng ký' : 'Từ chối đơn đăng ký'}
            </DialogTitle>
            <DialogDescription>
              {reviewStatus === 'APPROVED' 
                ? 'Xác nhận duyệt đơn đăng ký này?' 
                : 'Vui lòng cung cấp lý do từ chối'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {reviewStatus === 'APPROVED' ? 'Ghi chú (tùy chọn)' : 'Lý do từ chối'}
              </label>
              <Textarea
                placeholder={reviewStatus === 'APPROVED' 
                  ? 'Thêm ghi chú cho quyết định này...' 
                  : 'Nhập lý do từ chối đơn đăng ký...'
                }
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={submitReview} className="flex-1">
                {reviewStatus === 'APPROVED' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
              </Button>
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}