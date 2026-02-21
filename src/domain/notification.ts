/**
 * Domain - Notification entities
 */

export interface NotificationType {
  id: string;
  name: string;
  isLocked: boolean;
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  seen: boolean;
  notificationTypeId: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  isArchived: boolean;
  createdAt: string;
  readAt?: string;
  archivedAt?: string;
  contractId?: string;
  courseId?: string;
  metadata?: Record<string, unknown>;
}
