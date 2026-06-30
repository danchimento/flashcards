import { createRng } from '../lib/rng';

// Session-scoped spaced repetition based on the Leitner system.
//
// Each item to learn is a "card" that must be answered correctly to graduate.
// - A correct answer decrements the card's remaining reps; at 0 it graduates.
// - A wrong answer resets it to LAPSE_REPS and requeues it a few cards later,
//   so a missed state comes back (spaced out, not immediately) and keeps
//   returning until it's known.
//
// This is intentionally simple and session-only (no persistence). The card
// shape leaves room to grow into SM-2/FSRS with cross-session storage later.

const NEW_REPS = 1; // a fresh card graduates after one correct answer
const LAPSE_REPS = 2; // a missed card must be answered correctly twice
const SPACING = 3; // how many cards later a missed card reappears

export function createSession(config, rng = createRng()) {
  const targets = rng.sample(config.items, config.questionCount);
  // queue of cards waiting to be asked; order is the schedule
  const queue = targets.map((item) => ({ item, remaining: NEW_REPS, lapsed: false }));
  const total = queue.length;
  let graduated = 0;
  let asked = 0;
  let correct = 0;

  const session = {
    total,

    // The card to ask now, or null when the session is complete.
    current() {
      return queue[0] ?? null;
    },

    // Record the result for the current card and advance the schedule.
    answer(isCorrect) {
      const card = queue.shift();
      if (!card) return;
      asked += 1;
      if (isCorrect) {
        correct += 1;
        card.remaining -= 1;
        if (card.remaining <= 0) {
          graduated += 1; // mastered — drop it
          return;
        }
      } else {
        card.lapsed = true;
        card.remaining = LAPSE_REPS;
      }
      // requeue: insert SPACING cards from the front (or at the end if shorter)
      const at = Math.min(SPACING, queue.length);
      queue.splice(at, 0, card);
    },

    get progress() {
      return { mastered: graduated, total };
    },

    get stats() {
      return { asked, correct, total };
    },
  };

  return session;
}
