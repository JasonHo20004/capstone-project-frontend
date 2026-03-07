import apiClient from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface AssessmentTest {
  id: string;
  title: string;
  type: string;
  totalQuestions: number;
  duration: number;
  createdAt: string;
}

export interface AssessmentTestDetail {
  id: string;
  title: string;
  type: string;
  duration: number;
  sections: unknown[];
}

export interface AssessmentSession {
  id: string;
  userId: string;
  testId: string;
  status: string;
  selectedSections: string[];
  startedAt: string;
  submittedAt?: string;
  result?: unknown;
}

export interface SessionGradingResult {
  sessionId: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  percentage: number;
  details: unknown[];
}

class AssessmentService {
  // ============== Tests ==============

  /**
   * Get all assessment tests
   * GET /tests
   */
  async getAllTests(): Promise<ApiResponse<AssessmentTest[]>> {
    const response = await apiClient.get<ApiResponse<AssessmentTest[]>>('/tests');
    return response.data;
  }

  /**
   * Get assessment test by ID
   * GET /tests/:id
   */
  async getTestById(testId: string): Promise<ApiResponse<AssessmentTestDetail>> {
    const response = await apiClient.get<ApiResponse<AssessmentTestDetail>>(
      `/tests/${testId}`
    );
    return response.data;
  }

  // ============== Sessions ==============

  /**
   * Create a new test session
   * POST /sessions
   */
  async createSession(data: {
    userId: string;
    testId: string;
    selectedSections?: string[];
  }): Promise<ApiResponse<AssessmentSession>> {
    const response = await apiClient.post<ApiResponse<AssessmentSession>>(
      '/sessions',
      data
    );
    return response.data;
  }

  /**
   * Get session by ID
   * GET /sessions/:id
   */
  async getSession(sessionId: string): Promise<ApiResponse<AssessmentSession>> {
    const response = await apiClient.get<ApiResponse<AssessmentSession>>(
      `/sessions/${sessionId}`
    );
    return response.data;
  }

  /**
   * Submit session answers for grading
   * POST /sessions/:id/submit
   */
  async submitSession(
    sessionId: string,
    data: {
      userId: string;
      submissions: Record<string, unknown>;
    }
  ): Promise<ApiResponse<SessionGradingResult>> {
    const response = await apiClient.post<ApiResponse<SessionGradingResult>>(
      `/sessions/${sessionId}/submit`,
      data
    );
    return response.data;
  }
}

export const assessmentService = new AssessmentService();
