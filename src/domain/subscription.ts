/**
 * Domain - Subscription entities
 */

// ── Seller Subscription (existing) ──────────────────────────────────────

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  maxCourses: number;
  monthlyFee: number;
}

export interface SubscriptionContract {
  id: string;
  courseSellerId: string;
  status: boolean;
  subscriptionPlanId: string;
  createdAt: string;
  expiresAt: string;
  updatedAt?: string;
  renewalCount: number;
  lastRenewalAt?: string;
  notes?: string;
  lastNotificationAt?: string;
}

// ── User Subscription (new - Free/Pro plans) ────────────────────────────

export type UserPlanType = 'FREE' | 'PRO';

export interface UserPlan {
  id: string;
  name: string;
  type: UserPlanType;
  price: number;
  description?: string;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  plan: UserPlan;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserSubscriptionStatus {
  plan: UserPlan | null;
  subscription: UserSubscription | null;
  isProUser: boolean;
}

/** Premium feature keys used for access checks */
export type PremiumFeature =
  | 'ai_speaking'
  | 'ai_writing'
  | 'dictation'
  | 'learning_path'
  | 'skill_tree';
