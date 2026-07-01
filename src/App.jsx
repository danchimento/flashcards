import { useState } from 'react';
import { defaultConfig } from './config';
import { getContentPack } from './content/registry';
import LevelSelect from './components/LevelSelect';
import LevelIntro from './components/LevelIntro';
import Setup from './components/Setup';
import Session from './components/Session';

export default function App() {
  const [config, setConfig] = useState(defaultConfig);
  const [screen, setScreen] = useState('levels'); // 'levels' | 'intro' | 'setup' | 'play'
  const [level, setLevel] = useState(null); // campaign index, or null for free practice
  const [runId, setRunId] = useState(0); // bump to restart a fresh session

  function beginPlay() {
    setScreen('play');
    setRunId((r) => r + 1);
  }

  // Levels that introduce new states get an education phase first; review levels
  // jump straight into play.
  function goToLevel(i) {
    setLevel(i);
    const introduces = getContentPack(config.contentPackId).campaign[i].focus.length > 0;
    if (introduces) setScreen('intro');
    else beginPlay();
  }

  function startFree() {
    setLevel(null);
    beginPlay();
  }

  return (
    <main className="app">
      {screen === 'levels' && (
        <LevelSelect config={config} onPlay={goToLevel} onFreePractice={() => setScreen('setup')} />
      )}
      {screen === 'intro' && (
        <LevelIntro
          config={config}
          level={level}
          onStart={beginPlay}
          onBack={() => setScreen('levels')}
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
          onNextLevel={() => goToLevel(level + 1)}
        />
      )}
    </main>
  );
}
