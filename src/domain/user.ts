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
  /** Soft moderation status; admin can suspend or ban accounts. */
  userStatus?: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  suspendedUntil?: string | null;
  statusReason?: string | null;
  /** Populated when API returns user with wallet relation (e.g. /users/profile) */
  wallet?: Wallet;
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
  /** Populated when API returns application with user relation */
  user?: User;
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
