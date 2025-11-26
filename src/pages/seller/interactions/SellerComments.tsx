import { useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import FilterSection from '@/components/admin/FilterSection';
import { useSellerComments } from '@/hooks/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';

type Row = {
  id: string;
  content: string;
  userName: string;
  lessonTitle: string;
  courseTitle: string;
  createdAt: string;
};

export default function SellerComments() {
  const [search, setSearch] = useState('');
  const { data: commentsData, isLoading, error } = useSellerComments({ search, limit: 100 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Không thể tải danh sách bình luận. Vui lòng thử lại sau." />;
  }

  const rows: Row[] = commentsData?.comments || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Bình luận của người học</h1>
      <FilterSection searchValue={search} onSearchChange={setSearch} searchPlaceholder="Tìm theo nội dung bình luận" />
      <DataTable
        title="Danh sách bình luận"
        data={rows}
        columns={[
          { key: 'createdAt', header: 'Thời gian', render: (r) => new Date(r.createdAt).toLocaleString() },
          { key: 'userName', header: 'Người bình luận' },
          { key: 'courseTitle', header: 'Khoá học' },
          { key: 'lessonTitle', header: 'Bài học' },
          { key: 'content', header: 'Nội dung' },
        ]}
      />
    </div>
  );
}