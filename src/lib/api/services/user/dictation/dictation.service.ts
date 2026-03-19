// =============================================================================
// Dictation Service - Frontend API Layer
// =============================================================================

import apiClient from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DictationExercise {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  category: string | null;
  totalSentences: number;
  createdAt: string;
}

export interface DictationSentence {
  id: string;
  exerciseId: string;
  index: number;
  text: string;
  startTime: number;
  endTime: number;
}

export interface DictationExerciseDetail extends DictationExercise {
  audioUrl: string;
  sentences: DictationSentence[];
}

export interface DictationSession {
  id: string;
  userId: string;
  exerciseId: string;
  currentIndex: number;
  completedCount: number;
  accuracy: number | null;
  status: 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  completedAt: string | null;
  exercise?: {
    title: string;
    totalSentences: number;
    category: string | null;
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

class DictationService {
  /** List published dictation exercises */
  async listExercises(filters?: { category?: string; level?: string }) {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.level) params.set('level', filters.level);
    const query = params.toString() ? `?${params.toString()}` : '';
    const resp = await apiClient.get<ApiResponse<DictationExercise[]>>(`/dictation${query}`);
    return resp.data;
  }

  /** Get distinct categories */
  async getCategories() {
    const resp = await apiClient.get<ApiResponse<string[]>>('/dictation/categories');
    return resp.data;
  }

  /** Get exercise detail with sentences */
  async getExerciseById(id: string) {
    const resp = await apiClient.get<ApiResponse<DictationExerciseDetail>>(`/dictation/${id}`);
    return resp.data;
  }

  /** Start or resume a dictation session */
  async startSession(exerciseId: string, userId: string) {
    const resp = await apiClient.post<ApiResponse<DictationSession>>(`/dictation/${exerciseId}/start`, { userId });
    return resp.data;
  }

  /** Update session progress */
  async updateSession(sessionId: string, data: { currentIndex?: number; completedCount?: number; accuracy?: number }) {
    const resp = await apiClient.put<ApiResponse<DictationSession>>(`/dictation/sessions/${sessionId}`, data);
    return resp.data;
  }

  /** Complete session */
  async completeSession(sessionId: string, accuracy: number) {
    const resp = await apiClient.post<ApiResponse<DictationSession>>(`/dictation/sessions/${sessionId}/complete`, { accuracy });
    return resp.data;
  }

  /** Get user's dictation sessions */
  async getUserSessions(userId: string, exerciseId?: string) {
    const query = exerciseId ? `?exerciseId=${exerciseId}` : '';
    const resp = await apiClient.get<ApiResponse<DictationSession[]>>(`/dictation/sessions/user/${userId}${query}`);
    return resp.data;
  }
}

export const dictationService = new DictationService();
