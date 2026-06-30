// Forgiving answer matching for free-recall typing. Accepts case, spacing, and
// small typos — but never accepts a *different* valid answer as a typo (e.g.
// "Arkansas" must not count as "Kansas"), by requiring the intended answer to
// be the unique closest name within the typo budget.

export function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/[^a-z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Levenshtein edit distance.
export function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

// How many typos to forgive for a given target length.
function budget(target) {
  return target.length >= 7 ? 2 : 1;
}

export function isCloseMatch(input, answer, allNames = []) {
  const na = normalize(input);
  const nb = normalize(answer);
  if (!na) return false;
  if (na === nb) return true;
  // ignore spacing entirely ("newyork" == "new york")
  if (na.replace(/ /g, '') === nb.replace(/ /g, '')) return true;

  const d = editDistance(na, nb);
  if (d > budget(nb)) return false;

  // Reject if any *other* valid name is at least as close — the input is
  // ambiguous (or actually that other state), so don't give the point.
  for (const other of allNames) {
    if (other === answer) continue;
    if (editDistance(na, normalize(other)) <= d) return false;
  }
  return true;
}
