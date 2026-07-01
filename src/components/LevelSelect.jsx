import { getContentPack } from '../content/registry';
import { loadProgress } from '../session/levels';

// A simple vertical list of campaign levels: completed, current (unlocked), or
// locked. Tapping a playable level starts it.
export default function LevelSelect({ config, onPlay, onFreePractice }) {
  const content = getContentPack(config.contentPackId);
  const { unlocked } = loadProgress(config.contentPackId);
  const levels = content.campaign;

  return (
    <div className="screen levels">
      <h1>{content.label}</h1>
      <p className="subtitle">Work your way across the map — New England is the final boss.</p>

      <ol className="level-list">
        {levels.map((lvl, i) => {
          const status = i < unlocked ? 'done' : i === unlocked ? 'current' : 'locked';
          const playable = i <= unlocked;
          return (
            <li key={i}>
              <button
                className={`level ${status}`}
                disabled={!playable}
                onClick={() => playable && onPlay(i)}
              >
                <span className="level-badge">{status === 'done' ? '✓' : i + 1}</span>
                <span className="level-text">
                  <span className="level-title">{lvl.title}</span>
                  <span className="level-blurb">{lvl.blurb}</span>
                </span>
                <span className="level-mark">{status === 'locked' ? '🔒' : ''}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <button className="ghost free-practice" onClick={onFreePractice}>
        Free practice (all states)
      </button>
    </div>
  );
}
