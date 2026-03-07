import apiClient from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface PracticeTestSummary {
  id: string;
  title: string;
  type: string;
  totalQuestions: number;
  duration: number;
  createdAt: string;
}

export interface PracticeTestDetail {
  id: string;
  title: string;
  type: string;
  duration: number;
  sections: PracticeSection[];
}

export interface PracticeSection {
  id: string;
  title: string;
  type: string;
  parts: PracticePart[];
}

export interface PracticePart {
  id: string;
  title: string;
  instructions?: string;
  questionGroups: PracticeQuestionGroup[];
}

export interface PracticeQuestionGroup {
  id: string;
  passage?: string;
  audioUrl?: string;
  imageUrl?: string;
  questions: PracticeQuestion[];
}

export interface PracticeQuestion {
  id: string;
  questionText: string;
  questionType: string;
  options?: string[];
  // Note: 'answer' and 'explanation' are stripped by backend for non-admin users
}

export interface PracticeGradingResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  percentage: number;
  details: {
    questionId: string;
    userAnswer: unknown;
    correctAnswer: unknown;
    isCorrect: boolean;
    explanation?: string;
  }[];
}

class PracticeService {
  /**
   * Get all available practice tests (summary)
   * GET /practice
   */
  async getTests(): Promise<ApiResponse<PracticeTestSummary[]>> {
    const response = await apiClient.get<ApiResponse<PracticeTestSummary[]>>('/practice');
    return response.data;
  }

  /**
   * Get full test detail (questions without answers)
   * GET /practice/:id
   */
  async getTestDetail(testId: string): Promise<ApiResponse<PracticeTestDetail>> {
    const response = await apiClient.get<ApiResponse<PracticeTestDetail>>(
      `/practice/${testId}`
    );
    return response.data;
  }

  /**
   * Submit test answers for grading
   * POST /practice/:id/submit
   */
  async submitTest(
    testId: string,
    submissions: Record<string, unknown>
  ): Promise<ApiResponse<PracticeGradingResult>> {
    const response = await apiClient.post<ApiResponse<PracticeGradingResult>>(
      `/practice/${testId}/submit`,
      { submissions }
    );
    return response.data;
  }
}

export const practiceService = new PracticeService();
