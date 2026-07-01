import { useState } from 'react';
import { getContentPack } from '../content/registry';
import { focusItems } from '../session/levels';
import UsMap from './UsMap';

// Education phase shown before a level that introduces new states: step through
// each new state highlighted on the map with its memory trigger, then start.
export default function LevelIntro({ config, level, onStart, onBack }) {
  const content = getContentPack(config.contentPackId);
  const def = content.campaign[level];
  const states = focusItems(content, level);
  const [i, setI] = useState(0);

  const state = states[i];
  const hint = content.hints?.[state.name];
  const last = i === states.length - 1;

  return (
    <div className="screen intro">
      <header className="intro-head">
        <button className="back" onClick={onBack}>
          ← Levels
        </button>
        <span className="intro-count">
          {i + 1} / {states.length}
        </span>
      </header>

      <p className="intro-theme">Study · {def.title}</p>
      <p className="prompt">{state.name}</p>
      <UsMap map={content.map} highlightId={state.id} />
      {hint && <p className="hint-box intro-hint">💡 {hint}</p>}

      <div className="actions">
        {i > 0 && <button onClick={() => setI(i - 1)}>Back</button>}
        <button className="primary" onClick={() => (last ? onStart() : setI(i + 1))}>
          {last ? 'Start level' : 'Next'}
        </button>
      </div>
    </div>
  );
}
