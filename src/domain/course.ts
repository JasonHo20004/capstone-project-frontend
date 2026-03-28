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
  thumbnailUrl?: string;
  /** Optional relations - populated by API when requested */
  lessons?: Lesson[];
  user?: Pick<User, 'fullName' | 'id'>;
  courseSeller?: Pick<User, 'fullName' | 'id'>;
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
