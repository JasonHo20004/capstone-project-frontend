import apiClient from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WritingCriteriaScore {
  score: number;
  feedback: string;
}

export interface WritingEvaluation {
  id: string;
  userId: string;
  essayText: string;
  overallBand: number | null;
  criteria: {
    task_achievement: WritingCriteriaScore;
    coherence: WritingCriteriaScore;
    lexical: WritingCriteriaScore;
    grammar: WritingCriteriaScore;
  } | null;
  highlightedErrors: Array<{
    original: string;
    suggestion: string;
    type: 'grammar' | 'vocab' | 'coherence';
  }> | null;
  overallFeedback: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  jobId: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface SpeakingEvaluation {
  id: string;
  userId: string;
  audioUrl: string;
  transcript: string | null;
  duration: number | null;
  overallBand: number | null;
  pronunciationScore: number | null;
  fluencyScore: number | null;
  vocabScore: number | null;
  grammarScore: number | null;
  feedback: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  jobId: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface WritingSubmitResponse {
  evaluationId: string;
  jobId: string;
  status: string;
  message: string;
}

export interface SpeakingSubmitResponse {
  evaluationId: string;
  jobId: string;
  status: string;
  message: string;
}

export interface WritingAssistantResult {
  errors: Array<{
    text: string;
    suggestion: string;
    type: 'grammar' | 'vocab' | 'coherence' | 'spelling';
  }>;
  suggestions: Array<{
    text: string;
    improvement: string;
  }>;
}

// ─── Service ────────────────────────────────────────────────────────────────

class AiEvaluationService {
  // ============== Writing Assessment ==============

  async submitWriting(data: {
    userId: string;
    essayText: string;
    questionId?: string;
    sessionId?: string;
  }): Promise<ApiResponse<WritingSubmitResponse>> {
    const response = await apiClient.post<ApiResponse<WritingSubmitResponse>>(
      '/ai/assessments/writing/submit',
      data
    );
    return response.data;
  }

  async getWritingEvaluation(evaluationId: string): Promise<ApiResponse<WritingEvaluation>> {
    const response = await apiClient.get<ApiResponse<WritingEvaluation>>(
      `/ai/assessments/writing/${evaluationId}`
    );
    return response.data;
  }

  async getUserWritingEvaluations(userId: string): Promise<ApiResponse<WritingEvaluation[]>> {
    const response = await apiClient.get<ApiResponse<WritingEvaluation[]>>(
      `/ai/assessments/writing/user/${userId}`
    );
    return response.data;
  }

  // ============== Speaking Assessment ==============

  async submitSpeaking(data: {
    userId: string;
    audioUrl: string;
    questionId?: string;
    sessionId?: string;
  }): Promise<ApiResponse<SpeakingSubmitResponse>> {
    const response = await apiClient.post<ApiResponse<SpeakingSubmitResponse>>(
      '/ai/assessments/speaking/submit',
      data
    );
    return response.data;
  }

  async getSpeakingEvaluation(evaluationId: string): Promise<ApiResponse<SpeakingEvaluation>> {
    const response = await apiClient.get<ApiResponse<SpeakingEvaluation>>(
      `/ai/assessments/speaking/${evaluationId}`
    );
    return response.data;
  }

  async getUserSpeakingEvaluations(userId: string): Promise<ApiResponse<SpeakingEvaluation[]>> {
    const response = await apiClient.get<ApiResponse<SpeakingEvaluation[]>>(
      `/ai/assessments/speaking/user/${userId}`
    );
    return response.data;
  }

  // ============== Writing Assistant (Real-time) ==============

  async getWritingAssistance(data: {
    lastSentence: string;
    prevSentence?: string;
  }): Promise<ApiResponse<WritingAssistantResult>> {
    const response = await apiClient.post<ApiResponse<WritingAssistantResult>>(
      '/ai/writing-assistant',
      data
    );
    return response.data;
  }

  // ============== Transcription ==============

  async transcribeAudio(audioUrl: string): Promise<ApiResponse<{ transcript: string; duration: number }>> {
    const response = await apiClient.post<ApiResponse<{ transcript: string; duration: number }>>(
      '/ai/transcribe',
      { audioUrl }
    );
    return response.data;
  }
}

export const aiEvaluationService = new AiEvaluationService();
