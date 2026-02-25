import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  subscriptionPlanService,
  type CreateSubscriptionPlanRequest,
  type UpdateSubscriptionPlanRequest,
} from "@/lib/api/services/admin";

const SUBSCRIPTION_PLANS_KEY = ["admin", "subscription-plans"] as const;

export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: SUBSCRIPTION_PLANS_KEY,
    queryFn: async () => {
      const res = await subscriptionPlanService.getPlans();
      return res.data ?? [];
    },
    staleTime: 60 * 1000,
  });
};

export const useCreateSubscriptionPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubscriptionPlanRequest) =>
      subscriptionPlanService.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_PLANS_KEY });
      toast.success("Tạo gói đăng ký thành công");
    },
    onError: () => {
      toast.error("Không thể tạo gói đăng ký");
    },
  });
};

export const useUpdateSubscriptionPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSubscriptionPlanRequest;
    }) => subscriptionPlanService.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_PLANS_KEY });
      toast.success("Cập nhật gói đăng ký thành công");
    },
    onError: () => {
      toast.error("Không thể cập nhật gói đăng ký");
    },
  });
};
