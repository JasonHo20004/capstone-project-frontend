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
  MoreHorizontal, 
  Eye, 
  Check, 
  X, 
  AlertTriangle,
  MessageSquare,
  User,
  FileText
} from 'lucide-react';
import { mockReports } from '@/data/mock';
import { Report } from '@/types/type';
import StatCard from '@/components/admin/StatCard';
import FilterSection from '@/components/admin/FilterSection';
import DataTable from '@/components/admin/DataTable';

export default function ReportsManagement() {
  const [reports] = useState<Report[]>(mockReports);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [responseText, setResponseText] = useState('');

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || report.reasonType === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    totalReports: reports.length,
    pendingReports: reports.length, // Since Report doesn't have status, showing total
    resolvedReports: 0, // Since Report doesn't have status
    rejectedReports: 0 // Since Report doesn't have status
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'PENDING': { label: 'Đang chờ', variant: 'default' as const },
      'RESOLVED': { label: 'Đã giải quyết', variant: 'secondary' as const },
      'REJECTED': { label: 'Đã từ chối', variant: 'destructive' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      'INAPPROPRIATE_CONTENT': { label: 'Nội dung không phù hợp', variant: 'destructive' as const },
      'COPYRIGHT_VIOLATION': { label: 'Vi phạm bản quyền', variant: 'destructive' as const },
      'NOT_AS_DESCRIBED': { label: 'Không đúng mô tả', variant: 'default' as const },
      'UNRESPONSIVE_INSTRUCTOR': { label: 'GV không phản hồi', variant: 'secondary' as const },
      'INCOMPLETE_CONTENT': { label: 'Nội dung thiếu', variant: 'secondary' as const }
    };
    
    const typeInfo = typeMap[type as keyof typeof typeMap] || { label: type, variant: 'outline' as const };
    return <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>;
  };

  const handleResolveReport = (reportId: string) => {
    console.log('Resolving report:', reportId, 'with response:', responseText);
    setSelectedReport(null);
    setResponseText('');
  };

  const handleRejectReport = (reportId: string) => {
    console.log('Rejecting report:', reportId, 'with response:', responseText);
    setSelectedReport(null);
    setResponseText('');
  };

  const columns = [
    {
      key: 'report',
      header: 'Báo cáo',
      render: (report: Report) => (
        <div className="max-w-xs">
          <div className="font-medium truncate">Báo cáo khóa học</div>
          <div className="text-sm text-muted-foreground truncate">
            {report.content}
          </div>
        </div>
      )
    },
    {
      key: 'reporter',
      header: 'Người báo cáo',
      render: (report: Report) => (
        <div className="text-sm">
          <div className="font-medium">{report.user?.fullName ?? report.userId}</div>
          {report.user?.email && (
            <div className="text-muted-foreground">{report.user.email}</div>
          )}
        </div>
      )
    },
    {
      key: 'course',
      header: 'Khóa học',
      render: (report: Report) => (
        <div className="text-sm">
          <div className="font-medium truncate">{report.course?.title ?? report.courseId}</div>
          {report.course?.price !== undefined && (
            <div className="text-muted-foreground">{report.course.price.toLocaleString('vi-VN')} VND</div>
          )}
        </div>
      )
    },
    {
      key: 'type',
      header: 'Lý do',
      render: (report: Report) => getTypeBadge(report.reasonType)
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (report: Report) => (
        <div className="text-sm">{formatDate(report.createdAt)}</div>
      )
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (report: Report) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Mở menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setSelectedReport(report)}>
              <Eye className="mr-2 h-4 w-4" />
              Xem chi tiết
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSelectedReport(report)}>
              <Check className="mr-2 h-4 w-4" />
              Giải quyết
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedReport(report)}>
              <X className="mr-2 h-4 w-4" />
              Từ chối
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const typeOptions = [
    { value: 'all', label: 'Tất cả lý do' },
    { value: 'INAPPROPRIATE_CONTENT', label: 'Nội dung không phù hợp' },
    { value: 'COPYRIGHT_VIOLATION', label: 'Vi phạm bản quyền' },
    { value: 'NOT_AS_DESCRIBED', label: 'Không đúng mô tả' },
    { value: 'UNRESPONSIVE_INSTRUCTOR', label: 'GV không phản hồi' },
    { value: 'INCOMPLETE_CONTENT', label: 'Nội dung thiếu' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý báo cáo</h1>
        <p className="text-muted-foreground">
          Xem xét và xử lý các báo cáo từ người dùng
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng báo cáo"
          value={stats.totalReports.toString()}
          description="Tất cả báo cáo"
          icon={FileText}
        />
        <StatCard
          title="Đang chờ"
          value={stats.pendingReports.toString()}
          description="Báo cáo chờ xử lý"
          icon={AlertTriangle}
        />
        <StatCard
          title="Đã giải quyết"
          value={stats.resolvedReports.toString()}
          description="Báo cáo đã xử lý"
          icon={Check}
        />
        <StatCard
          title="Đã từ chối"
          value={stats.rejectedReports.toString()}
          description="Báo cáo bị từ chối"
          icon={X}
        />
      </div>

      <FilterSection
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm kiếm theo nội dung báo cáo..."
        filters={[
          {
            value: typeFilter,
            onChange: setTypeFilter,
            options: typeOptions,
            placeholder: "Lọc theo lý do"
          }
        ]}
      />

      <DataTable
        title="Danh sách báo cáo"
        description={`Tổng cộng ${reports.length} báo cáo`}
        data={filteredReports}
        columns={columns}
        emptyMessage="Không tìm thấy báo cáo nào"
      />

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết báo cáo</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết và xử lý báo cáo
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nội dung báo cáo</label>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {selectedReport.content}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Người báo cáo</label>
                  <div className="mt-1">
                    <p className="text-sm font-medium">{selectedReport.user?.fullName ?? selectedReport.userId}</p>
                    {selectedReport.user?.email && (
                      <p className="text-sm text-muted-foreground">{selectedReport.user.email}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Khóa học</label>
                  <div className="mt-1">
                    <p className="text-sm font-medium">{selectedReport.course?.title ?? selectedReport.courseId}</p>
                    {selectedReport.course?.price !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        {selectedReport.course.price.toLocaleString('vi-VN')} VND
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Lý do báo cáo</label>
                  <div className="mt-1">
                    {getTypeBadge(selectedReport.reasonType)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Ngày tạo</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(selectedReport.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <label className="text-sm font-medium">Phản hồi</label>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Nhập phản hồi cho báo cáo này..."
                  className="mt-1"
                  rows={3}
                />
                <div className="flex justify-end space-x-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => handleRejectReport(selectedReport.id)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Từ chối
                  </Button>
                  <Button onClick={() => handleResolveReport(selectedReport.id)}>
                    <Check className="mr-2 h-4 w-4" />
                    Giải quyết
                  </Button>
                </div>
              </div>
            </div>
          )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }