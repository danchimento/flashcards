// Long-term memory across sessions, using the SM-2 spaced repetition algorithm
// (the SuperMemo-2 / Anki-style scheduler). Each item stores an ease factor and
// an interval in days; correct answers grow the interval (so well-known states
// resurface less and less often), a miss resets it (so it comes back soon).
//
// Persisted in localStorage — no account needed. Per content pack.

const STORAGE_PREFIX = 'geo-memory:';
const DAY = 86_400_000; // ms
const START_EASE = 2.5;
const MIN_EASE = 1.3;

// An interval this long means the state is effectively "mastered" — it won't
// appear in a lesson again for weeks. Used for the mastered count / display.
export const MASTERED_DAYS = 21;

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

// SM-2 update for a binary answer. `correct` maps to a "Good" grade (4),
// a miss to a failing grade (2). Returns the new record.
export function review(record, correct, now) {
  const prev = record ?? { ease: START_EASE, interval: 0, reps: 0, lapses: 0 };
  const q = correct ? 4 : 2;
  let { ease, interval, reps, lapses } = prev;

  if (correct) {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ease);
    reps += 1;
  } else {
    reps = 0;
    interval = 1; // relearn: due again next day
    lapses += 1;
  }

  // Classic SM-2 ease adjustment, clamped so it never drops below 1.3.
  ease = Math.max(MIN_EASE, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  return { ease, interval, reps, lapses, due: now + interval * DAY, last: now };
}

export const isNew = (record) => !record;
export const isDue = (record, now) => !!record && record.due <= now;
export const isMastered = (record) => !!record && record.interval >= MASTERED_DAYS;

export function countMastered(memory) {
  return Object.values(memory).filter(isMastered).length;
}
