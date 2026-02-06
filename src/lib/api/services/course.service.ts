import apiClient from '../config';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  EmptyResponse,
} from '../types';
import type {
  Course,
  CourseLesson,
  CourseLevel,
  Lesson,
} from '@/types/type';

/**
 * Course Service - Xử lý tất cả API calls liên quan đến courses
 */

export interface CourseDetail extends Omit<Course, 'lessons'> {
  lessons: CourseLesson[];
}

export interface GetCoursesParams extends PaginationParams {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  courseLevel?: CourseLevel;
  status?: Course['status'];
}

export interface SellerCoursesParams {
  status?: Course['status'] | 'PUBLISHED' | 'ACTIVE' | 'PENDING';
}

export interface CreateCourseRequest {
  title: string;
  price: number;
  description?: string;
  category?: string;
  courseLevel?: CourseLevel;
  finalTestId?: string | null;
}

export interface UpdateCourseRequest {
  title?: string;
  price?: number;
  description?: string;
  category?: string;
  courseLevel?: CourseLevel;
  status?: Course['status'];
  finalTestId?: string | null;
}

class CourseService {
  /**
   * Lấy danh sách courses với pagination và filters
   */
  async getCourses(
    params?: GetCoursesParams
  ): Promise<ApiResponse<PaginatedResponse<Course>>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Course>>>(
      '/courses',
      { params }
    );
    return response.data;
  }

  /**
   * Lấy chi tiết một course
   */
  async getCourseById(id: string): Promise<ApiResponse<CourseDetail>> {
    const response = await apiClient.get<ApiResponse<CourseDetail>>(
      `/courses/${id}`
    );
    return response.data;
  }

  /**
   * Tạo course mới (Admin/Instructor)
   * Supports both JSON (when no file) and FormData (when uploading thumbnail)
   */
  async createCourse(
    data: CreateCourseRequest | FormData
  ): Promise<ApiResponse<Course>> {
    // Axios interceptor will automatically handle FormData Content-Type with boundary
    const response = await apiClient.post<ApiResponse<Course>>(
      '/courses',
      data
    );
    return response.data;
  }

  /**
   * Cập nhật course (Admin/Instructor)
   * Supports both JSON (when no file) and FormData (when uploading thumbnail)
   */
  async updateCourse(
    id: string,
    data: UpdateCourseRequest | FormData
  ): Promise<ApiResponse<Course>> {
    // Axios interceptor will automatically handle FormData Content-Type with boundary
    const response = await apiClient.put<ApiResponse<Course>>(
      `/courses/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Xóa course (Admin/Instructor)
   */
  async deleteCourse(id: string): Promise<ApiResponse<EmptyResponse>> {
    const response = await apiClient.delete<ApiResponse<EmptyResponse>>(
      `/courses/${id}`
    );
    return response.data;
  }

  /**
   * Publish course (seller/admin)
   */
  async publishCourse(id: string): Promise<ApiResponse<Course>> {
    const response = await apiClient.put<ApiResponse<Course>>(
      `/courses/${id}/publish`
    );
    return response.data;
  }

  /**
   * Lấy courses theo seller
   */
  async getCoursesBySeller(
    sellerId: string,
    params?: SellerCoursesParams
  ): Promise<ApiResponse<{ data: Course[]; count: number }>> {
    const response = await apiClient.get<
      ApiResponse<{ data: Course[]; count: number }>
    >(`/courses/seller/${sellerId}`, {
      params,
    });
    return response.data;
  }

  /**
   * Lấy courses của seller hiện tại (tự động lấy từ token)
   */
  async getMyCourses(
    params?: SellerCoursesParams
  ): Promise<ApiResponse<{ data: Course[]; count: number }>> {
    const response = await apiClient.get<
      ApiResponse<{ data: Course[]; count: number }>
    >('/courses/seller/me', {
      params,
    });
    return response.data;
  }

  /**
   * Lấy chi tiết một lesson
   */
  async getLessonById(courseId: string, lessonId: string): Promise<ApiResponse<Lesson>> {
    const response = await apiClient.get<ApiResponse<Lesson>>(
      `/courses/${courseId}/lessons/${lessonId}`
    );
    return response.data;
  }

  /**
   * Tạo lesson mới (Seller/Admin)
   */
  async createLesson(
    courseId: string,
    data: FormData
  ): Promise<ApiResponse<Lesson>> {
    const response = await apiClient.post<ApiResponse<Lesson>>(
      `/courses/${courseId}/lessons`,
      data,
      {
        // Don't set Content-Type header - axios will set it automatically with boundary for FormData
        // Increased timeout to 5 minutes (300000ms) for large video file uploads
        timeout: 300000,
      }
    );
    return response.data;
  }
}

export const courseService = new CourseService();

