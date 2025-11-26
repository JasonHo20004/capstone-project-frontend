import apiClient from '@/lib/api/config';
import type { ApiResponse, PaginatedResponse } from '@/lib/api/types';
import type { Course } from '@/types/type';

export interface GetCoursesForUserParams {
  page?: number;
  limit?: number;
  search?: string;
  level?: string;
  enrollmentStatus?: 'enrolled' | 'not_enrolled';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class CourseServiceUser {
  /**
   * Lấy danh sách TẤT CẢ khóa học (Public)
   * Hỗ trợ tìm kiếm và lọc theo trình độ
   */
  async getAllCourses(params?: GetCoursesForUserParams): Promise<ApiResponse<PaginatedResponse<Course>>> {
    const requestParams = {
      page: params?.page || 1,
      limit: params?.limit || 5,
      search: params?.search,
      // Map 'level' frontend -> 'courseLevel' backend
      courseLevel: (params?.level && params.level !== 'all') ? params.level : undefined,
      // Chỉ lấy các khoá học đang hoạt động cho màn hình người dùng
      status: 'ACTIVE',
      // Cho phép sort linh hoạt (mặc định BE sẽ sort theo createdAt nếu không truyền)
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      
      // 👇 Gửi status lọc mua/chưa mua
      enrollmentStatus: params?.enrollmentStatus, 
    };

    const response = await apiClient.get<ApiResponse<PaginatedResponse<Course>>>('/courses', {
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
}

export const courseServiceUser = new CourseServiceUser();