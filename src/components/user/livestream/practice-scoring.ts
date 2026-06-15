// Word-level pronunciation-practice scoring, shared by the choral battle
// overlay. Compares the target phrase with the Whisper transcript of the
// learner's spoken attempt.
//
// HONEST FRAMING: Whisper transcribes words, not phonemes, so this measures
// intelligibility — "how clearly the AI understood you" — NOT phoneme-level
// pronunciation accuracy. The UI frames scores accordingly.

const STRIP_RE = /[^a-z0-9' ]/gi;

function normalizeWords(s: string): string[] {
  return s
    .toLowerCase()
    .replace(STRIP_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

/** Classic character-level edit distance (for fuzzy per-word matching). */
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** A spoken word counts as the target word if it's close enough (handles minor
 *  mis-hearings / accents — a near miss shouldn't read as a hard fail). */
function wordsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  return editDistance(a, b) / Math.max(a.length, b.length) <= 0.34;
}

export interface WordMark {
  word: string;
  correct: boolean;
}

/**
 * Score a spoken attempt against the target phrase.
 * @returns score 0-100 (% of target words clearly recognised) + per-word marks.
 */
export function scoreMatch(target: string, said: string): { score: number; details: WordMark[] } {
  const tWords = normalizeWords(target);
  const sWords = normalizeWords(said);
  if (!tWords.length) return { score: 0, details: [] };
  if (!sWords.length) return { score: 0, details: tWords.map(word => ({ word, correct: false })) };

  // Greedy left-to-right alignment: for each target word, look a few words
  // ahead in the transcript for a fuzzy match, then advance the pointer.
  let sIdx = 0;
  let correctCount = 0;
  const details = tWords.map(tWord => {
    let correct = false;
    for (let i = 0; i < 3 && sIdx + i < sWords.length; i++) {
      if (wordsMatch(tWord, sWords[sIdx + i])) {
        correct = true;
        sIdx += i + 1;
        break;
      }
    }
    if (correct) correctCount++;
    return { word: tWord, correct };
  });

  return { score: Math.round((correctCount / tWords.length) * 100), details };
}
