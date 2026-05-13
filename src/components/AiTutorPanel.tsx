import React, { useState, useRef, useEffect, useCallback } from "react";
import { ragService, type ChatMessage, type ExplainPayload } from "@/lib/api/services/rag.service";
import { tutorService, type TutorSession } from "@/lib/api/services/tutor.service";

interface QuestionContext {
  questionId: string;
  questionText: string;
  questionType: string;
  options: string[];
  correctAnswer: string;
  userAnswer: string;
  questionOrder: number;
}

interface AiTutorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  passage: string;
  question?: QuestionContext | null;
  practiceSessionId: string;
  testTitle?: string;
  testSkill?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
  isStreaming?: boolean;
}

/** Converts a small subset of markdown to React: code blocks, inline code, bold, italic, bullet/ordered lines. */
function renderMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  // 1. Split on fenced code blocks first (```...```) so their contents are preserved verbatim.
  const blocks = text.split(/(```[\s\S]*?```)/g);

  const nodes: React.ReactNode[] = [];
  blocks.forEach((block, bi) => {
    if (block.startsWith("```") && block.endsWith("```")) {
      const code = block.slice(3, -3).replace(/^\w*\n/, "");
      nodes.push(
        <pre key={`code-${bi}`} className="bg-slate-100 border border-slate-200 rounded-md p-2 my-1 text-[12px] overflow-x-auto font-mono whitespace-pre-wrap">
          {code}
        </pre>
      );
      return;
    }

    const lines = block.split("\n");
    lines.forEach((line, li) => {
      const isBullet = /^\s*[-•]\s+/.test(line);
      const orderedMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
      const stripped = isBullet
        ? line.replace(/^\s*[-•]\s+/, "")
        : orderedMatch ? orderedMatch[2] : line;

      const parts = stripped.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g);
      const inline = parts.map((part, i) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i} className="bg-slate-100 px-1 py-0.5 rounded text-[12px] font-mono">{part.slice(1, -1)}</code>;
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <span key={i}>{part}</span>;
      });

      const key = `b${bi}-l${li}`;
      if (isBullet) {
        nodes.push(<div key={key} className="flex gap-2 pl-1"><span className="text-slate-400 shrink-0">•</span><span>{inline}</span></div>);
      } else if (orderedMatch) {
        nodes.push(<div key={key} className="flex gap-2 pl-1"><span className="text-slate-400 shrink-0">{orderedMatch[1]}.</span><span>{inline}</span></div>);
      } else {
        nodes.push(<span key={key}>{inline}{li < lines.length - 1 ? <br /> : null}</span>);
      }
    });
  });
  return nodes;
}

export default function AiTutorPanel({
  isOpen, onClose, passage, question, practiceSessionId, testTitle, testSkill,
}: AiTutorPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dbSession, setDbSession] = useState<TutorSession | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load or create DB session when question changes
  useEffect(() => {
    if (!question?.questionId || !practiceSessionId) return;

    // Abort any in-flight stream before switching to a new question
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);

    setLoadingHistory(true);
    setMessages([]);
    setDbSession(null);

    tutorService.getOrCreateSession(practiceSessionId, question.questionId)
      .then(session => {
        setDbSession(session);
        if (session.messages.length > 0) {
          setMessages(session.messages.map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })));
        }
      })
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
  }, [question?.questionId, practiceSessionId]);

  // Auto-explain if no history exists
  useEffect(() => {
    if (!loadingHistory && dbSession && messages.length === 0 && question) {
      handleStreamExplain([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingHistory, dbSession]);

  // Auto-scroll on every message update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Cleanup abort on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const persistMessage = useCallback(async (role: string, content: string) => {
    if (!dbSession) return;
    try {
      await tutorService.addMessage(dbSession.id, role, content);
    } catch (err) {
      console.error("Failed to persist message:", err);
    }
  }, [dbSession]);

  /**
   * Core SSE streaming handler.
   * Streams tokens from the AI and updates the last assistant message in real-time.
   */
  const handleStreamExplain = (conversationHistory: ChatMessage[]) => {
    if (!question || !passage) return;

    setIsLoading(true);

    // Add a streaming placeholder
    setMessages(prev => [...prev, { role: "assistant", content: "", isStreaming: true }]);

    const payload: ExplainPayload = {
      passage,
      question_text: question.questionText,
      question_type: question.questionType,
      options: question.options,
      correct_answer: question.correctAnswer,
      user_answer: question.userAnswer,
      test_skill: testSkill,
      conversation_history: conversationHistory,
    };

    let accumulated = "";

    const controller = ragService.explainAnswerStream(
      payload,
      // onToken — append each token to the streaming message
      (token: string) => {
        accumulated += token;
        const current = accumulated; // capture for closure
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].isStreaming) {
            updated[lastIdx] = { ...updated[lastIdx], content: current };
          }
          return updated;
        });
      },
      // onDone — finalize the message
      (fullResponse: string) => {
        const finalText = fullResponse || accumulated;
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0) {
            updated[lastIdx] = { role: "assistant", content: finalText };
          }
          return updated;
        });
        setIsLoading(false);
        abortRef.current = null;
        // Persist complete response to DB
        persistMessage("assistant", finalText);
      },
      // onError
      (error: string) => {
        console.error("[AI Tutor Stream] Error:", error);
        const finalText = accumulated || `⚠️ Lỗi: ${error}`;
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0) {
            updated[lastIdx] = { role: "assistant", content: finalText };
          }
          return updated;
        });
        setIsLoading(false);
        abortRef.current = null;
        // Persist error/partial response so conversation history isn't broken on reopen.
        persistMessage("assistant", finalText);
      },
    );

    abortRef.current = controller;
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading || !question) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

    // Persist user message
    await persistMessage("user", text);

    // Build conversation history for context
    const history: ChatMessage[] = newMessages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Stream the AI response
    handleStreamExplain(history);
  };

  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages(prev => {
      const updated = [...prev];
      const lastIdx = updated.length - 1;
      if (lastIdx >= 0 && updated[lastIdx].isStreaming) {
        updated[lastIdx] = { ...updated[lastIdx], isStreaming: false };
        // Persist whatever we have so far
        persistMessage("assistant", updated[lastIdx].content);
      }
      return updated;
    });
    setIsLoading(false);
  };

  const handleReset = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setInput("");
    setIsLoading(false);
    if (question && passage) {
      // Small delay to let state settle
      setTimeout(() => handleStreamExplain([]), 100);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6 pointer-events-none">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col pointer-events-auto animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-sky-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <span className="material-symbols-outlined text-white text-[20px]">psychology</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">AI Tutor</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                {question ? `Câu ${question.questionOrder}` : testTitle || "Reading Tutor"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && dbSession && !isLoading && (
              <span className="text-[10px] text-green-500 font-medium mr-1 flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                Saved
              </span>
            )}
            {isLoading && (
              <span className="text-[10px] text-amber-500 font-medium mr-1 flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                Streaming
              </span>
            )}
            <button
              onClick={handleReset}
              className="p-2 hover:bg-white/70 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
              title="Bắt đầu lại"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/70 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingHistory && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Đang tải lịch sử...</p>
              </div>
            </div>
          )}

          {!loadingHistory && messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-indigo-600 text-[32px]">school</span>
              </div>
              <h4 className="font-bold text-slate-700 mb-2">Chào bạn! 👋</h4>
              <p className="text-sm text-slate-400">
                {question
                  ? "Đang phân tích câu hỏi..."
                  : "Chọn một câu sai, sau đó bấm '🤖 Giải thích' để bắt đầu."}
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-md"
                  : "bg-slate-100 text-slate-800 rounded-bl-md"
              }`}>
                {msg.isStreaming && !msg.content ? (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs text-slate-400">AI đang kết nối...</span>
                  </div>
                ) : (
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                    {msg.isStreaming && (
                      <span className="inline-block w-[2px] h-4 bg-indigo-500 animate-pulse ml-0.5 align-text-bottom" />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isLoading ? "Đang stream..." : "Hỏi thêm về câu này..."}
              disabled={isLoading || loadingHistory}
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none disabled:opacity-50"
            />
            {isLoading ? (
              <button
                onClick={handleStop}
                className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shrink-0"
                title="Dừng stream"
              >
                <span className="material-symbols-outlined text-[16px]">stop</span>
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-300 text-center mt-2">
            AI có thể sai. Kiểm tra lại passage gốc. • Cuộc trò chuyện được lưu tự động.
          </p>
        </div>
      </div>
    </div>
  );
}
