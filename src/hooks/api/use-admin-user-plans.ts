import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminUserPlanService,
  type UpdateUserPlanRequest,
  type CreateUserPlanRequest,
} from "@/lib/api/services/admin/user-plans/user-plan.service";
import type { AxiosError } from "axios";

const extractApiError = (err: unknown, fallback: string) => {
  const axErr = err as AxiosError<{ error?: string; message?: string }>;
  return axErr?.response?.data?.error ?? axErr?.response?.data?.message ?? fallback;
};

const ADMIN_USER_PLANS_KEY = ["admin", "user-plans"] as const;

export const useAdminUserPlans = () => {
  return useQuery({
    queryKey: ADMIN_USER_PLANS_KEY,
    queryFn: async () => {
      const res = await adminUserPlanService.getPlans();
      return res.data ?? [];
    },
    staleTime: 60 * 1000,
  });
};

export const useUpdateUserPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserPlanRequest }) =>
      adminUserPlanService.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USER_PLANS_KEY });
      toast.success("Cập nhật gói thành công");
    },
    onError: () => {
      toast.error("Không thể cập nhật gói");
    },
  });
};

export const useSeedUserPlans = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => adminUserPlanService.seedPlans(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USER_PLANS_KEY });
      toast.success("Đã tạo gói mặc định Free & Pro");
    },
    onError: () => {
      toast.error("Không thể tạo gói mặc định");
    },
  });
};

export const useCreateUserPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserPlanRequest) => adminUserPlanService.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USER_PLANS_KEY });
      toast.success("Tạo gói thành công");
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Không thể tạo gói"));
    },
  });
};

export const useDeleteUserPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminUserPlanService.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USER_PLANS_KEY });
      toast.success("Đã xóa gói");
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Không thể xóa gói"));
    },
  });
};
