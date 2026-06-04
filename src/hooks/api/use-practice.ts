import { useQuery, useMutation } from '@tanstack/react-query';
import { practiceService } from '@/lib/api/services/user/practice/practice.service';

/**
 * Get all available practice tests
 */
export const usePracticeTests = () => {
  return useQuery({
    queryKey: ['practice-tests'],
    queryFn: async () => {
      const response = await practiceService.getTests();
      return response.data!;
    },
    staleTime: 5 * 60_000,
  });
};

/**
 * Get detailed practice test (questions without answers)
 */
export const usePracticeTestDetail = (testId: string | undefined) => {
  return useQuery({
    queryKey: ['practice-tests', testId],
    queryFn: async () => {
      const response = await practiceService.getTestDetail(testId!);
      return response.data!;
    },
    enabled: Boolean(testId),
    staleTime: 5 * 60_000,
  });
};

/**
 * Submit practice test answers for grading
 */
export const useSubmitPracticeTest = () => {
  return useMutation({
    mutationFn: (data: { testId: string; submissions: Record<string, unknown> }) =>
      practiceService.submitTest(data.testId, data.submissions),
  });
};
