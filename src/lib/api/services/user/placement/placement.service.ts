import apiClient from "@/lib/api/config";
import type { ApiResponse } from "@/lib/api/types";

export type PlacementQuestionType =
  | "fill_blank"
  | "heading_match"
  | "reorder"
  | "listening_mcq";

export interface PlacementQuestionPayload {
  id: string;
  type: PlacementQuestionType;
  instruction: string;
  prompt: string;
  context?: string;
  time_limit: number;
  options?: { A: string; B: string; C: string };
  passage?: string;
  fixed_fragment?: string;
  fragments?: { A: string; B: string; C: string };
  audio_context?: string;
  audio_url?: string | null;
  audio_script?: string;
}

export interface PlacementSectionPayload {
  section: number;
  title: string;
  instruction: string;
  time_per_question: number;
  questions: PlacementQuestionPayload[];
}

export interface PlacementExamPayload {
  session_id: string;
  sections: PlacementSectionPayload[];
}

export interface PlacementAnswerSubmission {
  question_id: string;
  question_index: number;
  selected_option?: "A" | "B" | "C";
  selected_order?: string;
  time_spent: number;
}

export interface PlacementSubmitPayload {
  session_id: string;
  userId: string;
  answers: PlacementAnswerSubmission[];
}

export interface PlacementSectionScore {
  earned: number;
  max: number;
}

export interface PlacementResult {
  session_id: string;
  status: string;
  raw_score: number | null;
  max_score: number | null;
  percentage: number | null;
  cefr_level: string | null;
  cefr_label: string | null;
  section_scores: Record<string, PlacementSectionScore> | null;
  answers: Array<{
    question_id: string;
    question_index: number;
    selected_option: string | null;
    selected_order: string | null;
    is_correct: boolean | null;
    points_earned: number;
    time_spent: number | null;
  }>;
  completed_at: string | null;
}

class PlacementService {
  async generateExam(userId: string): Promise<ApiResponse<PlacementExamPayload>> {
    const response = await apiClient.get<ApiResponse<PlacementExamPayload>>(
      `/placement/exam/generate`,
      { params: { userId } }
    );
    return response.data;
  }

  async submitExam(
    payload: PlacementSubmitPayload
  ): Promise<ApiResponse<PlacementResult>> {
    const response = await apiClient.post<ApiResponse<PlacementResult>>(
      `/placement/exam/submit`,
      payload
    );
    return response.data;
  }

  async getResult(
    sessionId: string,
    userId: string
  ): Promise<ApiResponse<PlacementResult>> {
    const response = await apiClient.get<ApiResponse<PlacementResult>>(
      `/placement/exam/result/${sessionId}`,
      { params: { userId } }
    );
    return response.data;
  }
}

export const placementService = new PlacementService();
