import apiClient from "../config";
import type { ApiResponse, InAppNotification, PaginationMeta } from "../types";

export interface UserNotificationsResponse {
  notifications: InAppNotification[];
  pagination: PaginationMeta;
}

export interface UserNotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

export class NotificationService {
  async getUserNotifications(params: {
    userId: string;
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: string;
  }): Promise<ApiResponse<UserNotificationsResponse>> {
    const { userId, page, limit, unreadOnly, type } = params;

    const searchParams = new URLSearchParams();
    if (page) searchParams.set("page", String(page));
    if (limit) searchParams.set("limit", String(limit));
    if (unreadOnly) searchParams.set("unreadOnly", "true");
    if (type) searchParams.set("type", type);

    const query = searchParams.toString();
    const url = `/notifications/in-app/user/${userId}${
      query ? `?${query}` : ""
    }`;

    const response = await apiClient.get<ApiResponse<UserNotificationsResponse>>(
      url,
    );
    return response.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<null>> {
    const response = await apiClient.post<ApiResponse<null>>(
      `/notifications/in-app/${notificationId}/read`,
    );
    return response.data;
  }

  async markAllAsRead(userId: string): Promise<ApiResponse<{ updatedCount: number }>> {
    const response = await apiClient.post<
      ApiResponse<{
        updatedCount: number;
      }>
    >(`/notifications/in-app/user/${userId}/mark-all-read`);
    return response.data;
  }

  async getUserStats(userId: string): Promise<ApiResponse<UserNotificationStats>> {
    const response = await apiClient.get<ApiResponse<UserNotificationStats>>(
      `/notifications/in-app/user/${userId}/stats`,
    );
    return response.data;
  }
}

export const notificationService = new NotificationService();


