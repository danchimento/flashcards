// Campaign/level logic: what a level contains, how questions scale, which
// modality a state is asked in, and unlock progress (persisted in localStorage).

import { getQuestionType } from '../questions/registry';

// Per-state modality ramp, driven by the SM-2 memory `reps` (correct answers in
// a row; a miss resets it). New → multiple choice, learned → find on map,
// strong → type. So typing turns on per-state once you're consistently right.
const LEARN_REPS = 2; // start "find on map"
const STRONG_REPS = 4; // start "type the state"

export function modalityTypeId(record) {
  const reps = record?.reps ?? 0;
  if (reps >= STRONG_REPS) return 'type-state';
  if (reps >= LEARN_REPS) return 'locate-state';
  return 'identify-state';
}

// Questions per level: starts gentle, rises over the campaign. Configurable.
export function countForLevel(levelNumber /* 1-based */) {
  return Math.min(12 + Math.floor((levelNumber - 1) / 2), 24);
}

// Accuracy (first-attempt) needed to pass a level and unlock the next.
export const PASS_ACCURACY = 0.85;

// The states in play for a level = everything introduced up to and including it.
export function introducedItems(content, levelIndex) {
  const names = new Set();
  for (let i = 0; i <= levelIndex && i < content.campaign.length; i++) {
    for (const name of content.campaign[i].focus) names.add(name);
  }
  // If a level (or the run of review levels) hasn't introduced anything yet,
  // fall back to everything so a session is never empty.
  const pool = content.items.filter((it) => names.has(it.name));
  return pool.length ? pool : content.items;
}

// The focus (new) states for a level, as item objects.
export function focusItems(content, levelIndex) {
  const names = new Set(content.campaign[levelIndex]?.focus ?? []);
  return content.items.filter((it) => names.has(it.name));
}

// Build the concrete question for a target using its earned modality.
export function levelQuestion({ content, target, record, rng }) {
  const type = getQuestionType(modalityTypeId(record));
  return { typeId: type.id, data: type.generate({ content, rng, target }) };
}

// ---- unlock progress ----
const PROGRESS_PREFIX = 'geo-progress:';

export function loadProgress(packId) {
  try {
    const raw = localStorage.getItem(PROGRESS_PREFIX + packId);
    return raw ? JSON.parse(raw) : { unlocked: 0 };
  } catch {
    return { unlocked: 0 };
  }
}

export function saveProgress(packId, progress) {
  try {
    localStorage.setItem(PROGRESS_PREFIX + packId, JSON.stringify(progress));
  } catch {
    /* storage unavailable — degrade to session-only */
  }
}

// Unlock the next level if `levelIndex` was the furthest unlocked. Returns the
// updated progress.
export function recordPass(packId, levelIndex) {
  const progress = loadProgress(packId);
  if (levelIndex >= progress.unlocked) {
    progress.unlocked = Math.min(levelIndex + 1, Number.MAX_SAFE_INTEGER);
    saveProgress(packId, progress);
  }
  return progress;
}
