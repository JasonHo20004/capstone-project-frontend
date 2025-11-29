import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { studentLearningService } from "@/lib/api/services/user";
import type {
  CreateLessonCommentRequest,
  StudentPaginatedParams,
} from "@/lib/api/services/user";
import type {
  CourseContext,
  CourseRatingsResponse,
  LessonCommentsResponse,
  LessonPlayer,
} from "@/types/student-learning";

type ForbiddenHandler = {
  onForbidden?: () => void;
};

const handleForbidden = (error: unknown, callback?: () => void) => {
  if (isAxiosError(error) && error.response?.status === 403) {
    callback?.();
  }
};

export const learningKeys = {
  context: (courseId?: string) => ["student-learning", "context", courseId] as const,
  lesson: (courseId?: string, lessonId?: string) =>
    ["student-learning", "lesson", courseId, lessonId] as const,
  comments: (
    courseId?: string,
    lessonId?: string,
    params?: StudentPaginatedParams
  ) => ["student-learning", "comments", courseId, lessonId, params] as const,
  ratings: (courseId?: string) => ["student-learning", "ratings", courseId] as const,
};

export const useCourseContext = (
  courseId: string | undefined,
  options?: ForbiddenHandler
) => {
  return useQuery({
    queryKey: learningKeys.context(courseId),
    queryFn: () => studentLearningService.getCourseContext(courseId!),
    enabled: Boolean(courseId),
    select: (response) => response.data as CourseContext,
    onError: (error) => handleForbidden(error, options?.onForbidden),
  });
};

export const useLessonPlayer = (
  courseId: string | undefined,
  lessonId: string | undefined,
  options?: ForbiddenHandler
) => {
  return useQuery({
    queryKey: learningKeys.lesson(courseId, lessonId),
    queryFn: () => studentLearningService.getLesson(courseId!, lessonId!),
    enabled: Boolean(courseId && lessonId),
    select: (response) => response.data as LessonPlayer,
    onError: (error) => handleForbidden(error, options?.onForbidden),
  });
};

export const useLessonComments = (
  courseId: string | undefined,
  lessonId: string | undefined,
  params?: StudentPaginatedParams,
  options?: ForbiddenHandler
) => {
  return useQuery({
    queryKey: learningKeys.comments(courseId, lessonId, params),
    queryFn: () => studentLearningService.getLessonComments(courseId!, lessonId!, params),
    enabled: Boolean(courseId && lessonId),
    select: (response) => response.data as LessonCommentsResponse,
    onError: (error) => handleForbidden(error, options?.onForbidden),
  });
};

export const useCourseRatings = (
  courseId: string | undefined,
  params?: StudentPaginatedParams,
  options?: ForbiddenHandler
) => {
  return useQuery({
    queryKey: learningKeys.ratings(courseId),
    queryFn: () => studentLearningService.getCourseRatings(courseId!, params),
    enabled: Boolean(courseId),
    select: (response) => {
      // Handle case when response is undefined or not an object
      if (!response || typeof response !== 'object') {
        return {
          ratings: [],
          total: 0,
          averageScore: 0,
          page: params?.page || 1,
          limit: params?.limit || 20,
        } as CourseRatingsResponse;
      }

      // Response structure from backend:
      // { success, message, data: [...ratings], averageScore, pagination: { total, page, limit } }
      const resp = response as any;
      
      // Extract ratings array - could be in response.data or response
      const ratingsArray = Array.isArray(resp.data) 
        ? resp.data 
        : (Array.isArray(resp.ratings) ? resp.ratings : []);
      
      // Extract pagination info
      const pagination = resp.pagination || {};
      
      // Build the transformed response
      const transformed: CourseRatingsResponse = {
        ratings: ratingsArray,
        total: typeof pagination.total === 'number' ? pagination.total : (resp.total || 0),
        averageScore: typeof resp.averageScore === 'number' ? resp.averageScore : 0,
        page: typeof pagination.page === 'number' ? pagination.page : (params?.page || 1),
        limit: typeof pagination.limit === 'number' ? pagination.limit : (params?.limit || 20),
      };
      
      return transformed;
    },
    onError: (error) => handleForbidden(error, options?.onForbidden),
  });
};

export const useCreateLessonComment = (
  courseId: string | undefined,
  lessonId: string | undefined,
  options?: ForbiddenHandler
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateLessonCommentRequest) =>
      studentLearningService.createLessonComment(courseId!, lessonId!, payload),
    onSuccess: () => {
      if (courseId && lessonId) {
        queryClient.invalidateQueries({ queryKey: learningKeys.comments(courseId, lessonId) });
      }
    },
    onError: (error) => handleForbidden(error, options?.onForbidden),
  });
};

export const useMarkLessonComplete = (
  courseId: string | undefined,
  lessonId: string | undefined,
  options?: ForbiddenHandler
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => studentLearningService.markLessonComplete(courseId!, lessonId!),
    onSuccess: () => {
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: learningKeys.context(courseId) });
      }
    },
    onError: (error) => handleForbidden(error, options?.onForbidden),
  });
};

