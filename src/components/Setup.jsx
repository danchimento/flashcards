import { QUESTION_COUNT_OPTIONS } from '../config';
import { questionTypeList } from '../questions/registry';

export default function Setup({ config, setConfig, onStart }) {
  function toggleType(id) {
    setConfig((c) => {
      const on = c.enabledTypeIds.includes(id);
      // keep at least one type enabled
      const next = on ? c.enabledTypeIds.filter((t) => t !== id) : [...c.enabledTypeIds, id];
      return { ...c, enabledTypeIds: next.length ? next : c.enabledTypeIds };
    });
  }

  return (
    <div className="screen setup">
      <h1>Geography</h1>
      <p className="subtitle">Learn the U.S. states.</p>

      <section className="setting">
        <h2>States per lesson</h2>
        <div className="count-options">
          {QUESTION_COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              className={config.questionCount === n ? 'count selected' : 'count'}
              onClick={() => setConfig((c) => ({ ...c, questionCount: n }))}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      <section className="setting">
        <h2>Question styles</h2>
        <div className="type-options">
          {questionTypeList.map((t) => (
            <label key={t.id} className="type-toggle">
              <input
                type="checkbox"
                checked={config.enabledTypeIds.includes(t.id)}
                onChange={() => toggleType(t.id)}
              />
              {t.label}
            </label>
          ))}
        </div>
      </section>

      <button className="primary start" onClick={onStart}>
        Start session
      </button>
    </div>
  );
}
