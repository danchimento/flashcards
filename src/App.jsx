import { useState } from 'react';
import { defaultConfig } from './config';
import Setup from './components/Setup';
import Session from './components/Session';

export default function App() {
  const [config, setConfig] = useState(defaultConfig);
  const [playing, setPlaying] = useState(false);
  const [runId, setRunId] = useState(0); // bump to restart a fresh session

  return (
    <main className="app">
      {playing ? (
        <Session
          key={runId}
          config={config}
          onExit={() => setPlaying(false)}
          onReplay={() => setRunId((r) => r + 1)}
        />
      ) : (
        <Setup config={config} setConfig={setConfig} onStart={() => setPlaying(true)} />
      )}
    </main>
  );
}
