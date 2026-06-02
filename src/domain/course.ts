/**
 * Domain - Course, Lesson entities
 */

import type { CourseLevel, CourseStatus } from './enums';
import type { User } from './user';

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  durationInSeconds?: number;
  lessonOrder?: number;
  videoUrl?: string;
  materials: string[];
  commentCount?: number;
  courseId: string;
  /** When set, this is a quiz lesson pointing to a Test in assessment-service. */
  testId?: string | null;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  price: number;
  category?: string;
  courseLevel?: CourseLevel;
  courseSellerId: string;
  finalTestId?: string;
  ratingCount?: number;
  status: CourseStatus;
  createdAt: string;
  updatedAt?: string;
  averageRating?: number;
  sellerName?: string;
  lessonCount?: number;
  thumbnailUrl?: string;
  requirements?: string[];
  targetAudiences?: string[];
  // Review workflow metadata (latest values; full audit trail at
  // GET /courses/:id/review-history). Nullable when no transition yet.
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  reviewedById?: string | null;
  /**
   * Active "Chưa đạt yêu cầu" quality flag (admin view only), or null. Derived
   * server-side from the review history; not a stored column.
   */
  qualityFlag?: QualityFlag | null;
  /** Optional relations - populated by API when requested */
  lessons?: Lesson[];
  user?: Pick<User, 'fullName' | 'id'>;
  courseSeller?: Pick<User, 'fullName' | 'id'>;
}

export interface QualityFlag {
  reason: string;
  flaggedAt: string;
  deadlineAt: string;
  confirmed: boolean;
}

export interface CourseLesson {
  lessonId: string;
  courseId: string;
  lesson?: Lesson;
  course?: Course;
}

export interface CourseWithStats extends Course {
  averageRating: number;
  lessonsCount: number;
  ratingsCount: number;
  lessons: Lesson[];
  courseSeller: User;
}
