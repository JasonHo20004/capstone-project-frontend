// Tiny code-only Web Audio sound-effects engine for the choral battle overlay.
//
// ZERO asset files: every sound is synthesized at runtime from one
// OscillatorNode → GainNode primitive. Pitch carries MEANING — the 3-2-1
// countdown rises, "GO" jumps an octave with a brighter timbre, the reveal
// chime's pitch scales with the learner's score (a better score literally
// sounds higher), and the podium gets a major-run fanfare.
//
// All output is gated: tone() is a no-op unless sfx are enabled (the overlay
// enables them only when motion is allowed AND audio has been unlocked), so the
// reduced-motion / muted experience is genuinely silent.

let ctx: AudioContext | null = null;
let enabled = false;

type AudioCtor = typeof AudioContext;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor: AudioCtor | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  return ctx;
}

/** Enable/disable all battle sfx. The overlay passes `!reduceMotion && audioUnlocked`. */
export function setSfxEnabled(on: boolean): void {
  enabled = on;
  if (on) unlockBattleSfx();
}

/** Resume the shared AudioContext off a user gesture so scheduled tones play. */
export function unlockBattleSfx(): void {
  const c = getCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

interface ToneOpts {
  freq: number;
  dur?: number;
  type?: OscillatorType;
  attack?: number;
  release?: number;
  gain?: number;
  when?: number;
}

/** Schedule one ADSR-ish tone. No-op when disabled or audio isn't running. */
export function tone({
  freq,
  dur = 0.18,
  type = 'sine',
  attack = 0.005,
  release = 0.09,
  gain = 0.18,
  when = 0,
}: ToneOpts): void {
  if (!enabled) return;
  const c = getCtx();
  if (!c || c.state !== 'running') return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  // exponential ramps can't touch 0 — floor at a tiny epsilon.
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + release + 0.02);
}

/** Schedule a short run of tones (a chime / fanfare). */
export function chime(
  freqs: number[],
  stagger = 0.06,
  type: OscillatorType = 'triangle',
  gain = 0.18,
): void {
  freqs.forEach((f, i) => tone({ freq: f, type, gain, when: i * stagger, dur: 0.16 }));
}
