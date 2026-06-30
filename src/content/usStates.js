import geo from './usStatesGeo.json';

// A "content pack" bundles everything a set of questions needs:
//   - map:   geometry for rendering an interactive map (optional, map-based packs only)
//   - items: the things that can be quizzed ({ id, name })
//
// To add a new geography pack (countries, capitals, ...) create a similar
// object and register it in ./registry.js. Question types read from this
// shape, so they work with any pack that provides it.
export const usStates = {
  id: 'us-states',
  label: 'U.S. States',

  map: {
    viewBox: geo.viewBox,
    // every shape is rendered; `quizzable` marks the ones used for questions
    shapes: geo.states,
  },

  // Washington, D.C. is on the map but isn't a state, so keep it out of the pool.
  items: geo.states
    .filter((s) => s.name !== 'District of Columbia')
    .map((s) => ({ id: s.id, name: s.name })),
};
