import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  notificationService,
  type UserNotificationsResponse,
  type UserNotificationStats,
} from "@/lib/api/services";
import type { InAppNotification } from "@/lib/api/types";

const NOTIFICATIONS_QUERY_KEY = (userId: string, params: any) => [
  "notifications",
  userId,
  params,
];

export const useNotifications = (params: {
  userId: string | undefined;
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
  enabled?: boolean;
}) => {
  const { userId, enabled = true, ...rest } = params;

  const query = useQuery<UserNotificationsResponse>({
    queryKey: NOTIFICATIONS_QUERY_KEY(userId || "anonymous", rest),
    queryFn: async () => {
      if (!userId) {
        return {
          notifications: [],
          pagination: {
            page: rest.page ?? 1,
            limit: rest.limit ?? 10,
            total: 0,
            totalPages: 0,
          },
        };
      }

      const response = await notificationService.getUserNotifications({
        userId,
        ...rest,
      });

      return response.data!;
    },
    enabled: Boolean(userId) && enabled,
    staleTime: 60_000,
  });

  return query;
};

export const useNotificationStats = (userId: string | undefined) => {
  return useQuery<UserNotificationStats>({
    queryKey: ["notifications", "stats", userId || "anonymous"],
    queryFn: async () => {
      if (!userId) {
        return {
          total: 0,
          unread: 0,
          byType: {},
        };
      }
      const response = await notificationService.getUserStats(userId);
      return response.data!;
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
};

export const useMarkNotificationAsRead = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.markNotificationAsRead(notificationId),
    onSuccess: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "stats", userId],
      });
    },
  });
};

export const useMarkAllNotificationsAsRead = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!userId) return Promise.resolve();
      return notificationService.markAllAsRead(userId);
    },
    onSuccess: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "stats", userId],
      });
    },
  });
};

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

        // Refresh queries for this user so UI stays in sync
        queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
        queryClient.invalidateQueries({
          queryKey: ["notifications", "stats", userId],
        });
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


