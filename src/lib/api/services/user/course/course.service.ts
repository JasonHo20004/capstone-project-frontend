import apiClient from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';
import type { Course } from "@/domain";

export interface GetCoursesForUserParams {
  page?: number;
  limit?: number;
  search?: string;
  level?: string;
  enrollmentStatus?: 'enrolled' | 'not_enrolled';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Actual backend response shape for paginated courses
export interface CoursesListResponse {
  success?: boolean;
  data: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

class CourseServiceUser {
  /**
   * Lấy danh sách TẤT CẢ khóa học đã published (Public)
   * Hỗ trợ tìm kiếm và lọc theo trình độ
   */
  async getAllCourses(params?: GetCoursesForUserParams): Promise<CoursesListResponse> {
    const requestParams = {
      page: params?.page || 1,
      limit: params?.limit || 5,
      search: params?.search,
      // Map 'level' frontend -> 'courseLevel' backend
      courseLevel: (params?.level && params.level !== 'all') ? params.level : undefined,
      // Cho phép sort linh hoạt (mặc định BE sẽ sort theo createdAt nếu không truyền)
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
    };

    // Dùng /courses/published (optionalAuth) thay vì /courses (requireAuth)
    const response = await apiClient.get<CoursesListResponse>('/courses/published', {
      params: requestParams,
    });
    return response.data;
  }

  /**
   * Lấy chi tiết 1 khóa học (cho trang Detail)
   */
  async getCourseById(id: string): Promise<ApiResponse<Course>> {
    const response = await apiClient.get<ApiResponse<Course>>(`/courses/${id}`);
    return response.data;
  }

  /**
   * Lấy danh sách khóa học đã mua (enrolled)
   */
  async getEnrolledCourses(): Promise<ApiResponse<Course[]>> {
    const response = await apiClient.get<ApiResponse<Course[]>>('/courses/enrolled');
    return response.data;
  }
}

export const courseServiceUser = new CourseServiceUser();