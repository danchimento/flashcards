import { useId } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';

// Reusable, presentational map with pinch/drag/double-tap zoom so small states
// (e.g. the Northeast) are reachable without zooming the whole page. Two modes,
// driven by props:
//   - highlight mode: pass `highlightId` to call out one shape
//   - pick mode:      pass `interactive` + `onSelect` to make shapes tappable
//
// react-zoom-pan-pinch distinguishes a drag (pan) from a tap, so selecting a
// state still works while zoomed/panned.
export default function UsMap({
  map,
  highlightId = null,
  selectedId = null,
  correctId = null,
  revealed = false,
  interactive = false,
  onSelect,
}) {
  const titleId = useId();

  function classFor(shape) {
    const classes = ['state'];
    if (interactive && !revealed) classes.push('interactive');
    if (shape.id === highlightId) classes.push('highlight');
    if (revealed) {
      if (shape.id === correctId) classes.push('correct');
      else if (shape.id === selectedId) classes.push('wrong');
    }
    return classes.join(' ');
  }

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
        <TransformComponent
          wrapperClass="map-viewport"
          contentClass="map-content"
        >
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
                className={classFor(shape)}
                onClick={interactive && !revealed ? () => onSelect?.(shape.id) : undefined}
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
