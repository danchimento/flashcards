import { createRng } from '../lib/rng';
import { review as reviewItem } from './memory';

// Builds a lesson and runs the in-session schedule.
//
// Two layers, matching how Anki/SM-2 works:
//   1. Composition (cross-session): a lesson is due reviews first (most overdue
//      first), then brand-new states, capped at `max`. Mastered states have a
//      long interval, so they aren't due and simply don't appear.
//   2. Relearning (within-session): miss a state and it returns a few cards
//      later; ONE correct answer after that graduates it for the lesson. The
//      long-term record is committed when it graduates — recorded as a miss if
//      it was missed at all this lesson (so it comes back soon next time).

const RELEARN_SPACING = 4; // how many cards later a missed state reappears

export function createSession({ items, memory = {}, max, now }, rng = createRng()) {
  const withRec = items.map((it) => ({ it, rec: memory[it.id] }));

  // Priority order, then top up so a lesson is always full:
  //   1. due reviews (most overdue first)
  //   2. brand-new states
  //   3. not-yet-due states, soonest-due first (study-ahead, so Play always works)
  const due = withRec
    .filter((x) => x.rec && x.rec.due <= now)
    .sort((a, b) => a.rec.due - b.rec.due)
    .map((x) => x.it);
  const fresh = rng.shuffle(withRec.filter((x) => !x.rec).map((x) => x.it));
  const future = withRec
    .filter((x) => x.rec && x.rec.due > now)
    .sort((a, b) => a.rec.due - b.rec.due)
    .map((x) => x.it);
  const selected = [...due, ...fresh, ...future].slice(0, max);

  const dueCount = due.length;
  const newCount = fresh.length;

  const queue = selected.map((item) => ({ item, lapsed: false }));
  const total = queue.length;
  let graduated = 0;
  let asked = 0;
  let correct = 0;
  let firstCorrect = 0; // states answered right on their first attempt this lesson
  const firstSeen = new Set();
  const updated = { ...memory };

  return {
    total,
    dueCount,
    newCount,

    current() {
      return queue[0] ?? null;
    },

    answer(isCorrect) {
      const card = queue.shift();
      if (!card) return;
      asked += 1;
      if (isCorrect) correct += 1;
      if (!firstSeen.has(card.item.id)) {
        firstSeen.add(card.item.id);
        if (isCorrect) firstCorrect += 1;
      }

      if (!isCorrect) {
        // relearn: requeue a few cards later, still in this lesson
        card.lapsed = true;
        const at = Math.min(RELEARN_SPACING, queue.length);
        queue.splice(at, 0, card);
        return;
      }

      // correct -> graduates for this lesson; commit to long-term memory.
      // If it was missed earlier this lesson, record it as a miss so the
      // interval resets and it returns soon next session.
      graduated += 1;
      updated[card.item.id] = reviewItem(updated[card.item.id], !card.lapsed, now);
    },

    get progress() {
      return { mastered: graduated, total };
    },
    get stats() {
      return { asked, correct, total, firstCorrect };
    },
    get memory() {
      return updated;
    },
  };
}
