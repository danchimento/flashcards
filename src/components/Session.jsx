import { useEffect, useRef, useState } from 'react';
import { getContentPack } from '../content/registry';
import { createSession } from '../session/scheduler';
import { generateQuestion } from '../session/engine';
import { getQuestionType } from '../questions/registry';
import { createRng } from '../lib/rng';
import { sound } from '../lib/sound';
import { loadMemory, saveMemory, countLearned } from '../session/memory';
import {
  introducedItems,
  countForLevel,
  levelQuestion,
  recordPass,
} from '../session/levels';

const ADVANCE_MS = 750; // brief pause to enjoy the "correct" feedback
const STAR_2 = 0.7; // first-try accuracy for 2 / 3 stars
const STAR_3 = 0.9;

// `level` is a 0-based campaign index for level mode, or null for free practice.
export default function Session({ config, level = null, onExit, onReplay, onNextLevel }) {
  const engine = useRef(null);
  if (engine.current === null) engine.current = buildEngine(config, level);

  const [question, setQuestion] = useState(() => engine.current.first);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [progress, setProgress] = useState(() => engine.current.session.progress);
  const [done, setDone] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  function persist() {
    saveMemory(config.contentPackId, engine.current.session.memory);
  }

  function nextQuestion(card) {
    const { session, content, rng, enabledTypeIds } = engine.current;
    if (level != null) {
      return levelQuestion({
        content,
        target: card.item,
        record: session.memory[card.item.id],
        rng,
      });
    }
    return generateQuestion({
      content,
      enabledTypeIds,
      target: card.item,
      rng,
      avoidTypeId: question?.typeId,
    });
  }

  function loadNext() {
    const { session } = engine.current;
    const card = session.current();
    setProgress(session.progress);
    if (!card) {
      persist();
      if (level != null) engine.current.result = finalizeLevel(engine.current, level, config);
      setDone(true);
      sound.finish();
      return;
    }
    setQuestion(nextQuestion(card));
    setAnswered(false);
    setShowHint(false);
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

  if (done) {
    return (
      <Results
        level={level}
        result={engine.current.result}
        stats={engine.current.session.stats}
        best={best}
        learned={countLearned(engine.current.session.memory)}
        totalItems={engine.current.content.items.length}
        hasNext={level != null && level + 1 < engine.current.content.campaign.length}
        onReplay={onReplay}
        onNextLevel={onNextLevel}
        onExit={onExit}
      />
    );
  }

  const type = getQuestionType(question.typeId);
  const pct = Math.round((progress.mastered / progress.total) * 100);
  const hint = engine.current.content.hints?.[question.data.targetName];

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
            {hint &&
              (showHint ? (
                <p className="hint-box">💡 {hint}</p>
              ) : (
                <button className="ghost" onClick={() => setShowHint(true)}>
                  💡 Show hint
                </button>
              ))}
            <button className="primary" onClick={loadNext}>
              Continue
            </button>
          </>
        )}
      </footer>
    </div>
  );
}

function buildEngine(config, level) {
  const content = getContentPack(config.contentPackId);
  const rng = createRng();
  const memory = loadMemory(config.contentPackId);
  const enabledTypeIds = config.enabledTypeIds;

  const items = level != null ? introducedItems(content, level) : content.items;
  const max = level != null ? countForLevel(level + 1) : config.questionCount;
  const session = createSession({ items, memory, max, now: Date.now() }, rng);

  const card = session.current();
  const first =
    level != null
      ? levelQuestion({ content, target: card.item, record: session.memory[card.item.id], rng })
      : generateQuestion({ content, enabledTypeIds, target: card.item, rng });

  return { content, rng, session, enabledTypeIds, first, result: null };
}

function finalizeLevel(engine, level, config) {
  const { firstCorrect, total } = engine.session.stats;
  const firstTry = total ? firstCorrect / total : 0;
  const stars = firstTry >= STAR_3 ? 3 : firstTry >= STAR_2 ? 2 : 1;
  // Completing a level unlocks the next; stars reward first-try accuracy.
  recordPass(config.contentPackId, level);
  return { stars, firstTry };
}

function Results({
  level,
  result,
  stats,
  best,
  learned,
  totalItems,
  hasNext,
  onReplay,
  onNextLevel,
  onExit,
}) {
  const accuracy = stats.asked ? Math.round((stats.correct / stats.asked) * 100) : 0;

  // --- level mode: complete + stars + unlock next ---
  if (level != null && result) {
    const firstTry = stats.total ? Math.round((stats.firstCorrect / stats.total) * 100) : 0;
    return (
      <div className="screen results">
        <div className="stars" aria-label={`${result.stars} of 3 stars`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={i < result.stars ? 'on' : ''}>
              ★
            </span>
          ))}
        </div>
        <h2>Level complete!</h2>
        <div className="stat-grid">
          <div className="stat">
            <span className="stat-value">{firstTry}%</span>
            <span className="stat-label">first try</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">studied</span>
          </div>
          <div className="stat">
            <span className="stat-value">{best}</span>
            <span className="stat-label">best streak</span>
          </div>
        </div>
        <div className="actions">
          {hasNext ? (
            <button className="primary" onClick={onNextLevel}>
              Next level
            </button>
          ) : (
            <button className="primary" onClick={onReplay}>
              Play again
            </button>
          )}
          <button onClick={onExit}>Levels</button>
        </div>
      </div>
    );
  }

  // --- free practice ---
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
        {learned} of {totalItems} states learned
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
