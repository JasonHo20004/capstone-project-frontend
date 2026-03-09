import { useQuery, useMutation } from '@tanstack/react-query';
import { assessmentService } from '@/lib/api/services/user/assessment/assessment.service';

/**
 * Get all assessment tests
 */
export const useAssessmentTests = () => {
  return useQuery({
    queryKey: ['assessment-tests'],
    queryFn: async () => {
      const response = await assessmentService.getAllTests();
      return response.data!;
    },
    staleTime: 5 * 60_000,
  });
};

/**
 * Get a single assessment test by ID
 */
export const useAssessmentTest = (testId: string | undefined) => {
  return useQuery({
    queryKey: ['assessment-tests', testId],
    queryFn: async () => {
      const response = await assessmentService.getTestById(testId!);
      return response.data!;
    },
    enabled: Boolean(testId),
    staleTime: 5 * 60_000,
  });
};

/**
 * Create a new assessment session
 */
export const useCreateSession = () => {
  return useMutation({
    mutationFn: (data: {
      userId: string;
      testId: string;
      selectedSections?: string[];
    }) => assessmentService.createSession(data),
  });
};

/**
 * Get an assessment session by ID
 */
export const useGetSession = (sessionId: string | undefined) => {
  return useQuery({
    queryKey: ['assessment-sessions', sessionId],
    queryFn: async () => {
      const response = await assessmentService.getSession(sessionId!);
      return response.data!;
    },
    enabled: Boolean(sessionId),
  });
};

/**
 * Submit session answers for grading
 */
export const useSubmitSession = () => {
  return useMutation({
    mutationFn: (data: {
      sessionId: string;
      userId: string;
      submissions: Record<string, unknown>;
    }) =>
      assessmentService.submitSession(data.sessionId, {
        userId: data.userId,
        submissions: data.submissions,
      }),
  });
};
