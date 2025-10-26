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
  Send, 
  Filter,
  Bell,
  Plus,
  Users,
  MessageCircle
} from 'lucide-react';
import { mockNotifications } from '@/data/admin-mock';
import { Notification } from '@/types/admin';

export default function NotificationsManagement() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || notification.notificationType.name === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'sent' && notification.seen) ||
      (statusFilter === 'draft' && !notification.seen);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatDate = (date: string | null) => {
    if (!date) return 'Chưa gửi';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'SYSTEM':
        return (
          <div className="flex items-center space-x-1">
            <Bell className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Hệ thống</span>
          </div>
        );
      case 'COURSE':
        return (
          <div className="flex items-center space-x-1">
            <MessageCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm">Khóa học</span>
          </div>
        );
      case 'PROMOTION':
        return (
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="text-sm">Khuyến mãi</span>
          </div>
        );
      default:
        return <span className="text-sm">{type}</span>;
    }
  };

  const getStatusBadge = (seen: boolean) => {
    if (seen) {
      return <Badge className="bg-green-100 text-green-800">Đã xem</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Chưa xem</Badge>;
  };

  const handleMarkAsSeen = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, seen: true }
          : notification
      )
    );
  };

  const getStats = () => {
    const total = notifications.length;
    const seen = notifications.filter(n => n.seen).length;
    const unseen = notifications.filter(n => !n.seen).length;
    const system = notifications.filter(n => n.notificationType.name === 'SYSTEM').length;

    return { total, seen, unseen, system };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý thông báo</h1>
          <p className="text-muted-foreground">
            Tạo và gửi thông báo đến người dùng trong hệ thống
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tạo thông báo mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tạo thông báo mới</DialogTitle>
              <DialogDescription>
                Tạo thông báo mới để gửi đến người dùng
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tiêu đề</label>
                  <Input placeholder="Nhập tiêu đề thông báo..." className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Loại thông báo</label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Chọn loại thông báo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SYSTEM">Hệ thống</SelectItem>
                      <SelectItem value="COURSE">Khóa học</SelectItem>
                      <SelectItem value="PROMOTION">Khuyến mãi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Nội dung</label>
                <Textarea 
                  placeholder="Nhập nội dung thông báo..."
                  className="mt-1 min-h-[100px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Đối tượng nhận</label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn đối tượng nhận" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả người dùng</SelectItem>
                    <SelectItem value="STUDENTS">Học viên</SelectItem>
                    <SelectItem value="COURSE_SELLERS">Giảng viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2 pt-4">
                <Button variant="outline" className="flex-1">
                  Lưu bản nháp
                </Button>
                <Button className="flex-1">
                  <Send className="mr-2 h-4 w-4" />
                  Gửi ngay
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng thông báo</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã xem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.seen}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chưa xem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.unseen}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hệ thống</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.system}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách thông báo</CardTitle>
          <CardDescription>
            Tổng cộng {notifications.length} thông báo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="SYSTEM">Hệ thống</SelectItem>
                <SelectItem value="COURSE">Khóa học</SelectItem>
                <SelectItem value="PROMOTION">Khuyến mãi</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="sent">Đã xem</SelectItem>
                <SelectItem value="draft">Chưa xem</SelectItem>
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
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{notification.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {notification.content}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(notification.notificationType.name)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(notification.seen)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDate(notification.createdAt)}</div>
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
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Chi tiết thông báo</DialogTitle>
                                <DialogDescription>
                                  Thông tin chi tiết của thông báo "{notification.title}"
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Tiêu đề</label>
                                    <p className="text-sm text-muted-foreground">{notification.title}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Loại thông báo</label>
                                    <div className="mt-1">{getTypeBadge(notification.notificationType.name)}</div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Trạng thái</label>
                                    <div className="mt-1">{getStatusBadge(notification.seen)}</div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Ngày tạo</label>
                                    <p className="text-sm text-muted-foreground">{formatDate(notification.createdAt)}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium">Nội dung</label>
                                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                    {notification.content}
                                  </p>
                                </div>
                                
                                {!notification.seen && (
                                  <div className="pt-4 border-t">
                                    <Button 
                                      className="w-full"
                                      onClick={() => handleMarkAsSeen(notification.id)}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      Đánh dấu đã xem
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          {!notification.seen && (
                            <DropdownMenuItem 
                              className="text-blue-600"
                              onClick={() => handleMarkAsSeen(notification.id)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Đánh dấu đã xem
                            </DropdownMenuItem>
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