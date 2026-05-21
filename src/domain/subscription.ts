/**
 * Domain - Subscription entities (user FREE/PRO plans only).
 * Seller subscription was removed in favor of the commission-based revenue split.
 */

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
