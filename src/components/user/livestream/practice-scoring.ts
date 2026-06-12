// Shared pronunciation-practice scoring: compares the target phrase with the
// Whisper transcript of the student's attempt. Used by both the solo
// PracticeCard and the room-wide PracticeBattle so a score means the same
// thing everywhere.

const STRIP_RE = /[^a-z0-9 ']/g;

function normalize(s: string) {
  return s.toLowerCase().replace(STRIP_RE, ' ').replace(/\s+/g, ' ').trim();
}

/** Word-level Levenshtein distance for accurate grading */
function levenshteinDistance(a: string[], b: string[]): number {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[a.length][b.length];
}

export function scoreMatch(target: string, said: string): { score: number; details: { word: string; correct: boolean }[] } {
  const tWords = normalize(target).split(' ').filter(Boolean);
  const sWords = normalize(said).split(' ').filter(Boolean);

  if (!tWords.length) return { score: 0, details: [] };
  if (!sWords.length) {
    return { score: 0, details: tWords.map(w => ({ word: w, correct: false })) };
  }

  const distance = levenshteinDistance(tWords, sWords);
  const maxLen = Math.max(tWords.length, sWords.length);
  const score = Math.round(Math.max(0, 1 - distance / maxLen) * 100);

  // Basic marking: if a target word is found in said words (in order-ish), mark correct
  // A true alignment would require backtracking the matrix, but for UI feedback:
  let sIdx = 0;
  const details = tWords.map(tWord => {
    let correct = false;
    // Look ahead a few words to find a match
    for (let i = 0; i < 3 && sIdx + i < sWords.length; i++) {
      if (sWords[sIdx + i] === tWord) {
        correct = true;
        sIdx += i + 1;
        break;
      }
    }
    return { word: tWord, correct };
  });

  return { score, details };
}
