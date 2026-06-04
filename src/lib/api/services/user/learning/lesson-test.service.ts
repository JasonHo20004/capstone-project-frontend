import apiClient from "@/lib/api/config";

export interface LessonTestQuestion {
  id: string;
  questionText?: string | null;
  questionType: string;
  options?: string[] | null;
  content?: { options?: string[]; text?: string } | null;
  questionOrder?: number | null;
  imageUrl?: string | null;
  explanation?: string | null;
}

export interface LessonTestSection {
  id: string;
  title?: string | null;
  questions?: LessonTestQuestion[];
}

export interface LessonTest {
  id: string;
  title: string;
  status: string;
  testType?: string | null;
  durationInMinutes?: number | null;
  totalScore?: number | null;
  passingScore?: number | null;
  maxAttempts?: number | null;
  englishTestType?: { name: string } | null;
  sections?: LessonTestSection[];
  questions?: LessonTestQuestion[];
}

export interface StartSessionResponse {
  sessionId: string;
  testId: string;
  resumed?: boolean;
}

export interface SubmitResultDetail {
  questionId: string;
  questionOrder?: number | null;
  questionText: string;
  questionType: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string | null;
}

export interface SubmitResult {
  sessionId: string | null;
  score: {
    correct: number;
    total: number;
    percentage: number;
    bandScore: number | null;
  };
  details: SubmitResultDetail[];
}

class LessonTestService {
  async getTest(testId: string): Promise<LessonTest> {
    const response = await apiClient.get<{ message?: string; data: LessonTest }>(
      `/tests/${testId}`
    );
    return response.data.data;
  }

  async startSession(testId: string, userId: string): Promise<StartSessionResponse> {
    const response = await apiClient.post<{ message?: string; data: StartSessionResponse }>(
      `/tests/${testId}/start`,
      { userId }
    );
    return response.data.data;
  }

  async submit(
    testId: string,
    submissions: Record<string, string>,
    userId: string
  ): Promise<SubmitResult> {
    const response = await apiClient.post<{ message?: string; data: SubmitResult }>(
      `/tests/${testId}/submit`,
      { submissions, userId }
    );
    return response.data.data;
  }
}

export const lessonTestService = new LessonTestService();
