import apiClient from "@/lib/api/config";

export interface FlashcardItem {
  front_content: string;
  back_content: string;
  example_sentence?: string;
}

export interface GenerateFlashcardsResponse {
  success: boolean;
  doc_id: string;
  deck_id?: string;
  title: string;
  flashcards: FlashcardItem[];
  source_pages: number;
  chunks_used: number;
}

export interface AskQuestionResponse {
  success: boolean;
  answer: string;
  relevant_chunks: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ExplainPayload {
  passage: string;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer: string;
  user_answer: string;
  test_skill?: string;
  conversation_history?: ChatMessage[];
  /** UI language code (i18n), e.g. "vi" | "en" — the tutor replies in this language. */
  language?: string;
}

export interface ExplainResponse {
  success: boolean;
  explanation: string;
  passage_reference: string;
  tips: string;
}

class RagService {
  async generateFlashcards(
    file: File,
    title: string,
    userId: string,
    saveToService: boolean = true,
  ): Promise<GenerateFlashcardsResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("user_id", userId);
    formData.append("save_to_service", saveToService.toString());

    const response = await apiClient.post<GenerateFlashcardsResponse>(
      "/rag/generate/flashcards",
      formData,
      { timeout: 300000 },
    );
    return response.data;
  }

  async generateFlashcardsFromText(
    text: string,
    title: string,
    userId: string,
    saveToService: boolean = true,
  ): Promise<GenerateFlashcardsResponse> {
    const response = await apiClient.post<GenerateFlashcardsResponse>(
      "/rag/generate/flashcards/text",
      {
        text,
        title,
        user_id: userId,
        save_to_service: saveToService,
      },
      { timeout: 300000 },
    );
    return response.data;
  }

  async askQuestion(docId: string, question: string): Promise<AskQuestionResponse> {
    const response = await apiClient.post<AskQuestionResponse>("/rag/ask", {
      doc_id: docId,
      question,
    }, { timeout: 120000 });
    return response.data;
  }

  /** Legacy non-streaming explain */
  async explainAnswer(payload: ExplainPayload): Promise<ExplainResponse> {
    const response = await apiClient.post<ExplainResponse>(
      "/rag/explain",
      payload,
      { timeout: 180000 },
    );
    return response.data;
  }

  /**
   * SSE streaming explain — streams tokens from AI in real-time.
   * @param payload - The explain request body
   * @param onToken - Called for each token as it arrives
   * @param onDone - Called when streaming is complete, with the full response
   * @param onError - Called on error
   * @returns AbortController to cancel the stream
   */
  explainAnswerStream(
    payload: ExplainPayload,
    onToken: (token: string) => void,
    onDone: (fullResponse: string) => void,
    onError: (error: string) => void,
  ): AbortController {
    const controller = new AbortController();
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
    const token = localStorage.getItem("accessToken");

    // Idle-timeout guard: if no chunk arrives within 60s, abort and report.
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        try { controller.abort(); } catch {}
        onError("AI phản hồi quá chậm. Vui lòng kiểm tra kết nối hoặc thử lại.");
      }, 60000);
    };
    const clearIdleTimer = () => {
      if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
    };
    resetIdleTimer();

    fetch(`${baseUrl}/rag/explain/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          clearIdleTimer();
          onError(`Server error: ${response.status}`);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          clearIdleTimer();
          onError("No response body");
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          resetIdleTimer();

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events (separated by \n\n)
          const events = buffer.split("\n\n");
          buffer = events.pop() || ""; // Keep incomplete event in buffer

          for (const event of events) {
            if (!event.trim()) continue;

            const lines = event.split("\n");
            let eventType = "message";
            let eventData = "";

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith("data: ")) {
                eventData = line.slice(6);
              }
            }

            if (!eventData) continue;

            try {
              const parsed = JSON.parse(eventData);

              if (eventType === "error") {
                clearIdleTimer();
                onError(parsed.error || "Unknown error");
                return;
              }

              if (eventType === "done" || parsed.done) {
                clearIdleTimer();
                onDone(parsed.full_response || "");
                return;
              }

              // Regular token
              if (parsed.token) {
                onToken(parsed.token);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      })
      .catch((err) => {
        clearIdleTimer();
        if (err?.name === "AbortError") return; // User cancelled or idle timeout already handled
        const isNetwork = err instanceof TypeError;
        onError(isNetwork
          ? "Không kết nối được máy chủ AI. Kiểm tra mạng hoặc thử lại."
          : (err?.message || "Connection failed"));
      });

    return controller;
  }

  // ── AI Reading Question Generator ────────────────────────────────────────

  async generateReadingQuestions(payload: {
    passage: string;
    question_types?: string[];
    num_questions?: number;
    difficulty?: string;
  }): Promise<ReadingGenResponse> {
    // LLM generation can take well over the default 30s — give it room.
    const resp = await apiClient.post("/rag/reading/generate", payload, { timeout: 300000 });
    return resp.data;
  }

  // ── AI Listening Generator (audio + questions from a script) ─────────────
  async generateListening(payload: {
    transcript: string;
    question_types?: string[];
    num_questions?: number;
    difficulty?: string;
    language?: string;
    level?: string;
    /** false = questions only, skip TTS (audio already uploaded). */
    with_audio?: boolean;
  }): Promise<ListeningGenResponse> {
    // TTS + LLM can take a while for a long script.
    const resp = await apiClient.post("/rag/listening/generate", payload, { timeout: 300000 });
    return resp.data;
  }

  // ── AI Answer-Reference (Study4-style "where is the answer") ─────────────
  /**
   * Locate the sentence in a reading passage / listening transcript that
   * justifies a question's answer. Used by the test editor to pre-fill the
   * answer reference, which the author can then adjust.
   */
  async findJustification(payload: {
    passage: string;
    question_text: string;
    question_type: string;
    correct_answer: string;
    skill?: string;
  }): Promise<FindJustificationResponse> {
    const resp = await apiClient.post("/rag/find-justification", payload, { timeout: 120000 });
    return resp.data;
  }

  // `fast` selects the small low-latency Whisper model on the server — used by
  // the live speaking battle, where the score must be ready before the short
  // battle window closes. Leave it false for accuracy-first transcription.
  async transcribeDictation(audioBlob: Blob, language: string, fast = false): Promise<{ success: boolean; sentences: { text: string }[] }> {
    const formData = new FormData();
    formData.append("audio", audioBlob, "dictation.webm");
    formData.append("language", language);
    if (fast) formData.append("fast", "true");

    const response = await apiClient.post(
      "/rag/transcribe/dictation",
      formData,
      { timeout: 120000 },
    );
    return response.data;
  }
}

export interface FindJustificationResponse {
  success: boolean;
  /** The verbatim justifying sentence, or "" if none found. */
  snippet: string;
  /** Char offsets into the supplied passage/transcript (best-effort). */
  start?: number;
  end?: number;
  /** Listening only — seconds, mapped from Whisper segments when available. */
  audio_start?: number;
  audio_end?: number;
  confidence?: number;
}

export interface GeneratedQuestion {
  questionText: string;
  questionType: string;
  options: string[];
  content: Record<string, any>;
  answer: Record<string, any>;
  explanation: string;
  questionOrder: number;
  /** Study4-style answer location: exact passage sentence justifying the answer. */
  answerReference?: {
    snippet: string;
    start?: number;
    end?: number;
    source?: "manual" | "ai";
  };
}

export interface ReadingGenResponse {
  success: boolean;
  questions: GeneratedQuestion[];
  summary: string;
}

export interface ListeningGenResponse {
  success: boolean;
  audio_url: string;
  transcript: string;
  questions: GeneratedQuestion[];
  summary: string;
}

export const ragService = new RagService();
