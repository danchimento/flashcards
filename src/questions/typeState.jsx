import { useEffect, useRef, useState } from 'react';
import UsMap from '../components/UsMap';
import { isCloseMatch, normalize } from '../lib/match';

const MAX_SUGGESTIONS = 6;

// "Type": a state is highlighted; type its name (free recall — no options).
//
// Suggestions are a single horizontal chip row directly under the field: it
// never covers the map and fits in the band above the on-screen keyboard.
// Tapping a chip submits immediately (no separate Check button).
export const typeState = {
  id: 'type-state',
  label: 'Type the highlighted state',

  generate({ content, rng, target }) {
    const answer = target ?? rng.pick(content.items);
    return { targetId: answer.id, targetName: answer.name };
  },

  Component({ content, question, answered, onAnswer }) {
    const [value, setValue] = useState('');
    const [active, setActive] = useState(-1);
    const [wasCorrect, setWasCorrect] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
      inputRef.current?.focus();
    }, []);

    const names = content.items.map((i) => i.name);
    const nv = normalize(value);
    const suggestions =
      !answered && nv
        ? names
            .filter((n) => normalize(n).startsWith(nv) && normalize(n) !== nv)
            .slice(0, MAX_SUGGESTIONS)
        : [];

    function grade(text) {
      if (answered || !text.trim()) return;
      const correct = isCloseMatch(text, question.targetName, names);
      setWasCorrect(correct);
      onAnswer(correct);
    }

    function choose(name) {
      setValue(name);
      grade(name);
    }

    function onKeyDown(e) {
      if (!suggestions.length) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => (i + 1) % suggestions.length);
      } else if (e.key === 'Enter' && active >= 0) {
        e.preventDefault();
        choose(suggestions[active]);
      }
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
            onChange={(e) => {
              setValue(e.target.value);
              setActive(-1);
            }}
            onKeyDown={onKeyDown}
            placeholder="Type the state name"
            type="text"
            inputMode="text"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            disabled={answered}
            aria-label="State name"
          />
          {suggestions.length > 0 && (
            <ul className="suggestions" role="listbox">
              {suggestions.map((n, i) => (
                <li key={n} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    className={`suggestion ${i === active ? 'active' : ''}`}
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
