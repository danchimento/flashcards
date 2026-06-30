import { useState } from 'react';
import { buildSession } from '../session/engine';
import { getQuestionType } from '../questions/registry';

export default function Session({ config, onExit }) {
  // Built once on mount; "Play again" rebuilds a fresh randomized session.
  const [session, setSession] = useState(() => buildSession(config));

  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const total = session.questions.length;
  const finished = index >= total;

  function handleAnswer(correct) {
    if (answered) return;
    setAnswered(true);
    if (correct) setScore((s) => s + 1);
  }

  function next() {
    setAnswered(false);
    setIndex((i) => i + 1);
  }

  function restart() {
    setSession(buildSession(config));
    setIndex(0);
    setScore(0);
    setAnswered(false);
  }

  if (finished) {
    return (
      <div className="screen results">
        <h2>Session complete</h2>
        <p className="score-line">
          You scored <strong>{score}</strong> / {total}
        </p>
        <div className="actions">
          <button className="primary" onClick={restart}>
            Play again
          </button>
          <button onClick={onExit}>Change settings</button>
        </div>
      </div>
    );
  }

  const current = session.questions[index];
  const type = getQuestionType(current.typeId);

  return (
    <div className="screen session">
      <header className="session-bar">
        <span>
          Question {index + 1} of {total}
        </span>
        <span>Score: {score}</span>
      </header>

      <type.Component
        content={session.content}
        question={current.data}
        answered={answered}
        onAnswer={handleAnswer}
      />

      <div className="actions">
        <button className="primary" onClick={next} disabled={!answered}>
          {index + 1 === total ? 'Finish' : 'Next'}
        </button>
        <button onClick={onExit}>Quit</button>
      </div>
    </div>
  );
}
