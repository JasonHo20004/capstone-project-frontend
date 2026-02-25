import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  reportManagementService,
  type ResolveReportRequest,
} from "@/lib/api/services/admin";

const REPORTS_KEY = ["admin", "reports"] as const;

export const useReports = () => {
  return useQuery({
    queryKey: REPORTS_KEY,
    queryFn: async () => {
      const res = await reportManagementService.getReports();
      return res.data ?? [];
    },
    staleTime: 60 * 1000,
  });
};

export const useResolveReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data?: ResolveReportRequest;
    }) => reportManagementService.resolveReport(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
      toast.success("Đã giải quyết báo cáo");
    },
    onError: () => {
      toast.error("Không thể giải quyết báo cáo");
    },
  });
};

export const useRejectReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data?: ResolveReportRequest;
    }) => reportManagementService.rejectReport(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
      toast.success("Đã từ chối báo cáo");
    },
    onError: () => {
      toast.error("Không thể từ chối báo cáo");
    },
  });
};
