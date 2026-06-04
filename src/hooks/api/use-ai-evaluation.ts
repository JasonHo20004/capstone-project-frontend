import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiEvaluationService, WritingEvaluation, SpeakingEvaluation } from '@/lib/api/services/user/ai-evaluation/ai-evaluation.service';
import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Writing Assessment Hooks ────────────────────────────────────────────────

/**
 * Submit essay for AI writing evaluation
 */
export const useSubmitWriting = () => {
  return useMutation({
    mutationFn: (data: {
      userId: string;
      essayText: string;
      questionId?: string;
      sessionId?: string;
      taskType?: 1 | 2;
      question?: string;
      imageUrl?: string;
    }) => aiEvaluationService.submitWriting(data),
  });
};

/**
 * Poll for writing evaluation result
 * Automatically refetches every 3s while status is PENDING or PROCESSING
 */
export const useWritingEvaluation = (evaluationId: string | null) => {
  return useQuery({
    queryKey: ['writing-evaluation', evaluationId],
    queryFn: async () => {
      const response = await aiEvaluationService.getWritingEvaluation(evaluationId!);
      return response.data as WritingEvaluation;
    },
    enabled: Boolean(evaluationId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'PENDING' || data.status === 'PROCESSING')) {
        return 3000; // Poll every 3 seconds
      }
      return false; // Stop polling when done
    },
  });
};

/**
 * Get user's writing evaluation history
 */
export const useUserWritingEvaluations = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['writing-evaluations', userId],
    queryFn: async () => {
      const response = await aiEvaluationService.getUserWritingEvaluations(userId!);
      return response.data as WritingEvaluation[];
    },
    enabled: Boolean(userId),
  });
};

// ─── Interactive Speaking Session Hooks ───────────────────────────────────────

/**
 * Start an interactive speaking session
 */
export const useStartSpeakingSession = () => {
  return useMutation({
    mutationFn: (data: { userId: string; topic?: string }) =>
      aiEvaluationService.startSpeakingSession(data),
  });
};

/**
 * Send audio response to speaking session (with S3 URL)
 */
export const useRespondToSpeaking = () => {
  return useMutation({
    mutationFn: (data: { sessionId: string; audioUrl: string; mimeType?: string }) =>
      aiEvaluationService.respondToSpeaking(data.sessionId, data.audioUrl, data.mimeType),
  });
};

/**
 * Finish speaking session early
 */
export const useFinishSpeaking = () => {
  return useMutation({
    mutationFn: (sessionId: string) => aiEvaluationService.finishSpeakingSession(sessionId),
  });
};

/**
 * Poll for speaking session result
 */
export const useSpeakingSessionResult = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['speaking-session-result', sessionId],
    queryFn: async () => {
      const response = await aiEvaluationService.getSpeakingSessionResult(sessionId!);
      return response.data;
    },
    enabled: Boolean(sessionId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'GRADING' || data.status === 'IN_PROGRESS')) {
        return 3000;
      }
      return false;
    },
  });
};

/**
 * List user's speaking sessions
 */
export const useUserSpeakingSessions = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['speaking-sessions', userId],
    queryFn: async () => {
      const response = await aiEvaluationService.listSpeakingSessions(userId!);
      return response.data;
    },
    enabled: Boolean(userId),
  });
};

/**
 * Poll for speaking individual evaluation result
 */
export const useSpeakingEvaluation = (evaluationId: string | null) => {
  return useQuery({
    queryKey: ['speaking-evaluation', evaluationId],
    queryFn: async () => {
      const response = await aiEvaluationService.getSpeakingEvaluation(evaluationId!);
      return response.data as SpeakingEvaluation;
    },
    enabled: Boolean(evaluationId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'PENDING' || data.status === 'PROCESSING')) {
        return 3000;
      }
      return false;
    },
  });
};

// ─── Writing Assistant Hook (Real-time, debounced) ───────────────────────────

/**
 * Real-time writing assistant with 2s debounce
 * Sends only the last 2 sentences for cost control
 */
export const useWritingAssistant = () => {
  const [result, setResult] = useState<{
    errors: Array<{ text: string; suggestion: string; type: string }>;
    suggestions: Array<{ text: string; improvement: string }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const analyze = useCallback((lastSentence: string, prevSentence?: string) => {
    // Clear previous timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Skip if input is too short
    if (!lastSentence || lastSentence.trim().length < 10) {
      setResult(null);
      return;
    }

    // Debounce 2000ms
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await aiEvaluationService.getWritingAssistance({
          lastSentence,
          prevSentence,
        });
        setResult(response.data as any);
      } catch {
        // Silently fail for assistant — don't interrupt writing
        console.warn('Writing assistant error');
      } finally {
        setIsLoading(false);
      }
    }, 2000);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return { result, isLoading, analyze };
};
