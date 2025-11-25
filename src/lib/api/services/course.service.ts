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
  CourseTest,
} from '@/types/type';

/**
 * Course Service - Xử lý tất cả API calls liên quan đến courses
 */

export interface CourseDetail extends Course {
  lessons?: CourseLesson[];
  test?: CourseTest | null;
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
   */
  async createCourse(
    data: CreateCourseRequest
  ): Promise<ApiResponse<Course>> {
    const response = await apiClient.post<ApiResponse<Course>>(
      '/courses',
      data
    );
    return response.data;
  }

  /**
   * Cập nhật course (Admin/Instructor)
   */
  async updateCourse(
    id: string,
    data: UpdateCourseRequest
  ): Promise<ApiResponse<Course>> {
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
  async getLessonById(courseId: string, lessonId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/courses/${courseId}/lessons/${lessonId}`
    );
    return response.data;
  }
}

export const courseService = new CourseService();

