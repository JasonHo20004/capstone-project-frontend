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
import type { Course } from "@/domain";

import  {courseServiceUser,type GetCoursesForUserParams} from '@/lib/api/services/user'
export const courseKeys = {
  // Key cache phụ thuộc vào tất cả params (bao gồm enrollmentStatus)
  list: (params: GetCoursesForUserParams) => ['courses', 'list', params] as const,
  myCourses: ['courses', 'my'] as const,
  detail: (id: string) => ['courses', 'detail', id] as const,
};

export const useGetCourses = (params: GetCoursesForUserParams) => {
  return useQuery({
    queryKey: courseKeys.list(params),
    queryFn: async () => {
      const res = await courseServiceUser.getAllCourses(params);
      return res;
    },
    placeholderData: keepPreviousData,
  });
};

export const useGetMyCourses = () => {
  return useQuery({
    queryKey: courseKeys.myCourses,
    queryFn: async () => {
      const res = await courseServiceUser.getEnrolledCourses();
      return res;
    },
  });
};

export const useEnrolledCourses = () => {
  const hasToken = Boolean(localStorage.getItem('accessToken'));
  return useQuery({
    queryKey: ['courses', 'enrolled'] as const,
    queryFn: async () => {
      const res = await courseServiceUser.getEnrolledCourses();
      return res.data ?? [];
    },
    enabled: hasToken,
  });
};
export const useGetCourseDetail = (id: string) => {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => courseService.getCourseById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    select: (response) => response.data,
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
    // Keep showing the previous result while a new filter/search loads —
    // without this, every change re-keys the query and flips isLoading=true,
    // which makes the page re-render its full-screen spinner.
    placeholderData: keepPreviousData,
    select: (response) => response.data,
  });
};

/**
 * Hook để tạo course mới
 * Supports both JSON and FormData (when uploading thumbnail)
 */
export const useCreateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCourseRequest | FormData) => courseService.createCourse(data),
    onSuccess: () => {
      // Invalidate và refetch danh sách courses
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['seller-courses'] });
      toast.success('Tạo khóa học thành công!');
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
      data: UpdateCourseRequest | FormData;
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
      queryClient.invalidateQueries({ queryKey: ['course-review-history', variables] });
      toast.success('Đã gửi khóa học để admin duyệt!');
    },
  });
};

/**
 * Read the review-workflow audit trail for one of the seller's own courses.
 * Powers the seller-facing timeline on SellerCourseDetail.
 */
export const useCourseReviewHistory = (
  courseId: string | undefined,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ['course-review-history', courseId],
    queryFn: () => courseService.getReviewHistory(courseId!),
    enabled: !!courseId && enabled,
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

/**
 * Hook để tạo lesson mới
 */
export const useCreateLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      formData,
      onProgress,
    }: {
      courseId: string;
      formData: FormData;
      onProgress?: (percent: number) => void;
    }) => courseService.createLesson(courseId, formData, onProgress),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['seller-courses'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Tạo bài học thành công!');
    },
  });
};

/**
 * Hook để cập nhật lesson
 */
export const useUpdateLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, lessonId, formData }: { courseId: string; lessonId: string; formData: FormData }) =>
      courseService.updateLesson(courseId, lessonId, formData),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['lesson', variables.courseId, variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['seller-courses'] });
      toast.success('Cập nhật bài học thành công!');
    },
  });
};

/**
 * Hook để xóa lesson — invalidate cả module list để FE refresh.
 */
export const useDeleteLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, lessonId }: { courseId: string; lessonId: string }) =>
      courseService.deleteLesson(courseId, lessonId),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['modules', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['seller-courses'] });
      queryClient.removeQueries({ queryKey: ['lesson', variables.courseId, variables.lessonId] });
      toast.success('Xóa bài học thành công!');
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data
          ?.message ??
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err instanceof Error ? err.message : 'Không thể xóa bài học');
      toast.error(msg);
    },
  });
};

// ── Module hooks ──────────────────────────────────

export const useModules = (courseId?: string) => {
  return useQuery({
    queryKey: ['modules', courseId],
    queryFn: () => courseService.getModules(courseId!),
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000,
    select: (response) => response.data,
  });
};

export const useCreateModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: { title: string; description?: string; moduleOrder?: number } }) =>
      courseService.createModule(courseId, data),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['modules', vars.courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', vars.courseId] });
      toast.success('Tạo module thành công!');
    },
  });
};

export const useUpdateModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, moduleId, data }: { courseId: string; moduleId: string; data: { title?: string; description?: string; moduleOrder?: number } }) =>
      courseService.updateModule(courseId, moduleId, data),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['modules', vars.courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', vars.courseId] });
      toast.success('Cập nhật module thành công!');
    },
  });
};

export const useDeleteModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, moduleId }: { courseId: string; moduleId: string }) =>
      courseService.deleteModule(courseId, moduleId),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['modules', vars.courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', vars.courseId] });
      toast.success('Xóa module thành công!');
    },
  });
};

export const useReorderModules = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      modules,
    }: {
      courseId: string;
      modules: { id: string; moduleOrder: number }[];
    }) => courseService.reorderModules(courseId, modules),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['modules', vars.courseId] });
    },
  });
};

export const useReorderLessons = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      lessons,
    }: {
      courseId: string;
      lessons: { id: string; lessonOrder: number }[];
    }) => courseService.reorderLessons(courseId, lessons),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['modules', vars.courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', vars.courseId] });
    },
  });
};

