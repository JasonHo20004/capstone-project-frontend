import { useMemo, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import FilterSection from '@/components/admin/FilterSection';
import { mockComments, mockLessons, mockCourses, mockUsers } from '@/data/mock';

type Row = {
  id: string;
  content: string;
  userName: string;
  lessonTitle: string;
  courseTitle: string;
  createdAt: string;
};

export default function SellerComments() {
  const currentUserId = localStorage.getItem('currentUserId') || '1';
  const [search, setSearch] = useState('');

  const myCourses = useMemo(() => mockCourses.filter((c) => c.courseSellerId === currentUserId), [currentUserId]);
  const myCourseIds = new Set(myCourses.map((c) => c.id));
  const lessons = mockLessons.filter((l) => myCourseIds.has(l.courseId));
  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  const userById = new Map(mockUsers.map((u) => [u.id, u]));

  const rows: Row[] = useMemo(() => {
    return mockComments
      .filter((c) => lessonById.has(c.lessonId))
      .map((c) => {
        const lesson = lessonById.get(c.lessonId)!;
        const course = myCourses.find((mc) => mc.id === lesson.courseId)!;
        const user = userById.get(c.userId);
        return {
          id: c.id,
          content: c.content,
          userName: user?.fullName || c.userId,
          lessonTitle: lesson.title,
          courseTitle: course.title,
          createdAt: c.createdAt,
        } as Row;
      })
      .filter((r) => r.content.toLowerCase().includes(search.toLowerCase()));
  }, [myCourses, lessonById, userById, search]);

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