import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  notificationService,
  type UserNotificationsResponse,
  type UserNotificationStats,
} from "@/lib/api/services";
import type { InAppNotification } from "@/domain";

interface NotificationQueryParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
  isArchived?: boolean;
}

const NOTIFICATIONS_QUERY_KEY = (params: NotificationQueryParams) => [
  "notifications",
  params,
];

/**
 * Fetch current user's notifications (token-based auth, no userId needed)
 */
export const useNotifications = (params: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
  isArchived?: boolean;
  enabled?: boolean;
}) => {
  const { enabled = true, ...rest } = params;

  return useQuery<UserNotificationsResponse>({
    queryKey: NOTIFICATIONS_QUERY_KEY(rest),
    queryFn: async () => {
      const response = await notificationService.getUserNotifications(rest);
      return response.data!;
    },
    enabled,
    staleTime: 60_000,
  });
};

/**
 * Fetch notification stats for current user
 */
export const useNotificationStats = () => {
  return useQuery<UserNotificationStats>({
    queryKey: ["notifications", "stats"],
    queryFn: async () => {
      const response = await notificationService.getUserStats();
      return response.data!;
    },
    staleTime: 60_000,
  });
};

/**
 * Fetch unread notification count
 */
export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const response = await notificationService.getUnreadCount();
      return response.data!;
    },
    staleTime: 30_000,
  });
};

/**
 * Mark a single notification as read
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

/**
 * Mark all notifications as read
 */
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string | undefined>({
    mutationFn: async (type?: string) => {
      return notificationService.markAllAsRead(type);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

/**
 * Archive (save) a notification — moves it out of the active inbox
 * into the "Đã lưu trữ" list.
 */
export const useArchiveNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.archiveNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

/**
 * Unarchive a notification — restores it from the saved list back
 * to the active inbox.
 */
export const useUnarchiveNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.unarchiveNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

/**
 * Delete a notification
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

/**
 * Real-time notification updates via polling
 * (SSE endpoint not yet implemented on backend, using polling fallback)
 */
export const useNotificationRealtime = (
  userId: string | undefined,
  _onNotification?: (notification: InAppNotification) => void,
) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }, 30_000);

    return () => {
      clearInterval(interval);
    };
  }, [userId, queryClient]);
};
