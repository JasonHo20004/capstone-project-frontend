import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  courseService,
  type GetCoursesParams,
  type Course,
  type CourseDetail,
} from '@/lib/api/services';

/**
 * Custom hooks cho Courses với React Query
 * Tự động quản lý loading states, caching, và error handling
 */

/**
 * Hook để lấy danh sách courses
 */
export const useCourses = (params?: GetCoursesParams) => {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => courseService.getCourses(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (response) => response.data, // Chỉ trả về data, không cần wrapper
  });
};

/**
 * Hook để lấy chi tiết một course
 */
export const useCourse = (id: string | undefined) => {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => courseService.getCourseById(id!),
    enabled: !!id, // Chỉ fetch khi có id
    staleTime: 5 * 60 * 1000,
    select: (response) => response.data,
  });
};

/**
 * Hook để tạo course mới
 */
export const useCreateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) =>
      courseService.createCourse(data),
    onSuccess: () => {
      // Invalidate và refetch danh sách courses
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Tạo khóa học thành công!');
    },
    onError: (error) => {
      // Error đã được xử lý trong interceptor
      console.error('Create course error:', error);
    },
  });
};

/**
 * Hook để cập nhật course
 */
export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Course>;
    }) => courseService.updateCourse(id, data),
    onSuccess: (response, variables) => {
      // Update cache cho course cụ thể
      queryClient.setQueryData(['course', variables.id], response);
      // Invalidate danh sách courses
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Cập nhật khóa học thành công!');
    },
  });
};

/**
 * Hook để xóa course
 */
export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => courseService.deleteCourse(id),
    onSuccess: () => {
      // Invalidate danh sách courses
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Xóa khóa học thành công!');
    },
  });
};

