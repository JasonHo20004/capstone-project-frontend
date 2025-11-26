/**
 * Export tất cả services từ một nơi để dễ import
 */
export { authService } from './user/auth/auth.service';
export { courseService } from './course.service';
export { sellerService } from './seller.service';
export { notificationService } from './notification.service';

// Export types
export type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from './user/auth/auth.service';

export type {
  CourseDetail,
  GetCoursesParams,
  SellerCoursesParams,
  CreateCourseRequest,
  UpdateCourseRequest,
} from './course.service';

export type {
  SellerDashboardStats,
  SellerLearner,
  SellerComment,
  SellerMonthlyFee,
  GetLearnersResponse,
  GetCommentsResponse,
  GetMonthlyFeesResponse,
} from './seller.service';



