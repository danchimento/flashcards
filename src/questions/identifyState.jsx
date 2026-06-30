import { useState } from 'react';
import UsMap from '../components/UsMap';

// "Identify": a state is highlighted on the map; choose its name.
export const identifyState = {
  id: 'identify-state',
  label: 'Name the highlighted state',

  generate({ content, rng }) {
    const target = rng.pick(content.items);
    const distractors = rng.sample(
      content.items.filter((i) => i.id !== target.id),
      3,
    );
    const choices = rng.shuffle([target, ...distractors]);
    return { targetId: target.id, targetName: target.name, choices };
  },

  Component({ content, question, answered, onAnswer }) {
    const [selected, setSelected] = useState(null);

    function choose(choice) {
      if (answered) return;
      setSelected(choice.id);
      onAnswer(choice.id === question.targetId);
    }

    return (
      <div className="question identify">
        <p className="prompt">Which state is highlighted?</p>
        <UsMap map={content.map} highlightId={question.targetId} />
        <div className="choices">
          {question.choices.map((choice) => {
            const classes = ['choice'];
            if (answered) {
              if (choice.id === question.targetId) classes.push('correct');
              else if (choice.id === selected) classes.push('wrong');
            }
            return (
              <button
                key={choice.id}
                className={classes.join(' ')}
                onClick={() => choose(choice)}
                disabled={answered}
              >
                {choice.name}
              </button>
            );
          })}
        </div>
      </div>
    );
  },
};
