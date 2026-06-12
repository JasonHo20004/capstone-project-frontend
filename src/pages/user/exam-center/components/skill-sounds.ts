// =============================================================================
// Skill Tree sounds — tiny WebAudio chimes for gamification moments.
// Generated with oscillators so no audio assets ship with the bundle. Every
// call is wrapped in try/catch: AudioContext may be blocked before a user
// gesture, and a missing/broken audio stack must never crash the page.
// Both helpers fire inside click-initiated flows (quiz submit), so the
// browser's user-gesture requirement is satisfied.
// =============================================================================

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function note(c: AudioContext, freq: number, start: number, dur: number, peak: number) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

/** Soft two-note "ding" when a node is completed. */
export function playNodeComplete() {
  try {
    const c = getCtx();
    if (!c) return;
    const t0 = c.currentTime;
    note(c, 523.25, t0, 0.18, 0.07); // C5
    note(c, 659.25, t0 + 0.11, 0.3, 0.07); // E5
  } catch {
    /* never break the UI over a sound */
  }
}

/** Rising arpeggio for the full-tree completion moment. */
export function playTreeComplete() {
  try {
    const c = getCtx();
    if (!c) return;
    const t0 = c.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      note(c, f, t0 + i * 0.12, 0.35, 0.07); // C5 E5 G5 C6
    });
  } catch {
    /* never break the UI over a sound */
  }
}
