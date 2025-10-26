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
  FileText,
  User
} from 'lucide-react';
import { mockCourseSellerApplications } from '@/data/admin-mock';
import { CourseSellerApplication } from '@/types/admin';

export default function ApplicationsManagement() {
  const [applications, setApplications] = useState<CourseSellerApplication[]>(mockCourseSellerApplications);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Đã duyệt</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Chờ duyệt</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Từ chối</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleApprove = (applicationId: string) => {
    setApplications(prev => 
      prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: 'APPROVED' }
          : app
      )
    );
  };

  const handleReject = (applicationId: string) => {
    setApplications(prev => 
      prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: 'REJECTED' }
          : app
      )
    );
  };

  const getStats = () => {
    const total = applications.length;
    const pending = applications.filter(app => app.status === 'PENDING').length;
    const approved = applications.filter(app => app.status === 'APPROVED').length;
    const rejected = applications.filter(app => app.status === 'REJECTED').length;

    return { total, pending, approved, rejected };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý đơn đăng ký</h1>
          <p className="text-muted-foreground">
            Duyệt và quản lý các đơn đăng ký trở thành Course Seller
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng đơn</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Từ chối</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn đăng ký</CardTitle>
          <CardDescription>
            Tổng cộng {applications.length} đơn đăng ký
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                <SelectItem value="REJECTED">Từ chối</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Lọc
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người đăng ký</TableHead>
                  <TableHead>Chuyên môn</TableHead>
                  <TableHead>Chứng chỉ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày nộp</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{application.user.fullName}</div>
                          <div className="text-sm text-muted-foreground">{application.user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {application.expertise.length > 0 ? application.expertise.join(', ') : 'Chưa có'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {application.expertise.join(', ') || 'Chưa có'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {application.certification.join(', ') || 'Chưa có'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(application.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDate(application.createdAt)}</div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Eye className="mr-2 h-4 w-4" />
                                Xem chi tiết
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Chi tiết đơn đăng ký</DialogTitle>
                                <DialogDescription>
                                  Thông tin chi tiết đơn đăng ký của {application.user.fullName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Họ và tên</label>
                                    <p className="text-sm text-muted-foreground">{application.user.fullName}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Email</label>
                                    <p className="text-sm text-muted-foreground">{application.user.email}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Chuyên môn</label>
                                    <p className="text-sm text-muted-foreground">
                                      {application.expertise.length > 0 ? application.expertise.join(', ') : 'Chưa có thông tin'}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Trạng thái</label>
                                    <div className="mt-1">{getStatusBadge(application.status)}</div>
                                  </div>
                                </div>
                                
                                {application.certification.length > 0 && (
                                  <div>
                                    <label className="text-sm font-medium">Chứng chỉ</label>
                                    <p className="text-sm text-muted-foreground mt-1">{application.certification.join(', ')}</p>
                                  </div>
                                )}
                                
                                {application.message && (
                                  <div>
                                    <label className="text-sm font-medium">Tin nhắn</label>
                                    <p className="text-sm text-muted-foreground mt-1">{application.message}</p>
                                  </div>
                                )}
                                
                                <div className="grid grid-cols-1 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Ngày nộp đơn</label>
                                    <p className="text-sm text-muted-foreground">{formatDate(application.createdAt)}</p>
                                  </div>
                                </div>

                                {application.status === 'PENDING' && (
                                  <div className="flex space-x-2 pt-4 border-t">
                                    <Button 
                                      className="flex-1"
                                      onClick={() => handleApprove(application.id)}
                                    >
                                      <Check className="mr-2 h-4 w-4" />
                                      Duyệt đơn
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      className="flex-1"
                                      onClick={() => handleReject(application.id)}
                                    >
                                      <X className="mr-2 h-4 w-4" />
                                      Từ chối
                                    </Button>
                                  </div>
                                )}

                                {application.status === 'REJECTED' && (
                                  <div className="pt-4 border-t">
                                    <label className="text-sm font-medium">Lý do từ chối</label>
                                    <Textarea 
                                      placeholder="Nhập lý do từ chối..."
                                      className="mt-1"
                                    />
                                    <Button className="mt-2" size="sm">
                                      Lưu lý do
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          {application.status === 'PENDING' && (
                            <>
                              <DropdownMenuItem 
                                className="text-green-600"
                                onClick={() => handleApprove(application.id)}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Duyệt
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleReject(application.id)}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Từ chối
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}