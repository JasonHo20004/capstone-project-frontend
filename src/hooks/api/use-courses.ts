import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  courseService,
  type GetCoursesParams,
  type CourseDetail,
  type SellerCoursesParams,
  type CreateCourseRequest,
  type UpdateCourseRequest,
} from '@/lib/api/services';
import type { Course } from '@/types/type';

import  {courseServiceUser,type GetCoursesForUserParams} from '@/lib/api/services/user'
export const courseKeys = {
  // Key cache phụ thuộc vào tất cả params (bao gồm enrollmentStatus)
  list: (params: GetCoursesForUserParams) => ['courses', 'list', params] as const,
};

export const useGetCourses = (params: GetCoursesForUserParams) => {
  return useQuery({
    queryKey: courseKeys.list(params),
    queryFn: async () => {
      const res = await courseServiceUser.getAllCourses(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
};
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
 * Hook để lấy danh sách courses theo seller
 */
export const useSellerCourses = (
  sellerId: string | undefined,
  params?: SellerCoursesParams
) => {
  return useQuery({
    queryKey: ['seller-courses', sellerId, params],
    queryFn: () => {
      // Nếu có sellerId và không phải empty string, dùng endpoint với sellerId
      // Nếu không, dùng endpoint /me để tự động lấy từ token
      if (sellerId && sellerId.trim() !== '') {
        return courseService.getCoursesBySeller(sellerId, params);
      } else {
        return courseService.getMyCourses(params);
      }
    },
    enabled: true, // Luôn enabled, sẽ dùng /me nếu không có sellerId
    staleTime: 2 * 60 * 1000,
    select: (response) => response.data,
  });
};

/**
 * Hook để tạo course mới
 */
export const useCreateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCourseRequest) => courseService.createCourse(data),
    onSuccess: () => {
      // Invalidate và refetch danh sách courses
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['seller-courses'] });
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
      data: UpdateCourseRequest;
    }) => courseService.updateCourse(id, data),
    onSuccess: (response, variables) => {
      // Update cache cho course cụ thể
      queryClient.setQueryData(['course', variables.id], response.data);
      // Invalidate danh sách courses
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['seller-courses'] });
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
      queryClient.invalidateQueries({ queryKey: ['seller-courses'] });
      toast.success('Xóa khóa học thành công!');
    },
  });
};

/**
 * Hook để publish course
 */
export const usePublishCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => courseService.publishCourse(id),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(['course', variables], response.data);
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['seller-courses'] });
      toast.success('Xuất bản khóa học thành công!');
    },
  });
};

/**
 * Hook để lấy chi tiết một lesson
 */
export const useLesson = (courseId: string | undefined, lessonId: string | undefined) => {
  return useQuery({
    queryKey: ['lesson', courseId, lessonId],
    queryFn: () => courseService.getLessonById(courseId!, lessonId!),
    enabled: !!courseId && !!lessonId,
    staleTime: 5 * 60 * 1000,
    select: (response) => response.data,
  });
};



