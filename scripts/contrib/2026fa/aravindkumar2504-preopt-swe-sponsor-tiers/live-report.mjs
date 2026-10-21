// live-report.mjs: join the live step's evidence and the person's gate decisions into a report for the person and a
// log for an agent (live step L5; the recipe's output contract, two customers).
//
// Reads, from the base run folder: run-log.json (tiers, funding, gates G0 to G3). From the live folder: boards.json,
// selected-postings.json, h1-liveness.json, h2-screen.json and, when the person has decided, gate-decisions.json.
// Nothing is fetched. The rules fail closed: no decision keeps a posting held; a person saying "live" where the
// checker did not keeps it held as a disagreement; only a posting the checker found active AND the named person
// confirmed live AND read no blocker in is cleared.
//
//   node live-report.mjs --run <base run folder> --live <live folder>
//
// Writes <live>/report-live.md (for the person) and <live>/run-log-live.json (for an agent).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256File } from './evidence.mjs';

export const H1_VALUES = { 'confirmed-live': 'live, right company, the job itself shown', 'not-live': 'not live', 'wrong-company': 'a different company', 'not-the-job-page': 'not the job itself (a search or listing page)' };
export const H2_VALUES = { 'no-blocker': 'no blocker read', blocked: 'rules out sponsorship, or needs U.S.-person status or a clearance', unclear: 'unclear wording' };

export class DecisionError extends Error {}

/** Reject a decisions file that names a posting not on the list, or a value outside the allowed words. */
export function validateDecisions(dec, chosenUrls) {
  if (!dec) return null;
  if (typeof dec.decided_by !== 'string' || !dec.decided_by.trim()) throw new DecisionError('gate-decisions.json: decided_by must name the person');
  if (Number.isNaN(Date.parse(dec.decided_at || ''))) throw new DecisionError('gate-decisions.json: decided_at must be a date and time');
  if (!Array.isArray(dec.decisions)) throw new DecisionError('gate-decisions.json: decisions must be a list');
  const seen = new Set();
  for (const d of dec.decisions) {
    if (!chosenUrls.includes(d.url)) throw new DecisionError(`gate-decisions.json: ${d.url} is not one of the chosen postings`);
    if (seen.has(d.url)) throw new DecisionError(`gate-decisions.json: ${d.url} is decided twice`);
    seen.add(d.url);
    if (!(d.h1 in H1_VALUES)) throw new DecisionError(`gate-decisions.json: h1 for ${d.url} must be one of ${Object.keys(H1_VALUES).join(', ')}`);
    if (d.h1 === 'confirmed-live' && !(d.h2 in H2_VALUES)) throw new DecisionError(`gate-decisions.json: h2 for ${d.url} must be one of ${Object.keys(H2_VALUES).join(', ')}`);
  }
  return new Map(dec.decisions.map((d) => [d.url, d]));
}

/** The outcome for one posting, from the checker's verdict and the person's decision (fail closed). */
export function outcome(machine, decision, who) {
  if (!decision) return { status: 'held', reason: 'gates H1 and H2 open: no decision from a person yet' };
  if (decision.h1 === 'confirmed-live' && machine !== 'active') {
    return { status: 'held', reason: `disagreement: the checker said ${machine}, the person said live; check again before applying` };
  }
  if (decision.h1 !== 'confirmed-live') return { status: 'set aside', reason: `H1: ${H1_VALUES[decision.h1]} (per ${who})` };
  if (decision.h2 === 'blocked') return { status: 'set aside', reason: `H2: ${H2_VALUES.blocked} (per ${who})` };
  if (decision.h2 === 'unclear') return { status: 'held', reason: `H2: unclear wording; ask a recruiter before applying (per ${who})` };
  return { status: 'cleared', reason: `the checker found it active and ${who} cleared H1 and H2` };
}

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();

export function build({ runDir, liveDir }) {
  const base = read(path.join(runDir, 'run-log.json'));
  const boards = read(path.join(liveDir, 'boards.json'));
  const selected = read(path.join(liveDir, 'selected-postings.json'));
  const h1 = read(path.join(liveDir, 'h1-liveness.json'));
  const h2 = read(path.join(liveDir, 'h2-screen.json'));
  const decPath = path.join(liveDir, 'gate-decisions.json');
  const decFile = fs.existsSync(decPath) ? read(decPath) : null;
  const chosen = selected.chosen || [];
  const decisions = validateDecisions(decFile, chosen.map((p) => p.url));
  const who = decFile?.decided_by || 'a person';
  const machineBy = new Map(h1.verdicts.map((v) => [v.url, v]));
  const screenBy = new Map(h2.postings.map((p) => [p.url, p]));
  const baseBy = new Map(base.rows.map((r) => [r.company, r]));
  const postings = chosen.map((p) => {
    const m = machineBy.get(p.url) || { recorded_as: 'uncertain', reason: 'no liveness verdict on file' };
    const d = decisions?.get(p.url) || null;
    const b = baseBy.get(p.company);
    const s = screenBy.get(p.url);
    return {
      company: p.company, title: p.title, location: p.location, url: p.url,
      tier: b?.tier ? { tier: b.tier.tier, approvals: b.tier.approvals, rate_pct: b.tier.rate_pct } : null,
      machine_h1: { verdict: m.recorded_as, reason: m.reason || null },
      person_h1: d?.h1 || null, person_h2: d?.h2 || null, person_note: d?.note || null,
      screen: s ? { fetched: s.fetched, quotes: (s.flags || []).map((f) => ({ category: f.category, sentence: f.sentence })), note: s.note || null } : null,
      ...outcome(m.recorded_as, d, who),
    };
  });
  const count = (st) => postings.filter((p) => p.status === st).length;
  const noBoard = boards.companies.filter((c) => !c.hit).map((c) => c.company);
  const withBoard = selected.companies.filter((c) => boards.companies.find((b) => b.company === c.company)?.hit);
  const noPosting = withBoard.filter((c) => !(c.eligible > 0)).map((c) => ({ company: c.company, postings_found: c.postings_found }));
  // The picker takes companies best score first and breaks ties by name, so record whether a company the cap cut tied a chosen one.
  const compositeOf = new Map(boards.companies.map((c) => [c.company, c.composite]));
  const lowestChosen = Math.min(...postings.map((p) => compositeOf.get(p.company) ?? Infinity));
  const pastCap = withBoard.filter((c) => c.eligible > 0 && c.chosen.length === 0).map((c) => ({
    company: c.company, eligible: c.eligible, composite: compositeOf.get(c.company) ?? null,
    approvals: baseBy.get(c.company)?.tier?.approvals ?? null, tied_with_chosen: compositeOf.get(c.company) === lowestChosen,
  }));
  const chosenCompanies = new Set(postings.map((p) => p.company)).size;
  // Every shortlisted company must land in exactly one bucket; a count that does not add up stops the report.
  const accounted = chosenCompanies + noBoard.length + noPosting.length + pastCap.length;
  if (accounted !== boards.shortlisted) {
    throw new Error(`the funnel accounts for ${accounted} companies but ${boards.shortlisted} were shortlisted`);
  }
  const funnel = {
    evaluated: base.summary?.evaluated ?? null,
    shortlisted: boards.shortlisted,
    with_board: boards.with_board,
    postings_scanned: selected.postings_scanned,
    postings_eligible: selected.postings_eligible,
    companies_with_fit: withBoard.filter((c) => c.eligible > 0).length,
    total_cap: selected.params?.max_postings_total ?? null,
    chosen: postings.length,
    checker_active: postings.filter((p) => p.machine_h1.verdict === 'active').length,
    person_confirmed_live: postings.filter((p) => p.person_h1 === 'confirmed-live').length,
    cleared: count('cleared'), held: count('held'), set_aside: count('set aside'),
  };
  const inputs = Object.fromEntries([
    ['base_run_log', path.join(runDir, 'run-log.json')], ['boards', path.join(liveDir, 'boards.json')],
    ['scan_history', path.join(liveDir, 'scan-history.tsv')], ['selected_postings', path.join(liveDir, 'selected-postings.json')],
    ['h1_liveness', path.join(liveDir, 'h1-liveness.json')], ['h2_screen', path.join(liveDir, 'h2-screen.json')],
    ['gate_decisions', decPath],
  ].filter(([, p]) => fs.existsSync(p)).map(([k, p]) => [k, { file: path.basename(p), sha256: sha256File(p) }]));
  return { base, decFile, postings, funnel, noBoard, noPosting, pastCap, inputs, h1 };
}

function reportMarkdown(b) {
  const { base, decFile, postings, funnel: f, noBoard, noPosting, pastCap, h1 } = b;
  const cap = f.total_cap ? `the cap of ${f.total_cap}` : 'the cap';
  const others = [
    [noBoard.length, 'with no board found under the names tried'],
    [noPosting.length, 'with a board but no posting that fits the rules'],
    [pastCap.length, `with a fitting posting that ${cap} left out`],
    [f.set_aside, 'whose chosen posting was set aside'],
    [f.held, 'whose chosen posting is held for a decision'],
  ].filter(([n]) => n > 0).map(([n, s]) => `${n} ${s}`);
  const otherList = others.length > 1 ? `${others.slice(0, -1).join(', ')} and ${others.at(-1)}` : others.join('');
  const g0 = base.gates?.G0_vintage || {};
  const o = [];
  o.push('# Live posting check for the sponsor-tier shortlist', '');
  o.push('## Executive summary', '');
  o.push('This report takes the companies the sponsor-tier shortlist marked as worth a closer look and asks two questions a list of companies cannot answer: is there a real, open backend job at the company today, and does the posting itself shut the candidate out (no sponsorship, U.S. citizens only, a clearance)? A program checks whether each posting is still open and quotes the sentences that matter; a person reads every posting and makes both calls.', '');
  o.push(`Read it before applying: a company with a strong sponsorship record can still have no open role, or a posting that excludes the candidate. Of ${f.shortlisted} shortlisted companies, a job board was found for only ${f.with_board}, on the three job-board systems this check reads, under the names it tried. ${f.chosen} postings were chosen from those, one per company; the program found ${f.checker_active} still open, and ${decFile ? `the person cleared ${f.cleared}, held ${f.held} and set aside ${f.set_aside}. So ${f.cleared} of the ${f.shortlisted} shortlisted companies end the run with a posting that cleared both gates. Of the other ${f.shortlisted - f.cleared}: ${otherList}` : 'no person has decided yet, so every posting is held'}.`, '');
  o.push('## Read this first', '');
  o.push(`- **The company data is old.** Its newest funding date is ${g0.vintage_date || 'unknown'}, ${g0.age_months ?? '?'} months before the run (the mode's limit is ${g0.limit_months ?? '?'}). The run went ahead with this warning (gate G0) because the acceptance flag was given; the base run's log records the flag, not who gave it. The postings themselves were read live from today's job boards.`);
  const start = base.timeline?.dates?.expected_start;
  if (start && base.as_of && start > base.as_of) {
    const months = Math.round((Date.parse(start) - Date.parse(base.as_of)) / (30.44 * 86400000));
    o.push(`- **Start dates were not checked.** The candidate's earliest start is ${esc(start)}, about ${months} months after the run (from the base run's timeline gate), and no gate checks whether an employer will wait that long. Ask before applying.`);
  }
  o.push(`- **Most of the shortlist is out of reach.** ${noBoard.length} of ${f.shortlisted} shortlisted companies have no board on Greenhouse, Lever or Ashby under a name the board finder tried, so this check says nothing about them.`);
  const tied = pastCap.filter((c) => c.tied_with_chosen);
  if (tied.length) {
    o.push(`- **The cap chose among equal scores by name.** ${tied.map((c) => `${esc(c.company)} (${c.approvals ?? '?'} approvals)`).join(', ')} had a fitting posting and the same score as a chosen company, and ${tied.length === 1 ? 'was' : 'were'} left out by alphabetical order, not by evidence, so check ${tied.length === 1 ? 'it' : 'them'} by hand.`);
  }
  o.push('- **The quoted sentences decide nothing.** A posting with no quoted sentence is not a pass; the person read each one.', '');
  o.push('## From the shortlist to a decision', '');
  o.push('| Step | Count |', '|---|---|');
  o.push(`| Companies the base run marked worth a closer look | ${f.shortlisted} |`);
  o.push(`| ...with a job board the scanner can read (a proposal; the person confirms the company) | ${f.with_board} |`);
  o.push(`| Postings the scanner kept from those boards (broad title filter) | ${f.postings_scanned} |`);
  o.push(`| ...that pass the mode's rules (backend family, U.S. location, no senior marker in the title, not contract or PhD-only) | ${f.postings_eligible} |`);
  o.push(`| ...from this many companies | ${f.companies_with_fit} |`);
  o.push(`| Chosen for the gates (one per company, at most ${f.total_cap ?? '?'}) | ${f.chosen} |`);
  o.push(`| Still open, per the liveness checker | ${f.checker_active} |`);
  o.push(`| Confirmed live by the person | ${f.person_confirmed_live} |`);
  o.push(`| Cleared (both gates) / held / set aside | ${f.cleared} / ${f.held} / ${f.set_aside} |`);
  o.push(`| **Shortlisted companies that end the run with a cleared posting** | **${f.cleared} of ${f.shortlisted}** |`, '');
  o.push('## The postings', '');
  o.push('| Company | Sponsor tier (approvals, rate) | Posting | Checker (H1) | Person (H1) | Person (H2) | Quoted sentences | Outcome |', '|---|---|---|---|---|---|---|---|');
  for (const p of postings) {
    const tier = p.tier ? `${p.tier.tier} (${p.tier.approvals}, ${p.tier.rate_pct}%)` : 'not in the base run';
    const quotes = p.screen?.quotes?.length ? p.screen.quotes.map((q) => `${q.category}: "${q.sentence}"`).join('; ') : (p.screen?.fetched ? 'none (not a pass)' : 'text not fetched');
    o.push(`| ${esc(p.company)} | ${esc(tier)} | [${esc(p.title)}](${p.url}) | ${esc(p.machine_h1.verdict + (p.machine_h1.reason ? ` (${p.machine_h1.reason})` : ''))} | ${esc(p.person_h1 ? H1_VALUES[p.person_h1] : 'open')} | ${esc(p.person_h2 ? H2_VALUES[p.person_h2] : (p.person_h1 && p.person_h1 !== 'confirmed-live' ? 'not needed (H1 failed)' : 'open'))} | ${esc(quotes)} | **${p.status}**: ${esc(p.reason)}${p.person_note ? `. Note: ${esc(p.person_note)}` : ''} |`);
  }
  o.push('');
  o.push('## Gates', '');
  o.push('| Gate | Cleared by | Result |', '|---|---|---|');
  o.push(`| G0 data age | ${g0.acknowledged ? 'whoever gave the acceptance flag (the log records the flag, not a name)' : 'no one'} | ${esc(g0.status)} |`);
  o.push(`| G1 persona, G2 scorer integrity, G3 timeline | the program | ${esc(base.gates?.G1_persona?.status)}, ${esc(base.gates?.G2_scorer_integrity?.status)}, ${esc(base.gates?.G3_timeline?.status ?? base.timeline?.status ?? 'see the base report')} |`);
  o.push(`| H1 posting live, machine half | the repository liveness checker | ${h1.summary.active} active, ${h1.summary.expired} expired, ${h1.summary.uncertain} uncertain (checker exit ${h1.checker_exit_code}) |`);
  o.push(`| H1 posting live, person half | ${decFile ? esc(decFile.decided_by) : 'open'} | ${f.person_confirmed_live} of ${f.chosen} confirmed live |`);
  o.push(`| H2 posting eligibility (asked where H1 passed) | ${decFile ? esc(decFile.decided_by) : 'open'} | ${f.cleared} cleared, ${postings.filter((p) => p.person_h2 === 'blocked').length} blocked, ${postings.filter((p) => p.person_h2 === 'unclear').length} unclear |`);
  if (decFile) o.push('', `Decided by ${esc(decFile.decided_by)} at ${esc(decFile.decided_at)}. ${esc(decFile.method || '')}`);
  o.push('');
  o.push('## Companies the live check could not reach', '');
  o.push(`- **No board found (${noBoard.length}):** ${noBoard.map(esc).join(', ') || 'none'}.`);
  o.push(`- **A board, but no posting passed the rules (${noPosting.length}):** ${noPosting.map((c) => `${esc(c.company)} (${c.postings_found} kept by the scanner)`).join(', ') || 'none'}.`);
  o.push(`- **A fitting posting, left out by ${cap} (${pastCap.length}):** ${pastCap.map((c) => `${esc(c.company)} (${c.eligible} passed the rules${c.tied_with_chosen ? `; same score as a chosen company, ${c.composite}, so the cap cut it by name` : ''})`).join(', ') || 'none'}. Companies are taken best score first; ties are broken by name.`, '');
  o.push('## What this run can and cannot verify', '');
  o.push('- **Can:** that each chosen posting answered the liveness checker at the time shown; which sentences in its text mention sponsorship, citizenship, clearance, authorization, degree level, dates or contract terms; and what the named person decided after reading it.');
  o.push('- **Cannot:** that a company will sponsor this candidate (the record is company-wide history); that a posting is still open after the check; whether an employer will wait until the candidate can start; that the board found by name belongs to the company (the person checked it for each live posting); anything about companies without a readable board; whether the candidate fits the job (fit is not scored).', '');
  o.push('## Run record', '');
  o.push(`- **Base run:** ${esc(base.recipe)} v${esc(base.recipe_version)}, as of ${esc(base.as_of)}.`);
  o.push(`- **Liveness checker:** \`${esc(h1.checker)}\` (SHA-256 ${h1.checker_sha256.slice(0, 12)}), run ${esc(h1.started_at)} to ${esc(h1.finished_at)}.`);
  o.push(`- **Inputs (SHA-256, first 12):** ${Object.entries(b.inputs).map(([k, v]) => `${k} ${v.sha256.slice(0, 12)}`).join('; ')}.`);
  o.push('- **Labels:** sponsor tier, liveness verdict, posting text and quotes are record; the board-to-company match is a model-judgment label (a name rule; the person confirmed the company for each posting that was live); the posting rules and the quote categories are your-input rules; the gate decisions are the named person\'s; no model was asked to judge any company.');
  return o.join('\n') + '\n';
}

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--run') a.runDir = argv[++i];
    else if (argv[i] === '--live') a.liveDir = argv[++i];
    else throw new Error(`unknown argument ${argv[i]}`);
  }
  if (!a.runDir || !a.liveDir) throw new Error('usage: live-report.mjs --run <base run folder> --live <live folder>');
  return a;
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  const b = build(a);
  fs.writeFileSync(path.join(a.liveDir, 'report-live.md'), reportMarkdown(b));
  fs.writeFileSync(path.join(a.liveDir, 'run-log-live.json'), JSON.stringify({
    _about: 'Agent log of the live step. Per posting: tier and checker verdict are record; person_h1/person_h2 are the named person\'s gate decisions; status follows the fail-closed rules in live-report.mjs.',
    generated: new Date().toISOString(),
    decided_by: b.decFile?.decided_by || null, decided_at: b.decFile?.decided_at || null,
    inputs: b.inputs, funnel: b.funnel, postings: b.postings,
    unreachable: { no_board: b.noBoard, no_eligible_posting: b.noPosting, past_total_cap: b.pastCap },
  }, null, 2) + '\n');
  const f = b.funnel;
  console.log(`live report: ${f.chosen} postings; checker active ${f.checker_active}; cleared ${f.cleared}, held ${f.held}, set aside ${f.set_aside}${b.decFile ? '' : ' (no person has decided yet: all held)'}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (err) { console.error(`live-report: ${err.message}`); process.exit(2); }
}
