/**
 * Domain - Subscription entities
 */

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
