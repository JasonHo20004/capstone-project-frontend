import { useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import FilterSection from '@/components/admin/FilterSection';
import { useSellerLearners } from '@/hooks/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';

type Row = {
  userName: string;
  email?: string;
  courseTitle: string;
  purchasedAt: string;
};

export default function SellerLearners() {
  const [search, setSearch] = useState('');
  const { data: learnersData, isLoading, error } = useSellerLearners({ search, limit: 100 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Không thể tải danh sách người học. Vui lòng thử lại sau." />;
  }

  const rows: Row[] = learnersData?.learners || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Người học của tôi</h1>
      <FilterSection searchValue={search} onSearchChange={setSearch} searchPlaceholder="Tìm theo tên hoặc khoá học" />
      <DataTable
        title="Danh sách người học"
        data={rows}
        columns={[
          { key: 'userName', header: 'Tên người học' },
          { key: 'email', header: 'Email' },
          { key: 'courseTitle', header: 'Khoá học' },
          { key: 'purchasedAt', header: 'Ngày mua', render: (r) => new Date(r.purchasedAt).toLocaleString() },
        ]}
      />
    </div>
  );
}