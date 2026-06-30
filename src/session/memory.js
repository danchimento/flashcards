// Long-term memory across sessions, persisted in localStorage (no account).
//
// Two phases, like Anki's learning-steps-then-review model:
//   1. Learning: a brand-new or just-missed state stays due (in rotation) until
//      you've answered it correctly GRADUATE_REPS times. This is what lets you
//      actually learn states in a sitting instead of being "done" after one
//      pass — they keep coming back until you know them.
//   2. Review (SM-2): once learned, the interval grows in days (1 → 6 → ×ease),
//      so well-known states resurface less and less often. A miss drops the
//      state back to learning.

const STORAGE_PREFIX = 'geo-memory:';
const DAY = 86_400_000; // ms
const START_EASE = 2.5;
const MIN_EASE = 1.3;

// Correct answers needed to leave the learning phase ("learned").
export const GRADUATE_REPS = 2;

export function loadMemory(packId) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + packId);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveMemory(packId, memory) {
  try {
    localStorage.setItem(STORAGE_PREFIX + packId, JSON.stringify(memory));
  } catch {
    /* storage unavailable (private mode, etc.) — degrade to session-only */
  }
}

// Update a state's record for a binary answer. Returns the new record.
// `interval` is in days; interval 0 means "still learning" (due immediately, so
// it stays in rotation this session/day).
export function review(record, correct, now) {
  const prev = record ?? { ease: START_EASE, interval: 0, reps: 0, lapses: 0 };
  const q = correct ? 4 : 2;
  let { ease, interval, reps, lapses } = prev;

  if (correct) {
    reps += 1;
    if (reps < GRADUATE_REPS) interval = 0; // learning step — stays due
    else if (reps === GRADUATE_REPS) interval = 1; // graduates: 1 day
    else if (reps === GRADUATE_REPS + 1) interval = 6;
    else interval = Math.round(Math.max(interval, 1) * ease);
  } else {
    reps = 0;
    interval = 0; // back to learning — stays due
    lapses += 1;
  }

  ease = Math.max(MIN_EASE, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  return { ease, interval, reps, lapses, due: now + interval * DAY, last: now };
}

export const isNew = (record) => !record;
export const isDue = (record, now) => !!record && record.due <= now;
// "Learned" = graduated out of the learning phase (answered right enough times).
export const isLearned = (record) => !!record && record.reps >= GRADUATE_REPS;

export function countLearned(memory) {
  return Object.values(memory).filter(isLearned).length;
}
