import apiClient from '../config';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  EmptyResponse,
} from '../types';

/**
 * Course Service - Xử lý tất cả API calls liên quan đến courses
 */

// Types cho Course
export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  instructor: string;
  thumbnail?: string;
  rating?: number;
  totalStudents?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseDetail extends Course {
  lessons: Lesson[];
  requirements?: string[];
  whatYouWillLearn?: string[];
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  order: number;
  duration?: number;
}

export interface GetCoursesParams extends PaginationParams {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
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
    data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>
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
    data: Partial<Course>
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
}

export const courseService = new CourseService();

