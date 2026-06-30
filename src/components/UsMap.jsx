import { useId, useRef, useState } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';

// Reusable map with two modes:
//   - highlight mode (default): zoom/pan to inspect a highlighted state
//   - pick mode (`interactive` + `onSelect`): one-handed "scrub" selection —
//     press and drag a finger across the map; a magnifier loupe shows the area
//     under your finger enlarged (above the fingertip, so small states aren't
//     hidden) WITHOUT naming it — releasing selects the state under the finger.
export default function UsMap(props) {
  return props.interactive ? <ScrubMap {...props} /> : <HighlightMap {...props} />;
}

const LOUPE_PX = 132; // on-screen diameter of the magnifier
const LOUPE_WIN = 150; // map units shown across the loupe (smaller = more zoom)

function shapeClasses({ shape, hoverId, selectedId, correctId, revealed }) {
  const classes = ['state'];
  if (!revealed && shape.id === hoverId) classes.push('hover');
  if (revealed) {
    if (shape.id === correctId) classes.push('correct');
    else if (shape.id === selectedId) classes.push('wrong');
  }
  return classes.join(' ');
}

// --- pick mode: drag-to-select with a magnifier, one-handed ---
function ScrubMap({ map, selectedId = null, correctId = null, revealed = false, onSelect }) {
  const titleId = useId();
  const frameRef = useRef(null);
  const svgRef = useRef(null);
  const hoverRef = useRef(null);
  const pressing = useRef(false);
  const [hoverId, setHoverId] = useState(null);
  const [loupe, setLoupe] = useState(null); // { fx, fy, fw, fh, sx, sy } in px / map units

  // map a screen point to the svg's user coordinates (respects viewBox + fit)
  function toMapPoint(clientX, clientY) {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = svg.createSVGPoint();
    p.x = clientX;
    p.y = clientY;
    const m = p.matrixTransform(ctm.inverse());
    return { x: m.x, y: m.y };
  }
  function idAtPoint(x, y) {
    return document.elementFromPoint(x, y)?.dataset?.stateId ?? null;
  }
  function update(clientX, clientY) {
    const id = idAtPoint(clientX, clientY);
    hoverRef.current = id;
    setHoverId(id);
    const frame = frameRef.current.getBoundingClientRect();
    const { x, y } = toMapPoint(clientX, clientY);
    setLoupe({
      fx: clientX - frame.left,
      fy: clientY - frame.top,
      fw: frame.width,
      fh: frame.height,
      sx: x,
      sy: y,
    });
  }

  function onDown(e) {
    if (revealed) return;
    pressing.current = true;
    try {
      svgRef.current.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic events may lack an active pointer */
    }
    update(e.clientX, e.clientY);
    e.preventDefault();
  }
  function onMove(e) {
    if (revealed || !pressing.current) return;
    update(e.clientX, e.clientY);
  }
  function clear() {
    pressing.current = false;
    hoverRef.current = null;
    setHoverId(null);
    setLoupe(null);
  }
  function onUp() {
    if (revealed || !pressing.current) return;
    const id = hoverRef.current;
    clear();
    if (id) onSelect?.(id);
  }

  return (
    <div className="map-frame scrub" ref={frameRef}>
      <svg
        ref={svgRef}
        className="us-map"
        viewBox={map.viewBox}
        role="img"
        aria-labelledby={titleId}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={clear}
      >
        <title id={titleId}>Map of the United States — drag to pick a state</title>
        {map.shapes.map((shape) => (
          <path
            key={shape.id}
            d={shape.d}
            data-state-id={shape.id}
            className={shapeClasses({ shape, hoverId, selectedId, correctId, revealed })}
            aria-label={shape.name}
          />
        ))}
      </svg>
      {loupe && !revealed && <Loupe map={map} loupe={loupe} hoverId={hoverId} />}
    </div>
  );
}

// Magnifier that shows the map under the finger, enlarged, with no label.
function Loupe({ map, loupe, hoverId }) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const left = clamp(loupe.fx - LOUPE_PX / 2, 6, loupe.fw - LOUPE_PX - 6);
  let top = loupe.fy - 20 - LOUPE_PX;
  if (top < 6) top = loupe.fy + 20; // flip below the finger near the top edge
  top = clamp(top, 6, loupe.fh - LOUPE_PX - 6);

  const vb = `${loupe.sx - LOUPE_WIN / 2} ${loupe.sy - LOUPE_WIN / 2} ${LOUPE_WIN} ${LOUPE_WIN}`;

  return (
    <div className="loupe" style={{ left, top, width: LOUPE_PX, height: LOUPE_PX }}>
      <svg className="loupe-map" viewBox={vb} preserveAspectRatio="xMidYMid slice">
        {map.shapes.map((shape) => (
          <path
            key={shape.id}
            d={shape.d}
            className={`state ${shape.id === hoverId ? 'hover' : ''}`}
          />
        ))}
        {/* crosshair marking the exact point under the finger */}
        <circle cx={loupe.sx} cy={loupe.sy} r="3" className="loupe-dot" />
      </svg>
    </div>
  );
}

// --- highlight mode: zoom/pan to inspect ---
function HighlightMap({ map, highlightId = null }) {
  const titleId = useId();
  return (
    <div className="map-frame">
      <TransformWrapper
        minScale={1}
        maxScale={8}
        doubleClick={{ mode: 'zoomIn', step: 0.9 }}
        wheel={{ step: 0.12 }}
        panning={{ velocityDisabled: true }}
      >
        <ZoomControls />
        <TransformComponent wrapperClass="map-viewport" contentClass="map-content">
          <svg
            className="us-map"
            viewBox={map.viewBox}
            role="img"
            aria-labelledby={titleId}
            preserveAspectRatio="xMidYMid meet"
          >
            <title id={titleId}>Map of the United States</title>
            {map.shapes.map((shape) => (
              <path
                key={shape.id}
                d={shape.d}
                className={`state ${shape.id === highlightId ? 'highlight' : ''}`}
                aria-label={shape.name}
              />
            ))}
          </svg>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}

function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="map-controls">
      <button type="button" aria-label="Zoom in" onClick={() => zoomIn()}>
        +
      </button>
      <button type="button" aria-label="Zoom out" onClick={() => zoomOut()}>
        −
      </button>
      <button type="button" aria-label="Reset zoom" onClick={() => resetTransform()}>
        ⟲
      </button>
    </div>
  );
}
