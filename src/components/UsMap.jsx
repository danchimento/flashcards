import { useId } from 'react';

// Reusable, presentational map. Two modes, driven purely by props:
//   - highlight mode: pass `highlightId` to call out one shape
//   - pick mode:      pass `onSelect` to make shapes clickable
//
// Answer feedback is shown by passing `correctId` / `selectedId` once revealed.
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
          aria-label={interactive ? shape.name : undefined}
        />
      ))}
    </svg>
  );
}
