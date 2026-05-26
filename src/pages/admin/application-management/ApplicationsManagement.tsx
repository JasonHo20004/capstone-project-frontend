import { useState, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  FileText,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
} from 'lucide-react';
import type { CourseSellerApplication } from '@/domain';
import DataTable from '@/components/admin/DataTable';
import FilterSection from '@/components/admin/FilterSection';
import StatCard from '@/components/admin/StatCard';
import { applicationManagementService } from '@/lib/api/services/admin/application-management/application.service';
import { toast } from 'sonner';

export default function ApplicationsManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<CourseSellerApplication | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: applicationsResp } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationManagementService.getApplications(),
  });

  const applications = applicationsResp?.data || [];

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'PENDING').length,
    approved: applications.filter((a) => a.status === 'APPROVED').length,
    rejected: applications.filter((a) => a.status === 'REJECTED').length,
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({
      applicationId,
      status,
      rejectionReason,
    }: {
      applicationId: string;
      status: 'APPROVED' | 'REJECTED';
      rejectionReason?: string;
    }) =>
      applicationManagementService.updateApplicationStatus(applicationId, {
        status,
        rejectionReason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success(reviewStatus === 'APPROVED' ? 'Đã duyệt đơn đăng ký' : 'Đã từ chối đơn đăng ký');
      setReviewDialogOpen(false);
      setSelectedApplication(null);
      setRejectionReason('');
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err instanceof Error ? err.message : 'Có lỗi xảy ra');
      toast.error(msg);
    },
  });

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      !searchTerm ||
      app.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
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
    setRejectionReason('');
    setReviewDialogOpen(true);
  };

  const handleViewApplication = (application: CourseSellerApplication) => {
    setSelectedApplication(application);
  };

  const submitReview = () => {
    if (!selectedApplication) return;
    if (reviewStatus === 'REJECTED' && !rejectionReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    updateStatusMutation.mutate({
      applicationId: selectedApplication.id,
      status: reviewStatus,
      rejectionReason: reviewStatus === 'REJECTED' ? rejectionReason.trim() : undefined,
    });
  };

  type ApplicationRow = CourseSellerApplication;

  const columns: {
    key: keyof ApplicationRow | string;
    header: string;
    render?: (app: ApplicationRow) => ReactNode;
    className?: string;
  }[] = [
    {
      key: 'applicant',
      header: 'Người nộp đơn',
      render: (app) => (
        <div>
          <div className="font-medium">{app.user?.fullName ?? '—'}</div>
          <div className="text-sm text-muted-foreground">{app.user?.email ?? '—'}</div>
        </div>
      )
    },
    {
      key: 'expertise',
      header: 'Chuyên môn',
      render: (app) => (
        <div className="text-sm">
          {app.expertise.length > 0 ? app.expertise.join(', ') : 'Chưa có'}
        </div>
      )
    },
    {
      key: 'certificates',
      header: 'Chứng chỉ',
      render: (app) => (
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
      render: (app) => getStatusBadge(app.status)
    },
    {
      key: 'createdAt',
      header: 'Ngày nộp',
      render: (app) => new Date(app.createdAt).toLocaleDateString('vi-VN')
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (app) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Mở menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleViewApplication(app)}>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tổng đơn" value={stats.total} description="Toàn bộ đơn đăng ký" icon={Users} />
        <StatCard title="Chờ duyệt" value={stats.pending} description="Đang chờ admin xem xét" icon={Clock} />
        <StatCard title="Đã duyệt" value={stats.approved} description="Đã trở thành giảng viên" icon={CheckCircle2} />
        <StatCard title="Đã từ chối" value={stats.rejected} description="Bị từ chối" icon={XCircle} />
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

      <DataTable<CourseSellerApplication>
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
                    <p className="text-sm text-muted-foreground">{selectedApplication.user?.fullName ?? '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground">{selectedApplication.user?.email ?? '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Số điện thoại</label>
                    <p className="text-sm text-muted-foreground">{selectedApplication.user?.phoneNumber || 'Chưa cung cấp'}</p>
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
                    {selectedApplication.certification.length > 0 ? (
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {selectedApplication.certification.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Nhấn để xem ảnh gốc"
                            className="block aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-white hover:shadow-md transition-all"
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
                      <p className="text-sm text-muted-foreground">Chưa có chứng chỉ</p>
                    )}
                  </div>
                  {selectedApplication.rejectionReason && (
                    <div>
                      <label className="text-sm font-medium text-destructive">Lý do từ chối</label>
                      <p className="text-sm text-destructive bg-destructive/5 p-2.5 rounded-lg border border-destructive/20 whitespace-pre-wrap">
                        {selectedApplication.rejectionReason}
                      </p>
                    </div>
                  )}
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
                : 'Vui lòng nhập lý do từ chối để người nộp đơn biết và cải thiện.'}
            </DialogDescription>
          </DialogHeader>

          {reviewStatus === 'REJECTED' && (
            <div className="space-y-2 py-2">
              <Label htmlFor="rejection-reason">
                Lý do từ chối <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="VD: Chứng chỉ không rõ, chuyên môn chưa phù hợp..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                maxLength={500}
                disabled={updateStatusMutation.isPending}
              />
              <p className="text-xs text-muted-foreground text-right">{rejectionReason.length}/500</p>
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={submitReview}
              className="flex-1"
              disabled={
                updateStatusMutation.isPending ||
                (reviewStatus === 'REJECTED' && !rejectionReason.trim())
              }
              variant={reviewStatus === 'REJECTED' ? 'destructive' : 'default'}
            >
              {updateStatusMutation.isPending
                ? 'Đang xử lý...'
                : reviewStatus === 'APPROVED'
                ? 'Xác nhận duyệt'
                : 'Xác nhận từ chối'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={updateStatusMutation.isPending}
            >
              Hủy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}