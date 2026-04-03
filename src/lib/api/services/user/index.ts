/**
 * Export tất cả services từ một nơi để dễ import
 */
export { authService } from './auth/auth.service';
export { courseServiceUser } from './course/course.service';
export { flashcardService } from './flashcard/flashcard.service';
export { tagService } from './flashcard/tag.service';
export { userService } from './profile/user.service';
export { topupService } from './profile/topup.service';
export { cartService } from './cart/cart.service';
export { studentLearningService } from './learning/student-learning.service';
export { walletService } from './wallet/wallet.service';
export { orderService } from './order/order.service';
export { practiceService } from './practice/practice.service';
export { assessmentService } from './assessment/assessment.service';
export { userSubscriptionService } from './subscription/subscription.service';

// Export types
export type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '@/lib/api/types/auth.types';

export type { GetCoursesForUserParams, CoursesListResponse } from './course/course.service';

export type { ReviewQuality, SubmitReviewDTO, DeckFormDTO, CardFormDTO } from './flashcard/flashcard.service';
export type { UpdateProfileDTO } from './profile/user.service';
export type { CreateTopupRequest, CreateTopupResponse, TopupOrderStatus } from './profile/topup.service';
export type { CheckoutResponse } from './cart/cart.service';
export type { PaginatedParams as StudentPaginatedParams, CreateLessonCommentRequest } from './learning/student-learning.service';
export type { WalletTransactionsResponse } from './wallet/wallet.service';
export type { OrderHistoryResponse, PayOrderResponse } from './order/order.service';
export type {
  PracticeTestSummary,
  PracticeTestDetail,
  PracticeGradingResult,
} from './practice/practice.service';
export type {
  AssessmentTest,
  AssessmentTestDetail,
  AssessmentSession,
  SessionGradingResult,
} from './assessment/assessment.service';
