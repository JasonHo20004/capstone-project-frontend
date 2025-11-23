/**
 * Export tất cả services từ một nơi để dễ import
 */
export { authService } from './auth/auth.service';
export { courseService } from './course/course.serivce';
export {flashcardService} from './flashcard/flashcard.service'
export {tagService} from './flashcard/tag.service'
export {userService} from './profile/user.service'
// Export types
export type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from './auth/auth.service';

export type{
CourseFilterParams
} from './course/course.serivce'

export type {ReviewQuality,SubmitReviewDTO,DeckFormDTO, CardFormDTO} from './flashcard/flashcard.service'
export type {UpdateProfileDTO}from './profile/user.service'
// export type {
//   Course,
//   CourseDetail,
//   Lesson,
//   GetCoursesParams,
// } from '../course.service';


export type { };

