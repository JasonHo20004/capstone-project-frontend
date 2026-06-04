// =============================================================================
// AI Advisor — API Client
// Thin wrapper around the advisor REST endpoints
// =============================================================================

import apiClient from "@/lib/api/client";

export interface AdvisorAction {
  type: "SHOW_BANNER" | "SUGGEST_COURSE" | "UNLOCK_TIP" | "SEND_REMINDER";
  message: string;
  evidence: string;
  courseId?: string;
  tipId?: string;
}

export interface AdvisorProfile {
  bandScoreTarget: number;
  bandScoreCurrent: number;
  skillGaps: {
    listening: number;
    reading: number;
    writing: number;
    speaking: number;
  };
  learningPersonality: {
    total_quizzes: number;
    avg_session_min: number;
    error_patterns: string[];
    last_active_at?: string;
  };
  advisorConfig: {
    proactive_enabled: boolean;
    min_interval_hours: number;
    last_push_at?: string;
  };
}

export const advisorApiService = {
  /** Send a direct question to the AI Advisor */
  chat: async (userId: string, query: string): Promise<AdvisorAction> => {
    const res = await apiClient.post("/api/ai/advisor/chat", { userId, query });
    return res.data.action;
  },

  /** Get the user's learning profile (skill gaps, band scores) */
  getProfile: async (userId: string): Promise<AdvisorProfile> => {
    const res = await apiClient.get(`/api/ai/advisor/profile/${userId}`);
    return res.data.profile;
  },

  /** Acknowledge that user has seen/dismissed an advisor action */
  acknowledge: async (userId: string, actionId: string): Promise<void> => {
    await apiClient.post("/api/ai/advisor/acknowledge", { userId, actionId });
  },
};
