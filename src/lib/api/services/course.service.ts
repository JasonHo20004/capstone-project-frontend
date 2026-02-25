import apiClient from '../config';
import type { Course, Lesson } from "@/domain";
import type {
  CreateCourseRequest,
  UpdateCourseRequest,
  GetCoursesParams,
  SellerCoursesParams,
  GetCoursesResponse,
  GetCourseDetailResponse,
  GetSellerCoursesResponse,
  GetLessonDetailResponse,
  CreateOrUpdateCourseResponse,
  DeleteCourseResponse,
  PublishCourseResponse,
} from '../types/course.types';

class CourseService {
  /**
   * Lấy danh sách courses với pagination và filters
   */
  async getCourses(
    params?: GetCoursesParams
  ): Promise<GetCoursesResponse> {
    const response = await apiClient.get<GetCoursesResponse>(
      '/courses',
      { params }
    );
    return response.data;
  }

  /**
   * Lấy chi tiết một course
   */
  async getCourseById(id: string): Promise<GetCourseDetailResponse> {
    const response = await apiClient.get<GetCourseDetailResponse>(
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
  ): Promise<CreateOrUpdateCourseResponse> {
    // Axios interceptor will automatically handle FormData Content-Type with boundary
    const response = await apiClient.post<CreateOrUpdateCourseResponse>(
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
  ): Promise<CreateOrUpdateCourseResponse> {
    // Axios interceptor will automatically handle FormData Content-Type with boundary
    const response = await apiClient.put<CreateOrUpdateCourseResponse>(
      `/courses/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Xóa course (Admin/Instructor)
   */
  async deleteCourse(id: string): Promise<DeleteCourseResponse> {
    const response = await apiClient.delete<DeleteCourseResponse>(
      `/courses/${id}`
    );
    return response.data;
  }

  /**
   * Publish course (seller/admin)
   */
  async publishCourse(id: string): Promise<PublishCourseResponse> {
    const response = await apiClient.put<PublishCourseResponse>(
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
  ): Promise<GetSellerCoursesResponse> {
    const response = await apiClient.get<
      GetSellerCoursesResponse
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
  ): Promise<GetSellerCoursesResponse> {
    const response = await apiClient.get<
      GetSellerCoursesResponse
    >('/courses/seller/me', {
      params,
    });
    return response.data;
  }

  /**
   * Lấy chi tiết một lesson
   */
  async getLessonById(courseId: string, lessonId: string): Promise<GetLessonDetailResponse> {
    const response = await apiClient.get<GetLessonDetailResponse>(
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
  ): Promise<GetLessonDetailResponse> {
    const response = await apiClient.post<GetLessonDetailResponse>(
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

