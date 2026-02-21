/**
 * Domain - User and related entities
 */

import type { ApplicationStatus, UserRole } from './enums';
import type { Course } from './course';
import type { Wallet } from './transaction';

export interface User {
  id: string;
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  profilePicture?: string;
  dateOfBirth: string;
  createdAt: string;
  englishLevel?: string;
  learningGoals: string[];
  role?: UserRole;
}

export interface RefreshToken {
  id: string;
  hashedToken: string;
  userId: string;
  revoked: boolean;
  createdAt: string;
}

export interface AdministratorProfile {
  id: string;
  userId: string;
}

export interface CourseSellerProfile {
  id: string;
  certification: string[];
  expertise: string[];
  isActive: boolean;
  userId: string;
}

export interface CourseSellerApplication {
  id: string;
  userId: string;
  certification: string[];
  expertise: string[];
  message?: string;
  status: ApplicationStatus;
  rejectionReason?: string;
  createdAt: string;
}

/** User for auth contexts - minimal profile */
export interface AuthUser extends Pick<User, 'id' | 'email' | 'fullName' | 'role' | 'profilePicture'> {
  courseSellerProfile?: CourseSellerProfile;
  administratorProfile?: AdministratorProfile;
}

/** User with optional relations - use when UI needs extended data */
export interface UserWithRelations extends User {
  wallet?: Wallet;
  courses?: Course[];
}
