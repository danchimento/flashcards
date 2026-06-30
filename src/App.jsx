import { useState } from 'react';
import { defaultConfig } from './config';
import Setup from './components/Setup';
import Session from './components/Session';

export default function App() {
  const [config, setConfig] = useState(defaultConfig);
  const [playing, setPlaying] = useState(false);

  return (
    <main className="app">
      {playing ? (
        <Session config={config} onExit={() => setPlaying(false)} />
      ) : (
        <Setup config={config} setConfig={setConfig} onStart={() => setPlaying(true)} />
      )}
    </main>
  );
}
