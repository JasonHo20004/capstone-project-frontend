import apiClient from "@/lib/api/config";

export interface TutorMessage {
  id: string;
  tutorSessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface TutorSession {
  id: string;
  practiceSessionId: string;
  questionId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages: TutorMessage[];
}

class TutorService {
  /**
   * Get all tutor sessions for a practice session
   */
  async getSessionsByPractice(practiceSessionId: string): Promise<TutorSession[]> {
    const res = await apiClient.get("/tutor/sessions", {
      params: { practiceSessionId },
    });
    return res.data?.data || [];
  }

  /**
   * Get or create a session for a specific question
   */
  async getOrCreateSession(practiceSessionId: string, questionId: string): Promise<TutorSession> {
    const res = await apiClient.post("/tutor/sessions", {
      practiceSessionId,
      questionId,
    });
    return res.data?.data;
  }

  /**
   * Add a message to a tutor session
   */
  async addMessage(sessionId: string, role: string, content: string): Promise<TutorMessage> {
    const res = await apiClient.post(`/tutor/sessions/${sessionId}/messages`, {
      role,
      content,
    });
    return res.data?.data;
  }
}

export const tutorService = new TutorService();
