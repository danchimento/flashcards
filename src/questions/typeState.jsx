import { useEffect, useRef, useState } from 'react';
import UsMap from '../components/UsMap';
import { isCloseMatch, normalize } from '../lib/match';

const MAX_SUGGESTIONS = 5;

// "Type": a state is highlighted; type its name (free recall — no options).
// A basic prefix autocomplete helps with spelling / mobile typing, but you
// still have to recall the start of the name yourself.
export const typeState = {
  id: 'type-state',
  label: 'Type the highlighted state',

  generate({ content, rng, target }) {
    const answer = target ?? rng.pick(content.items);
    return { targetId: answer.id, targetName: answer.name };
  },

  Component({ content, question, answered, onAnswer }) {
    const [value, setValue] = useState('');
    const [wasCorrect, setWasCorrect] = useState(false);
    const inputRef = useRef(null);

    // Focus on mount so the keyboard opens right away (re-mounts per question).
    useEffect(() => {
      inputRef.current?.focus();
    }, []);

    const names = content.items.map((i) => i.name);
    const nv = normalize(value);
    const suggestions =
      !answered && nv
        ? names.filter((n) => normalize(n).startsWith(nv) && normalize(n) !== nv).slice(0, MAX_SUGGESTIONS)
        : [];

    function grade(text) {
      if (answered || !text.trim()) return;
      const correct = isCloseMatch(text, question.targetName, names);
      setWasCorrect(correct);
      onAnswer(correct);
    }

    function choose(name) {
      setValue(name);
      inputRef.current?.focus();
    }

    return (
      <div className="question type">
        <p className="prompt">What state is highlighted?</p>
        <UsMap map={content.map} highlightId={question.targetId} />
        <form
          className="type-form"
          onSubmit={(e) => {
            e.preventDefault();
            grade(value);
          }}
        >
          <input
            ref={inputRef}
            className={`type-input ${answered ? (wasCorrect ? 'correct' : 'wrong') : ''}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type the state name"
            autoCapitalize="words"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            disabled={answered}
            aria-label="State name"
          />
          {suggestions.length > 0 && (
            <ul className="suggestions">
              {suggestions.map((n) => (
                <li key={n}>
                  <button
                    type="button"
                    className="suggestion"
                    // pointerDown fires before the input blurs, so the tap registers
                    onPointerDown={(e) => {
                      e.preventDefault();
                      choose(n);
                    }}
                  >
                    {n}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!answered && (
            <button className="primary" type="submit" disabled={!value.trim()}>
              Check
            </button>
          )}
        </form>
        {answered && !wasCorrect && (
          <p className="hint">
            It's <strong>{question.targetName}</strong>.
          </p>
        )}
      </div>
    );
  },
};
