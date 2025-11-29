/**
 * Export tất cả services từ một nơi để dễ import
 */
export { authService } from './auth/auth.service';
export { courseServiceUser } from './course/course.serivce';
export {flashcardService} from './flashcard/flashcard.service'
export {tagService} from './flashcard/tag.service'
export {userService} from './profile/user.service'
export {topupService}  from './profile/topup.service'
export {cartService} from './cart/cart.service'
export {studentLearningService} from './learning/student-learning.service'
// Export types
export type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from './auth/auth.service';

export type {GetCoursesForUserParams} from './course/course.serivce';

export type {ReviewQuality,SubmitReviewDTO,DeckFormDTO, CardFormDTO} from './flashcard/flashcard.service'
export type {UpdateProfileDTO}from './profile/user.service'
export type {CreateTopupRequest, ConfirmPaymentRequest, CreateTopupResponse} from './profile/topup.service'
export type {CheckoutResponse} from './cart/cart.service'
export type {PaginatedParams as StudentPaginatedParams,CreateLessonCommentRequest,} from './learning/student-learning.service'
// export type {
//   Course,
//   CourseDetail,
//   Lesson,
//   GetCoursesParams,
// } from '../course.service';


export type { };

