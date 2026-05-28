import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookmarkPlus,
  Bookmark,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileQuestion,
  Loader2,
  PlayCircle,
  RefreshCw,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  lessonTestService,
  type LessonTest,
  type LessonTestQuestion,
  type SubmitResult,
} from "@/lib/api/services/user/learning/lesson-test.service";

type RunnerState = "intro" | "active" | "result";

interface LessonTestRunnerProps {
  testId: string;
  lessonTitle?: string;
  onContinue?: () => void;
}

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    // JWT uses base64url; atob expects standard base64.
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? b64 : b64 + "=".repeat(4 - (b64.length % 4));
    const json = decodeURIComponent(
      atob(pad)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getCurrentUserId(): string | null {
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const parsed = JSON.parse(raw);
      const id = parsed?.id ?? parsed?.userId ?? parsed?.sub;
      if (typeof id === "string" && id.length > 0) return id;
    }
  } catch {
    /* fall through to token */
  }
  const token = localStorage.getItem("accessToken");
  if (token) {
    const payload = decodeJwt(token);
    if (payload) {
      const id = (payload.userId ?? payload.sub ?? payload.id) as unknown;
      if (typeof id === "string" && id.length > 0) return id;
    }
  }
  return null;
}

function flattenQuestions(test: LessonTest | undefined | null): LessonTestQuestion[] {
  if (!test) return [];
  if (Array.isArray(test.questions) && test.questions.length > 0) return test.questions;
  if (Array.isArray(test.sections) && test.sections.length > 0) {
    return test.sections.flatMap((s) => s.questions ?? []);
  }
  return [];
}

function getQuestionOptions(q: LessonTestQuestion): string[] {
  if (Array.isArray(q.options) && q.options.length > 0) return q.options;
  if (Array.isArray(q.content?.options) && q.content!.options!.length > 0) {
    return q.content!.options as string[];
  }
  return [];
}

function getQuestionText(q: LessonTestQuestion): string {
  return q.questionText || q.content?.text || "";
}

function formatTime(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export const LessonTestRunner = ({
  testId,
  lessonTitle,
  onContinue,
}: LessonTestRunnerProps) => {
  const [state, setState] = useState<RunnerState>("intro");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const timerRef = useRef<number | null>(null);
  const submittedRef = useRef(false);

  const {
    data: test,
    isLoading: testLoading,
    error: testError,
    refetch: refetchTest,
  } = useQuery({
    queryKey: ["lesson-test", testId],
    queryFn: () => lessonTestService.getTest(testId),
    enabled: Boolean(testId),
  });

  const questions = useMemo(() => flattenQuestions(test), [test]);
  const totalQuestions = questions.length;
  const durationMinutes = test?.durationInMinutes ?? 0;
  const passingScore = test?.passingScore ?? 0;
  const totalScore = test?.totalScore ?? totalQuestions;
  const maxAttempts = test?.maxAttempts ?? null;

  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.id] ?? "").trim().length > 0).length,
    [questions, answers]
  );
  const unansweredCount = totalQuestions - answeredCount;

  const startMutation = useMutation({
    mutationFn: async () => {
      const userId = getCurrentUserId();
      if (!userId) throw new Error("AUTH_REQUIRED");
      return lessonTestService.startSession(testId, userId);
    },
    onSuccess: (data) => {
      setCurrentIdx(0);
      setAnswers({});
      setFlagged(new Set());
      submittedRef.current = false;
      setResult(null);
      const seconds = Math.max(1, (test?.durationInMinutes ?? 30) * 60);
      setTimeLeft(seconds);
      setState("active");
      if (data.resumed) {
        toast.info("Tiếp tục phiên làm bài đang dang dở.");
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error && err.message === "AUTH_REQUIRED"
        ? "Vui lòng đăng nhập để làm bài kiểm tra."
        : "Không thể bắt đầu bài kiểm tra. Vui lòng thử lại.";
      toast.error(msg);
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const userId = getCurrentUserId();
      if (!userId) throw new Error("AUTH_REQUIRED");
      return lessonTestService.submit(testId, answers, userId);
    },
    onSuccess: (data) => {
      submittedRef.current = true;
      setResult(data);
      setState("result");
      setConfirmSubmitOpen(false);
    },
    onError: () => {
      toast.error("Không thể nộp bài. Vui lòng kiểm tra kết nối và thử lại.");
    },
  });

  // Countdown timer — auto-submit when it runs out.
  useEffect(() => {
    if (state !== "active") return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          if (!submittedRef.current && !submitMutation.isPending) {
            submittedRef.current = true;
            toast.warning("Hết thời gian! Bài làm sẽ được nộp tự động.");
            submitMutation.mutate();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [state, submitMutation]);

  // Discourage accidental refresh while taking the test.
  useEffect(() => {
    if (state !== "active") return;
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [state]);

  const currentQuestion = questions[currentIdx];

  const handleSelectOption = (questionId: string, optionText: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionText }));
  };

  const handleToggleFlag = (questionId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const goToQuestion = (idx: number) => {
    if (idx < 0 || idx >= totalQuestions) return;
    setCurrentIdx(idx);
  };

  const handleRestart = () => {
    setState("intro");
    setResult(null);
    setAnswers({});
    setFlagged(new Set());
  };

  // ───────── Loading & error states ─────────
  if (testLoading) {
    return (
      <div className="rounded-3xl border bg-card p-10 shadow-sm">
        <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Đang tải bài kiểm tra…</p>
        </div>
      </div>
    );
  }

  if (testError || !test) {
    return (
      <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <h3 className="text-lg font-semibold">Không tải được bài kiểm tra</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Bài kiểm tra này chưa sẵn sàng hoặc đã xảy ra lỗi khi tải dữ liệu.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetchTest()} className="rounded-full">
            <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
          </Button>
        </div>
      </div>
    );
  }

  if (totalQuestions === 0) {
    return (
      <div className="rounded-3xl border border-dashed bg-muted/30 p-8 text-center">
        <FileQuestion className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="mt-3 text-lg font-semibold">Bài kiểm tra chưa có câu hỏi</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Vui lòng liên hệ giảng viên để được hỗ trợ.
        </p>
      </div>
    );
  }

  // ───────── Intro / pre-start ─────────
  if (state === "intro") {
    return (
      <div className="overflow-hidden rounded-3xl border bg-card shadow-lg">
        <div className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-8 py-10">
          <div aria-hidden className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
          <div aria-hidden className="absolute -left-16 -bottom-12 h-48 w-48 rounded-full bg-secondary/20 blur-3xl" />
          <div className="relative flex flex-col gap-3">
            <Badge className="w-fit rounded-full bg-primary/15 text-primary hover:bg-primary/20">
              <ClipboardList className="mr-1.5 h-3 w-3" /> Bài kiểm tra
            </Badge>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              {lessonTitle || test.title}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Hoàn thành bài kiểm tra dưới đây để củng cố kiến thức bài học. Đọc kỹ hướng dẫn trước khi bắt đầu.
            </p>
          </div>
        </div>

        <div className="grid gap-4 px-8 py-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            icon={<FileQuestion className="h-4 w-4" />}
            label="Số câu hỏi"
            value={`${totalQuestions}`}
          />
          <StatTile
            icon={<Clock className="h-4 w-4" />}
            label="Thời gian"
            value={durationMinutes > 0 ? `${durationMinutes} phút` : "Không giới hạn"}
          />
          <StatTile
            icon={<Target className="h-4 w-4" />}
            label="Điểm đạt"
            value={totalScore > 0 ? `${passingScore}/${totalScore}` : `${passingScore}`}
          />
          <StatTile
            icon={<RefreshCw className="h-4 w-4" />}
            label="Số lần làm lại"
            value={maxAttempts && maxAttempts > 0 ? `${maxAttempts}` : "Không giới hạn"}
          />
        </div>

        <div className="mx-8 mb-6 rounded-2xl border border-primary/15 bg-primary/5 p-5">
          <p className="mb-3 text-sm font-semibold text-primary">Hướng dẫn làm bài</p>
          <ul className="space-y-2 text-sm text-foreground/80">
            <InstructionItem>Không làm mới trang trong khi làm bài — tiến trình có thể bị mất.</InstructionItem>
            <InstructionItem>Bạn có thể chuyển qua lại giữa các câu hỏi và đánh dấu câu để xem lại.</InstructionItem>
            <InstructionItem>Bấm <b>“Nộp bài”</b> khi hoàn thành. Hệ thống sẽ tự động nộp khi hết thời gian.</InstructionItem>
          </ul>
        </div>

        <div className="flex flex-col-reverse items-stretch gap-3 border-t bg-muted/30 px-8 py-5 sm:flex-row sm:items-center sm:justify-end">
          <Button
            variant="ghost"
            className="rounded-full sm:w-auto"
            onClick={() => {
              const el = document.getElementById("test-instructions");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            Xem hướng dẫn
          </Button>
          <Button
            size="lg"
            className="rounded-full sm:w-auto"
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
          >
            {startMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang khởi tạo…
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-5 w-5" /> Bắt đầu làm bài
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ───────── Active state ─────────
  if (state === "active" && currentQuestion) {
    const opts = getQuestionOptions(currentQuestion);
    const qId = currentQuestion.id;
    const selectedAnswer = answers[qId];
    const isFlagged = flagged.has(qId);

    return (
      <div className="space-y-4">
        {/* Sticky header */}
        <div className="sticky top-20 z-20 rounded-2xl border bg-background/90 px-5 py-4 shadow-md backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Đang làm bài
              </p>
              <h3 className="truncate text-base font-semibold text-foreground">
                {lessonTitle || test.title}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold tabular-nums",
                  timeLeft <= 60
                    ? "bg-destructive/15 text-destructive"
                    : timeLeft <= 300
                    ? "bg-amber-500/15 text-amber-600"
                    : "bg-primary/10 text-primary"
                )}
                aria-live="polite"
              >
                <Clock className="h-4 w-4" />
                {formatTime(timeLeft)}
              </div>
              <Button
                size="sm"
                className="rounded-full"
                onClick={() => setConfirmSubmitOpen(true)}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Nộp bài
              </Button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              Câu {currentIdx + 1}/{totalQuestions}
            </span>
            <Progress
              value={((currentIdx + 1) / totalQuestions) * 100}
              className="h-1.5 flex-1"
            />
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              Đã trả lời {answeredCount}/{totalQuestions}
            </span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_minmax(220px,260px)]">
          {/* Question card */}
          <div className="space-y-4">
            <div className="rounded-3xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <Badge variant="outline" className="rounded-full">
                  Câu {currentIdx + 1}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "rounded-full text-xs",
                    isFlagged && "text-amber-600 hover:text-amber-700"
                  )}
                  onClick={() => handleToggleFlag(qId)}
                  aria-pressed={isFlagged}
                  aria-label={isFlagged ? "Bỏ đánh dấu xem lại" : "Đánh dấu xem lại"}
                >
                  {isFlagged ? (
                    <Bookmark className="mr-1.5 h-3.5 w-3.5 fill-current" />
                  ) : (
                    <BookmarkPlus className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {isFlagged ? "Đã đánh dấu" : "Đánh dấu xem lại"}
                </Button>
              </div>

              <p className="whitespace-pre-line text-base leading-relaxed text-foreground">
                {getQuestionText(currentQuestion) || "(Câu hỏi không có nội dung)"}
              </p>

              {currentQuestion.imageUrl && (
                <img
                  src={currentQuestion.imageUrl}
                  alt=""
                  className="mt-4 max-h-80 rounded-2xl border object-contain"
                />
              )}

              <fieldset className="mt-6 space-y-3">
                <legend className="sr-only">Chọn đáp án</legend>
                {opts.length === 0 ? (
                  <p className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                    Câu hỏi này không có lựa chọn để hiển thị.
                  </p>
                ) : (
                  opts.map((opt, oi) => {
                    const isSelected = selectedAnswer === opt;
                    const letter = String.fromCharCode(65 + oi);
                    return (
                      <label
                        key={`${qId}-${oi}`}
                        className={cn(
                          "group flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-all",
                          "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-background hover:border-primary/40 hover:bg-primary/[0.03]"
                        )}
                      >
                        <input
                          type="radio"
                          name={`q-${qId}`}
                          value={opt}
                          checked={isSelected}
                          onChange={() => handleSelectOption(qId, opt)}
                          className="sr-only"
                        />
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground group-hover:border-primary/50"
                          )}
                          aria-hidden
                        >
                          {letter}
                        </span>
                        <span className="flex-1 text-sm leading-relaxed text-foreground">
                          {opt}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                        )}
                      </label>
                    );
                  })
                )}
              </fieldset>
            </div>

            <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => goToQuestion(currentIdx - 1)}
                disabled={currentIdx === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Câu trước
              </Button>
              <div className="flex gap-2">
                {currentIdx < totalQuestions - 1 ? (
                  <Button
                    className="rounded-full"
                    onClick={() => goToQuestion(currentIdx + 1)}
                  >
                    Câu tiếp theo <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    className="rounded-full"
                    onClick={() => setConfirmSubmitOpen(true)}
                    disabled={submitMutation.isPending}
                  >
                    Nộp bài
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Question navigator */}
          <aside className="rounded-3xl border bg-card p-5 shadow-sm lg:sticky lg:top-44 lg:self-start">
            <h4 className="text-sm font-semibold text-foreground">Bảng câu hỏi</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Bấm số để chuyển đến câu tương ứng.
            </p>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const answered = (answers[q.id] ?? "").trim().length > 0;
                const isCurrent = idx === currentIdx;
                const isFlag = flagged.has(q.id);
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => goToQuestion(idx)}
                    aria-label={`Câu ${idx + 1}${answered ? ", đã trả lời" : ", chưa trả lời"}${isFlag ? ", đã đánh dấu" : ""}`}
                    aria-current={isCurrent ? "true" : undefined}
                    className={cn(
                      "relative flex h-9 items-center justify-center rounded-lg border text-xs font-bold transition-all",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                      isCurrent
                        ? "border-primary bg-primary text-primary-foreground shadow"
                        : answered
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
                        : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted"
                    )}
                  >
                    {idx + 1}
                    {isFlag && (
                      <span
                        aria-hidden
                        className="absolute -right-1 -top-1 inline-flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 text-[8px] text-white"
                      >
                        ★
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 space-y-2 text-xs text-muted-foreground">
              <LegendDot className="border-primary bg-primary" label="Đang xem" />
              <LegendDot className="border-emerald-300 bg-emerald-50" label="Đã trả lời" />
              <LegendDot className="border-border bg-background" label="Chưa trả lời" />
              <LegendDot className="border-amber-300 bg-amber-50" label="Đánh dấu xem lại" badge />
            </div>
          </aside>
        </div>

        <AlertDialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận nộp bài?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-sm">
                  <p>Vui lòng kiểm tra lại thông tin bài làm trước khi nộp:</p>
                  <div className="rounded-xl border bg-muted/30 p-3 text-foreground">
                    <SubmitStatLine label="Đã trả lời" value={`${answeredCount}/${totalQuestions}`} tone="success" />
                    <SubmitStatLine label="Chưa trả lời" value={`${unansweredCount}`} tone={unansweredCount > 0 ? "warning" : "muted"} />
                    <SubmitStatLine label="Đánh dấu xem lại" value={`${flagged.size}`} tone={flagged.size > 0 ? "warning" : "muted"} />
                  </div>
                  {unansweredCount > 0 && (
                    <p className="text-amber-600">
                      Bạn còn {unansweredCount} câu chưa trả lời. Hãy chắc chắn bạn muốn nộp bài.
                    </p>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitMutation.isPending}>
                Quay lại kiểm tra
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={submitMutation.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  submitMutation.mutate();
                }}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang nộp…
                  </>
                ) : (
                  "Nộp bài"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ───────── Result state ─────────
  if (state === "result" && result) {
    const { correct, total, percentage } = result.score;
    const passingPct = totalScore > 0 ? Math.round((passingScore / totalScore) * 100) : 0;
    const passed = percentage >= passingPct;

    return (
      <div className="space-y-5">
        <div
          className={cn(
            "overflow-hidden rounded-3xl border shadow-lg",
            passed ? "border-emerald-200 bg-emerald-50/40" : "border-amber-200 bg-amber-50/40"
          )}
        >
          <div className="grid gap-6 p-8 md:grid-cols-[auto_1fr] md:items-center">
            <div className="flex flex-col items-center justify-center">
              <ScoreRing percentage={percentage} passed={passed} />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                {correct}/{total} câu đúng
              </p>
            </div>
            <div className="space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                {passed ? (
                  <Trophy className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Award className="h-3.5 w-3.5 text-amber-600" />
                )}
                Kết quả
              </div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight">
                {passed ? "Chúc mừng — Bạn đã đạt!" : "Chưa đạt yêu cầu"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {passed
                  ? "Bạn đã hoàn thành bài kiểm tra này. Tiếp tục với bài học tiếp theo nhé."
                  : `Điểm đạt yêu cầu là ${passingPct}%. Hãy ôn tập và thử lại.`}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button onClick={handleRestart} variant="outline" className="rounded-full">
                  <RefreshCw className="mr-2 h-4 w-4" /> Làm lại bài kiểm tra
                </Button>
                {onContinue && (
                  <Button onClick={onContinue} className="rounded-full">
                    Tiếp tục bài học tiếp theo <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Chi tiết bài làm</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Xem lại từng câu hỏi và đáp án đúng để củng cố kiến thức.
          </p>
          <div className="mt-4 space-y-3">
            {result.details.map((d, idx) => (
              <div
                key={d.questionId}
                className={cn(
                  "rounded-2xl border p-4",
                  d.isCorrect
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-rose-200 bg-rose-50/40"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">
                    Câu {idx + 1}. {d.questionText}
                  </p>
                  {d.isCorrect ? (
                    <Badge className="rounded-full bg-emerald-600 hover:bg-emerald-700">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Đúng
                    </Badge>
                  ) : (
                    <Badge className="rounded-full bg-rose-600 hover:bg-rose-700">
                      <XCircle className="mr-1 h-3 w-3" /> Sai
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-sm">
                  <span className="text-muted-foreground">Bạn chọn:</span>{" "}
                  <span className="font-medium">{d.userAnswer}</span>
                </p>
                {!d.isCorrect && (
                  <p className="mt-1 text-sm">
                    <span className="text-muted-foreground">Đáp án đúng:</span>{" "}
                    <span className="font-medium text-emerald-700">{d.correctAnswer}</span>
                  </p>
                )}
                {d.explanation && (
                  <p className="mt-2 rounded-xl bg-background/70 p-3 text-sm text-foreground/80">
                    <span className="font-semibold">Giải thích:</span> {d.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// ───────── Small helpers ─────────

const StatTile = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="rounded-2xl border bg-background/80 p-4">
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      {label}
    </div>
    <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
  </div>
);

const InstructionItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2">
    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
    <span>{children}</span>
  </li>
);

const LegendDot = ({
  className,
  label,
  badge,
}: {
  className: string;
  label: string;
  badge?: boolean;
}) => (
  <div className="flex items-center gap-2">
    <span
      className={cn(
        "relative inline-block h-4 w-4 rounded border-2",
        className
      )}
    >
      {badge && (
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-amber-500" />
      )}
    </span>
    <span>{label}</span>
  </div>
);

const SubmitStatLine = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "muted";
}) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-muted-foreground">{label}</span>
    <span
      className={cn(
        "font-semibold",
        tone === "success" && "text-emerald-600",
        tone === "warning" && "text-amber-600",
        tone === "muted" && "text-foreground"
      )}
    >
      {value}
    </span>
  </div>
);

const ScoreRing = ({ percentage, passed }: { percentage: number; passed: boolean }) => {
  const size = 140;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color = passed ? "rgb(16 185 129)" : "rgb(245 158 11)";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="transparent"
          className="text-muted/40"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-extrabold tabular-nums">
          {percentage}%
        </span>
        <span className={cn("text-xs font-semibold uppercase tracking-wide", passed ? "text-emerald-600" : "text-amber-600")}>
          {passed ? "Đạt" : "Chưa đạt"}
        </span>
      </div>
    </div>
  );
};
