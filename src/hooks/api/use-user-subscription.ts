import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { userSubscriptionService } from "@/lib/api/services/user";
import type { UserSubscriptionStatus } from "@/domain";

const PLANS_KEY = ["user-plans"] as const;
export const MY_SUBSCRIPTION_KEY = ["my-subscription"] as const;
const SUBSCRIPTION_HISTORY_KEY = ["subscription-history"] as const;

export const SUBSCRIPTION_CACHE_KEY = "capstone_my_subscription";

function hasAccessToken(): boolean {
  return !!localStorage.getItem("accessToken");
}

function readCachedSubscription(): UserSubscriptionStatus | null | undefined {
  if (!hasAccessToken()) return null;
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    if (raw === null) return undefined;
    return JSON.parse(raw) as UserSubscriptionStatus | null;
  } catch {
    localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
    return undefined;
  }
}

export const useUserPlans = () => {
  return useQuery({
    queryKey: PLANS_KEY,
    queryFn: async () => {
      const res = await userSubscriptionService.getPlans();
      return res.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useMySubscription = () => {
  const authed = hasAccessToken();
  return useQuery({
    queryKey: MY_SUBSCRIPTION_KEY,
    queryFn: async () => {
      const res = await userSubscriptionService.getMySubscription();
      return res.data ?? null;
    },
    staleTime: 60 * 1000,
    // Guests have no subscription: don't hit the API, and resolve to null
    // instead of any cached value.
    enabled: authed,
    initialData: authed ? readCachedSubscription : null,
    initialDataUpdatedAt: 0,
  });
};

export const useSubscribe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => userSubscriptionService.subscribe(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_SUBSCRIPTION_KEY });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      toast.success("Đăng ký gói thành công!");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || "Không thể đăng ký gói. Vui lòng thử lại.";
      toast.error(message);
    },
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => userSubscriptionService.cancelSubscription(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: MY_SUBSCRIPTION_KEY });
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_HISTORY_KEY });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      const refund = res.data?.refundAmount || 0;
      if (refund > 0) {
        const formatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(refund);
        toast.success(`Đã hủy gói. Hoàn tiền ${formatted} vào ví.`);
      } else {
        toast.success("Đã hủy gói đăng ký");
      }
    },
    onError: () => {
      toast.error("Không thể hủy gói đăng ký");
    },
  });
};

export const useCheckFeatureAccess = (feature: string) => {
  return useQuery({
    queryKey: ["feature-access", feature],
    queryFn: async () => {
      const res = await userSubscriptionService.checkFeatureAccess(feature);
      return res.data?.hasAccess ?? false;
    },
    staleTime: 30 * 1000,
    enabled: !!feature,
  });
};

export const useSubscriptionHistory = () => {
  return useQuery({
    queryKey: SUBSCRIPTION_HISTORY_KEY,
    queryFn: async () => {
      const res = await userSubscriptionService.getHistory();
      return res.data ?? [];
    },
    staleTime: 60 * 1000,
  });
};
