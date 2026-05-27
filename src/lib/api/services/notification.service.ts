import apiClient from "@/lib/api/config";
import type { ApiResponse } from "@/lib/api/types";
import type { InAppNotification } from "@/domain";
import type { PaginationMeta } from "@/lib/api/types";

export interface UserNotificationsResponse {
  notifications: InAppNotification[];
  pagination: PaginationMeta;
}

export interface UserNotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

export interface UnreadCountResponse {
  total: number;
  byType: Record<string, number>;
}

export class NotificationService {
  /**
   * List current user's notifications (token-based, no userId needed)
   * GET /notifications
   */
  async getUserNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: string;
  }): Promise<ApiResponse<UserNotificationsResponse>> {
    const response = await apiClient.get<ApiResponse<UserNotificationsResponse>>(
      "/notifications",
      { params }
    );
    return response.data;
  }

  /**
   * Get single notification
   * GET /notifications/:id
   */
  async getNotification(id: string): Promise<ApiResponse<InAppNotification>> {
    const response = await apiClient.get<ApiResponse<InAppNotification>>(
      `/notifications/${id}`
    );
    return response.data;
  }

  /**
   * Mark a notification as read
   * PATCH /notifications/:id/read
   */
  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<InAppNotification>> {
    const response = await apiClient.patch<ApiResponse<InAppNotification>>(
      `/notifications/${notificationId}/read`
    );
    return response.data;
  }

  /**
   * Mark all notifications as read
   * POST /notifications/read-all
   */
  async markAllAsRead(type?: string): Promise<ApiResponse<{ count: number }>> {
    const response = await apiClient.post<ApiResponse<{ count: number }>>(
      "/notifications/read-all",
      { type }
    );
    return response.data;
  }

  /**
   * Archive a notification
   * PATCH /notifications/:id/archive
   */
  async archiveNotification(notificationId: string): Promise<ApiResponse<InAppNotification>> {
    const response = await apiClient.patch<ApiResponse<InAppNotification>>(
      `/notifications/${notificationId}/archive`
    );
    return response.data;
  }

  /**
   * Delete a notification
   * DELETE /notifications/:id
   */
  async deleteNotification(notificationId: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/notifications/${notificationId}`
    );
    return response.data;
  }

  /**
   * Get unread notification count
   * GET /notifications/unread-count
   */
  async getUnreadCount(): Promise<ApiResponse<UnreadCountResponse>> {
    const response = await apiClient.get<ApiResponse<UnreadCountResponse>>(
      "/notifications/unread-count"
    );
    return response.data;
  }

  /**
   * Get notification stats for current user
   * GET /notifications/stats
   */
  async getUserStats(): Promise<ApiResponse<UserNotificationStats>> {
    const response = await apiClient.get<ApiResponse<UserNotificationStats>>(
      "/notifications/stats"
    );
    return response.data;
  }

  // ── Admin campaign endpoints ───────────────────────────────────────────
  async runCampaign(payload: CampaignPayload): Promise<ApiResponse<CampaignResult>> {
    const response = await apiClient.post<ApiResponse<CampaignResult>>(
      "/notifications/admin/campaign",
      payload
    );
    return response.data;
  }

  async previewCampaign(
    segment: CampaignSegment
  ): Promise<ApiResponse<{ recipientCount: number }>> {
    const response = await apiClient.post<ApiResponse<{ recipientCount: number }>>(
      "/notifications/admin/campaign/preview",
      { segment }
    );
    return response.data;
  }
}

export type CampaignSegment =
  | { kind: "all" }
  | { kind: "role"; roles: string[] }
  | { kind: "user-ids"; userIds: string[] };

export interface CampaignPayload {
  title: string;
  content: string;
  type: string;
  metadata?: Record<string, unknown>;
  segment: CampaignSegment;
}

export interface CampaignResult {
  recipientCount: number;
  createdCount: number;
  segmentKind: CampaignSegment["kind"];
}

export const notificationService = new NotificationService();
