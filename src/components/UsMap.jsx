import { useId, useRef, useState } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';

// Reusable map with two modes:
//   - highlight mode (default): zoom/pan to inspect a highlighted state
//   - pick mode (`interactive` + `onSelect`): one-handed "scrub" selection —
//     press and drag a finger across the map; a large label shows the state
//     under your finger (small states are hard to see beneath a fingertip), and
//     releasing selects it. A plain tap is just a quick press-and-release.
export default function UsMap(props) {
  return props.interactive ? <ScrubMap {...props} /> : <HighlightMap {...props} />;
}

function shapeClasses({ shape, hoverId, selectedId, correctId, revealed }) {
  const classes = ['state'];
  if (!revealed && shape.id === hoverId) classes.push('hover');
  if (revealed) {
    if (shape.id === correctId) classes.push('correct');
    else if (shape.id === selectedId) classes.push('wrong');
  }
  return classes.join(' ');
}

// --- pick mode: drag-to-select, one-handed ---
function ScrubMap({ map, selectedId = null, correctId = null, revealed = false, onSelect }) {
  const titleId = useId();
  const svgRef = useRef(null);
  const hoverRef = useRef(null);
  const pressing = useRef(false);
  const [hoverId, setHoverId] = useState(null);

  const nameOf = (id) => map.shapes.find((s) => s.id === id)?.name ?? null;

  function setHover(id) {
    hoverRef.current = id;
    setHoverId(id);
  }
  // Find the state under a screen point (works regardless of finger position).
  function idAtPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    return el?.dataset?.stateId ?? null;
  }
  function idFromEvent(e) {
    return e.target?.dataset?.stateId ?? idAtPoint(e.clientX, e.clientY);
  }

  function onDown(e) {
    if (revealed) return;
    pressing.current = true;
    try {
      svgRef.current.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic events may lack an active pointer */
    }
    setHover(idFromEvent(e));
    e.preventDefault();
  }
  function onMove(e) {
    if (revealed || !pressing.current) return;
    setHover(idAtPoint(e.clientX, e.clientY));
  }
  function onUp() {
    if (revealed || !pressing.current) return;
    pressing.current = false;
    const id = hoverRef.current;
    setHover(null);
    if (id) onSelect?.(id);
  }
  function onCancel() {
    pressing.current = false;
    setHover(null);
  }

  return (
    <div className="map-frame scrub">
      {hoverId && !revealed && <div className="scrub-label">{nameOf(hoverId)}</div>}
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
        onPointerCancel={onCancel}
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
