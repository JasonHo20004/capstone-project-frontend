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
 * Archive a notification
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
 * Real-time notification stream via SSE
 */
export const useNotificationRealtime = (
  userId: string | undefined,
  onNotification?: (notification: InAppNotification) => void,
) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;

    if (typeof EventSource === "undefined") {
      return;
    }

    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
    const streamUrl = `${API_BASE_URL}/notifications/in-app/stream?token=${encodeURIComponent(
      accessToken,
    )}`;

    const es = new EventSource(streamUrl);

    es.addEventListener("notification", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as InAppNotification;

        if (onNotification) {
          onNotification(data);
        }

        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } catch {
        // ignore parsing errors
      }
    });

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [userId, queryClient, onNotification]);
};
