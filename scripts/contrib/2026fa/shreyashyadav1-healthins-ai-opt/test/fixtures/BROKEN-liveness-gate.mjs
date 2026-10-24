// BROKEN-* mutant (CONTRIBUTING: mutants for break attempts live in fixtures/ as BROKEN-*).
// A liveness gate with three defects the real one must not have:
//   1. `uncertain` is read as active,
//   2. evidence is never too old,
//   3. any `record` claim is believed, with or without the repo checker named.
// The property suite in test/liveness-properties.test.mjs must FAIL on this file.
export function livenessGate(l /* , today, maxAgeDays */) {
  if (!l || !l.status || l.status === 'unchecked') return { status: 'missing', reason: 'liveness-unchecked', factor: null };
  const f = { active: 1, uncertain: 1, closed: 0, 'not-found': 0, expired: 0 }[l.status];
  return { status: 'ok', factor: f, source: l.source || 'your-input', checked_on: l.checked_on, method: l.method || null };
}
