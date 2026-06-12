// =============================================================================
// Flashcard Study Mode — Web Audio SFX
// Synthesized at runtime (no audio assets). Respects a persisted mute flag.
// A single AudioContext is created lazily on first user gesture (a grade press).
// =============================================================================

const MUTE_KEY = "flashcard.sfx.muted";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function isSfxMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSfxMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* ignore — sound preference is non-critical */
  }
}

interface Tone {
  freq: number;
  start: number; // seconds from now
  dur: number; // seconds
  type?: OscillatorType;
  gain?: number;
}

function play(tones: Tone[]): void {
  if (isSfxMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  for (const tone of tones) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = tone.type ?? "sine";
    osc.frequency.value = tone.freq;
    const peak = tone.gain ?? 0.12;
    const t0 = now + tone.start;
    const t1 = t0 + tone.dur;
    // Quick attack, exponential decay — avoids clicks.
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t1);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t1 + 0.02);
  }
}

export const sfx = {
  flip() {
    play([{ freq: 520, start: 0, dur: 0.06, type: "triangle", gain: 0.04 }]);
  },
  good() {
    play([
      { freq: 523.25, start: 0, dur: 0.12, type: "triangle" },
      { freq: 659.25, start: 0.07, dur: 0.15, type: "triangle" },
    ]);
  },
  easy() {
    play([
      { freq: 523.25, start: 0, dur: 0.11, type: "triangle" },
      { freq: 659.25, start: 0.07, dur: 0.11, type: "triangle" },
      { freq: 783.99, start: 0.14, dur: 0.2, type: "triangle" },
    ]);
  },
  hard() {
    play([{ freq: 233.08, start: 0, dur: 0.16, type: "sine", gain: 0.13 }]);
  },
  again() {
    play([
      { freq: 196, start: 0, dur: 0.13, type: "sawtooth", gain: 0.06 },
      { freq: 146.83, start: 0.1, dur: 0.18, type: "sawtooth", gain: 0.06 },
    ]);
  },
  /** Escalating sparkle for streak milestones. */
  streak(level: number) {
    const base = 660 + Math.min(level, 6) * 70;
    play([
      { freq: base, start: 0, dur: 0.07, type: "square", gain: 0.05 },
      { freq: base * 1.5, start: 0.06, dur: 0.13, type: "square", gain: 0.05 },
    ]);
  },
  finish() {
    play([
      { freq: 523.25, start: 0, dur: 0.13, type: "triangle" },
      { freq: 659.25, start: 0.12, dur: 0.13, type: "triangle" },
      { freq: 783.99, start: 0.24, dur: 0.13, type: "triangle" },
      { freq: 1046.5, start: 0.36, dur: 0.32, type: "triangle" },
    ]);
  },
};
