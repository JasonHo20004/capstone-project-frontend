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
        timeout: 3600000,
      }
    );
    return response.data;
  }

  /**
   * Cập nhật lesson (Seller)
   */
  async updateLesson(
    courseId: string,
    lessonId: string,
    data: FormData
  ): Promise<GetLessonDetailResponse> {
    const response = await apiClient.patch<GetLessonDetailResponse>(
      `/courses/${courseId}/lessons/${lessonId}`,
      data,
      { timeout: 300000 }
    );
    return response.data;
  }

  // ── Lesson Comments ──────────────────────────────────

  async getComments(courseId: string, lessonId: string): Promise<any> {
    const response = await apiClient.get(`/courses/${courseId}/lessons/${lessonId}/comments`);
    return response.data;
  }

  async postComment(courseId: string, lessonId: string, content: string, parentCommentId?: string): Promise<any> {
    const response = await apiClient.post(`/courses/${courseId}/lessons/${lessonId}/comments`, {
      content,
      parentCommentId,
    });
    return response.data;
  }

  // ── Final Test Management ──────────────────────────────────

  /** Create a test in assessment-service */
  async createFinalTest(payload: {
    title: string;
    durationInMinutes: number;
    passingScore: number;
    totalScore: number;
    englishTestTypeId: string;
    testType: string;
    questions: Array<{
      questionText: string;
      questionType: string;
      options: string[];
      correctAnswerIndex: number;
      explanation?: string;
      questionOrder: number;
    }>;
  }) {
    const response = await apiClient.post<{ success: boolean; data: { id: string } }>(
      '/tests',
      payload
    );
    return response.data;
  }

  /** Link a test to a course as the final test */
  async setFinalTest(courseId: string, testId: string) {
    const response = await apiClient.put<{ success: boolean }>(
      `/courses/${courseId}/final-test`,
      { testId }
    );
    return response.data;
  }

  /** Unlink the final test from a course */
  async removeFinalTest(courseId: string) {
    const response = await apiClient.delete<{ success: boolean }>(
      `/courses/${courseId}/final-test`
    );
    return response.data;
  }

  /** Get student eligibility for the final test */
  async getStudentFinalTest(courseId: string) {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        hasFinalTest: boolean;
        finalTestId: string | null;
        isEligible: boolean;
        totalLessons?: number;
        completedLessons?: number;
      };
    }>(`/student/courses/${courseId}/final-test`);
    return response.data;
  }

  /** Get test details from assessment-service */
  async getTestById(testId: string) {
    const response = await apiClient.get<{ success: boolean; data: unknown }>(
      `/tests/${testId}`
    );
    return response.data;
  }

  /** Get test types from assessment-service */
  async getTestTypes() {
    const response = await apiClient.get<{ success: boolean; data: Array<{ id: string; name: string }> }>(
      '/tests/types'
    );
    return response.data;
  }

  // ── Module Management ──────────────────────────────────

  async getModules(courseId: string) {
    const response = await apiClient.get<{ success: boolean; data: any[] }>(
      `/courses/${courseId}/modules`
    );
    return response.data;
  }

  async createModule(courseId: string, data: { title: string; description?: string; moduleOrder?: number }) {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      `/courses/${courseId}/modules`,
      data
    );
    return response.data;
  }

  async updateModule(courseId: string, moduleId: string, data: { title?: string; description?: string; moduleOrder?: number }) {
    const response = await apiClient.put<{ success: boolean; data: any }>(
      `/courses/${courseId}/modules/${moduleId}`,
      data
    );
    return response.data;
  }

  async deleteModule(courseId: string, moduleId: string) {
    const response = await apiClient.delete<{ success: boolean }>(
      `/courses/${courseId}/modules/${moduleId}`
    );
    return response.data;
  }
}

export const courseService = new CourseService();

