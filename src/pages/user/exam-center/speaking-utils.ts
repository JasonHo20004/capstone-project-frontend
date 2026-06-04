// ─── Speaking Test Utilities (non-component code) ──────────────────────────

export interface ConversationTurn {
  role: "examiner" | "candidate";
  content: string;
  audioUrl?: string;
  timestamp: string;
}

export type Screen =
  | "topic"
  | "mic-check"
  | "conversation"
  | "grading"
  | "result";

export interface TopicDisplay {
  name: string;
  icon: string;
  color: string;
  fromDb: boolean;
  isPremium?: boolean;
}

export interface VocabSuggestion {
  word: string;
  meaning: string;
  example: string;
}

export interface ErrorHighlight {
  original: string;
  suggestion: string;
  type: "grammar" | "vocab" | "coherence";
}

// Icon/color map for known topic names (used for display styling only)
export const TOPIC_ICON_MAP: Record<string, { icon: string; color: string }> = {
  "Hometown and Living": { icon: "home", color: "from-blue-500 to-cyan-500" },
  "Work and Studies": { icon: "work", color: "from-indigo-500 to-blue-500" },
  "Daily Routine": { icon: "schedule", color: "from-teal-500 to-emerald-500" },
  "Hobbies and Free Time": { icon: "sports_esports", color: "from-cyan-500 to-blue-500" },
  "Technology": { icon: "devices", color: "from-cyan-500 to-blue-500" },
  "Travel and Holidays": { icon: "flight", color: "from-amber-500 to-orange-500" },
  "Food and Cooking": { icon: "restaurant", color: "from-red-500 to-pink-500" },
  "Health and Fitness": { icon: "fitness_center", color: "from-green-500 to-emerald-500" },
  "Friends and Family": { icon: "group", color: "from-pink-500 to-rose-500" },
  "Music and Entertainment": { icon: "music_note", color: "from-fuchsia-500 to-pink-500" },
  "Reading and Books": { icon: "auto_stories", color: "from-amber-600 to-yellow-500" },
  "Shopping": { icon: "shopping_bag", color: "from-rose-500 to-red-500" },
  "Weather and Seasons": { icon: "wb_sunny", color: "from-sky-400 to-blue-500" },
  "Animals and Nature": { icon: "forest", color: "from-lime-500 to-green-600" },
  "Sports": { icon: "sports_soccer", color: "from-orange-500 to-red-500" },
};

export function getUserId(): string {
  try {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.sub || payload.userId || payload.id || "anonymous";
    }
  } catch { /* ignore */ }
  return "anonymous";
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function getBandColor(band: number | null | undefined): string {
  if (!band) return "text-slate-400";
  if (band >= 8) return "text-emerald-600";
  if (band >= 7) return "text-teal-600";
  if (band >= 6) return "text-blue-600";
  if (band >= 5) return "text-amber-600";
  return "text-red-500";
}

export function getBandBg(band: number | null | undefined): string {
  if (!band) return "bg-slate-50 border-slate-200";
  if (band >= 8) return "bg-emerald-50 border-emerald-200";
  if (band >= 7) return "bg-teal-50 border-teal-200";
  if (band >= 6) return "bg-blue-50 border-blue-200";
  if (band >= 5) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

// Part 2 IELTS - chuan la 2 phut noi lien tuc
export const PART2_MAX_SECONDS = 120;
export const PART2_WARN_SECONDS = 30;
export const PART2_PREP_SECONDS = 60;

// Highlight inline errors in transcript text.
export function highlightErrors(
  text: string,
  errors: ErrorHighlight[]
): Array<{ text: string; error?: ErrorHighlight }> {
  if (!errors || errors.length === 0) return [{ text }];

  const segments: Array<{ text: string; error?: ErrorHighlight }> = [];
  let cursor = 0;
  const lower = text.toLowerCase();

  const indexed = errors
    .map((e) => ({ err: e, idx: lower.indexOf(e.original.toLowerCase()) }))
    .filter((x) => x.idx >= 0)
    .sort((a, b) => a.idx - b.idx);

  for (const { err, idx } of indexed) {
    if (idx < cursor) continue;
    if (idx > cursor) segments.push({ text: text.slice(cursor, idx) });
    segments.push({
      text: text.slice(idx, idx + err.original.length),
      error: err,
    });
    cursor = idx + err.original.length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}
