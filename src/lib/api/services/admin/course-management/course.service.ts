import apiClient from '../../../config'
import type { ApiResponse } from '../../../types'
import type { Course, CourseLevel, CourseStatus } from '@/types/type'



export interface UpdateCourseRequest {
  title?: string
  description?: string
  price?: number
  courseLevel?: CourseLevel
  status?: CourseStatus
}

class CourseManagementService {
  async createCourse(data: Partial<Course>): Promise<ApiResponse<Course>> {
    const response = await apiClient.post<ApiResponse<Course>>('/admin/courses', data)
    return response.data
  }

  async getCourses(): Promise<ApiResponse<Course[]>> {
    const response = await apiClient.get<ApiResponse<Course[]>>('/admin/courses')
    return response.data
  }

  async getCourseById(id: string): Promise<ApiResponse<Course>> {
    const response = await apiClient.get<ApiResponse<Course>>(`/admin/courses/${id}`)
    return response.data
  }

  async updateCourse(id: string, data: Partial<Course>): Promise<ApiResponse<Course>> {
    const response = await apiClient.put<ApiResponse<Course>>(`/admin/courses/${id}`, data)
    return response.data
  }

  async deleteCourse(id: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.delete<ApiResponse<{ success: boolean }>>(`/admin/courses/${id}`)
    return response.data
  }

  async getLessons(courseId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>(`/admin/courses/${courseId}/lessons`)
    return response.data
  }

  async createLesson(courseId: string, data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/courses/${courseId}/lessons`, data)
    return response.data
  }

  async updateLesson(courseId: string, lessonId: string, data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/courses/${courseId}/lessons/${lessonId}`, data)
    return response.data
  }

  async getLessonById(courseId: string, lessonId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>(`/admin/courses/${courseId}/lessons/${lessonId}`)
    return response.data
  }

  async deleteLesson(courseId: string, lessonId: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.delete<ApiResponse<{ success: boolean }>>(`/admin/courses/${courseId}/lessons/${lessonId}`)
    return response.data
  }

  async getRatings(courseId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>(`/admin/courses/${courseId}/ratings`)
    return response.data
  }

  async deleteRating(courseId: string, ratingId: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.delete<ApiResponse<{ success: boolean }>>(`/admin/courses/${courseId}/ratings/${ratingId}`)
    return response.data
  }

  async deleteComment(courseId: string, lessonId: string, commentId: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.delete<ApiResponse<{ success: boolean }>>(`/admin/courses/${courseId}/lessons/${lessonId}/comments/${commentId}`)
    //router.delete('/:courseId/lessons/:lessonId/comments/:commentId', courseManagementController.deleteComment);
    return response.data
  }
}

export const courseManagementService = new CourseManagementService()