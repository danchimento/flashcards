import { useState } from 'react';
import UsMap from '../components/UsMap';

// "Locate": given a state name, click it on the map.
export const locateState = {
  id: 'locate-state',
  label: 'Find the state on the map',

  generate({ content, rng, target }) {
    const answer = target ?? rng.pick(content.items);
    return { targetId: answer.id, targetName: answer.name };
  },

  Component({ content, question, answered, onAnswer }) {
    const [selected, setSelected] = useState(null);

    const nameOf = (id) => content.map.shapes.find((s) => s.id === id)?.name ?? 'that area';

    function pick(id) {
      if (answered) return;
      setSelected(id);
      onAnswer(id === question.targetId);
    }

    return (
      <div className="question locate">
        <p className="prompt">
          Find <strong>{question.targetName}</strong> on the map
        </p>
        <UsMap
          map={content.map}
          interactive
          revealed={answered}
          selectedId={selected}
          correctId={question.targetId}
          onSelect={pick}
        />
        {answered && selected !== question.targetId && (
          <p className="hint">
            You picked <strong>{nameOf(selected)}</strong> — it's{' '}
            <strong>{question.targetName}</strong> (highlighted).
          </p>
        )}
      </div>
    );
  },
};
