import { useMemo, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import FilterSection from '@/components/admin/FilterSection';
import { mockUserActivities, mockCourses, mockUsers } from '@/data/mock';

type Row = {
  userName: string;
  email?: string;
  courseTitle: string;
  purchasedAt: string;
};

export default function SellerLearners() {
  const currentUserId = localStorage.getItem('currentUserId') || '1';
  const [search, setSearch] = useState('');

  const myCourses = useMemo(() => mockCourses.filter((c) => c.courseSellerId === currentUserId), [currentUserId]);
  const myCourseIds = new Set(myCourses.map((c) => c.id));
  const userById = new Map(mockUsers.map((u) => [u.id, u]));

  const rows: Row[] = useMemo(() => {
    return mockUserActivities
      .filter((a) => myCourseIds.has(a.courseId) && a.transaction?.status === 'SUCCESS')
      .map((a) => {
        const user = userById.get(a.userId);
        const course = myCourses.find((c) => c.id === a.courseId)!;
        return {
          userName: user?.fullName || a.userId,
          email: user?.email,
          courseTitle: course.title,
          purchasedAt: a.createdAt,
        } as Row;
      })
      .filter((r) => r.userName.toLowerCase().includes(search.toLowerCase()) || r.courseTitle.toLowerCase().includes(search.toLowerCase()));
  }, [myCourses, myCourseIds, userById, search]);

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