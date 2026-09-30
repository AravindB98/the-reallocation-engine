// scorer-bridge.mjs: hand the evidence to the repo's scorer, then check what it says back.
//
// The scorer (scripts/score/role-scorer.mjs) is not re-implemented here: it is run as a
// command, exactly as `npm run score` runs it. What this file adds is a guard, because two
// behaviours of the scorer can silently change a decision:
//
//   1. It decides whether the candidate needs sponsorship by matching free text with a loose
//      pattern (words such as "authorized" count as "no sponsorship needed") and it ignores
//      an explicit needs_sponsorship field. For a student who does need sponsorship that
//      zeroes the sponsorship weight, and a proven sponsor drops from Apply to Skip.
//   2. A gate value that is missing is treated as 1.0 (open) and labelled "record".
//
// So this file (a) writes the scorer profile from the persona's explicit boolean, in wording
// the scorer's pattern reads correctly, (b) always supplies both gate values with an honest
// label, and (c) after the run, refuses to continue if the scorer's own output disagrees.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export class IntegrityError extends Error {
  constructor(message, problems = []) {
    super(message);
    this.name = 'IntegrityError';
    this.problems = problems;
  }
}

export class ScorerError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ScorerError';
  }
}

/** The one field the scorer reads from a profile is free text; keep it plain and unambiguous. */
export function buildScorerProfile(persona) {
  return { authorization: persona.needs_sponsorship ? 'F-1 student; requires H-1B sponsorship' : 'no sponsorship needed' };
}

/** One role record in the shape of data/examples/ch11-roles.json. There is deliberately no fit term. */
export function buildRole(candidate, timeline) {
  return {
    role_id: candidate.role_id,
    company: candidate.company,
    title: `${candidate.matched_titles[0]} (historically sponsored; not a live posting)`,
    sponsorship: { p: candidate.tier.p, tier: candidate.tier.tier, source: 'record', note: 'tier derived from the reported counts; p is a fixed number per tier (not a probability)' },
    liveness: { factor: 1, source: 'your-input', note: 'UNCHECKED placeholder: assumed open until a person clears gate H1' },
    timeline: { factor: timeline.factor, source: 'your-input' },
  };
}

/** Run the scorer as a command and return what it printed. Never imports or copies it. */
export function runScorer({ repoRoot, rolesPath, profilePath, outDir, scorerPath }) {
  // scorerPath exists only so break tests can swap in a deliberately wrong stand-in (fixtures/BROKEN-*);
  // a normal run always uses the repository's own scorer.
  const scorer = scorerPath ?? path.join(repoRoot, 'scripts', 'score', 'role-scorer.mjs');
  if (!fs.existsSync(scorer)) throw new ScorerError(`scorer not found at ${scorer}`);
  const args = [scorer, rolesPath, '--profile', profilePath, '--out-dir', outDir];
  try {
    const stdout = execFileSync(process.execPath, args, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { args, stdout };
  } catch (e) {
    const detail = String(e.stderr || e.message).trim().split('\n').slice(0, 4).join(' | ');
    throw new ScorerError(`the scorer exited with code ${e.status ?? 'unknown'}: ${detail}`);
  }
}

/** Check the scorer's answer against what this run sent. Throws IntegrityError listing every problem. */
export function assertScorerIntegrity({ persona, scorerJson, sentRoles }) {
  const problems = [];
  if (scorerJson.profile_needs_sponsorship !== persona.needs_sponsorship) {
    problems.push(`the scorer reported profile_needs_sponsorship=${scorerJson.profile_needs_sponsorship} but the persona says ${persona.needs_sponsorship} (known scorer defect: its authorization parser reads words such as "authorized" as "no sponsorship needed" and ignores a needs_sponsorship field)`);
  }
  const returned = new Map();
  for (const r of scorerJson.roles || []) {
    if (returned.has(r.role_id)) problems.push(`the scorer returned role_id ${r.role_id} twice`);
    returned.set(r.role_id, r);
  }
  if (returned.size !== sentRoles.length) problems.push(`the scorer returned ${returned.size} roles but ${sentRoles.length} were sent`);
  const roleProblems = [];
  for (const sent of sentRoles) {
    const got = returned.get(sent.role_id);
    if (!got) { roleProblems.push(`${sent.role_id}: missing from the scorer output`); continue; }
    const gate = (name) => got.trace?.gates?.find((g) => g.factor === name);
    for (const name of ['liveness', 'timeline']) {
      const g = gate(name);
      if (!g || g.source !== 'your-input') roleProblems.push(`${sent.role_id}: ${name} gate labelled ${g ? JSON.stringify(g.source) : 'absent'}, expected "your-input" (a placeholder or an input must not read as a record)`);
    }
    if (got.override) roleProblems.push(`${sent.role_id}: an override appeared that this run never supplied`);
  }
  problems.push(...roleProblems.slice(0, 5));
  if (roleProblems.length > 5) problems.push(`... and ${roleProblems.length - 5} more role-level problems`);
  if (problems.length) throw new IntegrityError(`scorer integrity check failed (${problems.length} problem${problems.length === 1 ? '' : 's'})`, problems);
  return returned;
}
