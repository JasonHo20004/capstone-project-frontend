import type {
  Course,
  CourseLesson,
  CourseLevel,
  Lesson,
} from "@/domain";
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  EmptyResponse,
} from "@/lib/api/types";

/**
 * Course API Types - request/response contracts for course-related endpoints
 */

export interface CourseDetail extends Omit<Course, "lessons"> {
  lessons: CourseLesson[];
}

export interface GetCoursesParams extends PaginationParams {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  courseLevel?: CourseLevel;
  status?: Course["status"];
}

export interface SellerCoursesParams {
  status?: Course["status"] | "PUBLISHED" | "ACTIVE" | "PENDING";
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
  status?: Course["status"];
  finalTestId?: string | null;
}

// Matches actual backend response from getMany/getPublished:
// { success: true, data: Course[], total, page, limit, totalPages, hasNext, hasPrev }
export interface GetCoursesResponse {
  success?: boolean;
  data: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export type GetCourseDetailResponse = ApiResponse<CourseDetail>;

export type GetSellerCoursesResponse = ApiResponse<{
  data: Course[];
  count: number;
}>;

export type GetLessonDetailResponse = ApiResponse<Lesson>;

export type CreateOrUpdateCourseResponse = ApiResponse<Course>;

export type DeleteCourseResponse = ApiResponse<EmptyResponse>;

export type PublishCourseResponse = ApiResponse<Course>;

