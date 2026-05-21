import { useMutation, useQuery } from "@tanstack/react-query";
import {
  placementService,
  type PlacementExamPayload,
  type PlacementResult,
  type PlacementSubmitPayload,
} from "@/lib/api/services/user/placement/placement.service";

export const useGeneratePlacementExam = () => {
  return useMutation<PlacementExamPayload, Error, { userId: string }>({
    mutationFn: async ({ userId }) => {
      const response = await placementService.generateExam(userId);
      return response.data!;
    },
  });
};

export const useSubmitPlacementExam = () => {
  return useMutation<PlacementResult, Error, PlacementSubmitPayload>({
    mutationFn: async (payload) => {
      const response = await placementService.submitExam(payload);
      return response.data!;
    },
  });
};

export const usePlacementResult = (
  sessionId: string | undefined,
  userId: string | undefined
) => {
  return useQuery({
    queryKey: ["placement", "result", sessionId],
    queryFn: async () => {
      const response = await placementService.getResult(sessionId!, userId!);
      return response.data!;
    },
    enabled: Boolean(sessionId && userId),
  });
};
