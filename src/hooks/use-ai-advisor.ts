// =============================================================================
// useAIAdvisor — SSE hook for the AI Advisor
// Manages the EventSource connection and advisor action state
// =============================================================================

import { useState, useEffect, useCallback, useRef } from "react";
import type { AdvisorAction } from "@/lib/api/services/user/advisor/advisor.service";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

interface UseAIAdvisorOptions {
  userId: string | undefined;
  enabled?: boolean; // Allows disabling (e.g., when user not logged in)
}

interface UseAIAdvisorReturn {
  /** Current advisor action to display (null = nothing to show) */
  activeAction: AdvisorAction | null;
  /** Whether the SSE connection is active */
  isConnected: boolean;
  /** Dismiss current banner */
  dismiss: () => void;
}

export function useAIAdvisor({
  userId,
  enabled = true,
}: UseAIAdvisorOptions): UseAIAdvisorReturn {
  const [activeAction, setActiveAction] = useState<AdvisorAction | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    if (!userId || !enabled) return;

    // Clean up existing connection
    eventSourceRef.current?.close();

    const token = localStorage.getItem("accessToken") || "";
    const url = `${API_BASE}/api/ai/advisor/stream?userId=${userId}&token=${encodeURIComponent(token)}`;
    const es = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = es;

    es.addEventListener("connected", () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
      console.log("[AIAdvisor] SSE connected");
    });

    es.addEventListener("advisor_action", (e: MessageEvent) => {
      try {
        const action = JSON.parse(e.data) as AdvisorAction;
        setActiveAction(action);
      } catch {
        console.error("[AIAdvisor] Failed to parse action:", e.data);
      }
    });

    es.addEventListener("heartbeat", () => {
      // Keep-alive — no UI action needed
    });

    es.onerror = () => {
      setIsConnected(false);
      es.close();

      // Exponential backoff reconnect (max 5 attempts, then give up)
      const attempt = reconnectAttempts.current;
      if (attempt < 5) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 30_000);
        reconnectAttempts.current += 1;
        reconnectTimerRef.current = setTimeout(connect, delay);
        console.log(`[AIAdvisor] Reconnecting in ${delay}ms (attempt ${attempt + 1})`);
      } else {
        console.warn("[AIAdvisor] Max reconnect attempts reached. SSE disabled.");
      }
    };
  }, [userId, enabled]);

  useEffect(() => {
    connect();

    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      setIsConnected(false);
    };
  }, [connect]);

  const dismiss = useCallback(() => {
    setActiveAction(null);
  }, []);

  return { activeAction, isConnected, dismiss };
}
