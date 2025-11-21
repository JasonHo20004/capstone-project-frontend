/**
 * Export tất cả services từ một nơi để dễ import
 */
export { authService } from './auth.service';
export { courseService } from './course.service';
export { userManagementService } from './admin/user-management.service';
export { courseManagementService } from './admin/course-management.service';
export { dashboardService } from './admin/dashboard.service';
export { revenueManagementService } from './admin/revenue-management.service';
export { transactionManagementService } from './admin/transaction-management.service';

// Export types
export type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from './auth.service';

export type {
  Course,
  CourseDetail,
  Lesson,
  GetCoursesParams,
} from './course.service';

export type { CreateUserRequest, UpdateUserRequest } from './admin/user-management.service';
export type { UpdateCourseRequest } from './admin/course-management.service';

export type { };

