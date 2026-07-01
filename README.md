# Geography

A small study tool for learning geography. The main mode is a **level campaign**:
~20 themed levels (West Coast → Four Corners → the Great Plains Stack → … → New
England as the final boss), each drawing on everything learned so far. Completing
a level unlocks the next; 1–3 **stars** reward first-try accuracy. There's also a
**free-practice** mode over all 50 states. The first content pack is **U.S.
states**, with three question styles:

- **Name the highlighted state** — a state is highlighted on the map; pick its name (multiple choice).
- **Find the state on the map** — given a name, tap the right state.
- **Type the highlighted state** — a state is highlighted; type its name (free recall, with
  forgiving spelling and a basic prefix autocomplete). Recall beats recognition for retention.

The map adapts to the task. For **Find the state**, it's **one-handed drag-to-select**:
press and slide a finger across the map and a **magnifier loupe** shows the area
under your finger enlarged (above the fingertip, so tiny states aren't hidden) —
crucially with *no label*, so it still tests whether you know the state. Release
to pick; a tap is just a quick press-and-release. For the highlight-based styles
the map is **zoomable** (pinch / drag / double-tap / +− buttons).

**Spaced repetition, two phases (the standard Anki/SM-2 model).**

- *Learning:* a new or just-missed state stays in rotation (due now) until you've
  answered it correctly a couple of times — so you actually learn states in a
  sitting instead of being "done" after one shaky pass. Within a lesson, a miss
  comes back a few questions later; correct answers auto-advance, a miss reveals
  the answer and waits for one tap. Streak, progress bar, light audio, results.
- *Review (memory):* once **learned**, progress is saved in `localStorage` and the
  state graduates to SM-2 day-scale intervals (1 → 6 → ×ease), resurfacing less
  and less often. A miss drops it back to learning.

A lesson is composed **due reviews → new states → then the soonest-due ones to
fill up**, capped at your lesson size. Priority goes to what you most need, but
pressing **Play always starts a full session** — even if you've learned
everything, you can keep practicing (study-ahead). FSRS is the newer, more
efficient successor if we want it later.

It's built as a React + Vite app, and intentionally minimal: no accounts. The
architecture is the point: content and question styles are pluggable so we can
iterate quickly.

## Run it

```bash
npm install
npm run dev      # dev server with hot reload
npm run build    # emits a single self-contained docs/index.html (great for phones)
npm run preview  # serve the production build
```

`npm run build` inlines everything into one `docs/index.html` you can open
directly in any browser, including on a phone.

## How it's organized

```
src/
  config.js              # default settings (states per session, enabled styles)
  lib/rng.js             # tiny randomness helper (pick/shuffle/sample)
  lib/sound.js           # synthesized correct/wrong/finish blips (mutable)
  lib/match.js           # forgiving free-recall matching (typos, spacing, no false accepts)
  content/
    registry.js          # registers content packs
    usStates.js          # the U.S. states pack (items + map geometry + hints + campaign)
    usStatesGeo.json     # pre-projected SVG paths (generated, see below)
    usStatesLevels.js    # the ~20-level themed campaign
    usStateHints.js      # per-state memory triggers (mnemonics)
  questions/
    registry.js          # registers question styles
    identifyState.jsx    # "name the highlighted state" plugin (multiple choice)
    locateState.jsx      # "find the state on the map" plugin
    typeState.jsx        # "type the highlighted state" plugin (free recall + autocomplete)
  session/
    memory.js            # SM-2 across-session memory, persisted in localStorage
    scheduler.js         # composes a lesson (due + new) and runs relearning
    engine.js            # picks a style and generates a question for a target
    levels.js            # campaign logic: per-state modality ramp, counts, unlock progress
  components/
    UsMap.jsx            # reusable map (magnifier drag-to-pick / zoom-highlight modes)
    LevelSelect.jsx      # the campaign level list
    Setup.jsx            # free-practice settings
    Session.jsx          # drives a level or free lesson: HUD, streak, feedback, advance
```

**Education phase.** Levels that introduce new states open with a short study
phase (`LevelIntro`) that steps through each new state highlighted on the map
with its memory trigger, before the questions start. Review levels skip it.

**Level campaign & modality ramp.** In a level, each state is asked in a style
earned from its spaced-repetition history: brand-new → **multiple choice**,
learned (2 correct) → **find on map**, strong (4 correct) → **type**. So typing
turns on per state as you get it right consistently, and by the late levels
you're typing everything. Question count rises with level. See
`knowledge/us-states/` for the design notes.

### Adding a question style

Create a plugin in `src/questions/` exporting:

```js
export const myStyle = {
  id: 'my-style',
  label: 'Shown in the settings list',
  generate({ content, rng, target }) {
    // `target` is the item the scheduler wants to quiz (its data must include
    // `targetId` so the scheduler can match the answer). Falls back to random.
    const answer = target ?? rng.pick(content.items);
    return { targetId: answer.id /* + whatever your component needs */ };
  },
  Component({ content, question, answered, onAnswer }) {
    // render the question; call onAnswer(true|false) once when answered
  },
};
```

Then add it to the `types` array in `src/questions/registry.js`. It's
automatically available in the settings and the session mix.

### Adding content (new geography)

Create a pack in `src/content/` with this shape and register it in
`src/content/registry.js`:

```js
export const myPack = {
  id: 'my-pack',
  label: 'Shown to the user',
  map: { viewBox, shapes: [{ id, name, d }] }, // for map-based styles
  items: [{ id, name }],                        // the things to quiz on
};
```

Any question style that reads `content.map` / `content.items` works with it.

### Regenerating the U.S. map geometry

`usStatesGeo.json` is derived from the [`us-atlas`](https://github.com/topojson/us-atlas)
Albers-USA dataset and committed so the app needs no geo libs at runtime. To
regenerate:

```bash
node scripts/build-geo.mjs
```
