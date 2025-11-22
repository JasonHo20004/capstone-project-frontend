import { useMemo, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import FilterSection from '@/components/admin/FilterSection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockCourses } from '@/data/mock';
import { formatVND } from '@/lib/utils';

export default function SellerCourses() {
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem('currentUserId') || '1';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [level, setLevel] = useState<string>('ALL');
  const [selected, setSelected] = useState<typeof mockCourses[number] | null>(null);

  const myCourses = useMemo(() => mockCourses.filter((c) => c.courseSellerId === currentUserId), [currentUserId]);

  const levels = useMemo(() => {
    const s = new Set<string>();
    myCourses.forEach((c) => c.courseLevel && s.add(c.courseLevel));
    return ['ALL', ...Array.from(s)];
  }, [myCourses]);

  const filtered = useMemo(() => {
    return myCourses.filter((c) => {
      const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
      const matchStatus = status === 'ALL' ? true : c.status === status;
      const matchLevel = level === 'ALL' ? true : c.courseLevel === level;
      return matchSearch && matchStatus && matchLevel;
    });
  }, [myCourses, search, status, level]);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'ACTIVE':
        return <Badge className="bg-green-600">Đang hoạt động</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-600">Chờ duyệt</Badge>;
      case 'REFUSE':
        return <Badge variant="destructive">Từ chối</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-gray-600">Tạm dừng</Badge>;
      default:
        return <Badge variant="outline">Khác</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Quản lý khoá học của tôi</h1>

      <FilterSection
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm kiếm theo tiêu đề"
        filters={[
          {
            value: status,
            onChange: setStatus,
            options: [
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'ACTIVE', label: 'Đang hoạt động' },
              { value: 'PENDING', label: 'Chờ duyệt' },
              { value: 'REFUSE', label: 'Từ chối' },
              { value: 'INACTIVE', label: 'Tạm dừng' },
            ],
            placeholder: 'Trạng thái'
          },
          {
            value: level,
            onChange: setLevel,
            options: levels.map((l) => ({ value: l, label: l === 'ALL' ? 'Tất cả level' : l })),
            placeholder: 'Level'
          }
        ]}
      />

      <DataTable
        title="Khoá học"
        description="Danh sách khoá học của bạn"
        data={filtered}
        columns={[
          { key: 'title', header: 'Tiêu đề' },
          { key: 'courseLevel', header: 'Level' },
          { key: 'price', header: 'Giá', render: (item) => formatVND(item.price) },
          { key: 'averageRating', header: 'Đánh giá TB', render: (item) => `${item.averageRating ?? '-'} (${item.ratingCount ?? 0})` },
          { key: 'status', header: 'Trạng thái', render: (item) => getStatusBadge(item.status) },
          {
            key: 'actions',
            header: 'Hành động',
            className: 'w-20',
            render: (item) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/seller/courses/${item.id}`)}>
                    <Eye className="mr-2 h-4 w-4" /> Xem chi tiết
                  </DropdownMenuItem>
                  {item.status === 'ACTIVE' ? (
                    <DropdownMenuItem onClick={() => alert('Tạm dừng (demo)')}>
                      <ToggleLeft className="mr-2 h-4 w-4" /> Tạm dừng
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => alert('Kích hoạt (demo)')}>
                      <ToggleRight className="mr-2 h-4 w-4" /> Kích hoạt
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }
        ]}
      />

      
    </div>
  );
}