// report.mjs: turn a finished run into the two outputs the recipe promises.
//   run-log.json  for the agent: every input hash, parameter, gate, row and label.
//   report.md     for the person: plain-language summary first, then the evidence.
//
// Nothing here reads the clock or the environment, so the same inputs always produce the
// same bytes.

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const money = (n) => (n === null || n === undefined ? 'n/a' : `$${Math.round(n).toLocaleString('en-US')}`);
const pct = (n) => (n === null || n === undefined ? 'n/a' : `${n}%`);
const round1 = (x) => Math.round(x * 10) / 10;

export const NEXT_ACTION = {
  Apply: 'Find a live backend posting, run the liveness check (gate H1) and read the posting for eligibility traps (gate H2). Only if both clear does this earn a tailored application.',
  Consider: 'Do not tailor yet. Use the networking block: ask a recruiter or engineer whether the company sponsors backend hires, then decide.',
  Skip: 'Set aside for now. The reason is in the Why column; the evidence stays in the run log if you want to revisit.',
  hold_unknown: 'The data is silent, not negative. Look for a direct signal (careers-page wording, a recent hire\'s post, a question to a recruiter) before spending any tailoring time.',
  hold_role_unverified: 'The company has sponsored other kinds of roles. Check whether it sponsors backend titles (its listed titles are in the run log) before deciding.',
  hold_data_problem: 'The record could not be read cleanly. Fix or check the data row by hand; nothing was scored.',
  not_found: 'Not in this dataset. Check the spelling; if it is right, the dataset cannot say anything about this company.',
  ambiguous: 'More than one dataset row shares this name after normalization. Pick the right entity by hand before using any number.',
};

export const LABELS = {
  company_name: 'record', approvals: 'record', denials: 'record', approval_rate_pct: 'record (arithmetic on two record values)',
  sponsored_titles: 'record', matched_titles: 'record matched by an author-defined rule', tier: 'record (rule-derived; thresholds are your-input)',
  latest_funding_date: 'record', latest_funding_stage: 'record', latest_funding_amount: 'record', months_before_vintage: 'record (arithmetic)',
  median_salary_offered: 'record', oews_median_wage: 'record', wage_ratio: 'record (arithmetic on two records)',
  form_d_first_sale: 'record', form_d_offering: 'record',
  timeline_factor: 'your-input', liveness_factor: 'your-input (unchecked placeholder)', sponsorship_p: 'record (tier mapped to the chapter 11 example value)',
  composite: 'record (computed by the repo scorer from labelled terms)', recommendation: 'record (repo scorer output)',
  model_judgment_values: 'none produced by this prototype',
};

export function orderRows(rows) {
  const rank = { Apply: 0, Consider: 1, Skip: 2 };
  return [...rows].sort((a, b) =>
    (a.origin === b.origin ? 0 : a.origin === 'watchlist' ? -1 : 1)
    || (rank[a.scorer?.recommendation] ?? 9) - (rank[b.scorer?.recommendation] ?? 9)
    || (b.scorer?.composite ?? -1) - (a.scorer?.composite ?? -1)
    || (a.funding?.months_before_vintage ?? 1e9) - (b.funding?.months_before_vintage ?? 1e9)
    || (b.sponsorship?.approvals ?? -1) - (a.sponsorship?.approvals ?? -1)
    || cmp(a.company, b.company));
}

export function bucketOf(row) {
  if (row.bucket) return row.bucket;
  const rec = row.scorer?.recommendation;
  return rec === 'Skip' ? 'skip' : 'advance';
}

export function renderRunLog(run) {
  return `${JSON.stringify(run, null, 2)}\n`;
}

function rowLine(r, cols) {
  const s = r.sponsorship || {};
  const titles = (r.titles?.matched || []).slice(0, 2).join('; ');
  const cells = {
    company: esc(r.company),
    origin: r.origin,
    tier: r.tier?.tier ?? '',
    counts: s.approvals === undefined ? '' : `${s.approvals} / ${s.denials} (${pct(r.tier?.rate_pct)})`,
    titles: esc(titles),
    level: r.level_note ? esc(r.level_note.replace(/-/g, ' ')) : '',
    raise: r.funding?.date ? `${r.funding.date}${r.funding.stage ? ` ${esc(r.funding.stage)}` : ''}` : 'none recorded',
    wage: r.wage?.status === 'ok' ? `${r.wage.ratio}x (${money(r.wage.offered)})` : `missing: ${r.wage?.reason ?? 'n/a'}`,
    formd: esc(r.form_d_check ?? 'no sample record'),
    score: r.scorer ? `${r.scorer.composite.toFixed(3)} ${r.scorer.recommendation}` : '',
    why: esc(r.scorer?.reason ?? r.note ?? ''),
    action: esc(NEXT_ACTION[r.scorer ? r.scorer.recommendation : bucketOf(r)] ?? ''),
    bucketnote: esc(r.note ?? ''),
  };
  return `| ${cols.map((c) => cells[c]).join(' | ')} |`;
}

function table(rows, spec) {
  const head = `| ${spec.map(([, h]) => h).join(' | ')} |\n|${spec.map(() => '---').join('|')}|`;
  return [head, ...rows.map((r) => rowLine(r, spec.map(([c]) => c)))].join('\n');
}

export function renderReport(run) {
  const { summary: sm, gates, timeline, rows, params_used: pu, coverage: cov } = run;
  const rowsSorted = orderRows(rows);
  const advance = rowsSorted.filter((r) => bucketOf(r) === 'advance');
  const skip = rowsSorted.filter((r) => bucketOf(r) === 'skip');
  const holds = rowsSorted.filter((r) => String(bucketOf(r)).startsWith('hold_'));
  const unresolved = rowsSorted.filter((r) => ['not_found', 'ambiguous'].includes(bucketOf(r)));
  const shown = (list) => list.filter((r) => r.origin === 'watchlist' || r.display_rank <= run.discover_limit);
  const o = [];

  o.push('# Sponsor-tier shortlist for a pre-OPT backend software candidate', '');
  o.push('## Executive summary', '');
  o.push(`This report looks at companies for one candidate: an international student who graduates soon, has not yet started work authorization, and wants a backend software job with a company that will sponsor a work visa. For each company it shows what public records say about sponsoring that kind of job, how much evidence stands behind it, and where the evidence is missing.`, '');
  o.push(`It is worth reading because it keeps three things apart that job boards blur together: a company with a real history of sponsoring this kind of role, a company that has sponsored something else, and a company the data simply says nothing about. Silence is never treated as a no.`, '');
  o.push(`On this run ${sm.evaluated} companies were evaluated (${sm.watchlist_names} names from the candidate's own list and ${sm.pool_size} found by search). ${sm.advance} look worth a closer look, ${sm.skip} were set aside because the evidence is thin or the timeline is closed, ${sm.held} were held because the data cannot judge them, and ${sm.unresolved} could not be matched to a single record. The data is ${gates.G0_vintage.age_months} months old${gates.G0_vintage.acknowledged ? ' and this run was told to accept that' : ''}, and nothing here shows that any job exists: every company still needs a person to confirm a live posting and read it for traps the data cannot see.`, '');

  o.push('## Read this first', '');
  o.push(`- **Evidence coverage:** only ${cov.with_h1b_record.toLocaleString('en-US')} of ${cov.csv_rows.toLocaleString('en-US')} companies (${cov.pct_with_h1b_record}%) have any sponsorship record at all. Everyone else is unknown, not a no.`);
  o.push(`- **The data's age:** its newest funding date is ${gates.G0_vintage.vintage_date}. "Recent" here means recent as of that date, and the Form D check below shows the funding column can lag behind.`);
  o.push('- **Counts are as reported:** every approval and denial count in the file is an even number and the cause is undocumented, so the tier thresholds were set to survive a possible double count.');
  o.push('- **Two human gates stay open on every row:** H1 (is there a live posting?) and H2 (does the posting hide an eligibility trap such as U.S.-person wording, "no sponsorship", a graduation window, or a start date before authorization begins?).');
  o.push('- **Fit is not scored:** deciding whether a role suits the candidate needs a person or a model reading a posting, so the scorer\'s fit term is left empty. That caps the composite (see the recipe).', '');

  const verdict = (v) => rowsSorted.filter((r) => r.scorer?.recommendation === v).length;
  const notAdvancedPct = round1((100 * (cov.csv_rows - sm.advance)) / cov.csv_rows);
  o.push('## From the whole dataset to this list', '');
  o.push('| Step | Companies |', '|---|---|');
  o.push(`| In the dataset | ${cov.csv_rows.toLocaleString('en-US')} |`);
  o.push(`| With any sponsorship record (the other ${(cov.csv_rows - cov.with_h1b_record).toLocaleString('en-US')} are unknown: not scored, not skipped) | ${cov.with_h1b_record.toLocaleString('en-US')} |`);
  o.push(`| ...whose listed titles include a backend-style title | ${cov.records_with_matching_title.toLocaleString('en-US')} |`);
  o.push(`| ...that also raised money within ${pu.funding_window_months} months of the data's newest date${cov.pool_excluded_ambiguous_name ? ` (${cov.pool_excluded_ambiguous_name} more left out for an ambiguous name)` : ''} | ${cov.pool_size} |`);
  o.push(`| Scored by the repository's scorer (pool plus any watchlist companies with a matching title) | ${sm.scorer_roles} |`);
  o.push(`| Worth a closer look (Apply ${verdict('Apply')}, Consider ${verdict('Consider')}) | ${sm.advance} |`);
  o.push(`| Set aside (Skip ${verdict('Skip')}) | ${sm.skip} |`, '');
  o.push(`The scorer's own skip rate looks low because it only sees companies that already passed these evidence filters. Measured against the whole dataset, ${notAdvancedPct}% of companies were not advanced.`, '');

  o.push('## Gates', '');
  o.push('| Gate | Status | What a person sees |', '|---|---|---|');
  o.push(`| G0 data vintage | ${gates.G0_vintage.status} | newest funding date ${gates.G0_vintage.vintage_date}, ${gates.G0_vintage.age_months} months before the run date ${run.as_of} (limit ${gates.G0_vintage.limit_months}) |`);
  o.push(`| G1 persona | ${gates.G1_persona.status} | fields read: ${gates.G1_persona.fields_read.join(', ')} |`);
  o.push(`| G2 scorer integrity | ${gates.G2_scorer_integrity.status} | scorer echoed needs_sponsorship=${gates.G2_scorer_integrity.scorer_needs_sponsorship}, persona says ${gates.G2_scorer_integrity.persona_needs_sponsorship}; ${gates.G2_scorer_integrity.roles_checked} roles checked |`);
  o.push(`| G3 timeline | factor ${timeline.factor} (${timeline.reason}) | run date ${timeline.dates.as_of}; authorization starts ${timeline.dates.ead_start}; expected start ${timeline.dates.expected_start}; ${timeline.days.projected_at_start} of ${timeline.days.ceiling} unemployment days projected at start (buffer ${timeline.days.buffer}); authorization ends ${timeline.dates.authorization_end} |`);
  o.push('| H1 liveness | OPEN on every row | a person must find a posting URL and run the liveness check |');
  o.push('| H2 posting eligibility | OPEN on every row | a person must read the posting |', '');
  o.push(`The timeline factor is a planning multiplier built from the candidate's own dates, not legal advice; STEM eligibility and the unemployment ceiling are for the school's international office to confirm.`, '');

  const advSpec = [['company', 'Company'], ['origin', 'From'], ['tier', 'Tier'], ['counts', 'Approvals / denials (rate)'], ['titles', 'Matching sponsored titles'], ['level', 'Level note'], ['raise', 'Latest raise'], ['wage', 'Offered wage vs national median'], ['formd', 'Form D sample'], ['score', 'Composite and scorer verdict']];
  o.push(`## Worth a closer look (${advance.length})`, '');
  if (advance.length) {
    o.push(`Showing ${shown(advance).length} of ${advance.length}. What to do next: **Apply** means ${NEXT_ACTION.Apply} **Consider** means ${NEXT_ACTION.Consider}`, '');
    o.push(table(shown(advance), advSpec));
  } else o.push('None on this run.');
  o.push('');

  const skipSpec = [['company', 'Company'], ['origin', 'From'], ['tier', 'Tier'], ['counts', 'Approvals / denials (rate)'], ['score', 'Composite and scorer verdict'], ['why', 'Why']];
  // Show the recipe's own reason (the tier, or the closed timeline gate) instead of the scorer's generic line.
  const whyText = (r) => (timeline.factor === 0 ? `the timeline gate is closed (${timeline.reason.replace(/-/g, ' ')})` : r.tier?.reason ?? r.scorer?.reason ?? '');
  o.push(`## Set aside on the evidence (${skip.length})`, '');
  if (skip.length) {
    const list = skip.slice(0, 10).map((r) => ({ ...r, scorer: { ...r.scorer, reason: whyText(r) } }));
    o.push(`Showing ${list.length} of ${skip.length}; all are in the run log.`, '');
    o.push(table(list, skipSpec));
  } else o.push('None on this run.');
  o.push('');

  const holdSpec = [['company', 'Company'], ['bucketnote', 'What the record shows'], ['action', 'Next action']];
  o.push(`## Held, not skipped (${holds.length})`, '');
  if (holds.length) o.push(table(holds, holdSpec)); else o.push('None on this run.');
  o.push('');

  o.push(`## Not resolved (${unresolved.length})`, '');
  if (unresolved.length) o.push(table(unresolved, holdSpec)); else o.push('None on this run.');
  o.push('');

  const fc = run.form_d_crosscheck;
  o.push('## Funding cross-check against the shipped Form D samples', '');
  o.push(`${fc.records_examined} sample records were examined; ${fc.matched} matched exactly one dataset company by normalized name (${fc.ambiguous} were ambiguous, ${fc.unmatched} had no match). Of the matched pairs: ${Object.entries(fc.counts).map(([k, v]) => `${k} ${v}`).join(', ')}.`, '');
  o.push('"form-d-newer" means the sample shows a later first sale than the dataset\'s latest funding date, so the dataset understates that company\'s recency. Only samples ship, so this is a spot check on a small subset, not a verification of the column.', '');

  o.push('## Run record', '');
  o.push(`- **Recipe:** ${run.recipe} v${run.recipe_version}. **Run date (your-input):** ${run.as_of}. **Model-judgment values in this run:** 0.`);
  o.push(`- **Inputs (path, sha256):** ${Object.entries(run.inputs).filter(([, v]) => v && v.sha256).map(([k, v]) => `${k}: \`${v.path}\` \`${v.sha256.slice(0, 12)}\``).join('; ')}.`);
  o.push(`- **Code that produced this run:** prototype files combined sha256 \`${run.inputs.code.combined_sha256.slice(0, 12)}\` (per-file hashes in the run log); scorer \`${run.inputs.scorer.path}\` sha256 \`${run.inputs.scorer.sha256.slice(0, 12)}\`.`);
  o.push(`- **Parameters (all your-input, defined in the recipe):** vintage limit ${pu.max_vintage_age_months} months; funding window ${pu.funding_window_months} months; Proven at least ${pu.tiers.proven.min_approvals} approvals and ${pu.tiers.proven.min_rate_pct}%; Likely at least ${pu.tiers.likely.min_approvals} and ${pu.tiers.likely.min_rate_pct}%; expected days to start ${run.persona_used.expected_days_to_start}.`);
  o.push(`- **Scorer:** \`${run.scorer.command}\`; outputs \`${run.scorer.outputs.join('`, `')}\`.`);
  o.push('- **Label legend:** record = read from a repo data file or arithmetic on record values; your-input = persona values and author-defined parameters; model-judgment = none here. Per-field labels are in the run log under `labels`.');
  return `${o.join('\n')}\n`;
}
