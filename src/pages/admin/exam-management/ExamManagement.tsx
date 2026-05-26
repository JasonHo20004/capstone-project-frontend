import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Pencil, Trash2, Plus, CheckCircle, XCircle, PenTool, Mic, BookOpen } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import FilterSection from '@/components/admin/FilterSection';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import apiClient from '@/lib/api/config';

interface TestItem {
  id: string;
  title: string;
  slug: string | null;
  status: string;
  durationInMinutes: number | null;
  totalScore: number | null;
  practiceCount: number | null;
  createdAt: string;
  updatedAt: string | null;
  englishTestType: { name: string };
  testSkills: { skill: string }[];
}

const fetchAllTests = async (): Promise<TestItem[]> => {
  const resp = await apiClient.get('/tests');
  return resp.data?.data || [];
};

const deleteTestApi = async (id: string) => {
  const resp = await apiClient.delete(`/tests/${id}`);
  return resp.data;
};

const updateTestStatusApi = async (id: string, status: string) => {
  const resp = await apiClient.put(`/tests/${id}`, { status });
  return resp.data;
};

export default function ExamManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<TestItem | null>(null);
  const [statusTarget, setStatusTarget] = useState<{ test: TestItem; nextStatus: 'PUBLISHED' | 'DRAFT' } | null>(null);
  const queryClient = useQueryClient();

  const { data: tests = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['adminTests'],
    queryFn: fetchAllTests,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTestApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTests'] });
      setDeleteTarget(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateTestStatusApi(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTests'] });
      setStatusTarget(null);
    },
  });

  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchSkill = skillFilter === 'all' || t.testSkills?.some((s) => s.skill === skillFilter);
      return matchSearch && matchStatus && matchSkill;
    });
  }, [tests, searchTerm, statusFilter, skillFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Đã xuất bản</Badge>;
      case 'DRAFT':
        return <Badge variant="outline" className="text-amber-600 border-amber-200">Bản nháp</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSkillBadge = (skills: { skill: string }[]) => {
    return skills?.map((s) => {
      const colors: Record<string, string> = {
        READING: 'bg-blue-500/10 text-blue-600 border-blue-200',
        LISTENING: 'bg-purple-500/10 text-purple-600 border-purple-200',
        WRITING: 'bg-orange-500/10 text-orange-600 border-orange-200',
        SPEAKING: 'bg-teal-500/10 text-teal-600 border-teal-200',
      };
      return (
        <Badge key={s.skill} className={colors[s.skill] || ''}>
          {s.skill}
        </Badge>
      );
    });
  };

  const columns = [
    {
      key: 'title',
      header: 'Bài thi',
      render: (test: TestItem) => (
        <div>
          <div className="font-medium">{test.title}</div>
          <div className="text-xs text-muted-foreground">{test.englishTestType?.name || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'skills',
      header: 'Kỹ năng',
      render: (test: TestItem) => <div className="flex gap-1 flex-wrap">{getSkillBadge(test.testSkills)}</div>,
    },
    {
      key: 'duration',
      header: 'Thời gian',
      render: (test: TestItem) => (test.durationInMinutes ? `${test.durationInMinutes} phút` : '—'),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (test: TestItem) => getStatusBadge(test.status),
    },
    {
      key: 'updatedAt',
      header: 'Cập nhật',
      render: (test: TestItem) => {
        const d = test.updatedAt ? new Date(test.updatedAt) : new Date(test.createdAt);
        const diff = Date.now() - d.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return <span className="text-xs text-muted-foreground">Vừa xong</span>;
        if (mins < 60) return <span className="text-xs text-muted-foreground">{mins} phút trước</span>;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return <span className="text-xs text-muted-foreground">{hours} giờ trước</span>;
        const days = Math.floor(hours / 24);
        if (days < 7) return <span className="text-xs text-muted-foreground">{days} ngày trước</span>;
        return <span className="text-xs text-muted-foreground">{d.toLocaleDateString('vi-VN')}</span>;
      },
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (test: TestItem) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => {
              const skill = test.testSkills?.[0]?.skill;
              if (skill === 'WRITING') navigate(`/admin/exams/${test.id}/edit/writing`);
              else if (skill === 'SPEAKING') navigate(`/admin/exams/${test.id}/edit/speaking`);
              else navigate(`/admin/exams/${test.id}/edit`);
            }}>
              <Pencil className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {test.status === 'DRAFT' ? (
              <DropdownMenuItem
                className="text-emerald-600"
                onClick={() => setStatusTarget({ test, nextStatus: 'PUBLISHED' })}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Xuất bản
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-amber-600"
                onClick={() => setStatusTarget({ test, nextStatus: 'DRAFT' })}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Hủy xuất bản
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={() => setDeleteTarget(test)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý bài thi</h1>
        <LoadingSpinner text="Đang tải bài thi..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý bài thi</h1>
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Không thể tải danh sách bài thi.'}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý bài thi</h1>
          <p className="text-muted-foreground">Tạo và quản lý các bài thi IELTS</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tạo bài thi mới
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Chọn loại bài thi</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/admin/exams/new')}>
              <BookOpen className="mr-2 h-4 w-4 text-blue-600" />
              Reading / Listening
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/exams/new/writing')}>
              <PenTool className="mr-2 h-4 w-4 text-orange-600" />
              Writing Test
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/exams/new/speaking')}>
              <Mic className="mr-2 h-4 w-4 text-teal-600" />
              Speaking Test
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <FilterSection
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm kiếm theo tên bài thi..."
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'DRAFT', label: 'Bản nháp' },
              { value: 'PUBLISHED', label: 'Đã xuất bản' },
            ],
            placeholder: 'Lọc theo trạng thái',
          },
          {
            value: skillFilter,
            onChange: setSkillFilter,
            options: [
              { value: 'all', label: 'Tất cả kỹ năng' },
              { value: 'READING', label: 'Reading' },
              { value: 'LISTENING', label: 'Listening' },
              { value: 'WRITING', label: 'Writing' },
              { value: 'SPEAKING', label: 'Speaking' },
            ],
            placeholder: 'Lọc theo kỹ năng',
          },
        ]}
      />

      <DataTable
        title="Danh sách bài thi"
        description={`Tổng cộng ${tests.length} bài thi`}
        data={filteredTests}
        columns={columns}
        emptyMessage="Không tìm thấy bài thi nào"
      />

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa bài thi</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài thi <strong>"{deleteTarget?.title}"</strong>? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Toggle Confirm Dialog */}
      <AlertDialog open={!!statusTarget} onOpenChange={(open) => !open && setStatusTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusTarget?.nextStatus === 'PUBLISHED' ? 'Xuất bản bài thi' : 'Hủy xuất bản bài thi'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusTarget?.nextStatus === 'PUBLISHED' ? (
                <>
                  Bài thi <strong>"{statusTarget?.test.title}"</strong> sẽ hiển thị công khai cho học viên ngay sau khi xuất bản.
                </>
              ) : (
                <>
                  Bài thi <strong>"{statusTarget?.test.title}"</strong> sẽ bị ẩn khỏi học viên. Học viên đang làm dở
                  có thể bị gián đoạn. Bạn có chắc chắn?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusMutation.isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={statusMutation.isPending}
              onClick={() =>
                statusTarget &&
                statusMutation.mutate({ id: statusTarget.test.id, status: statusTarget.nextStatus })
              }
            >
              {statusMutation.isPending
                ? 'Đang xử lý...'
                : statusTarget?.nextStatus === 'PUBLISHED'
                ? 'Xác nhận xuất bản'
                : 'Xác nhận hủy xuất bản'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
