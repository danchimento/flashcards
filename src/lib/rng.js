// Tiny random helper. Wrapped so the source of randomness can be swapped
// later (e.g. for a seeded/repeatable session) without touching callers.
export function createRng(next = Math.random) {
  const rng = {
    next,
    // random integer in [0, n)
    int: (n) => Math.floor(next() * n),
    // pick one element
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    // Fisher–Yates shuffle (returns a new array)
    shuffle: (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    // pick `count` distinct elements
    sample: (arr, count) => rng.shuffle(arr).slice(0, count),
  };
  return rng;
}
