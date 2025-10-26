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
  Check, 
  X, 
  Filter,
  Star
} from 'lucide-react';
import { mockCourses } from '@/data/admin-mock';
import { Course } from '@/types/admin';

export default function CoursesManagement() {
  const [courses] = useState<Course[]>(mockCourses);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.courseSeller.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Đang hoạt động</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Chờ duyệt</Badge>;
      case 'REFUSE':
        return <Badge className="bg-red-100 text-red-800">Từ chối</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary">Không hoạt động</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLevelBadge = (level?: string) => {
    if (!level) return <span className="text-muted-foreground">Chưa xác định</span>;
    
    const colors: Record<string, string> = {
      'A1': 'bg-blue-100 text-blue-800',
      'A2': 'bg-green-100 text-green-800',
      'B1': 'bg-yellow-100 text-yellow-800',
      'B2': 'bg-orange-100 text-orange-800',
      'C1': 'bg-red-100 text-red-800',
      'C2': 'bg-purple-100 text-purple-800'
    };

    return <Badge className={colors[level] || 'bg-gray-100 text-gray-800'}>{level}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý khóa học</h1>
          <p className="text-muted-foreground">
            Quản lý và duyệt các khóa học trong hệ thống
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách khóa học</CardTitle>
          <CardDescription>
            Tổng cộng {courses.length} khóa học
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên khóa học hoặc giảng viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Lọc
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khóa học</TableHead>
                  <TableHead>Giảng viên</TableHead>
                  <TableHead>Trình độ</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Đánh giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{course.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {course.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{course.courseSeller.fullName}</div>
                      <div className="text-sm text-muted-foreground">{course.courseSeller.email}</div>
                    </TableCell>
                    <TableCell>
                      {getLevelBadge(course.courseLevel)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(course.price)}
                    </TableCell>
                    <TableCell>
                      {course.ratingCount ? (
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{course.ratingCount}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Chưa có</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(course.status)}
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
                                <DialogTitle>Chi tiết khóa học</DialogTitle>
                                <DialogDescription>
                                  Thông tin chi tiết của khóa học "{course.title}"
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Tên khóa học</label>
                                    <p className="text-sm text-muted-foreground">{course.title}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Giá</label>
                                    <p className="text-sm text-muted-foreground">{formatCurrency(course.price)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Trình độ</label>
                                    <p className="text-sm text-muted-foreground">{course.courseLevel || 'Chưa xác định'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Trạng thái</label>
                                    <div className="mt-1">{getStatusBadge(course.status)}</div>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Mô tả</label>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {course.description || 'Chưa có mô tả'}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Thông tin giảng viên</label>
                                  <div className="mt-1 p-3 bg-muted rounded-lg">
                                    <p className="font-medium">{course.courseSeller.fullName}</p>
                                    <p className="text-sm text-muted-foreground">{course.courseSeller.email}</p>
                                  </div>
                                </div>
                                {course.status === 'PENDING' && (
                                  <div className="flex space-x-2 pt-4">
                                    <Button className="flex-1">
                                      <Check className="mr-2 h-4 w-4" />
                                      Duyệt khóa học
                                    </Button>
                                    <Button variant="destructive" className="flex-1">
                                      <X className="mr-2 h-4 w-4" />
                                      Từ chối
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          {course.status === 'PENDING' && (
                            <>
                              <DropdownMenuItem className="text-green-600">
                                <Check className="mr-2 h-4 w-4" />
                                Duyệt
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
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