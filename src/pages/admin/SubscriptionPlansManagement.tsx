import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Search, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Plus,
  CreditCard,
  Users,
  Calendar
} from 'lucide-react';
import { mockSubscriptionPlans } from '@/data/admin-mock';
import { SubscriptionPlan } from '@/types/admin';

export default function SubscriptionPlansManagement() {
  const [plans] = useState<SubscriptionPlan[]>(mockSubscriptionPlans);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getStatusBadge = () => {
    return <Badge className="bg-green-100 text-green-800">Hoạt động</Badge>;
  };

  const getDurationText = (duration: number) => {
    if (duration === 30) return '1 tháng';
    if (duration === 90) return '3 tháng';
    if (duration === 180) return '6 tháng';
    if (duration === 365) return '1 năm';
    return `${duration} ngày`;
  };

  const getStats = () => {
    const total = plans.length;
    const active = plans.length; // All plans are considered active since there's no isActive field
    const totalRevenue = plans.reduce((sum, plan) => sum + plan.monthlyFee, 0);
    const totalSubscribers = 0; // No subscribers field available

    return { total, active, totalRevenue, totalSubscribers };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý gói đăng ký</h1>
          <p className="text-muted-foreground">
            Quản lý các gói đăng ký premium trong hệ thống
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tạo gói mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tạo gói đăng ký mới</DialogTitle>
              <DialogDescription>
                Tạo gói đăng ký premium mới cho người dùng
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tên gói</label>
                  <Input placeholder="Nhập tên gói..." className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Giá (VND)</label>
                  <Input type="number" placeholder="0" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Thời hạn (ngày)</label>
                  <Input type="number" placeholder="30" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Giảm giá (%)</label>
                  <Input type="number" placeholder="0" className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Mô tả</label>
                <Input placeholder="Mô tả gói đăng ký..." className="mt-1" />
              </div>
              <div className="flex space-x-2 pt-4">
                <Button variant="outline" className="flex-1">
                  Hủy
                </Button>
                <Button className="flex-1">
                  Tạo gói
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
            <CardTitle className="text-sm font-medium">Tổng gói</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng người đăng ký</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu ước tính</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách gói đăng ký</CardTitle>
          <CardDescription>
            Tổng cộng {plans.length} gói đăng ký
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên gói hoặc mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên gói</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Thời hạn</TableHead>
                  <TableHead>Giảm giá</TableHead>
                  <TableHead>Người đăng ký</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {plan.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(plan.monthlyFee)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">Tối đa {plan.maxCourses} khóa học</div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">Hoạt động</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">0 người dùng</div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">Hoạt động</Badge>
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
                                <DialogTitle>Chi tiết gói đăng ký</DialogTitle>
                                <DialogDescription>
                                  Thông tin chi tiết của gói "{plan.name}"
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Tên gói</label>
                                    <p className="text-sm text-muted-foreground">{plan.name}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Giá</label>
                                    <p className="text-sm text-muted-foreground font-medium">{formatCurrency(plan.monthlyFee)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Số khóa học tối đa</label>
                                    <p className="text-sm text-muted-foreground">{plan.maxCourses} khóa học</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Mô tả</label>
                                    <p className="text-sm text-muted-foreground">{plan.description || 'Không có mô tả'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Số người đăng ký</label>
                                    <p className="text-sm text-muted-foreground">0 người dùng</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Trạng thái</label>
                                    <div className="mt-1"><Badge className="bg-green-100 text-green-800">Hoạt động</Badge></div>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium">Mô tả</label>
                                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Gói đăng ký</label>
                                    <p className="text-sm text-muted-foreground">{plan.name}</p>
                                  </div>
                                </div>

                                <div className="flex space-x-2 pt-4 border-t">
                                  <Button variant="outline" className="flex-1">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Chỉnh sửa
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
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