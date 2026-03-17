// ─── Speaking Test Utilities (non-component code) ──────────────────────────

export interface ConversationTurn {
  role: "examiner" | "candidate";
  content: string;
  audioUrl?: string;
  timestamp: string;
}

export type Screen = "topic" | "conversation" | "grading" | "result";

export interface TopicDisplay {
  name: string;
  icon: string;
  color: string;
  fromDb: boolean;
}

export const FALLBACK_TOPICS = [
  { name: "Hometown and Living", icon: "home", color: "from-blue-500 to-cyan-500" },
  { name: "Work and Studies", icon: "work", color: "from-indigo-500 to-blue-500" },
  { name: "Daily Routine", icon: "schedule", color: "from-teal-500 to-emerald-500" },
  { name: "Hobbies and Free Time", icon: "sports_esports", color: "from-cyan-500 to-blue-500" },
  { name: "Technology", icon: "devices", color: "from-cyan-500 to-blue-500" },
  { name: "Travel and Holidays", icon: "flight", color: "from-amber-500 to-orange-500" },
  { name: "Food and Cooking", icon: "restaurant", color: "from-red-500 to-pink-500" },
  { name: "Health and Fitness", icon: "fitness_center", color: "from-green-500 to-emerald-500" },
  { name: "Friends and Family", icon: "group", color: "from-pink-500 to-rose-500" },
  { name: "Music and Entertainment", icon: "music_note", color: "from-fuchsia-500 to-pink-500" },
  { name: "Reading and Books", icon: "auto_stories", color: "from-amber-600 to-yellow-500" },
  { name: "Shopping", icon: "shopping_bag", color: "from-rose-500 to-red-500" },
  { name: "Weather and Seasons", icon: "wb_sunny", color: "from-sky-400 to-blue-500" },
  { name: "Animals and Nature", icon: "forest", color: "from-lime-500 to-green-600" },
  { name: "Sports", icon: "sports_soccer", color: "from-orange-500 to-red-500" },
];

export const TOPIC_ICON_MAP: Record<string, { icon: string; color: string }> = Object.fromEntries(
  FALLBACK_TOPICS.map(t => [t.name, { icon: t.icon, color: t.color }])
);

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

export function getBandColor(band: number | null): string {
  if (!band) return "text-slate-400";
  if (band >= 8) return "text-emerald-600";
  if (band >= 7) return "text-teal-600";
  if (band >= 6) return "text-blue-600";
  if (band >= 5) return "text-amber-600";
  return "text-red-500";
}
