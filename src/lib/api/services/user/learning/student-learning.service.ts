import apiClient from "@/lib/api/config";
import type { ApiResponse } from "@/lib/api/types";
import type {
  CourseContext,
  CourseRatingsResponse,
  LessonCommentsResponse,
  LessonPlayer,
} from "@/types/student-learning";

export interface PaginatedParams {
  page?: number;
  limit?: number;
}

export interface CreateLessonCommentRequest {
  content: string;
  parentCommentId?: string;
}

class StudentLearningService {
  async getCourseContext(courseId: string) {
    const response = await apiClient.get<ApiResponse<CourseContext>>(
      `/student/courses/${courseId}/context`
    );
    return response.data;
  }

  async getLesson(courseId: string, lessonId: string) {
    const response = await apiClient.get<ApiResponse<LessonPlayer>>(
      `/student/courses/${courseId}/lessons/${lessonId}`
    );
    return response.data;
  }

  async getLessonComments(
    courseId: string,
    lessonId: string,
    params?: PaginatedParams
  ) {
    const response = await apiClient.get<ApiResponse<LessonCommentsResponse>>(
      `/student/courses/${courseId}/lessons/${lessonId}/comments`,
      { params }
    );
    return response.data;
  }

  async createLessonComment(
    courseId: string,
    lessonId: string,
    payload: CreateLessonCommentRequest
  ) {
    const response = await apiClient.post<ApiResponse<LessonCommentsResponse["comments"][number]>>(
      `/student/courses/${courseId}/lessons/${lessonId}/comments`,
      payload
    );
    return response.data;
  }

  async getCourseRatings(courseId: string, params?: PaginatedParams) {
    // Backend returns: { success, message, data: [...ratings], averageScore, pagination }
    const response = await apiClient.get<any>(
      `/student/courses/${courseId}/ratings`,
      { params }
    );
    return response.data;
  }

  async markLessonComplete(courseId: string, lessonId: string) {
    const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>(
      `/student/courses/${courseId}/lessons/${lessonId}/complete`
    );
    return response.data;
  }
}

export const studentLearningService = new StudentLearningService();

