# Geography

A small study tool for learning geography. You start a **session** of N
questions (default 10), each a randomly chosen *style*. The first content pack
is **U.S. states**, with two question styles:

- **Name the highlighted state** — a state is highlighted on the map; pick its name.
- **Find the state on the map** — given a name, tap the right state.

It's built as a React + Vite app, and intentionally minimal: no accounts, no
persistence — just the settings described above. The architecture is the point:
content and question styles are pluggable so we can iterate quickly.

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
  config.js              # default settings (question count, enabled styles)
  lib/rng.js             # tiny randomness helper (pick/shuffle/sample)
  content/
    registry.js          # registers content packs
    usStates.js          # the U.S. states pack (items + map geometry)
    usStatesGeo.json     # pre-projected SVG paths (generated, see below)
  questions/
    registry.js          # registers question styles
    identifyState.jsx    # "name the highlighted state" plugin
    locateState.jsx      # "find the state on the map" plugin
  session/
    engine.js            # builds a session (a list of questions) from config
  components/
    UsMap.jsx            # reusable SVG map (highlight mode / clickable mode)
    Setup.jsx            # start screen + settings
    Session.jsx          # runs through the questions, tracks score
```

### Adding a question style

Create a plugin in `src/questions/` exporting:

```js
export const myStyle = {
  id: 'my-style',
  label: 'Shown in the settings list',
  generate({ content, rng }) {
    // return whatever data your component needs
    return { /* ... */ };
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
