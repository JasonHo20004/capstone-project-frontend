/**
 * EXAMPLE: Cách sử dụng Courses Service với React Query
 * 
 * File này minh họa cách sử dụng API service với:
 * - Loading states
 * - Error handling
 * - Data fetching
 * - Mutations (create, update, delete)
 */

import { useState } from 'react';
import {
  useCourses,
  useCourse,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
} from '@/hooks/api';
import { LoadingSpinner, FullPageLoading } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Example 1: Fetch danh sách courses với loading và error states
 */
export const CoursesListExample = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Sử dụng hook - tự động quản lý loading, error, và data
  const {
    data: coursesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCourses({
    page,
    limit: 10,
    search,
  });

  // Loading state
  if (isLoading) {
    return <FullPageLoading text="Đang tải danh sách khóa học..." />;
  }

  // Error state
  if (isError) {
    return (
      <ErrorMessage
        message={error?.message || 'Không thể tải danh sách khóa học'}
        onRetry={() => refetch()}
      />
    );
  }

  // Success state - render data
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {coursesData?.data.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <CardTitle>{course.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {course.description}
              </p>
              <p className="mt-2 font-semibold">{course.price} VNĐ</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {coursesData?.pagination && (
        <div className="flex justify-between items-center">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Trước
          </Button>
          <span>
            Trang {coursesData.pagination.page} / {coursesData.pagination.totalPages}
          </span>
          <Button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= coursesData.pagination.totalPages}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
};

/**
 * Example 2: Fetch chi tiết một course
 */
export const CourseDetailExample = ({ courseId }: { courseId: string }) => {
  const {
    data: course,
    isLoading,
    isError,
    error,
    refetch,
  } = useCourse(courseId);

  if (isLoading) {
    return <LoadingSpinner text="Đang tải chi tiết khóa học..." />;
  }

  if (isError) {
    return (
      <ErrorMessage
        message={error?.message || 'Không thể tải chi tiết khóa học'}
        onRetry={() => refetch()}
      />
    );
  }

  if (!course) {
    return <p>Không tìm thấy khóa học</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{course.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{course.description}</p>
        <p className="mt-4 font-semibold">Giá: {course.price} VNĐ</p>
        {course.lessons && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Danh sách bài học:</h3>
            <ul className="list-disc list-inside">
              {course.lessons.map((lesson) => (
                <li key={lesson.id}>{lesson.title}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Example 3: Create course với mutation
 */
export const CreateCourseExample = () => {
  const createCourse = useCreateCourse();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    instructor: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCourse.mutate(formData, {
      onSuccess: () => {
        // Reset form sau khi thành công
        setFormData({ title: '', description: '', price: 0, instructor: '' });
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Tiêu đề"
        value={formData.title}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, title: e.target.value }))
        }
        required
      />
      <textarea
        placeholder="Mô tả"
        value={formData.description}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, description: e.target.value }))
        }
        required
      />
      <input
        type="number"
        placeholder="Giá"
        value={formData.price}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, price: Number(e.target.value) }))
        }
        required
      />
      <input
        type="text"
        placeholder="Giảng viên"
        value={formData.instructor}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, instructor: e.target.value }))
        }
        required
      />
      <Button type="submit" disabled={createCourse.isPending}>
        {createCourse.isPending ? 'Đang tạo...' : 'Tạo khóa học'}
      </Button>
      {/* Toast notification đã được xử lý tự động trong hook */}
    </form>
  );
};

/**
 * Example 4: Update và Delete course
 */
export const CourseActionsExample = ({ courseId }: { courseId: string }) => {
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const handleUpdate = () => {
    updateCourse.mutate({
      id: courseId,
      data: { price: 999000 }, // Update price
    });
  };

  const handleDelete = () => {
    if (window.confirm('Bạn có chắc muốn xóa khóa học này?')) {
      deleteCourse.mutate(courseId);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleUpdate}
        disabled={updateCourse.isPending}
        variant="outline"
      >
        {updateCourse.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
      </Button>
      <Button
        onClick={handleDelete}
        disabled={deleteCourse.isPending}
        variant="destructive"
      >
        {deleteCourse.isPending ? 'Đang xóa...' : 'Xóa'}
      </Button>
    </div>
  );
};

