import { useState } from 'react';
import { defaultConfig } from './config';
import LevelSelect from './components/LevelSelect';
import Setup from './components/Setup';
import Session from './components/Session';

export default function App() {
  const [config, setConfig] = useState(defaultConfig);
  const [screen, setScreen] = useState('levels'); // 'levels' | 'setup' | 'play'
  const [level, setLevel] = useState(null); // campaign index, or null for free practice
  const [runId, setRunId] = useState(0); // bump to restart a fresh session

  function startLevel(i) {
    setLevel(i);
    setScreen('play');
    setRunId((r) => r + 1);
  }
  function startFree() {
    setLevel(null);
    setScreen('play');
    setRunId((r) => r + 1);
  }

  return (
    <main className="app">
      {screen === 'levels' && (
        <LevelSelect
          config={config}
          onPlay={startLevel}
          onFreePractice={() => setScreen('setup')}
        />
      )}
      {screen === 'setup' && (
        <Setup
          config={config}
          setConfig={setConfig}
          onStart={startFree}
          onBack={() => setScreen('levels')}
        />
      )}
      {screen === 'play' && (
        <Session
          key={runId}
          config={config}
          level={level}
          onExit={() => setScreen(level != null ? 'levels' : 'setup')}
          onReplay={() => setRunId((r) => r + 1)}
          onNextLevel={() => startLevel(level + 1)}
        />
      )}
    </main>
  );
}
