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
    taskType?: 1 | 2;
    question?: string;
    imageUrl?: string;
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

  // ============== Interactive Speaking Sessions ==============

  async startSpeakingSession(data: {
    userId: string;
    topic?: string;
  }): Promise<ApiResponse<{ sessionId: string; question: string; currentPart: number; topic: string }>> {
    const response = await apiClient.post<ApiResponse<any>>(
      '/ai/speaking-sessions/start',
      data
    );
    return response.data;
  }

  async getSpeakingUploadUrl(): Promise<ApiResponse<{ uploadUrl: string; key: string; publicUrl: string }>> {
    const response = await apiClient.post<ApiResponse<any>>(
      '/ai/speaking-sessions/upload-url'
    );
    return response.data;
  }

  async respondToSpeaking(sessionId: string, audioUrl: string, mimeType: string = 'audio/webm'): Promise<ApiResponse<{
    transcript: string;
    nextQuestion: string | null;
    currentPart: number;
    currentStep: number;
    isSessionComplete: boolean;
    cueCard?: { topic: string; bulletPoints: string[]; finalPrompt: string };
    audioUrl?: string;
  }>> {
    const response = await apiClient.post<ApiResponse<any>>(
      `/ai/speaking-sessions/${sessionId}/respond`,
      { audioUrl, mimeType }
    );
    return response.data;
  }

  async finishSpeakingSession(sessionId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>(
      `/ai/speaking-sessions/${sessionId}/finish`
    );
    return response.data;
  }

  async getSpeakingSessionResult(sessionId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/ai/speaking-sessions/${sessionId}/result`
    );
    return response.data;
  }

  async listSpeakingSessions(userId: string): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get<ApiResponse<any[]>>(
      `/ai/speaking-sessions/user/${userId}`
    );
    return response.data;
  }

  // ============== Writing Assistant (Real-time) ==============

  async getWritingAssistance(data: {
    lastSentence: string;
    prevSentence?: string;
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>(
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
  // ============== Speaking Evaluation (Submit + Poll) ==============

  async submitSpeakingEvaluation(data: {
    userId: string;
    audioUrl: string;
    questionId?: string;
    sessionId?: string;
  }): Promise<ApiResponse<{ evaluationId: string; jobId: string; status: string }>> {
    const response = await apiClient.post<ApiResponse<any>>(
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

  // ============== Speaking Topic Bank (Admin) ==============

  async listSpeakingTopics(activeOnly: boolean = false): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/ai/speaking-topics${activeOnly ? '?active=true' : ''}`
    );
    return response.data;
  }

  async createSpeakingTopic(data: {
    title: string;
    part1Questions: string[];
    part2Topic?: string;
    part2Bullets?: string[];
    part2FinalPrompt?: string;
    part3Questions: string[];
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>(
      '/ai/speaking-topics',
      data
    );
    return response.data;
  }

  async updateSpeakingTopic(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put<ApiResponse<any>>(
      `/ai/speaking-topics/${id}`,
      data
    );
    return response.data;
  }

  async deleteSpeakingTopic(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete<ApiResponse<any>>(
      `/ai/speaking-topics/${id}`
    );
    return response.data;
  }
}

export const aiEvaluationService = new AiEvaluationService();
