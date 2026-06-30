# Geography

A small study tool for learning geography. You start a **session** to master N
states (default 10), each asked in a randomly chosen *style*. The first content
pack is **U.S. states**, with two question styles:

- **Name the highlighted state** — a state is highlighted on the map; pick its name.
- **Find the state on the map** — given a name, tap the right state.

The map is **zoomable** (pinch / drag / double-tap / +− buttons) so small states
like the Northeast are reachable without zooming the whole page.

**Spaced repetition (Leitner system, session-scoped).** Get a state right and it
graduates; miss it and it returns a few questions later (spaced, not immediately)
and keeps coming back until you know it. Correct answers auto-advance; a miss
reveals the answer and waits for one tap. There's a streak counter, a progress
bar, light audio feedback, and a results summary — Duolingo-ish, quick taps.
SM-2/FSRS (day-scale, needs stored history) are the next step if we add
cross-session persistence later.

It's built as a React + Vite app, and intentionally minimal: no accounts, no
persistence yet. The architecture is the point: content and question styles are
pluggable so we can iterate quickly.

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
  content/
    registry.js          # registers content packs
    usStates.js          # the U.S. states pack (items + map geometry)
    usStatesGeo.json     # pre-projected SVG paths (generated, see below)
  questions/
    registry.js          # registers question styles
    identifyState.jsx    # "name the highlighted state" plugin
    locateState.jsx      # "find the state on the map" plugin
  session/
    scheduler.js         # Leitner spaced-repetition queue (mastery + requeue)
    engine.js            # picks a style and generates a question for a target
  components/
    UsMap.jsx            # reusable zoom/pan SVG map (highlight / pick modes)
    Setup.jsx            # start screen + settings
    Session.jsx          # drives the session: HUD, streak, feedback, advance
```

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
