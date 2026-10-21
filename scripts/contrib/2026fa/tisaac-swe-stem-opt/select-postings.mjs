import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import greenhouse from '../../../ats/providers/greenhouse.mjs';
import { makeHttpCtx } from '../../../ats/providers/_http.mjs';

// select-postings.mjs — pick the postings this mode evaluates, with a written reason
// for every posting it drops. Network: boards-api.greenhouse.io only (via the repo's
// Greenhouse provider). Rules come from scope.json (the student's own scope).
//
// Usage (from repo root):
//   node scripts/contrib/2026fa/tisaac-swe-stem-opt/select-postings.mjs [--scope <scope.json>] [--date YYYY-MM-DD]
//        [--from-snapshot <dir>] [--out-dir <dir>]
// Writes, into --out-dir (default: next to this file):
//   postings-<date>/<board>.raw.json   every posting the board listed (snapshot; live mode only)
//   jobs-<date>.json                   the selected postings (input to collect-liveness / index.js)
//   postings-<date>-audit.md           every posting: kept or dropped, and why
// --from-snapshot re-runs the filter on saved <board>.raw.json files, with no network,
// so the same snapshot and scope always give the same selection.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../../');
const args = process.argv.slice(2);
function argValue(flag, fallback) {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}
const scope = JSON.parse(fs.readFileSync(path.resolve(argValue('--scope', path.join(__dirname, 'scope.json'))), 'utf-8'));
const DATE = argValue('--date', new Date().toISOString().slice(0, 10));
const FROM_SNAPSHOT = argValue('--from-snapshot', null) && path.resolve(argValue('--from-snapshot'));
const OUT_DIR = path.resolve(argValue('--out-dir', __dirname));
const SNAP_DIR = FROM_SNAPSHOT || path.join(OUT_DIR, `postings-${DATE}`);
const JOBS_PATH = path.join(OUT_DIR, `jobs-${DATE}.json`);
const AUDIT_PATH = path.join(OUT_DIR, `postings-${DATE}-audit.md`);
const rel = (p) => path.relative(REPO_ROOT, p);

const anyOf = (patterns) => new RegExp(patterns.join('|'), 'i');
const INCLUDE = anyOf(scope.include_title);
const SPECIALIST = anyOf(scope.exclude_specialist);
const LEVEL = anyOf(scope.exclude_level);
const US = new RegExp(scope.us_location.join('|'));   // case-sensitive: state codes are upper case

// Titles on real boards carry double spaces and odd dashes; match on a normalized copy.
const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
const jobIdOf = (url) => (url.match(/gh_jid=(\d+)/) || url.match(/\/jobs\/(\d+)/) || [])[1] || null;

function decide(job) {
    const title = norm(job.title);
    const m = (re) => (title.match(re) || [])[0];
    if (m(LEVEL)) return { keep: false, reason: `level: "${m(LEVEL)}"` };
    if (m(SPECIALIST)) return { keep: false, reason: `specialist role: "${m(SPECIALIST)}"` };
    if (!m(INCLUDE)) return { keep: false, reason: 'title outside the SWE scope' };
    // Location last, so every location drop in the audit is an in-scope SWE title a person can eyeball.
    const loc = norm(job.location);
    if (!US.test(loc)) {
        // "Remote" with no country is unknown, not foreign — say so in the audit.
        return { keep: false, reason: /^(remote)?$/i.test(loc) ? 'location unclear (no country stated)' : 'location not in the US' };
    }
    return { keep: true, reason: `in scope: "${m(INCLUDE)}"` };
}

// Live: fetch the board and save a snapshot. Snapshot: read the saved file, no network.
async function loadBoard(board) {
    if (FROM_SNAPSHOT) {
        const file = path.join(FROM_SNAPSHOT, `${board}.raw.json`);
        if (!fs.existsSync(file)) { console.error(`❌ snapshot missing: ${file}`); process.exit(1); }
        const snap = JSON.parse(fs.readFileSync(file, 'utf-8'));
        return { name: snap.name, listed: snap.jobs, fetched_at: snap.fetched_at };
    }
    const ctx = makeHttpCtx();
    const meta = await ctx.fetchJson(`https://boards-api.greenhouse.io/v1/boards/${board}`, { redirect: 'error' });
    const listed = await greenhouse.fetch({ name: board, careers_url: `https://job-boards.greenhouse.io/${board}` }, ctx);
    const fetched_at = new Date().toISOString();
    fs.writeFileSync(path.join(SNAP_DIR, `${board}.raw.json`), JSON.stringify({ fetched_at, board, name: meta.name, jobs: listed }, null, 2) + '\n');
    return { name: meta.name, listed, fetched_at };
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(SNAP_DIR, { recursive: true });
const selected = [];
const audit = [];
const fetchedAt = {};
for (const board of scope.boards) {
    const { name, listed, fetched_at } = await loadBoard(board);
    const meta = { name };
    fetchedAt[board] = fetched_at;
    let kept = 0;
    for (const job of listed) {
        const d = decide(job);
        audit.push({ board, title: norm(job.title), location: norm(job.location), ...d });
        if (!d.keep) continue;
        kept++;
        const id = jobIdOf(job.url);
        const entry = { id: `${board}-${id}`, company: meta.name };
        if (scope.csv_name[board]) entry.csv_name = scope.csv_name[board];
        Object.assign(entry, {
            title: norm(job.title), location: norm(job.location), url: job.url,
            greenhouse_board: board, greenhouse_job_id: id,
            fit: scope.defaults.fit, timeline: scope.defaults.timeline
        });
        selected.push(entry);
    }
    console.log(`board ${board} (${meta.name}): ${listed.length} listed → ${kept} selected`);
}
for (const b of scope.break_jobs) {
    selected.push({
        id: b.id, company: selected.find(j => j.greenhouse_board === b.board)?.company || b.board,
        ...(scope.csv_name[b.board] ? { csv_name: scope.csv_name[b.board] } : {}),
        title: b.title, location: '', url: b.url,
        greenhouse_board: b.board, greenhouse_job_id: b.greenhouse_job_id,
        fit: scope.defaults.fit, timeline: scope.defaults.timeline
    });
}
fs.writeFileSync(JOBS_PATH, JSON.stringify(selected, null, 2) + '\n');

// Audit: a report for human judgment, not a pass/fail.
const by = (k) => audit.reduce((acc, a) => ((acc[a[k]] = (acc[a[k]] || 0) + 1), acc), {});
const md = [`# Posting selection audit — ${DATE}`, '',
    '## Executive summary', '',
    `This lists every posting found on ${scope.boards.length} company job boards and says, for each one, whether this mode kept it and why. ` +
    `Read it to check that the filter did not drop a job it should have kept. ${audit.length} postings were found and ${audit.filter(a => a.keep).length} kept; ` +
    `${scope.break_jobs.length} deliberately broken link(s) were added for testing.`, '',
    '## Source', '',
    `Mode: ${FROM_SNAPSHOT ? `re-run from snapshot \`${rel(FROM_SNAPSHOT)}\` (no network)` : 'live fetch from boards-api.greenhouse.io'}.`, '',
    '| Board | Fetched at | Listed | Kept | Dropped |', '|---|---|---|---|---|',
    ...scope.boards.map(b => {
        const rows = audit.filter(a => a.board === b), kept = rows.filter(a => a.keep).length;
        return `| ${b} | ${fetchedAt[b]} | ${rows.length} | ${kept} | ${rows.length - kept} |`;
    }), '',
    '## Counts', '', '| Reason | Postings |', '|---|---|',
    ...Object.entries(by('reason')).sort((a, b) => b[1] - a[1]).map(([r, n]) => `| ${r} | ${n} |`), '',
    '## Every posting', '', '| Board | Title | Location | Kept | Reason |', '|---|---|---|---|---|',
    ...audit.map(a => `| ${a.board} | ${a.title.replace(/\|/g, '/')} | ${a.location.replace(/\|/g, '/')} | ${a.keep ? '**yes**' : 'no'} | ${a.reason} |`), '',
    `Rules: \`${rel(path.join(__dirname, 'scope.json'))}\` (your-input). Snapshots: \`${rel(SNAP_DIR)}/\`.`, ''];
fs.writeFileSync(AUDIT_PATH, md.join('\n'));
console.log(`✅ ${selected.length} jobs (incl. ${scope.break_jobs.length} break) → ${rel(JOBS_PATH)}`);
console.log(`✅ audit → ${rel(AUDIT_PATH)}`);
