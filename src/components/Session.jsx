import { useEffect, useReducer, useRef, useState } from 'react';
import { getContentPack } from '../content/registry';
import { createSession } from '../session/scheduler';
import { generateQuestion } from '../session/engine';
import { getQuestionType } from '../questions/registry';
import { createRng } from '../lib/rng';
import { sound } from '../lib/sound';
import { loadMemory, saveMemory, countMastered } from '../session/memory';

const ADVANCE_MS = 750; // brief pause to enjoy the "correct" feedback

export default function Session({ config, onExit, onReplay }) {
  const [, force] = useReducer((x) => x + 1, 0);
  // Built once per run; "Play again" remounts via `runId`, practice rebuilds in place.
  const engine = useRef(null);
  if (engine.current === null) engine.current = buildEngine(config, false);

  const [question, setQuestion] = useState(() => engine.current.first);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [progress, setProgress] = useState(() => engine.current.session.progress);
  const [done, setDone] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  function persist() {
    saveMemory(config.contentPackId, engine.current.session.memory);
  }

  function loadNext() {
    const { session, content, rng, enabledTypeIds } = engine.current;
    const card = session.current();
    setProgress(session.progress);
    if (!card) {
      persist();
      setDone(true);
      sound.finish();
      return;
    }
    const q = generateQuestion({
      content,
      enabledTypeIds,
      target: card.item,
      rng,
      avoidTypeId: question?.typeId,
    });
    setQuestion(q);
    setAnswered(false);
  }

  function handleAnswer(isCorrect) {
    if (answered) return;
    setAnswered(true);
    setLastCorrect(isCorrect);
    engine.current.session.answer(isCorrect);

    if (isCorrect) {
      sound.correct();
      setStreak((s) => {
        const n = s + 1;
        setBest((b) => Math.max(b, n));
        return n;
      });
      timer.current = setTimeout(loadNext, ADVANCE_MS);
    } else {
      sound.wrong();
      setStreak(0);
    }
  }

  function quit() {
    persist();
    onExit();
  }

  function startPractice() {
    engine.current = buildEngine(config, true);
    setQuestion(engine.current.first);
    setAnswered(false);
    setStreak(0);
    setBest(0);
    setProgress(engine.current.session.progress);
    setDone(false);
    force();
  }

  if (done) {
    return (
      <Results
        stats={engine.current.session.stats}
        best={best}
        mastered={countMastered(engine.current.session.memory)}
        totalItems={engine.current.content.items.length}
        onReplay={onReplay}
        onExit={onExit}
      />
    );
  }

  // Nothing due and nothing new — every state is mastered or resting.
  if (engine.current.session.total === 0) {
    return (
      <CaughtUp
        mastered={countMastered(engine.current.session.memory)}
        totalItems={engine.current.content.items.length}
        onPractice={startPractice}
        onExit={onExit}
      />
    );
  }

  const type = getQuestionType(question.typeId);
  const pct = Math.round((progress.mastered / progress.total) * 100);

  return (
    <div className="screen session">
      <header className="hud">
        <button className="quit" onClick={quit} aria-label="Quit session">
          ✕
        </button>
        <div className="progress" aria-label={`${progress.mastered} of ${progress.total} done`}>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className={`streak ${streak >= 2 ? 'on' : ''}`} aria-label={`Streak ${streak}`}>
          🔥 {streak}
        </div>
      </header>

      <type.Component
        key={question.data.targetId + ':' + question.typeId + ':' + progress.mastered}
        content={engine.current.content}
        question={question.data}
        answered={answered}
        onAnswer={handleAnswer}
      />

      <footer className={`feedback ${answered ? (lastCorrect ? 'correct' : 'wrong') : ''}`}>
        {answered && lastCorrect && <span className="banner">✓ Nice!</span>}
        {answered && !lastCorrect && (
          <>
            <span className="banner">Keep going — you'll see it again</span>
            <button className="primary" onClick={loadNext}>
              Continue
            </button>
          </>
        )}
      </footer>
    </div>
  );
}

function buildEngine(config, ignoreSchedule) {
  const content = getContentPack(config.contentPackId);
  const rng = createRng();
  const memory = loadMemory(config.contentPackId);
  const session = createSession(
    { items: content.items, memory, max: config.questionCount, now: Date.now(), ignoreSchedule },
    rng,
  );
  const enabledTypeIds = config.enabledTypeIds;
  const card = session.current();
  const first = card
    ? generateQuestion({ content, enabledTypeIds, target: card.item, rng })
    : null;
  return { content, rng, session, enabledTypeIds, first };
}

function Results({ stats, best, mastered, totalItems, onReplay, onExit }) {
  const accuracy = stats.asked ? Math.round((stats.correct / stats.asked) * 100) : 0;
  return (
    <div className="screen results">
      <div className="trophy">🏆</div>
      <h2>Lesson complete!</h2>
      <div className="stat-grid">
        <div className="stat">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">studied</span>
        </div>
        <div className="stat">
          <span className="stat-value">{accuracy}%</span>
          <span className="stat-label">accuracy</span>
        </div>
        <div className="stat">
          <span className="stat-value">{best}</span>
          <span className="stat-label">best streak</span>
        </div>
      </div>
      <p className="overall">
        {mastered} of {totalItems} states mastered
      </p>
      <div className="actions">
        <button className="primary" onClick={onReplay}>
          New lesson
        </button>
        <button onClick={onExit}>Change settings</button>
      </div>
    </div>
  );
}

function CaughtUp({ mastered, totalItems, onPractice, onExit }) {
  return (
    <div className="screen results">
      <div className="trophy">🎉</div>
      <h2>All caught up!</h2>
      <p className="overall">
        Nothing's due right now. {mastered} of {totalItems} states mastered — they'll resurface
        later to keep them fresh.
      </p>
      <div className="actions">
        <button className="primary" onClick={onPractice}>
          Practice anyway
        </button>
        <button onClick={onExit}>Change settings</button>
      </div>
    </div>
  );
}
