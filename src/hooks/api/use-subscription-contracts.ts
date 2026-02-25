import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  subscriptionContractService,
  type CreateSubscriptionContractRequest,
  type UpdateSubscriptionContractRequest,
  type RenewSubscriptionContractRequest,
} from "@/lib/api/services/admin";

const SUBSCRIPTION_CONTRACTS_KEY = ["admin", "subscription-contracts"] as const;

export const useSubscriptionContracts = () => {
  return useQuery({
    queryKey: SUBSCRIPTION_CONTRACTS_KEY,
    queryFn: async () => {
      const res = await subscriptionContractService.getContracts();
      return res.data ?? [];
    },
    staleTime: 60 * 1000,
  });
};

export const useCreateSubscriptionContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubscriptionContractRequest) =>
      subscriptionContractService.createContract(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: SUBSCRIPTION_CONTRACTS_KEY,
      });
      toast.success("Tạo hợp đồng thành công");
    },
    onError: () => {
      toast.error("Không thể tạo hợp đồng");
    },
  });
};

export const useUpdateSubscriptionContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSubscriptionContractRequest;
    }) => subscriptionContractService.updateContract(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: SUBSCRIPTION_CONTRACTS_KEY,
      });
      toast.success("Cập nhật hợp đồng thành công");
    },
    onError: () => {
      toast.error("Không thể cập nhật hợp đồng");
    },
  });
};

export const useRenewSubscriptionContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: RenewSubscriptionContractRequest;
    }) => subscriptionContractService.renewContract(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: SUBSCRIPTION_CONTRACTS_KEY,
      });
      toast.success("Gia hạn hợp đồng thành công");
    },
    onError: () => {
      toast.error("Không thể gia hạn hợp đồng");
    },
  });
};
