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
  myCourses: ['courses', 'my'] as const,
  detail: (id: string) => ['courses', 'detail', id] as const,
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

export const useGetMyCourses = () => {
  // Lưu ý: Hook này cần User login mới chạy được (xử lý enabled ở component hoặc check token)
  return useQuery({
    queryKey: courseKeys.myCourses,
    queryFn: async () => {
      // Giả sử courseServiceUser có hàm getMyCourses
      // Nếu chưa có, bạn cần thêm vào service giống như hướng dẫn trước
      const res = await courseServiceUser.getAllCourses({ enrollmentStatus: 'enrolled', limit: 100 });
      // Hoặc gọi endpoint riêng nếu bạn đã tách: await courseService.getMyCourses()
      return res.data; 
    },
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message);
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message);
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message);
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

/**
 * Hook để tạo lesson mới
 */
export const useCreateLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, formData }: { courseId: string; formData: FormData }) =>
      courseService.createLesson(courseId, formData),
    onSuccess: (response, variables) => {
      // Invalidate course data to refresh lesson list
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['seller-courses'] });
      toast.success('Tạo bài học thành công!');
    },
    onError: (error: any) => {
      console.error('Create lesson error:', error);
      
      // Handle timeout errors specifically
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('Thời gian tải lên quá lâu', {
          description: 'File video quá lớn hoặc kết nối chậm. Vui lòng thử lại với file nhỏ hơn hoặc kiểm tra kết nối mạng.',
        });
        return;
      }

      // Handle 401 Unauthorized
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn', {
          description: 'Vui lòng đăng nhập lại để tiếp tục.',
        });
        return;
      }

      // Handle 503 Service Unavailable (S3 connection errors)
      if (error.response?.status === 503) {
        const errorMessage = error.response?.data?.message || 'Dịch vụ lưu trữ file hiện không khả dụng.';
        toast.error('Lỗi dịch vụ lưu trữ', {
          description: errorMessage,
        });
        return;
      }

      // Handle 400 Bad Request with specific error message
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
        
        // Check for S3 connection errors in 400 response (should be 503, but handle both)
        if (errorMessage.includes('getaddrinfo') || errorMessage.includes('EAI_AGAIN') || errorMessage.includes('S3')) {
          toast.error('Lỗi kết nối dịch vụ lưu trữ', {
            description: 'Không thể kết nối đến dịch vụ lưu trữ file. Vui lòng thử lại sau hoặc liên hệ quản trị viên.',
          });
          return;
        }
        
        toast.error('Tạo bài học thất bại', {
          description: errorMessage,
        });
        return;
      }

      // Handle other errors
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tạo bài học. Vui lòng thử lại.';
      toast.error('Tạo bài học thất bại', {
        description: errorMessage,
      });
    },
  });
};



