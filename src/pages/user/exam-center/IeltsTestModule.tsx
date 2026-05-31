import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { BarChart2, Lightbulb, Lock } from 'lucide-react';
import apiClient from "@/lib/api/config";
import { useSubmitWriting, useWritingEvaluation, useWritingAssistant } from "@/hooks/api/use-ai-evaluation";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import SpeakingTestLayout from "./SpeakingTestLayout";

// ─── Section-level instructions (Cambridge IELTS format) ─────────────────────
const SECTION_INSTRUCTIONS: Record<string, string> = {
  TRUE_FALSE_NOT_GIVEN:
    "Do the following statements agree with the information given in the passage?\n\nWrite:\nTRUE   —   if the statement agrees with the information\nFALSE   —   if the statement contradicts the information\nNOT GIVEN   —   if there is no information on this",
  YES_NO_NOT_GIVEN:
    "Do the following statements agree with the views/claims of the writer?\n\nWrite:\nYES   —   if the statement agrees with the claims of the writer\nNO   —   if the statement contradicts the claims of the writer\nNOT GIVEN   —   if it is impossible to say what the writer thinks about this",
  MULTIPLE_CHOICE:
    "Choose the correct letter, A, B, C or D.",
  MULTIPLE_CHOICE_MULTI_ANSWER:
    "Choose TWO letters, A–E.",
  GAP_FILL:
    "Complete the sentences below.\n\nChoose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.",
  SHORT_ANSWER:
    "Answer the questions below.\n\nChoose NO MORE THAN THREE WORDS from the passage for each answer.",
  MATCHING:
    "Look at the following statements and match each one with the correct option in the list below.",
};

// ─── Highlight Colors ────────────────────────────────────────────────────────
const HIGHLIGHT_COLORS = [
  { name: 'Yellow', color: '#fef08a', border: '#eab308' },
  { name: 'Green', color: '#bbf7d0', border: '#22c55e' },
  { name: 'Blue', color: '#bfdbfe', border: '#3b82f6' },
  { name: 'Pink', color: '#fbcfe8', border: '#ec4899' },
];

// ─── Types (matching assessment-service API response) ────────────────────────

interface QuestionData {
  id: string;
  questionType: "MULTIPLE_CHOICE" | "MULTIPLE_CHOICE_MULTI_ANSWER" | "GAP_FILL" | "SHORT_ANSWER" | "MATCHING" | "TRUE_FALSE_NOT_GIVEN" | "YES_NO_NOT_GIVEN" | string;
  questionText?: string;
  imageUrl?: string | null;
  content?: {
    text?: string;
    options?: string[];
  };
  questionOrder: number;
  explanation?: string;
}

interface PassageData {
  id: string;
  content: string;
  passageOrder: number;
}

interface SectionData {
  id: string;
  title: string;
  skill?: string;
  mediaUrl?: string | null;
  audioTranscript?: string | null;
  imageUrl?: string | null;
  orderIndex?: number;
  passages: PassageData[];
  questions: QuestionData[];
}

interface TestData {
  id: string;
  title: string;
  slug?: string;
  status: string;
  durationInMinutes: number | null;
  testSkills?: { skill: string }[];
  sections: SectionData[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function IeltsTestModule() {
  const { t } = useTranslation("exam");
  const { testId, sessionId: urlSessionId } = useParams<{ testId: string; sessionId?: string }>();
  const [sessionId, setSessionId] = useState<string | null>(urlSessionId || null);
  // Mirror sessionId in a ref so submit (incl. the timer's auto-submit) always
  // sends the current session id without depending on / re-creating callbacks.
  const sessionIdRef = useRef<string | null>(urlSessionId || null);
  const [testData, setTestData] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Writing essays keyed by writing-task index. Declared here (rather than in
  // the Writing section further down) so the draft auto-save effect can depend
  // on them without a temporal-dead-zone error.
  const [activeWritingTab, setActiveWritingTab] = useState(0);
  const [writingEssays, setWritingEssays] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [gradingResult, setGradingResult] = useState<any>(null);

  // Submit confirmation + time-warning + layout controls
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [timeWarning, setTimeWarning] = useState<string | null>(null);
  const firedTimeWarnings = useRef<Set<number>>(new Set());
  const [mobilePane, setMobilePane] = useState<'passage' | 'questions'>('questions');
  const [isDesktop, setIsDesktop] = useState(true);
  const [leftWidth, setLeftWidth] = useState(50); // % width of passage panel (desktop)
  const [passageFontScale, setPassageFontScale] = useState(1); // 0.85 – 1.4
  const isResizing = useRef(false);

  // Track desktop vs mobile (≥1024px = lg). Drives split-screen vs tabbed panes.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Drag-to-resize the passage/questions divider (desktop only)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const pct = (e.clientX / window.innerWidth) * 100;
      setLeftWidth(Math.min(72, Math.max(28, pct)));
    };
    const onUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const autoSaveKey = testId ? `ielts_draft_${testId}` : null;
  const highlightKey = testId ? `ielts_hl_${testId}` : null;

  // Restore draft answers on mount (F5/tab close protection)
  useEffect(() => {
    if (!autoSaveKey) return;
    try {
      const raw = localStorage.getItem(autoSaveKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.answers && typeof parsed.answers === 'object') {
          setAnswers(parsed.answers);
        }
        // Writing essays are the most painful thing to lose on an accidental
        // refresh, so restore them alongside the MCQ/gap answers.
        if (parsed?.writingEssays && typeof parsed.writingEssays === 'object') {
          setWritingEssays(parsed.writingEssays);
        }
      }
    } catch { /* ignore parse errors */ }
  }, [autoSaveKey]);

  // Auto-save answers + writing essays with debounce
  useEffect(() => {
    if (!autoSaveKey || submitted) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          autoSaveKey,
          JSON.stringify({ answers, writingEssays, savedAt: new Date().toISOString() }),
        );
      } catch { /* quota or private mode — ignore */ }
    }, 1500);
    return () => clearTimeout(t);
  }, [answers, writingEssays, autoSaveKey, submitted]);

  // Keep the session-id ref in sync with state.
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  // Best-effort server-side draft autosave (debounced, slower than localStorage).
  // Backs up answers beyond the browser so work survives a localStorage wipe or
  // a device switch. Degrades silently if the draft endpoint isn't ready.
  useEffect(() => {
    if (submitted || !testData?.id) return;
    const sid = sessionIdRef.current;
    if (!sid || Object.keys(answers).length === 0) return;
    const h = setTimeout(() => {
      apiClient
        .post(`/tests/${testData.id}/draft`, { sessionId: sid, answers })
        .catch(() => { /* offline / endpoint not migrated yet — local draft covers it */ });
    }, 4000);
    return () => clearTimeout(h);
  }, [answers, testData?.id, submitted]);

  // Warn before an accidental refresh / tab close while the test is in progress.
  useBeforeUnload(
    !!testData && !submitted && !loading,
    "Bài thi đang làm dở sẽ không được nộp nếu bạn rời trang.",
  );

  // Audio refs for listening sections
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const passageRef = useRef<HTMLDivElement | null>(null);
  const questionsRef = useRef<HTMLDivElement | null>(null);

  // IELTS rule: audio plays exactly once per section. Track which sections have already played.
  const [playedSections, setPlayedSections] = useState<Set<string>>(new Set());
  const [audioStarted, setAudioStarted] = useState(false);
  const [showTranscript, setShowTranscript] = useState<Record<string, boolean>>({});
  // True while the listening audio is buffering/loading — the countdown pauses so
  // a slow connection doesn't eat exam time. Mirrored to a ref so the 1s timer
  // can read it without restarting the interval each time it flips.
  const [audioLoading, setAudioLoading] = useState(false);
  const audioLoadingRef = useRef(false);
  useEffect(() => { audioLoadingRef.current = audioLoading; }, [audioLoading]);

  useEffect(() => {
    setAudioStarted(false);
  }, [currentSectionIdx]);

  // Persist which listening sections have already played, so a refresh can't
  // re-enable replaying the audio. (The timer is server-anchored separately;
  // this closes the matching "listen once" hole.)
  useEffect(() => {
    if (!testId) return;
    try {
      const raw = localStorage.getItem(`ielts_played_${testId}`);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setPlayedSections(new Set(arr));
      }
    } catch { /* ignore parse errors */ }
  }, [testId]);

  useEffect(() => {
    if (!testId || submitted) return;
    try {
      if (playedSections.size > 0) {
        localStorage.setItem(`ielts_played_${testId}`, JSON.stringify([...playedSections]));
      }
    } catch { /* quota or private mode — ignore */ }
  }, [playedSections, testId, submitted]);

  const handleAudioPlay = useCallback(() => {
    setAudioStarted(true);
    setAudioLoading(false); // playback started → not buffering
  }, []);

  const handleAudioEnded = useCallback(() => {
    setAudioLoading(false);
    const sid = testData?.sections?.[currentSectionIdx]?.id;
    if (sid) setPlayedSections(prev => new Set(prev).add(sid));
  }, [testData, currentSectionIdx]);

  // Buffering ↔ ready, used to pause/resume the exam countdown.
  const handleAudioWaiting = useCallback(() => setAudioLoading(true), []);
  const handleAudioReady = useCallback(() => setAudioLoading(false), []);

  // Reset the loading flag when switching sections so a previous section's
  // buffering state can never leave the timer paused.
  useEffect(() => { setAudioLoading(false); }, [currentSectionIdx]);

  const handleAudioSeeking = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    const sid = testData?.sections?.[currentSectionIdx]?.id;
    if (sid && playedSections.has(sid)) {
      try { el.pause(); el.currentTime = el.duration || 0; } catch { /* noop */ }
      return;
    }
    if (audioStarted && el.currentTime < (el as any)._lastTime - 0.5) {
      el.currentTime = (el as any)._lastTime || 0;
    }
    (el as any)._lastTime = el.currentTime;
  }, [audioStarted, playedSections, testData, currentSectionIdx]);

  const handleAudioTimeUpdate = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    (el as any)._lastTime = el.currentTime;
  }, []);

  // ─── Highlight State ────────────────────────────────────────────────────────
  const [highlightPopover, setHighlightPopover] = useState<{ x: number; y: number; range: Range } | null>(null);
  const [highlightMode, setHighlightMode] = useState(false);
  const [savedHighlights, setSavedHighlights] = useState<Record<string, string>>({});

  // Restore highlight snapshots on mount (F5 protection — parallels answers draft)
  useEffect(() => {
    if (!highlightKey) return;
    try {
      const raw = localStorage.getItem(highlightKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') setSavedHighlights(parsed);
      }
    } catch { /* ignore parse errors */ }
  }, [highlightKey]);

  // Persist highlight snapshots with debounce
  useEffect(() => {
    if (!highlightKey || submitted) return;
    const t = setTimeout(() => {
      try {
        if (Object.keys(savedHighlights).length > 0) {
          localStorage.setItem(highlightKey, JSON.stringify(savedHighlights));
        } else {
          localStorage.removeItem(highlightKey);
        }
      } catch { /* quota or private mode — ignore */ }
    }, 1500);
    return () => clearTimeout(t);
  }, [savedHighlights, highlightKey, submitted]);

  // ─── Question Navigator State ──────────────────────────────────────────────
  const [showNavigator, setShowNavigator] = useState(true);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  const toggleFlag = useCallback((qId: string) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  }, []);

  // ─── Fetch test data by slug/ID ────────────────────────────────────────────
  useEffect(() => {
    const fetchTest = async () => {
      if (!testId) {
        setError(t("ieltsTestModule.errors.noTestId"));
        setLoading(false);
        return;
      }

      try {
        const resp = await apiClient.get(`/tests/${testId}`);
        const test = resp.data?.data;

        if (!test) {
          setError(t("ieltsTestModule.errors.notFound"));
          setLoading(false);
          return;
        }

        setTestData(test);
        // Default in case /start fails (network blip) — overridden below by the
        // server-anchored remaining time on success.
        setTimeLeft((test.durationInMinutes || 60) * 60);

        // Open (or resume) the practice session on the server. startSession
        // reuses an existing ONGOING session, so its startedAt is stable across
        // refreshes — the countdown is derived from it instead of resetting to
        // the full duration (which previously let a refresh reset the clock and
        // re-enable the listening audio). Identity is taken from the JWT server-side.
        try {
          const startResp = await apiClient.post(`/tests/${test.id}/start`);
          const s = startResp.data?.data;
          if (s?.sessionId) {
            setSessionId(s.sessionId);
            window.history.replaceState(null, "", `/exam/test/${testId}/session/${s.sessionId}`);
          }
          const durationSec = ((s?.durationInMinutes ?? test.durationInMinutes) || 60) * 60;
          if (s?.startedAt) {
            const elapsed = Math.floor((Date.now() - new Date(s.startedAt).getTime()) / 1000);
            setTimeLeft(Math.max(0, durationSec - elapsed));
          }
          // Restore the server-side draft when there's no local draft (e.g.
          // resuming on another device). A local draft, if present, wins.
          if (s?.draftAnswers && typeof s.draftAnswers === "object") {
            setAnswers(prev =>
              Object.keys(prev).length > 0 ? prev : (s.draftAnswers as Record<string, string>),
            );
          }
        } catch (err: any) {
          // Attempt-limit / auth errors must block the test, not silently start it.
          const status = err?.response?.status;
          if (status === 401 || status === 403 || status === 429) {
            setError(err?.response?.data?.message || t("ieltsTestModule.errors.loadFailed"));
            setLoading(false);
            return;
          }
          console.warn("Failed to create session:", err);
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Failed to fetch test:", err);
        setError(err.response?.data?.message || t("ieltsTestModule.errors.loadFailed"));
        setLoading(false);
      }
    };

    fetchTest();
  }, [testId]);

  // ─── Writing state ─────────────────────────────────────────────────────────
  // (activeWritingTab + writingEssays are declared with the core test state
  // above so the draft auto-save effect can list them as dependencies.)
  const [writingEvalId, setWritingEvalId] = useState<string | null>(null);
  const [showWritingResult, setShowWritingResult] = useState(false);
  const [writingSubmitting, setWritingSubmitting] = useState(false);
  const submitWritingMutation = useSubmitWriting();
  const { data: writingEvaluation } = useWritingEvaluation(writingEvalId);
  const { result: assistantResult, isLoading: assistantLoading, analyze: analyzeWriting } = useWritingAssistant();

  // ─── Derived data ──────────────────────────────────────────────────────────
  const sections = useMemo(() => testData?.sections || [], [testData]);
  const currentSection = sections[currentSectionIdx];
  const allQuestions = sections.flatMap(s => s.questions);
  const isListeningTest = testData?.testSkills?.some((s: any) => s.skill === 'LISTENING')
    || sections.some(s => s.skill === 'LISTENING')
    || sections.some(s => s.mediaUrl);
  const isWritingTest = testData?.testSkills?.some((s: any) => s.skill === 'WRITING')
    || sections.some(s => s.skill === 'WRITING')
    || sections.some(s => s.questions?.some((q: any) => q.questionType?.includes('WRITING')));
  const isSpeakingTest = testData?.testSkills?.some((s: any) => s.skill === 'SPEAKING')
    || sections.some(s => s.skill === 'SPEAKING')
    || sections.some(s => s.questions?.some((q: any) => q.questionType?.includes('SPEAKING')));
  const testSkillLabel = isSpeakingTest ? "Speaking" : isWritingTest ? "Writing" : isListeningTest ? "Listening" : "Reading";

  // Derived writing essay for hooks
  const currentWritingEssay = writingEssays[activeWritingTab] || '';

  // ─── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!testData || submitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      // Pause the countdown while listening audio is buffering so a slow
      // connection doesn't burn exam time. (The server deadline has a generous
      // grace window, so brief client-side pauses never cause a late rejection.)
      if (audioLoadingRef.current) return;
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [testData, timeLeft, submitted]);

  // ─── Time-remaining warnings (5 min / 1 min) ────────────────────────────────
  useEffect(() => {
    if (!testData || submitted || timeLeft <= 0) return;
    const fire = (mark: number, msg: string) => {
      if (timeLeft <= mark && !firedTimeWarnings.current.has(mark)) {
        firedTimeWarnings.current.add(mark);
        setTimeWarning(msg);
        setTimeout(() => setTimeWarning(curr => (curr === msg ? null : curr)), 6000);
      }
    };
    fire(300, t('ieltsTestModule.timeWarnings.fiveMin'));
    fire(60, t('ieltsTestModule.timeWarnings.oneMin'));
  }, [timeLeft, testData, submitted, t]);

  // ─── Writing assistant (debounced) ──────────────────────────────────────────
  useEffect(() => {
    if (!isWritingTest || currentWritingEssay.length <= 30) return;
    const sentences = currentWritingEssay.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    analyzeWriting(sentences[sentences.length - 1] || '', sentences[sentences.length - 2] || '');
  }, [currentWritingEssay, isWritingTest]);

  // ─── Writing evaluation completed ──────────────────────────────────────────
  useEffect(() => {
    if (writingEvaluation?.status === 'COMPLETED' || writingEvaluation?.status === 'FAILED') {
      setWritingSubmitting(false);
    }
  }, [writingEvaluation?.status]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ─── Answer Handling ────────────────────────────────────────────────────────
  const setAnswer = useCallback((qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  }, []);

  // Gap numbers for a multi-gap Summary Completion question (empty for others).
  const gapNumsFor = useCallback((q: QuestionData): string[] => {
    const summary = (q.content as any)?.summaryText as string | undefined;
    if (q.questionType !== 'GAP_FILL' || !summary) return [];
    return Array.from(summary.matchAll(/\{\{(\d+)\}\}/g)).map((m) => m[1]);
  }, []);

  // Answered = a normal question with a value, or a multi-gap question with
  // at least one gap filled.
  const questionAnswered = useCallback((q: QuestionData): boolean => {
    const gaps = gapNumsFor(q);
    if (gaps.length > 0) return gaps.some((n) => answers[`${q.id}::${n}`]?.trim());
    return !!answers[q.id]?.trim();
  }, [answers, gapNumsFor]);

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const navigate = useNavigate();
  const handleSubmit = useCallback(async () => {
    if (!testData || isSubmitting || submitted) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Extract userId from JWT
      let userId: string | undefined;
      try {
        const token = localStorage.getItem("accessToken");
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          userId = payload.sub || payload.userId || payload.id;
        }
      } catch {}
      // Assemble submissions. Multi-gap GAP_FILL questions hold per-gap values
      // under composite keys `${q.id}::${gapNum}`; collapse those into a single
      // JSON object keyed by gap number. All other keys pass through unchanged.
      const submissions: Record<string, string> = {};
      const gapByQuestion: Record<string, string[]> = {};
      for (const sec of (testData.sections || [])) {
        for (const q of (sec.questions || [])) {
          const summary = (q as any).content?.summaryText as string | undefined;
          if (q.questionType === 'GAP_FILL' && summary) {
            const nums = Array.from(summary.matchAll(/\{\{(\d+)\}\}/g)).map((m) => m[1]);
            if (nums.length > 0) gapByQuestion[q.id] = nums;
          }
        }
      }
      for (const [k, v] of Object.entries(answers)) {
        if (k.includes('::')) continue; // composite gap keys handled below
        submissions[k] = v;
      }
      for (const [qId, nums] of Object.entries(gapByQuestion)) {
        const obj: Record<string, string> = {};
        for (const n of nums) {
          const val = answers[`${qId}::${n}`];
          if (val != null && val.trim() !== '') obj[n] = val.trim();
        }
        if (Object.keys(obj).length > 0) submissions[qId] = JSON.stringify(obj);
        else delete submissions[qId];
      }
      const resp = await apiClient.post(`/tests/${testData.id}/submit`, {
        submissions,
        userId,
        // Closes the ONGOING session opened at start (server grades it once).
        sessionId: sessionIdRef.current,
      });
      const sessionId = resp.data?.data?.sessionId;
      if (autoSaveKey) {
        try { localStorage.removeItem(autoSaveKey); } catch {}
      }
      if (highlightKey) {
        try { localStorage.removeItem(highlightKey); } catch {}
      }
      if (testId) {
        try { localStorage.removeItem(`ielts_played_${testId}`); } catch {}
      }
      if (sessionId) {
        navigate(`/practice/${testData.id}/result/${sessionId}`);
      } else {
        // Fallback: show inline if no session saved
        setGradingResult(resp.data?.data);
        setSubmitted(true);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || t("ieltsTestModule.errors.submitFailed");
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [testData, answers, navigate, isSubmitting, submitted, autoSaveKey, highlightKey, t]);

  // ─── Highlight Handlers (must be before any early returns!) ──────────────
  const attachMarkRemovalHandler = useCallback((mark: HTMLElement) => {
    mark.addEventListener('click', function onClick(e) {
      e.stopPropagation();
      const parent = mark.parentNode;
      if (parent) {
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
        parent.normalize();
      }
    });
  }, []);

  const snapshotCurrentHighlights = useCallback(() => {
    const sectionId = sections[currentSectionIdx]?.id;
    if (!passageRef.current || !sectionId) return;
    const hasMarks = passageRef.current.querySelector('mark[data-highlight]') !== null;
    setSavedHighlights(prev => {
      if (hasMarks) {
        return { ...prev, [sectionId]: passageRef.current!.innerHTML };
      }
      if (prev[sectionId] === undefined) return prev;
      const { [sectionId]: _removed, ...rest } = prev;
      return rest;
    });
  }, [sections, currentSectionIdx]);

  // Single navigation entrypoint — snapshots highlights, then changes index.
  const navigateToSection = useCallback((next: number | ((prev: number) => number)) => {
    snapshotCurrentHighlights();
    setCurrentSectionIdx(next);
  }, [snapshotCurrentHighlights]);

  // ─── Navigation ─────────────────────────────────────────────────────────────
  const goNext = () => {
    if (currentSectionIdx < sections.length - 1) navigateToSection(prev => prev + 1);
  };
  const goPrev = () => {
    if (currentSectionIdx > 0) navigateToSection(prev => prev - 1);
  };

  // ─── Keyboard shortcuts: [ / ] move between sections, h toggles highlight ────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      // Ignore while typing in a field
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === ']') {
        if (currentSectionIdx < sections.length - 1) navigateToSection(prev => prev + 1);
      } else if (e.key === '[') {
        if (currentSectionIdx > 0) navigateToSection(prev => prev - 1);
      } else if (e.key === 'h' || e.key === 'H') {
        setHighlightMode(m => !m);
        setHighlightPopover(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentSectionIdx, sections.length, navigateToSection]);

  const handleTextSelect = useCallback(() => {
    if (!highlightMode) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      setHighlightPopover(null);
      return;
    }
    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    if (!text || !(passageRef.current?.contains(range.commonAncestorContainer) || questionsRef.current?.contains(range.commonAncestorContainer))) {
      setHighlightPopover(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    setHighlightPopover({ x: rect.left + rect.width / 2, y: rect.top - 10, range: range.cloneRange() });
  }, [highlightMode]);

  const applyHighlight = useCallback((color: string) => {
    if (!highlightPopover?.range) return;
    try {
      const range = highlightPopover.range;
      const mark = document.createElement('mark');
      mark.style.backgroundColor = color;
      mark.style.borderRadius = '2px';
      mark.style.padding = '1px 0';
      mark.style.cursor = 'pointer';
      mark.dataset.highlight = 'true';
      mark.title = 'Click to remove highlight';
      attachMarkRemovalHandler(mark);
      range.surroundContents(mark);
      // Persist immediately — protects against navigation paths we might miss.
      const sectionId = sections[currentSectionIdx]?.id;
      if (sectionId && passageRef.current) {
        const html = passageRef.current.innerHTML;
        setSavedHighlights(prev => ({ ...prev, [sectionId]: html }));
      }
    } catch { /* skip if range crosses element boundaries */ }
    window.getSelection()?.removeAllRanges();
    setHighlightPopover(null);
  }, [highlightPopover, attachMarkRemovalHandler, sections, currentSectionIdx]);

  const clearAllHighlights = useCallback(() => {
    if (!passageRef.current) return;
    const marks = passageRef.current.querySelectorAll('mark[data-highlight]');
    marks.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
        parent.normalize();
      }
    });
    // Drop the saved entry so a future navigation away doesn't reintroduce them.
    const sectionId = sections[currentSectionIdx]?.id;
    if (sectionId) {
      setSavedHighlights(prev => {
        if (prev[sectionId] === undefined) return prev;
        const { [sectionId]: _removed, ...rest } = prev;
        return rest;
      });
    }
  }, [sections, currentSectionIdx]);

  // Restore highlights after React re-renders the passage for a new section.
  // Runs whenever the rendered section changes; if we have a saved HTML
  // snapshot for it, swap the passage DOM and re-bind removal handlers.
  useEffect(() => {
    const sectionId = sections[currentSectionIdx]?.id;
    if (!sectionId || !passageRef.current) return;
    const saved = savedHighlights[sectionId];
    if (!saved) return;
    if (passageRef.current.innerHTML === saved) return;
    passageRef.current.innerHTML = saved;
    passageRef.current
      .querySelectorAll<HTMLElement>('mark[data-highlight]')
      .forEach(attachMarkRemovalHandler);
  }, [currentSectionIdx, sections, savedHighlights, attachMarkRemovalHandler]);

  // Close popover on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (highlightPopover && !(e.target as HTMLElement)?.closest?.('.highlight-popover')) {
        setHighlightPopover(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [highlightPopover]);

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6 mx-auto"></div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">{t("ieltsTestModule.loading.title")}</h2>
          <p className="text-slate-500">{t("ieltsTestModule.loading.subtitle")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 max-w-md text-center">
          <span className="material-symbols-outlined text-red-500 text-5xl mb-4 block">error</span>
          <h2 className="text-xl font-bold text-slate-800 mb-2">{t("ieltsTestModule.errorTitle")}</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link to="/exam" className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
            {t("ieltsTestModule.backToExamCenter")}
          </Link>
        </div>
      </div>
    );
  }

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const currentQuestions = currentSection?.questions || [];
  const answeredCount = currentQuestions.filter(q => questionAnswered(q)).length;
  const totalAnswered = allQuestions.filter(q => questionAnswered(q)).length;

  // ─── Result Screen ─────────────────────────────────────────────────────────
  // Fallback inline result (when sessionId not available)
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
          <h2 className="text-xl font-bold text-slate-800">{t("ieltsTestModule.submitted.title")}</h2>
          <p className="text-slate-500">{t("ieltsTestModule.submitted.subtitle")}</p>
          <div className="flex gap-3 justify-center">
            <Link to="/exam" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">
              ← {t("ieltsTestModule.submitted.examCenter")}
            </Link>
            <Link to="/exam/history" className="px-6 py-2.5 bg-white text-indigo-600 rounded-xl font-bold border-2 border-indigo-200 hover:bg-indigo-50 transition">
              <BarChart2 size={16} className="mr-1.5 inline-block" /> {t("ieltsTestModule.submitted.history")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!currentSection) return null;

  const passageContent = currentSection.passages?.[0]?.content || "";

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEAKING TEST — Dedicated Layout with Voice Recording
  // ═══════════════════════════════════════════════════════════════════════════
  if (isSpeakingTest) {
    return <SpeakingTestLayout
      testData={testData}
      sections={sections}
      currentSectionIdx={currentSectionIdx}
      setCurrentSectionIdx={navigateToSection}
      answers={answers}
      setAnswer={setAnswer}
      formatTime={formatTime}
      timeLeft={timeLeft}
      goNext={goNext}
      goPrev={goPrev}
      handleSubmit={handleSubmit}
    />;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITING TEST — Dedicated Layout
  // ═══════════════════════════════════════════════════════════════════════════
  if (isWritingTest) {
    // Build writing sections from test data
    const writingSections = sections.map((sec, idx) => {
      const q = sec.questions?.[0];
      const isTask1 = q?.questionType?.includes('TASK1') || sec.title?.toLowerCase().includes('task 1');
      return {
        sectionIdx: idx,
        title: sec.title || (isTask1 ? t('ieltsTestModule.writing.defaultTask1Title') : t('ieltsTestModule.writing.defaultTask2Title')),
        taskType: isTask1 ? 1 as const : 2 as const,
        imageUrl: sec.imageUrl || q?.imageUrl || (q as any)?.content?.imageUrl,
        prompt: q?.questionText || (q as any)?.content?.prompt || (q as any)?.content?.text || '',
        questionId: q?.id,
        wordCountMin: isTask1 ? 150 : 250,
      };
    });

    const activeWSection = writingSections[activeWritingTab] || writingSections[0];
    const currentWEssay = writingEssays[activeWritingTab] || '';
    const wWordCount = currentWEssay.trim().split(/\s+/).filter(Boolean).length;

    const handleWritingSubmit = async () => {
      if (writingSubmitting) return;
      const text = currentWEssay.trim();
      if (text.length < 50) return;
      setWritingSubmitting(true);
      try {
        let userId: string | undefined;
        try {
          const token = localStorage.getItem('accessToken');
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.sub || payload.userId || 'anonymous';
          }
        } catch {}
        const result = await submitWritingMutation.mutateAsync({
          userId: userId || 'anonymous',
          essayText: text,
          questionId: activeWSection?.questionId,
          taskType: activeWSection?.taskType || 2,
          question: activeWSection?.prompt,
          imageUrl: activeWSection?.imageUrl,
        });
        setWritingEvalId(result.data?.evaluationId || null);
        setShowWritingResult(true);
      } catch (err) {
        console.error('Submit failed:', err);
        setWritingSubmitting(false);
      }
    };

    // ── Writing Result Screen ────────────────────────────────────────────
    if (showWritingResult) {
      return (
        <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-900">
          <header className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-600">edit_note</span>
              <h1 className="font-bold text-slate-800 text-sm">{t("ieltsTestModule.writing.resultHeader")}</h1>
            </div>
            <Link to="/exam" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">← {t("ieltsTestModule.writing.backLink")}</Link>
          </header>
          <div className="max-w-4xl mx-auto p-8">
            {(!writingEvaluation || writingEvaluation.status === 'PENDING' || writingEvaluation.status === 'PROCESSING') && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-6" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">{t("writingTest.result.evaluatingTitle")}</h2>
                <p className="text-slate-500">{t("writingTest.result.evaluatingSubtitle")}</p>
              </div>
            )}
            {writingEvaluation?.status === 'FAILED' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                <h2 className="text-xl font-bold text-red-800 mb-2">{t("writingTest.result.failedTitle")}</h2>
                <p className="text-red-600 mb-4">{t("writingTest.result.failedBody")}</p>
                <button onClick={() => { setShowWritingResult(false); setWritingEvalId(null); setWritingSubmitting(false); }}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700">{t("writingTest.result.retry")}</button>
              </div>
            )}
            {writingEvaluation?.status === 'COMPLETED' && writingEvaluation.criteria && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                  <p className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-2">{t("writingTest.result.estimatedBand")}</p>
                  <div className="text-7xl font-black text-emerald-600 mb-2">{writingEvaluation.overallBand}</div>
                  <p className="text-xs text-slate-400 italic mb-3">{t("writingTest.result.disclaimer")}</p>
                  <p className="text-slate-600 text-sm max-w-xl mx-auto">{writingEvaluation.overallFeedback}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'task_achievement', label: t('writingTest.result.criteria.taskAchievement'), icon: 'task_alt' },
                    { key: 'coherence', label: t('writingTest.result.criteria.coherence'), icon: 'link' },
                    { key: 'lexical', label: t('writingTest.result.criteria.lexical'), icon: 'dictionary' },
                    { key: 'grammar', label: t('writingTest.result.criteria.grammar'), icon: 'spellcheck' },
                  ].map(({ key, label, icon }) => {
                    const c = writingEvaluation.criteria?.[key as keyof typeof writingEvaluation.criteria];
                    if (!c) return null;
                    return (
                      <div key={key} className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500 text-xl">{icon}</span>
                            <span className="font-semibold text-slate-800 text-sm">{label}</span>
                          </div>
                          <span className="text-2xl font-black text-emerald-600">{c.score}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{c.feedback}</p>
                      </div>
                    );
                  })}
                </div>
                {writingEvaluation.highlightedErrors && writingEvaluation.highlightedErrors.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500">warning</span>
                      {t("ieltsTestModule.writing.errorsDetected", { count: writingEvaluation.highlightedErrors.length })}
                    </h3>
                    <div className="space-y-3">
                      {writingEvaluation.highlightedErrors.map((err: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${err.type === 'grammar' ? 'bg-red-100 text-red-700' : err.type === 'vocab' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{err.type}</span>
                          <div className="flex-1 text-sm">
                            <p className="text-red-600 line-through">{err.original}</p>
                            <p className="text-green-700 font-medium">→ {err.suggestion}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-center pt-4">
                  <Link to="/exam" className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors">{t("ieltsTestModule.writing.backToExamCenter")}</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // ── Writing Editor Screen ────────────────────────────────────────────
    return (
      <div className="h-screen flex flex-col bg-[#f8fafc] font-sans text-slate-900 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-5 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <Link to="/exam" className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-sm leading-tight">{testData?.title}</h1>
              <span className="text-[11px] text-slate-500">{t("ieltsTestModule.writing.ieltsWriting")}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {assistantLoading && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 animate-pulse">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />{t("ieltsTestModule.writing.aiChecking")}
              </div>
            )}
            <div className={`px-2.5 py-1 rounded-md font-mono font-bold text-sm ${timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
              {formatTime(timeLeft)}
            </div>
            <button onClick={handleWritingSubmit} disabled={writingSubmitting || wWordCount < 20}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors">
              {writingSubmitting ? t("ieltsTestModule.writing.submitting") : t("ieltsTestModule.writing.submit")}
            </button>
          </div>
        </header>

        {/* Section Tabs */}
        {writingSections.length > 1 && (
          <div className="bg-white border-b border-slate-200 px-5 flex gap-1 py-1.5 shrink-0">
            {writingSections.map((sec, idx) => (
              <button key={sec.sectionIdx} onClick={() => setActiveWritingTab(idx)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeWritingTab === idx ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}>
                <span className="material-symbols-outlined text-[16px]">{sec.taskType === 1 ? 'bar_chart' : 'edit_note'}</span>
                {sec.title}
              </button>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left — Question + Chart */}
          <div className="w-[38%] bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-[18px] ${activeWSection.taskType === 1 ? 'text-blue-600' : 'text-orange-500'}`}>
                  {activeWSection.taskType === 1 ? 'bar_chart' : 'edit_note'}
                </span>
                <h2 className="font-bold text-slate-700 text-sm">{activeWSection.title}</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-auto">{t("ieltsTestModule.writing.wordsMin", { count: activeWSection.wordCountMin })}</span>
              </div>
            </div>
            <div className="flex-1 p-5 space-y-5">
              {activeWSection.imageUrl && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t("ieltsTestModule.writing.chartLabel")}</p>
                  <img src={activeWSection.imageUrl} alt={t("ieltsTestModule.writing.task1VisualAlt")} className="w-full rounded-lg border border-slate-200 bg-white" />
                </div>
              )}
              <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2">{t("ieltsTestModule.writing.promptLabel")}</p>
                <p className="text-sm text-slate-800 leading-relaxed italic">{activeWSection.prompt}</p>
                <p className="text-xs text-slate-600 mt-3">{t("ieltsTestModule.writing.writeAtLeast", { count: activeWSection.wordCountMin })}</p>
              </div>
              {assistantResult && (assistantResult.errors.length > 0 || assistantResult.suggestions.length > 0) && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>{t("ieltsTestModule.writing.assistantTitle")}
                  </h4>
                  {assistantResult.errors.map((err, i) => (
                    <div key={`e-${i}`} className="text-xs mb-2 p-2 bg-white rounded border border-amber-100">
                      <span className={`font-bold px-1.5 py-0.5 rounded mr-1 ${err.type === 'grammar' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{err.type}</span>
                      <span className="text-red-600 line-through">{err.text}</span>
                      <span className="mx-1">→</span>
                      <span className="text-green-700 font-medium">{err.suggestion}</span>
                    </div>
                  ))}
                  {assistantResult.suggestions.map((sug, i) => (
                    <div key={`s-${i}`} className="text-xs mb-1 p-2 bg-white rounded border border-blue-100">
                      <Lightbulb size={12} className="inline mr-1 text-blue-600 shrink-0" /> {sug.improvement}
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t("ieltsTestModule.writing.tipsTitle")}</h4>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  {activeWSection.taskType === 1 ? (
                    <><li>{t("ieltsTestModule.writing.task1Tips.paraphrase")}</li><li>{t("ieltsTestModule.writing.task1Tips.overview")}</li><li>{t("ieltsTestModule.writing.task1Tips.compare")}</li></>
                  ) : (
                    <><li>{t("ieltsTestModule.writing.task2Tips.outline")}</li><li>{t("ieltsTestModule.writing.task2Tips.bothViews")}</li><li>{t("ieltsTestModule.writing.task2Tips.linking")}</li></>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Right — Essay Editor */}
          <div className="w-[62%] bg-white flex flex-col h-full">
            <div className="px-5 py-2 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
              <span className="text-xs text-slate-500 font-medium">{t("ieltsTestModule.writing.yourEssay")}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-400">
                  {t("ieltsTestModule.writing.wordCountLabel")}{' '}
                  <span className={`font-bold ${wWordCount >= activeWSection.wordCountMin ? 'text-emerald-600' : wWordCount >= activeWSection.wordCountMin * 0.8 ? 'text-amber-600' : 'text-slate-700'}`}>{wWordCount}</span>
                  <span className="text-slate-300 ml-1">{t("ieltsTestModule.writing.wordsSuffix", { min: activeWSection.wordCountMin })}</span>
                </span>
                {wWordCount >= activeWSection.wordCountMin && (
                  <span className="text-[10px] flex items-center gap-0.5 text-emerald-600 font-bold">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span> {t("ieltsTestModule.writing.enough")}
                  </span>
                )}
              </div>
            </div>
            <textarea
              className="flex-1 p-6 text-base leading-[1.8] text-slate-800 outline-none resize-none font-serif placeholder:text-slate-300"
              placeholder={activeWSection.taskType === 1 ? 'The chart/diagram illustrates...' : 'In today\'s society, the issue of...'}
              value={currentWEssay}
              onChange={(e) => setWritingEssays(prev => ({ ...prev, [activeWritingTab]: e.target.value }))}
              aria-label={t("ieltsTestModule.writing.essayAria")}
            />
            {wWordCount < activeWSection.wordCountMin && (
              <div className="px-5 py-2 border-t border-amber-100 bg-amber-50/70 text-[11px] text-amber-800 shrink-0">
                <Trans
                  i18nKey="ieltsTestModule.writing.needMore"
                  ns="exam"
                  values={{ remaining: activeWSection.wordCountMin - wWordCount, min: activeWSection.wordCountMin }}
                  components={{ strong: <strong /> }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Test Screen ───────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] font-sans text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shrink-0 relative">
        <div className="h-14 flex items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="material-symbols-outlined text-indigo-600 shrink-0">{isListeningTest ? "headphones" : "menu_book"}</span>
            <h1 className="font-bold text-slate-800 text-sm truncate max-w-[120px] sm:max-w-none">{testData?.title}</h1>
            <span className="text-slate-300 hidden md:inline">|</span>
            <span className="text-xs text-slate-500 hidden md:inline truncate">{currentSection.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase shrink-0 ${isListeningTest ? "bg-teal-100 text-teal-700" : "bg-indigo-100 text-indigo-700"}`}>
              {testSkillLabel}
            </span>
            <span className="text-xs text-slate-400 ml-1 hidden lg:inline">{t("ieltsTestModule.test.answeredShort", { answered: answeredCount, total: currentQuestions.length })}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <span className="text-xs text-slate-500 hidden sm:inline">
              {t("ieltsTestModule.test.sectionProgress", { current: currentSectionIdx + 1, total: sections.length })}
            </span>
            <span className="text-xs text-slate-400 hidden lg:inline">
              {t("ieltsTestModule.test.totalProgress", { answered: totalAnswered, total: allQuestions.length })}
            </span>
            <div className={`px-2.5 sm:px-3 py-1 rounded-md font-mono font-bold text-sm ${timeLeft < 60 ? "bg-red-100 text-red-700 animate-pulse" : timeLeft < 120 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
              {formatTime(timeLeft)}
            </div>
            {currentSectionIdx > 0 && (
              <button onClick={goPrev} className="bg-slate-200 text-slate-700 px-2 sm:px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-300 cursor-pointer" title={t("ieltsTestModule.test.prevSectionTitle")}>
                <span className="hidden sm:inline">{t("ieltsTestModule.test.prevSection")}</span><span className="sm:hidden">←</span>
              </button>
            )}
            {currentSectionIdx < sections.length - 1 ? (
              <button onClick={goNext} className="bg-indigo-600 text-white px-3 sm:px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-700 cursor-pointer" title={t("ieltsTestModule.test.nextSectionTitle")}>
                <span className="hidden sm:inline">{t("ieltsTestModule.test.nextSection")}</span><span className="sm:hidden">→</span>
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitConfirm(true)}
                disabled={isSubmitting || submitted}
                className="bg-green-600 text-white px-3 sm:px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? t("ieltsTestModule.test.submitting") : submitted ? t("ieltsTestModule.test.submitted") : t("ieltsTestModule.test.submit")}
              </button>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 w-full bg-slate-100">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${allQuestions.length ? (totalAnswered / allQuestions.length) * 100 : 0}%` }}
          />
        </div>
        {submitError && (
          <div className="absolute top-16 right-3 sm:right-6 bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded-md text-xs shadow-lg max-w-sm z-50">
            <strong className="block mb-0.5">{t("ieltsTestModule.test.submitFailedTitle")}</strong>
            <span>{submitError}</span>
            <button onClick={() => setSubmitError(null)} className="ml-2 text-red-500 hover:text-red-700 font-bold">×</button>
          </div>
        )}
      </header>

      {/* Mobile pane toggle (passage ↔ questions) */}
      <div className="lg:hidden flex shrink-0 border-b border-slate-200 bg-white">
        <button
          onClick={() => setMobilePane('passage')}
          className={`flex-1 py-2 text-xs font-bold transition-colors ${mobilePane === 'passage' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
        >
          {isListeningTest ? t("ieltsTestModule.test.mobilePassageListening") : t("ieltsTestModule.test.mobilePassageReading")}
        </button>
        <button
          onClick={() => setMobilePane('questions')}
          className={`flex-1 py-2 text-xs font-bold transition-colors ${mobilePane === 'questions' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
        >
          {t("ieltsTestModule.test.mobileQuestions", { answered: totalAnswered, total: allQuestions.length })}
        </button>
      </div>

      {/* Split Screen */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel: Passage / Audio */}
        <div
          className={`${mobilePane === 'passage' ? 'block' : 'hidden'} lg:block w-full max-lg:flex-1 min-h-0 bg-white border-r border-slate-200 overflow-y-auto relative p-6`}
          style={isDesktop ? { width: `${leftWidth}%` } : undefined}
        >
          {/* Audio Player for Listening */}
          {currentSection.mediaUrl && (() => {
            const sid = currentSection.id;
            const alreadyPlayed = playedSections.has(sid);
            return (
              <div className={`mb-6 border rounded-xl p-4 ${
                alreadyPlayed
                  ? "bg-slate-50 border-slate-200"
                  : "bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200"
              }`}>
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-xl ${alreadyPlayed ? "text-slate-400" : "text-teal-600"}`}>headphones</span>
                    <h3 className={`text-sm font-bold ${alreadyPlayed ? "text-slate-500" : "text-teal-800"}`}>{currentSection.title} — {t("ieltsTestModule.test.audioLabel")}</h3>
                  </div>
                  {alreadyPlayed && (
                    <span className="text-[10px] font-black uppercase tracking-widest bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                      {t("ieltsTestModule.test.audioPlayed")}
                    </span>
                  )}
                </div>
                <audio
                  key={sid}
                  ref={audioRef}
                  controls
                  controlsList="nodownload noplaybackrate"
                  onContextMenu={(e) => e.preventDefault()}
                  onPlay={handleAudioPlay}
                  onEnded={handleAudioEnded}
                  onSeeking={handleAudioSeeking}
                  onTimeUpdate={handleAudioTimeUpdate}
                  onLoadStart={handleAudioWaiting}
                  onWaiting={handleAudioWaiting}
                  onStalled={handleAudioWaiting}
                  onCanPlay={handleAudioReady}
                  onPlaying={handleAudioReady}
                  onPause={handleAudioReady}
                  onError={handleAudioReady}
                  className={`w-full h-10 ${alreadyPlayed ? "opacity-50 pointer-events-none" : ""}`}
                  src={currentSection.mediaUrl}
                  preload="auto"
                >
                  {t("ieltsTestModule.test.audioUnsupported")}
                </audio>
                <p className={`text-xs mt-2 ${alreadyPlayed ? "text-slate-500" : "text-teal-600"}`}>
                  {alreadyPlayed
                    ? <><Lock size={12} className="inline mr-1" />{t("ieltsTestModule.test.audioLockedOnce")}</>
                    : <><Lightbulb size={12} className="inline mr-1" />{t("ieltsTestModule.test.audioOnceNotice")}</>}
                </p>
                {audioLoading && !alreadyPlayed && (
                  <p className="text-xs mt-1 text-amber-600 flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                    Đang tải audio — đồng hồ tạm dừng
                  </p>
                )}

                {/* Transcript reveal — available on demand during the test (and after) */}
                {currentSection.audioTranscript && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => setShowTranscript(prev => ({ ...prev, [sid]: !prev[sid] }))}
                      className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-2 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {showTranscript[sid] ? "visibility_off" : "subtitles"}
                      </span>
                      {showTranscript[sid] ? t("ieltsTestModule.test.hideTranscript") : t("ieltsTestModule.test.showTranscript")}
                    </button>
                    {showTranscript[sid] && (
                      <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                          <span className="material-symbols-outlined text-indigo-500 text-[16px]">subtitles</span>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t("ieltsTestModule.test.transcriptLabel")} — {currentSection.title}</p>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-mono">
                          {currentSection.audioTranscript}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Highlight Toolbar */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isListeningTest ? t("ieltsTestModule.test.questionsContext") : t("ieltsTestModule.test.readingPassage")}
            </h3>
            <div className="flex items-center gap-2">
              {/* Font size controls */}
              <div className="flex items-center rounded-lg bg-slate-100 border border-transparent">
                <button
                  onClick={() => setPassageFontScale(s => Math.max(0.85, +(s - 0.1).toFixed(2)))}
                  disabled={passageFontScale <= 0.85}
                  className="px-2 py-1.5 text-slate-500 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-l-lg"
                  title={t("ieltsTestModule.test.fontDecreaseTitle")}
                  aria-label={t("ieltsTestModule.test.fontDecreaseAria")}
                >
                  <span className="material-symbols-outlined text-[16px]">text_decrease</span>
                </button>
                <button
                  onClick={() => setPassageFontScale(s => Math.min(1.4, +(s + 0.1).toFixed(2)))}
                  disabled={passageFontScale >= 1.4}
                  className="px-2 py-1.5 text-slate-500 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-r-lg"
                  title={t("ieltsTestModule.test.fontIncreaseTitle")}
                  aria-label={t("ieltsTestModule.test.fontIncreaseAria")}
                >
                  <span className="material-symbols-outlined text-[16px]">text_increase</span>
                </button>
              </div>
              <button
                onClick={() => { setHighlightMode(!highlightMode); setHighlightPopover(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  highlightMode
                    ? 'bg-amber-100 text-amber-700 border border-amber-300 shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent'
                }`}
                title={highlightMode ? t('ieltsTestModule.test.highlightOnTitle') : t('ieltsTestModule.test.highlightOffTitle')}
                aria-pressed={highlightMode}
              >
                <span className="material-symbols-outlined text-[16px]">ink_highlighter</span>
                {highlightMode ? t('ieltsTestModule.test.highlightOn') : t('ieltsTestModule.test.highlightLabel')}
              </button>
              {highlightMode && (
                <button onClick={clearAllHighlights}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  title={t("ieltsTestModule.test.clearHighlightsTitle")}
                >
                  <span className="material-symbols-outlined text-[14px]">delete_sweep</span>
                </button>
              )}
            </div>
          </div>

          {/* Highlight Mode Hint */}
          {highlightMode && (
            <div className="mb-3 flex items-center gap-3 text-[11px] text-slate-400">
              <span>{t("ieltsTestModule.test.highlightHintSelect")}</span>
              <span className="text-slate-300">|</span>
              <span>{t("ieltsTestModule.test.highlightHintRemove")}</span>
              <span className="text-slate-300">|</span>
              <div className="flex gap-1">
                {HIGHLIGHT_COLORS.map((c) => (
                  <span key={c.name} className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: c.color, border: `1px solid ${c.border}` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={passageRef} onMouseUp={handleTextSelect}
            className={highlightMode ? 'cursor-text select-text' : ''}
            style={{ fontSize: `${(0.875 * passageFontScale).toFixed(3)}rem`, ...(highlightMode ? { userSelect: 'text' as const } : {}) }}
          >
            {(() => {
              if (!passageContent) return <p className="text-slate-400 italic text-sm">{t("ieltsTestModule.test.noPassage")}</p>;
              const paragraphs = passageContent.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
              // If only 1 paragraph or very short, render as-is
              if (paragraphs.length < 2) {
                return <p className="passage-text text-slate-700 leading-[1.9] whitespace-pre-line">{passageContent}</p>;
              }
              // Label body paragraphs A, B, C… via a dedicated counter so a
              // leading heading doesn't shift letters and the first body
              // paragraph always starts at "A" (never "@").
              let labelIdx = 0;
              return (
                <div className="space-y-4">
                  {paragraphs.map((para, i) => {
                    // Detect title/heading: short line (≤90 chars), no trailing period, or ALL CAPS
                    const isHeading = para.length <= 90 && (!para.endsWith('.')) && i === 0;
                    if (isHeading) {
                      return (
                        <div key={i}>
                          <h2 className="font-bold text-slate-900 text-base leading-snug mb-1">{para}</h2>
                        </div>
                      );
                    }
                    const label = String.fromCharCode(65 + labelIdx);
                    labelIdx++;
                    return (
                      <div key={i} className="flex gap-3">
                        <span className="font-bold text-slate-400 text-sm w-5 shrink-0 pt-[3px] select-none">
                          {label}
                        </span>
                        <p className="passage-text text-slate-700 leading-[1.9] flex-1">{para}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Highlight Color Popover */}
          {highlightPopover && (
            <div className="highlight-popover fixed z-50 animate-in fade-in zoom-in-95 duration-150"
              style={{ left: highlightPopover.x, top: highlightPopover.y, transform: 'translate(-50%, -100%)' }}>
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 px-2 py-1.5 flex items-center gap-1">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button key={c.name} onClick={() => applyHighlight(c.color)}
                    className="w-7 h-7 rounded-lg hover:scale-110 transition-transform flex items-center justify-center"
                    style={{ backgroundColor: c.color, border: `2px solid ${c.border}` }}
                    title={t(`ieltsTestModule.highlightColors.${c.name}`)}
                  />
                ))}
                <div className="w-px h-5 bg-slate-200 mx-0.5" />
                <button onClick={() => { window.getSelection()?.removeAllRanges(); setHighlightPopover(null); }}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-100 transition-colors flex items-center justify-center text-slate-400 hover:text-red-500"
                  title={t("ieltsTestModule.test.cancelTitle")}
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
              {/* Arrow */}
              <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45" />
            </div>
          )}

          {/* Section Image (Maps, Diagrams) */}
          {currentSection.imageUrl && (
            <div className="mt-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t("ieltsTestModule.test.diagramMap")}</h3>
              <img src={currentSection.imageUrl} alt={t("ieltsTestModule.test.sectionDiagramAlt")} className="w-full rounded-lg border border-slate-200 shadow-sm" />
            </div>
          )}
        </div>

        {/* Drag-to-resize divider (desktop only) */}
        <div
          onMouseDown={() => {
            isResizing.current = true;
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'col-resize';
          }}
          onDoubleClick={() => setLeftWidth(50)}
          className="hidden lg:flex items-center justify-center w-1.5 shrink-0 bg-slate-100 hover:bg-indigo-200 cursor-col-resize transition-colors group"
          title={t("ieltsTestModule.test.resizeTitle")}
          role="separator"
          aria-orientation="vertical"
        >
          <span className="w-0.5 h-8 bg-slate-300 group-hover:bg-indigo-400 rounded-full" />
        </div>

        {/* Right Panel: Questions + Navigator */}
        <div className={`${mobilePane === 'questions' ? 'flex' : 'hidden'} lg:flex flex-col w-full flex-1 min-h-0 overflow-hidden`}>
          <div ref={questionsRef} onMouseUp={handleTextSelect} className="flex-1 bg-slate-50 p-6 overflow-y-auto">
          <div className="space-y-5">
            {(() => {
              // Group consecutive same-type questions
              const groups: { type: string; questions: typeof currentQuestions }[] = [];
              for (const q of currentQuestions) {
                const last = groups[groups.length - 1];
                if (last && last.type === q.questionType) {
                  last.questions.push(q);
                } else {
                  groups.push({ type: q.questionType, questions: [q] });
                }
              }

              return groups.map((group) => {
                const first = group.questions[0];
                const last = group.questions[group.questions.length - 1];
                const rangeLabel = first.questionOrder === last.questionOrder
                  ? t("ieltsTestModule.test.rangeSingle", { n: first.questionOrder })
                  : t("ieltsTestModule.test.rangeMulti", { from: first.questionOrder, to: last.questionOrder });
                const instruction = SECTION_INSTRUCTIONS[group.type];

                return (
                  <div key={`group-${first.id}`} className="space-y-4">
                    {/* Cambridge-style section instruction block (reading only) */}
                    {instruction && !isListeningTest && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{rangeLabel}</p>
                        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{instruction}</p>
                      </div>
                    )}

                    {group.questions.map((q) => {
              const qText = q.content?.text || q.questionText || "";
              const qOptions = q.content?.options || [];
              const qType = q.questionType;
              const qImage = q.imageUrl;
              const qInstruction = (q.content as any)?.instruction || '';
              const qSummaryText = (q.content as any)?.summaryText || '';

              return (
                <div key={q.id} id={`question-${q.id}`} className={`bg-white rounded-xl border p-5 transition-colors relative ${
                  flaggedQuestions.has(q.id)
                    ? 'border-amber-400 ring-1 ring-amber-200'
                    : questionAnswered(q) ? 'border-indigo-300 shadow-sm' : 'border-slate-200'
                }`}>
                  {/* Instruction banner (for Summary Completion, Matching, etc.) */}
                  {qInstruction && (
                    <div className="mb-3 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                      <p className="text-xs text-indigo-700 font-medium italic">{qInstruction}</p>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="font-medium text-sm text-slate-800">
                      <span className="text-slate-500 font-bold mr-2">{q.questionOrder}.</span>
                      {qText}
                    </p>
                    <button
                      onClick={() => toggleFlag(q.id)}
                      className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                        flaggedQuestions.has(q.id)
                          ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                          : 'bg-slate-50 text-slate-300 hover:text-amber-500 hover:bg-amber-50'
                      }`}
                      title={flaggedQuestions.has(q.id) ? t('ieltsTestModule.test.unflagTitle') : t('ieltsTestModule.test.flagTitle')}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {flaggedQuestions.has(q.id) ? 'flag' : 'outlined_flag'}
                      </span>
                    </button>
                  </div>

                  {/* Question Image (Maps, Diagrams) */}
                  {qImage && (
                    <div className="mb-3">
                      <img src={qImage} alt={t("ieltsTestModule.test.questionImageAlt", { n: q.questionOrder })} className="max-w-full rounded-lg border border-slate-200 shadow-sm" />
                    </div>
                  )}

                  {/* Summary inline view for GAP_FILL with summaryText */}
                  {qType === 'GAP_FILL' && qSummaryText && (
                    <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm leading-relaxed">
                      {qSummaryText.split(/(\{\{\d+\}\})/).map((part: string, i: number) => {
                        const match = part.match(/^\{\{(\d+)\}\}$/);
                        if (match) {
                          const gapNum = match[1];
                          return (
                            <span key={i} className="inline-flex items-center mx-0.5">
                              <span className="text-[10px] font-bold text-indigo-600 mr-0.5">{gapNum}</span>
                              <input
                                type="text"
                                // Each gap is stored under a composite key `${q.id}::${gapNum}`.
                                // handleSubmit() assembles these into a JSON object keyed by
                                // gap number so the backend can grade each gap independently.
                                value={answers[`${q.id}::${gapNum}`] || ''}
                                onChange={(e) => setAnswer(`${q.id}::${gapNum}`, e.target.value)}
                                className="w-28 border-b-2 border-indigo-300 bg-white px-1.5 py-0.5 text-sm outline-none focus:border-indigo-500 rounded-sm"
                                aria-label={`Gap ${gapNum}`}
                                placeholder="..........."
                              />
                            </span>
                          );
                        }
                        return <span key={i}>{part}</span>;
                      })}
                    </div>
                  )}

                  {qType === "MULTIPLE_CHOICE" && qOptions.length > 0 && (
                    <div className="space-y-2">
                      {qOptions.map((opt, idx) => (
                        <label key={idx} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          answers[q.id] === opt ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-200"
                        }`}>
                          <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt}
                            onChange={() => setAnswer(q.id, opt)} className="accent-indigo-600" />
                          <span className="text-sm text-slate-700">
                            <span className="font-bold text-indigo-600 mr-1">{String.fromCharCode(65 + idx)}.</span> {opt}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {qType === "MULTIPLE_CHOICE_MULTI_ANSWER" && qOptions.length > 0 && (
                    <div className="space-y-2">
                      {qOptions.map((opt, idx) => {
                        const currentAns = answers[q.id] ? answers[q.id].split(',') : [];
                        const idxStr = idx.toString();
                        const isChecked = currentAns.includes(idxStr);
                        return (
                          <label key={idx} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            isChecked ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-200"
                          }`}>
                            <input type="checkbox" name={q.id} value={idxStr} checked={isChecked}
                              onChange={() => {
                                const newAns = isChecked ? currentAns.filter(i => i !== idxStr) : [...currentAns, idxStr].sort();
                                setAnswer(q.id, newAns.join(','));
                              }} className="accent-indigo-600 rounded" />
                            <span className="text-sm text-slate-700">
                              <span className="font-bold text-indigo-600 mr-1">{String.fromCharCode(65 + idx)}.</span> {opt}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* GAP_FILL: simple input (when no summaryText) or SHORT_ANSWER */}
                  {((qType === "GAP_FILL" && !qSummaryText) || qType === "SHORT_ANSWER") && (
                    <input type="text" value={answers[q.id] || ""} onChange={e => setAnswer(q.id, e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder={t("ieltsTestModule.test.typeAnswerPlaceholder")} />
                  )}

                  {(qType === "TRUE_FALSE_NOT_GIVEN" || qType === "YES_NO_NOT_GIVEN") && (
                    <div className="flex gap-3" role="radiogroup" aria-label={t("ieltsTestModule.test.questionAria", { n: q.questionOrder })}>
                      {(qType === "TRUE_FALSE_NOT_GIVEN" ? ["TRUE", "FALSE", "NOT GIVEN"] : ["YES", "NO", "NOT GIVEN"]).map(opt => (
                        <button key={opt} onClick={() => setAnswer(q.id, opt)}
                          role="radio" aria-checked={answers[q.id] === opt}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-all cursor-pointer ${
                            answers[q.id] === opt ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                          }`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* MATCHING: Dropdown selector instead of text input */}
                  {qType === "MATCHING" && (
                    qOptions.length > 0 ? (
                      <div className="relative">
                        <select
                          value={answers[q.id] || ''}
                          onChange={(e) => setAnswer(q.id, e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none appearance-none bg-white cursor-pointer transition-colors ${
                            answers[q.id]
                              ? 'border-indigo-400 bg-indigo-50 text-indigo-800 font-medium'
                              : 'border-slate-200 text-slate-500 hover:border-indigo-200'
                          }`}
                        >
                          <option value="">{t("ieltsTestModule.test.selectAnswer")}</option>
                          {qOptions.map((opt, idx) => (
                            <option key={idx} value={String.fromCharCode(65 + idx)}>
                              {String.fromCharCode(65 + idx)}. {opt}
                            </option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-slate-400 pointer-events-none">expand_more</span>
                      </div>
                    ) : (
                      <input type="text" value={answers[q.id] || ""} onChange={e => setAnswer(q.id, e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                        placeholder={t("ieltsTestModule.test.matchingPlaceholder")} />
                    )
                  )}
                </div>
              );
            })}
                  </div>
                );
              });
            })()}
          </div>
          </div>

          {/* ─── Question Navigator Panel (sticky bottom) ─────────────────── */}
          <div className={`bg-white border-t border-slate-200 transition-all duration-300 ${showNavigator ? 'max-h-[220px]' : 'max-h-10'}`}>
            {/* Toggle bar */}
            <button
              onClick={() => setShowNavigator(!showNavigator)}
              className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-indigo-600">grid_view</span>
                <span className="text-xs font-bold text-slate-600">{t("ieltsTestModule.test.questionNavigator")}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                  {totalAnswered}/{allQuestions.length}
                </span>
                {flaggedQuestions.size > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">flag</span>
                    {flaggedQuestions.size}
                  </span>
                )}
              </div>
              <span className={`material-symbols-outlined text-[16px] text-slate-400 transition-transform ${showNavigator ? 'rotate-180' : ''}`}>
                expand_less
              </span>
            </button>

            {showNavigator && (
              <div className="px-4 pb-3 overflow-y-auto max-h-[170px]">
                {sections.map((sec, secIdx) => (
                  <div key={secIdx} className="mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      {sec.title || t("ieltsTestModule.test.sectionFallback", { n: secIdx + 1 })}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {sec.questions.map((q) => {
                        const isAnswered = questionAnswered(q);
                        const isFlagged = flaggedQuestions.has(q.id);
                        const isCurrent = secIdx === currentSectionIdx;
                        return (
                          <button
                            key={q.id}
                            onClick={() => {
                              if (secIdx !== currentSectionIdx) navigateToSection(secIdx);
                              setTimeout(() => {
                                const el = document.getElementById(`question-${q.id}`);
                                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 100);
                            }}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer relative
                              ${isAnswered
                                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                                : isCurrent
                                  ? 'bg-white text-slate-600 border-2 border-indigo-300 hover:border-indigo-400'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                              }
                              ${isFlagged ? 'ring-2 ring-amber-400' : ''}
                            `}
                            title={`Q${q.questionOrder}${isAnswered ? ' ' + t('ieltsTestModule.test.navOk') : ''}${isFlagged ? ' ' + t('ieltsTestModule.test.navFlagged') : ''}`}
                          >
                            {q.questionOrder}
                            {isFlagged && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full flex items-center justify-center">
                                <span className="block w-1.5 h-1.5 bg-white rounded-full" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Time-remaining warning toast */}
      {timeWarning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-bold">
            <span className="material-symbols-outlined text-[18px]">schedule</span>
            {timeWarning}
            <button onClick={() => setTimeWarning(null)} className="ml-2 text-white/80 hover:text-white" aria-label={t("ieltsTestModule.test.closeWarningAria")}>×</button>
          </div>
        </div>
      )}

      {/* Submit confirmation modal */}
      {showSubmitConfirm && (() => {
        const unanswered = allQuestions.length - totalAnswered;
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in duration-150"
            onClick={() => setShowSubmitConfirm(false)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-green-600">task_alt</span>
                </div>
                <h2 className="text-lg font-bold text-slate-800">{t("ieltsTestModule.test.confirm.title")}</h2>
              </div>
              <div className="space-y-2 text-sm text-slate-600 mb-5">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span>{t("ieltsTestModule.test.confirm.answered")}</span>
                  <span className="font-bold text-emerald-600">{totalAnswered}/{allQuestions.length}</span>
                </div>
                {unanswered > 0 ? (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-amber-700">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    <span>
                      <Trans
                        i18nKey="ieltsTestModule.test.confirm.unanswered"
                        ns="exam"
                        values={{ count: unanswered }}
                        components={{ strong: <strong /> }}
                      />
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-700">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>{t("ieltsTestModule.test.confirm.allDone")}</span>
                  </div>
                )}
                <p className="text-xs text-slate-400 pt-1">{t("ieltsTestModule.test.confirm.noEdit")}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  {t("ieltsTestModule.test.confirm.continueTest")}
                </button>
                <button
                  onClick={() => { setShowSubmitConfirm(false); handleSubmit(); }}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-slate-400 transition-colors"
                >
                  {isSubmitting ? t("ieltsTestModule.test.confirm.submitting") : t("ieltsTestModule.test.confirm.submit")}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
