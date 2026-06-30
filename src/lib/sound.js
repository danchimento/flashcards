// Minimal WebAudio blips for answer feedback. Synthesized (no asset files) and
// only ever triggered by a tap, so mobile autoplay restrictions don't apply.

let ctx = null;
function audio() {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, duration, type = 'sine') {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export const sound = {
  enabled: true,
  correct() {
    if (!this.enabled) return;
    tone(587.33, 0, 0.12); // D5
    tone(880.0, 0.09, 0.16); // A5 — rising = pleasant
  },
  wrong() {
    if (!this.enabled) return;
    tone(196.0, 0, 0.22, 'sawtooth'); // low G3 buzz
  },
  finish() {
    if (!this.enabled) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.1, 0.18)); // C-E-G-C
  },
};
