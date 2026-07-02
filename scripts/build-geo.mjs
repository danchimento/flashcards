// Regenerates src/content/usStatesGeo.json from the us-atlas dataset.
// Run with: node scripts/build-geo.mjs
//
// We pre-project the Albers-USA TopoJSON to flat SVG path strings at build
// time so the app bundle doesn't need d3-geo/topojson at runtime.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { feature } from 'topojson-client';
import { geoPath } from 'd3-geo';

const topo = JSON.parse(
  readFileSync(fileURLToPath(new URL('../node_modules/us-atlas/states-albers-10m.json', import.meta.url))),
);

const path = geoPath(); // identity: coordinates are already screen-space
const fc = feature(topo, topo.objects.states);

const [[x0, y0], [x1, y1]] = path.bounds(fc);
const pad = 8;
const viewBox = [
  Math.floor(x0 - pad),
  Math.floor(y0 - pad),
  Math.ceil(x1 - x0 + pad * 2),
  Math.ceil(y1 - y0 + pad * 2),
].join(' ');

const states = fc.features
  .map((f) => {
    const [cx, cy] = path.centroid(f); // home point, for the "place the state" puzzle
    return {
      id: f.id,
      name: f.properties.name,
      d: path(f),
      cx: Math.round(cx * 10) / 10,
      cy: Math.round(cy * 10) / 10,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const outPath = fileURLToPath(new URL('../src/content/usStatesGeo.json', import.meta.url));
writeFileSync(outPath, JSON.stringify({ viewBox, states }));
console.log(`Wrote ${states.length} states to ${outPath}`);
