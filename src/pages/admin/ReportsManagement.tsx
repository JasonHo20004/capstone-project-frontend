import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Check, 
  X, 
  Filter,
  AlertTriangle,
  MessageSquare,
  User
} from 'lucide-react';
import { mockReports } from '@/data/admin-mock';
import { Report } from '@/types/admin';

export default function ReportsManagement() {
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.content && report.content.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesReason = reasonFilter === 'all' || report.reasonType === reasonFilter;
    
    return matchesSearch && matchesReason;
  });

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
    switch (status) {
      case 'RESOLVED':
        return <Badge className="bg-green-100 text-green-800">Đã giải quyết</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Đang xử lý</Badge>;
      case 'DISMISSED':
        return <Badge className="bg-red-100 text-red-800">Từ chối</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case 'INAPPROPRIATE_CONTENT':
        return (
          <div className="flex items-center space-x-1">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm">Nội dung không phù hợp</span>
          </div>
        );
      case 'COPYRIGHT_VIOLATION':
        return (
          <div className="flex items-center space-x-1">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm">Vi phạm bản quyền</span>
          </div>
        );
      case 'NOT_AS_DESCRIBED':
        return (
          <div className="flex items-center space-x-1">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Không đúng mô tả</span>
          </div>
        );
      case 'UNRESPONSIVE_INSTRUCTOR':
        return (
          <div className="flex items-center space-x-1">
            <User className="h-4 w-4 text-purple-600" />
            <span className="text-sm">GV không phản hồi</span>
          </div>
        );
      case 'INCOMPLETE_CONTENT':
        return (
          <div className="flex items-center space-x-1">
            <MessageSquare className="h-4 w-4 text-gray-600" />
            <span className="text-sm">Nội dung thiếu</span>
          </div>
        );
      default:
        return <span className="text-sm">{reason}</span>;
    }
  };

  const handleStatusChange = (reportId: string, newStatus: string) => {
    setReports(reports.map(report => 
      report.id === reportId 
        ? { ...report, status: newStatus as 'PENDING' | 'RESOLVED' | 'DISMISSED' }
        : report
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý báo cáo</h1>
        <p className="text-muted-foreground">
          Xem và xử lý các báo cáo từ người dùng về khóa học
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách báo cáo</CardTitle>
          <CardDescription>
            Tổng cộng {reports.length} báo cáo, {filteredReports.length} báo cáo được hiển thị
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên người báo cáo, email hoặc mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="PENDING">Đang xử lý</SelectItem>
                <SelectItem value="RESOLVED">Đã giải quyết</SelectItem>
                <SelectItem value="DISMISSED">Từ chối</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Lý do báo cáo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả lý do</SelectItem>
                <SelectItem value="INAPPROPRIATE_CONTENT">Nội dung không phù hợp</SelectItem>
                <SelectItem value="COPYRIGHT_VIOLATION">Vi phạm bản quyền</SelectItem>
                <SelectItem value="NOT_AS_DESCRIBED">Không đúng mô tả</SelectItem>
                <SelectItem value="UNRESPONSIVE_INSTRUCTOR">GV không phản hồi</SelectItem>
                <SelectItem value="INCOMPLETE_CONTENT">Nội dung thiếu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người báo cáo</TableHead>
                  <TableHead>Khóa học</TableHead>
                  <TableHead>Lý do</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{report.user.fullName}</div>
                        <div className="text-sm text-muted-foreground">{report.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{report.course.title}</div>
                        <div className="text-sm text-muted-foreground">
                          Giá: {report.course.price.toLocaleString('vi-VN')} VND
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getReasonBadge(report.reasonType)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={report.content}>
                        {report.content || 'Không có mô tả'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(report.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Mở menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(report.id, 'RESOLVED')}
                            className="text-green-600"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Đánh dấu đã giải quyết
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(report.id, 'DISMISSED')}
                            className="text-red-600"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Từ chối báo cáo
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Không có báo cáo</h3>
              <p className="mt-1 text-sm text-gray-500">
                Không tìm thấy báo cáo nào phù hợp với bộ lọc hiện tại.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}