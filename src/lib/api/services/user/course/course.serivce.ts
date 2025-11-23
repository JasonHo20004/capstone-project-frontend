import apiClient from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';
import type { Course } from '@/types/type';

export interface CourseFilterParams {
  search?: string;
  level?: string; // 'A1', 'B1', etc.
}

class CourseService {
  /**
   * Lấy danh sách TẤT CẢ khóa học (Public)
   * Hỗ trợ tìm kiếm và lọc theo trình độ
   */
  async getAllCourses(params?: CourseFilterParams): Promise<ApiResponse<Course[]>> {
    // Tạo query string thủ công hoặc dùng thư viện qs
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.level && params.level !== 'all') queryParams.append('level', params.level);

    const response = await apiClient.get<ApiResponse<Course[]>>(`/courses?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Lấy danh sách khóa học ĐÃ MUA của user hiện tại
   */
  async getMyCourses(): Promise<ApiResponse<Course[]>> {
    const response = await apiClient.get<ApiResponse<Course[]>>('/users/me/courses');
    return response.data;
  }

  /**
   * Lấy chi tiết 1 khóa học (cho trang Detail)
   */
  async getCourseById(id: string): Promise<ApiResponse<Course>> {
    const response = await apiClient.get<ApiResponse<Course>>(`/courses/${id}`);
    return response.data;
  }
}

export const courseService = new CourseService();