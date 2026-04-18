// =============================================================================
// useAIInsights — localStorage-backed history of AI Advisor actions.
// Consumed by UserAppLayout (write) and Notifications page (read/mark-read).
// =============================================================================

import { useState, useCallback } from "react";
import type { AdvisorAction } from "@/lib/api/services/user/advisor/advisor.service";

const STORAGE_KEY = "ai_insights_history";
const MAX_ENTRIES = 50;

export interface AIInsight {
  id: string;
  actionType: AdvisorAction["type"];
  message: string;
  evidence: string;
  isRead: boolean;
  createdAt: string;
}

function read(): AIInsight[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function persist(entries: AIInsight[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function useAIInsights() {
  const [insights, setInsights] = useState<AIInsight[]>(read);

  const add = useCallback((action: AdvisorAction) => {
    const entry: AIInsight = {
      id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      actionType: action.type,
      message: action.message,
      evidence: action.evidence,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setInsights((prev) => {
      const next = [entry, ...prev].slice(0, MAX_ENTRIES);
      persist(next);
      return next;
    });
  }, []);

  const markRead = useCallback((id: string) => {
    setInsights((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, isRead: true } : i));
      persist(next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setInsights((prev) => {
      const next = prev.map((i) => ({ ...i, isRead: true }));
      persist(next);
      return next;
    });
  }, []);

  const unreadCount = insights.filter((i) => !i.isRead).length;

  return { insights, add, markRead, markAllRead, unreadCount };
}
