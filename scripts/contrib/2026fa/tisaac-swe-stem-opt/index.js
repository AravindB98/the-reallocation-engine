import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usage (from repo root):
//   node scripts/contrib/2026fa/tisaac-swe-stem-opt/index.js --fixture <jobs.json> --liveness <liveness.json> --out-dir <dir>
// <jobs.json> comes from select-postings.mjs, <liveness.json> from collect-liveness.mjs.
const args = process.argv.slice(2);
function argValue(flag, fallback) {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] ? path.resolve(args[i + 1]) : fallback;
}

// Paths
const FIXTURE_PATH = argValue('--fixture', null);
const LIVENESS_PATH = argValue('--liveness', null);
const OUT_DIR = argValue('--out-dir', null);
const OUTPUT_JSON_PATH = path.join(OUT_DIR, 'my-roles.json');
const RUN_JSON_PATH = path.join(OUT_DIR, 'mode-run.json');
const REPORT_MD_PATH = path.join(OUT_DIR, 'mode-report.md');
const REPO_ROOT = path.resolve(__dirname, '../../../../');
const CSV_PATH = path.join(REPO_ROOT, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv');
const SCORER_PATH = path.join(REPO_ROOT, 'scripts/score/role-scorer.mjs');

// System-level failure: stop the whole run, never write a partial output.
function halt(message) {
    console.error(`❌ ${message}`);
    process.exit(1);
}
const rel = (p) => path.relative(REPO_ROOT, p);

console.log("🚀 Starting SWE STEM-OPT Prototype...");

for (const [flag, value] of [['--fixture', FIXTURE_PATH], ['--liveness', LIVENESS_PATH], ['--out-dir', OUT_DIR]]) {
    if (!value) halt(`Missing ${flag} — this mode never guesses liveness and never writes over a default folder.`);
}

// 1. Read Fixture
if (!fs.existsSync(FIXTURE_PATH)) halt(`Fixture not found: ${FIXTURE_PATH}`);
const jobs = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf-8'));
console.log(`Loaded ${jobs.length} test jobs from ${rel(FIXTURE_PATH)}.`);

// Every job must carry the person's own inputs; a missing value is never filled in.
for (const job of jobs) {
    for (const field of ['id', 'company', 'title', 'url', 'fit', 'timeline']) {
        if (job[field] === undefined || job[field] === null || job[field] === '') {
            halt(`Job ${job.id ?? '(no id)'} is missing "${field}" in the fixture — refusing to invent a value.`);
        }
    }
}

// Liveness evidence
if (!fs.existsSync(LIVENESS_PATH)) halt(`Liveness evidence not found: ${LIVENESS_PATH}`);
const liveness = JSON.parse(fs.readFileSync(LIVENESS_PATH, 'utf-8'));
console.log(`Liveness evidence: ${rel(LIVENESS_PATH)} (checked ${liveness.checked_at}).`);

// 2. Read Real Repo CSV Data
if (!fs.existsSync(CSV_PATH)) halt(`Sponsorship CSV not found: ${CSV_PATH}`);
const csvData = fs.readFileSync(CSV_PATH, 'utf-8');
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const obj = {};
        headers.forEach((h, i) => obj[h] = values[i] ? values[i].replace(/^"|"$/g, '') : '');
        return obj;
    });
}
const records = parseCSV(csvData);

// Create a lookup map for faster searching
const companyMap = new Map();
records.forEach(row => {
    companyMap.set(row.company_name.trim().toUpperCase(), row);
});

// Liveness gate from the evidence file. Returns a gate, or a reason to hold the role.
function livenessFromEvidence(job) {
    const e = liveness.results.find(r => r.id === job.id);
    if (!e) return { hold: 'no liveness evidence for this job' };
    if (e.board_listed === false) {
        return { gate: { "factor": 0.0, "source": "record", "detail": "job id not on the Greenhouse board" } };
    }
    if (e.board_listed === null) return { hold: 'no Greenhouse board signal (board missing or fetch failed)' };
    if (e.browser_result !== 'active') {
        return { hold: `signals disagree: listed on the board, but the page check says "${e.browser_result}"` };
    }
    return { gate: { "factor": 1.0, "source": "record", "detail": "listed on the Greenhouse board and page check active" } };
}

// 3. Process each job based on Recipe logic
const noMatched = [];
const held = [];
const evaluatedRoles = [];
for (const job of jobs) {
    const roleId = job.id;
    // csv_name is a person's own name resolution (posting name → legal name in the CSV).
    const lookupName = (job.csv_name || job.company).trim().toUpperCase();

    // Evaluate Data Layer (H-1B / Funding)
    let sponsorship;
    if (companyMap.has(lookupName)) {
        const data = companyMap.get(lookupName);
        const matchedOn = job.csv_name ? "csv_name (your-input)" : "posting company name";
        if (data['Total Approvals'] && parseInt(data['Total Approvals']) > 0) {
            // Bonus points for H1B history
            sponsorship = { "p": 0.8, "tier": "h1b-history", "source": "record", "matched_on": matchedOn };
        } else if (data['total_funding'] && parseFloat(data['total_funding']) > 0) {
            // Bonus points for recent funding (Proxy for no freeze)
            sponsorship = { "p": 0.4, "tier": "form-d-funding", "source": "record", "matched_on": matchedOn };
        } else {
            // Found in the CSV, and the record shows neither signal.
            sponsorship = { "p": 0.0, "tier": "none", "source": "record", "matched_on": matchedOn };
        }
    } else {
        // Not in the CSV: 0 is this persona's rule ("not a deduction if missing"), not a record.
        sponsorship = { "p": 0.0, "tier": "no-matched", "source": "your-input" };
        if (!noMatched.includes(job.company)) noMatched.push(job.company);
    }

    // Evaluate Liveness
    const l = livenessFromEvidence(job);
    if (l.hold) {
        // Stop condition: refuse to score rather than guess.
        held.push({ role_id: roleId, company: job.company, title: job.title, url: job.url, reason: l.hold });
        console.warn(`[HOLD] Job ${roleId} not scored: ${l.hold}`);
        continue;
    }
    const livenessGate = l.gate;

    // Format output matching scorer schema
    evaluatedRoles.push({
        "role_id": roleId,
        "company": job.company,
        "title": job.title,
        "sponsorship": sponsorship,
        "fit": { "p": job.fit, "source": "your-input" },
        "liveness": livenessGate,
        "timeline": { "factor": job.timeline, "source": "your-input" }
    });
}

if (noMatched.length > 0) {
    console.log(`[no-matched] Not found in the 80-days CSV (sponsorship 0, labeled your-input): ${noMatched.join(', ')}`);
}

// 4. Save output
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(evaluatedRoles, null, 2));
console.log(`✅ Saved evidence tagged output to ${rel(OUTPUT_JSON_PATH)}`);

// 5. Run the Professor's Engine
let scored = [];
if (evaluatedRoles.length > 0) {
    try {
        console.log("⚙️ Calling role-scorer.mjs...");
        execFileSync('node', [SCORER_PATH, OUTPUT_JSON_PATH, '--out-dir', OUT_DIR], { cwd: REPO_ROOT, stdio: 'inherit' });
        scored = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'role-scores.json'), 'utf-8')).roles;
    } catch (error) {
        halt(`Scorer failed: ${error.message}`);
    }
}

// 6. Mode outputs: JSON log for the agent, Markdown report for the person
const counts = { evaluated: jobs.length, scored: scored.length, held: held.length };
for (const r of scored) counts[r.recommendation] = (counts[r.recommendation] || 0) + 1;
fs.writeFileSync(RUN_JSON_PATH, JSON.stringify({
    mode: 'case-swe-stem-opt-runway',
    run_at: new Date().toISOString(),
    inputs: { fixture: rel(FIXTURE_PATH), liveness: rel(LIVENESS_PATH), csv: rel(CSV_PATH) },
    counts,
    held,
    no_matched: noMatched,
    scored: scored.map(r => ({ role_id: r.role_id, recommendation: r.recommendation, composite: r.composite, reason: r.reason }))
}, null, 2) + '\n');

const md = [];
md.push('# SWE STEM-OPT Runway — run report', '');
md.push(`**${counts.evaluated} postings checked → ${counts.Apply || 0} Apply · ${counts.Consider || 0} Consider · ${counts.Skip || 0} Skip · ${counts.held} held (not scored).**`, '');
md.push('## Scored', '');
md.push('| Posting | Recommendation | Composite | Why | Liveness | Sponsorship |', '|---|---|---|---|---|---|');
for (const r of scored) {
    const role = evaluatedRoles.find(x => x.role_id === r.role_id);
    md.push(`| ${r.company} — ${r.title} | **${r.recommendation}** | ${r.composite.toFixed(3)} | ${r.reason} | ${role.liveness.factor} [${role.liveness.source}] | ${role.sponsorship.p} ${role.sponsorship.tier} [${role.sponsorship.source}] |`);
}
md.push('', '## Held — the mode refused to score these', '');
if (held.length === 0) md.push('None.');
else {
    md.push('| Posting | Reason | What a person must check |', '|---|---|---|');
    for (const h of held) md.push(`| ${h.company} — ${h.title} | ${h.reason} | open ${h.url} and decide |`);
}
md.push('', '## Not found in the sponsorship file', '');
md.push(noMatched.length ? `${noMatched.join(', ')} — check the legal name by hand before trusting the 0.` : 'None.');
md.push('', '## Gates you still have to clear before applying', '');
md.push('- **Visa timeline:** `timeline` is your own input — confirm your OPT dates against the start date.');
md.push('- **International-student ban:** read the JD for "US citizens only", "no sponsorship", or clearance requirements.');
md.push('- **Excluded titles:** skip Data / ML-specialist roles.');
md.push('', `Full scorer audit: \`${rel(path.join(OUT_DIR, 'role-scores.md'))}\`.`, '');
fs.writeFileSync(REPORT_MD_PATH, md.join('\n'));
console.log(`✅ Wrote ${rel(RUN_JSON_PATH)} + ${rel(REPORT_MD_PATH)}`);
console.log("🎉 Run complete!");
