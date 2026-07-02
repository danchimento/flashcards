import { useMemo, useRef, useState } from 'react';

// "Place": the state's shape is a draggable puzzle piece; the rest of the
// country is faint empty outlines with a gap where the state belongs. Drag the
// piece into its spot. Physically constructing the map (the enactment effect)
// encodes location far more deeply than recognition.
const TRAY_H = 175; // map units of tray below the map, where the piece starts
const SNAP_TOL = 60; // release within this distance of home = correct
const NEAR = 100; // show the target outline once you're roughly there

export const placeState = {
  id: 'place-state',
  label: 'Drag the state into place',

  generate({ content, rng, target }) {
    const answer = target ?? rng.pick(content.items);
    return { targetId: answer.id, targetName: answer.name };
  },

  Component({ content, question, answered, onAnswer }) {
    const { map } = content;
    const piece = map.shapes.find((s) => s.id === question.targetId);
    const [vx, vy, vw, vh] = useMemo(() => map.viewBox.split(' ').map(Number), [map.viewBox]);

    // start with the piece centered in the tray below the map
    const start = useMemo(() => {
      const trayX = vx + vw / 2;
      const trayY = vy + vh + TRAY_H / 2;
      return { dx: trayX - piece.cx, dy: trayY - piece.cy };
    }, [vx, vy, vw, vh, piece]);

    const [pos, setPos] = useState(start);
    const [result, setResult] = useState(null); // 'correct' | 'wrong'
    const svgRef = useRef(null);
    const dragging = useRef(false);
    const grab = useRef({ x: 0, y: 0 });
    const posRef = useRef(start);

    function toMap(clientX, clientY) {
      const svg = svgRef.current;
      const ctm = svg.getScreenCTM();
      const p = svg.createSVGPoint();
      p.x = clientX;
      p.y = clientY;
      const m = p.matrixTransform(ctm.inverse());
      return { x: m.x, y: m.y };
    }
    function apply(p) {
      posRef.current = p;
      setPos(p);
    }

    function onDown(e) {
      if (answered) return;
      dragging.current = true;
      try {
        svgRef.current.setPointerCapture(e.pointerId);
      } catch {
        /* synthetic events */
      }
      const m = toMap(e.clientX, e.clientY);
      grab.current = { x: piece.cx + posRef.current.dx - m.x, y: piece.cy + posRef.current.dy - m.y };
      e.preventDefault();
    }
    function onMove(e) {
      if (!dragging.current || answered) return;
      const m = toMap(e.clientX, e.clientY);
      apply({ dx: m.x + grab.current.x - piece.cx, dy: m.y + grab.current.y - piece.cy });
    }
    function onUp() {
      if (!dragging.current || answered) return;
      dragging.current = false;
      const { dx, dy } = posRef.current;
      const correct = Math.hypot(dx, dy) < SNAP_TOL;
      if (correct) apply({ dx: 0, dy: 0 });
      setResult(correct ? 'correct' : 'wrong');
      onAnswer(correct);
    }

    const dist = Math.hypot(pos.dx, pos.dy);
    const showGuide = (!answered && dragging.current && dist < NEAR) || result === 'wrong';
    const pieceClass = `place-piece ${result ?? ''}`;

    return (
      <div className="question place">
        <p className="prompt">
          Drag <strong>{question.targetName}</strong> into place
        </p>
        <svg
          ref={svgRef}
          className="place-svg"
          viewBox={`${vx} ${vy} ${vw} ${vh + TRAY_H}`}
          preserveAspectRatio="xMidYMid meet"
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          {/* the rest of the country as faint empty slots (context) */}
          {map.shapes
            .filter((s) => s.id !== question.targetId)
            .map((s) => (
              <path key={s.id} d={s.d} className="place-slot" />
            ))}

          {/* the target's home outline — revealed as you get close / on a miss */}
          {showGuide && <path d={piece.d} className="place-guide" />}

          {/* the draggable piece */}
          <g transform={`translate(${pos.dx} ${pos.dy})`}>
            <path
              d={piece.d}
              className={pieceClass}
              aria-label={`${question.targetName} piece`}
              onPointerDown={onDown}
            />
          </g>
        </svg>
      </div>
    );
  },
};
