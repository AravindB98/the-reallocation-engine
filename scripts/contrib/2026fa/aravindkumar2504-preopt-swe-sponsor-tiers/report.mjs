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

const NEXT_ACTION = {
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
  _kinds: 'record = read from a repository data file, or plain arithmetic on record values; your-input = the persona values, the run date and the run\'s parameters (the author confirmed the sponsor tiers and the funding window on 2026-10-19 and cleared the data-age gate for the live run; the vintage limit and the Thin value are still proposals by the assistant; see author-decisions.md); model-judgment = a judgment a model made about a company (none is made by this prototype); run-metadata = describes the run itself and is not evidence',
  // one entry for every field of a row, by dotted path
  'company': 'record (the dataset\'s company name); on a not-found row it is your-input, the name the candidate typed',
  'origin': 'run-metadata (watchlist = the candidate\'s own list; pool = found by search)',
  'industry': 'record',
  'csv_row_number': 'run-metadata (the row in the company table, counting its header as row 1)',
  'bucket': 'run-metadata (the recipe\'s grouping of the outcome)',
  'note': 'run-metadata (plain-language explanation of a held or unresolved row)',
  'scored': 'run-metadata',
  'role_id': 'run-metadata',
  'matched_titles': 'record (titles from the table) matched by a rule proposed by the assistant',
  'pending_gates': 'run-metadata (the human gates still open)',
  'display_rank': 'run-metadata',
  'level_note': 'record (titles) read by a rule: whether every matched title carries a senior marker',
  'form_d_check': 'record (two files compared): the class of the Form D sample comparison',
  'funding.status': 'record', 'funding.date': 'record', 'funding.stage': 'record', 'funding.amount': 'record',
  'funding.months_before_vintage': 'record (arithmetic on two dates)',
  'funding.within_window': 'your-input (the window is a parameter) applied to record dates',
  'sponsorship.approvals': 'record', 'sponsorship.denials': 'record', 'sponsorship.given_rate_pct': 'record',
  'sponsorship.rate_consistent': 'record (arithmetic check of the given rate)', 'sponsorship.median_salary_offered': 'record',
  'tier.approvals': 'record', 'tier.denials': 'record', 'tier.total_decisions': 'record (arithmetic)',
  'tier.rate_pct': 'record (arithmetic on the two counts)',
  'tier.tier': 'record (the approval and denial counts) classified by a rule whose thresholds are your-input (confirmed by the author on 2026-10-19)',
  'tier.p': 'your-input: a fixed number per tier from params.json. Proven 0.9 and Likely 0.6 are the book\'s chapter 11 example values; Thin 0.3 is a low value that keeps a Thin row under the scorer\'s Consider line, so a Thin row is set aside by construction. It is not a probability',
  'tier.scored': 'run-metadata', 'tier.reason': 'run-metadata (plain-language explanation of the tier)',
  'titles.matched': 'record matched by a rule', 'titles.unmatched_count': 'record (count)', 'titles.all': 'record',
  'wage.status': 'record', 'wage.reason': 'run-metadata', 'wage.offered': 'record', 'wage.oews_median': 'record',
  'wage.ratio': 'record (arithmetic on two records)',
  'scorer.composite': 'your-input (derived): the repository scorer multiplies the tier value, its own weight, and the liveness and timeline gate values, and all three of those inputs are your-input here',
  'scorer.recommendation': 'your-input (derived): the repository scorer\'s verdict from the composite and its fixed thresholds',
  'scorer.reason': 'run-metadata: the repository scorer\'s own explanation of its verdict',
  'scorer.arithmetic': 'run-metadata: the repository scorer\'s audit line for the composite',
  // what is sent to the scorer, for reference
  'sent_to_scorer.sponsorship': 'your-input: the tier\'s fixed number from params.json (the tier itself is classified from record counts; see tier.p)',
  'sent_to_scorer.liveness': 'your-input: an UNCHECKED placeholder meaning "assume open until a person checks"',
  'sent_to_scorer.timeline': 'your-input: computed from the persona\'s dates',
  'sent_to_scorer.fit': 'model-judgment: not sent, because fit needs a judgment about a posting, which this prototype does not make',
  'model_judgment_values': 'model-judgment: none are produced by this prototype',
};

// One entry for every other top-level value in the run log (the rows above are covered by LABELS).
export const RUN_LABELS = {
  recipe: 'run-metadata', recipe_version: 'run-metadata', as_of: 'your-input (the run date)', as_of_source: 'run-metadata',
  command: 'run-metadata (the command as typed, with paths written repository-relative)', discover_limit: 'your-input',
  inputs: 'run-metadata (each input file\'s path and sha256, so a reader can prove which data and code produced the run)',
  persona_used: 'your-input (the persona values, each with its source: persona-file or command-line)',
  params_used: 'your-input (tiers and funding window confirmed by the author on 2026-10-19; vintage limit still a proposal by the assistant)',
  gates: 'run-metadata (each gate\'s status; the values behind G0 are record dates compared with your-input)',
  timeline: 'your-input (computed from the persona\'s dates; a planning multiplier, not legal advice)',
  bls_reference: 'record (the national median wage for the SOC code in the BLS extract)',
  coverage: 'record for the two whole-table counts (companies, companies with a sponsorship record); every count after them is a count of record rows kept by a your-input rule (the backend-title rule, the funding window, the candidate\'s own list)',
  form_d_crosscheck: 'record (two repository files compared: the company table and the Form D samples)',
  summary: 'run-metadata (how many companies fell into each bucket on this run)',
  scorer: 'run-metadata (how the repository scorer was run and what it printed)',
  stop_reason: 'run-metadata',
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

export function renderRunLog(run) {
  return `${JSON.stringify(run, null, 2)}\n`;
}

function rowLine(r, cols) {
  const s = r.sponsorship || {};
  const matched = r.titles?.matched || [];
  const titles = matched.slice(0, 3).join('; ') + (matched.length > 3 ? `; +${matched.length - 3} more (in the run log)` : '');
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
    action: esc(NEXT_ACTION[r.scorer ? r.scorer.recommendation : r.bucket] ?? ''),
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
  const advance = rowsSorted.filter((r) => r.bucket === 'advance');
  const skip = rowsSorted.filter((r) => r.bucket === 'skip');
  const holds = rowsSorted.filter((r) => String(r.bucket).startsWith('hold_'));
  const unresolved = rowsSorted.filter((r) => ['not_found', 'ambiguous'].includes(r.bucket));
  const shown = (list) => list.filter((r) => r.origin === 'watchlist' || r.display_rank <= run.discover_limit);
  const o = [];

  o.push('# Sponsor-tier shortlist for a pre-OPT backend software candidate', '');
  o.push('## Executive summary', '');
  o.push(`This report looks at companies for one candidate: an international student who graduates soon, has not yet started work authorization, and wants a backend software job with a company that will sponsor a work visa. For each company it shows what public records say about sponsoring that kind of job, how much evidence stands behind it, and where the evidence is missing.`, '');
  o.push(`It is worth reading because it keeps three things apart that job boards blur together: a company with a real history of sponsoring this kind of role, a company that has sponsored something else, and a company the data simply says nothing about. Silence is never treated as a no.`, '');
  o.push(`On this run ${sm.evaluated} companies were evaluated (${sm.watchlist_names} names from the candidate's own list and ${sm.pool_size} found by search). ${sm.advance} look worth a closer look, ${sm.skip} were set aside because the evidence is thin or the timeline is closed, ${sm.held} were held because the data cannot judge them, and ${sm.unresolved} could not be matched to a single record. The data is ${gates.G0_vintage.age_months} months old${gates.G0_vintage.acknowledged ? ' and this run was told to accept that' : ''}, and nothing here shows that any job exists: every company still needs a person to confirm a live posting and read it for traps the data cannot see.`, '');

  o.push('## Read this first', '');
  if (run.scorer.is_repository_scorer === false) o.push(`- **This run used a STAND-IN scorer, not the repository's:** \`${run.scorer.command}\`. It exists only to test the guards; none of the verdicts below are the repository scorer's.`);
  o.push(`- **Evidence coverage:** only ${cov.with_h1b_record.toLocaleString('en-US')} of ${cov.csv_rows.toLocaleString('en-US')} companies (${cov.pct_with_h1b_record}%) have any sponsorship record at all. Everyone else is unknown, not a no.`);
  o.push(`- **The data's age:** its newest funding date is ${gates.G0_vintage.vintage_date}. "Recent" here means recent as of that date, and the Form D check below shows the funding column can lag behind.`);
  o.push('- **Counts are as reported:** every approval and denial count in the file is an even number and the cause is undocumented, so the tier thresholds were set to survive a possible double count.');
  o.push('- **Two human gates stay open on every row:** H1 (is there a live posting?) and H2 (does the posting hide an eligibility trap such as U.S.-person wording, "no sponsorship", a graduation window, or a start date before authorization begins?).');
  o.push('- **Fit is not scored:** deciding whether a role suits the candidate needs a person or a model reading a posting, so the scorer\'s fit term is left empty. That caps the composite (see the recipe).', '');

  o.push('## Where each column comes from', '');
  o.push('| Column | Label | Where it comes from |', '|---|---|---|');
  o.push('| Company, Approvals / denials (rate), Latest raise, Form D sample | record | the company table and the Form D samples |');
  o.push('| Matching sponsored titles | record, kept by a your-input rule | the table\'s titles that match the role family in role-families.json (a rule proposed by the assistant, not yet confirmed by the author) |');
  o.push('| Tier | record classified by a your-input rule | counts from the table; the thresholds are parameters the author confirmed on 2026-10-19 |');
  o.push('| Level note | record read by a rule | the matched titles and a list of senior markers |');
  o.push('| Offered wage vs national median | record divided by record | the table\'s median offered wage and the national median in the BLS extract |');
  o.push('| Composite and scorer verdict | your-input (derived) | the repository scorer: the tier\'s fixed value, times its weight, times the liveness placeholder and the timeline factor, both your-input |');
  o.push('| Why, Next action, What the record shows | run-metadata | this program\'s plain-language explanation; it is not evidence |', '');

  const verdict = (v) => rowsSorted.filter((r) => r.scorer?.recommendation === v).length;
  const notAdvancedPct = round1((100 * (cov.csv_rows - sm.advance)) / cov.csv_rows);
  o.push('## From the whole dataset to this list', '');
  o.push('| Step | Companies |', '|---|---|');
  o.push(`| In the dataset | ${cov.csv_rows.toLocaleString('en-US')} |`);
  o.push(`| With any sponsorship record (the other ${(cov.csv_rows - cov.with_h1b_record).toLocaleString('en-US')} are unknown: not scored, not skipped) | ${cov.with_h1b_record.toLocaleString('en-US')} |`);
  o.push(`| ...whose listed titles include a backend-style title | ${cov.records_with_matching_title.toLocaleString('en-US')} |`);
  o.push(`| ...that also raised money within ${pu.funding_window_months} months of the data's newest date | ${cov.records_matching_and_recently_funded} |`);
  const leftOut = [`${cov.recent_already_on_candidate_list} already on the candidate's own list`, ...(cov.pool_excluded_ambiguous_name ? [`${cov.pool_excluded_ambiguous_name} whose name is shared with another row`] : []), ...(cov.pool_excluded_no_usable_name ? [`${cov.pool_excluded_no_usable_name} with no usable name`] : [])];
  o.push(`| ...of those, leaving out ${leftOut.join(', ')}: the discovery pool | ${cov.pool_size} |`);
  o.push(`| Scored by the repository's scorer (pool plus any watchlist companies with a matching title) | ${sm.scorer_roles} |`);
  o.push(`| Worth a closer look (Apply ${verdict('Apply')}, Consider ${verdict('Consider')}) | ${sm.advance} |`);
  o.push(`| Set aside (Skip ${verdict('Skip')}) | ${sm.skip} |`, '');
  o.push('The first two rows are plain counts of the table (record). Every row after them counts table rows kept by a your-input rule: the backend-title rule, the funding window and the candidate\'s own list.', '');
  const unreadable = [];
  const nTitles = cov.records_with_unreadable_titles;
  const nDates = gates.G0_vintage.unreadable_dates;
  if (nTitles) unreadable.push(`${nTitles} ${nTitles === 1 ? 'company with a sponsorship record whose title list' : 'companies with a sponsorship record whose title lists'} could not be read`);
  if (nDates) unreadable.push(`${nDates} ${nDates === 1 ? 'row whose funding date' : 'rows whose funding dates'} could not be read, so ${nDates === 1 ? 'it' : 'they'} cannot be placed inside the funding window`);
  if (unreadable.length) o.push(`Left out of the counts above because a cell could not be read (nothing is guessed): ${unreadable.join('; ')}. The run log counts them, and a person should look at those rows.`, '');
  const skipRate = sm.scorer_roles ? Math.round((100 * sm.skip) / sm.scorer_roles) : 0;
  const wholeDataset = `Measured against the whole dataset, ${notAdvancedPct}% of the ${cov.csv_rows.toLocaleString('en-US')} companies were not advanced, but mostly because the data says nothing about them (unknown), not because anything scored them Skip.`;
  const skipLead = `The repository scorer's own skip rate here is ${skipRate}% (${sm.skip} of ${sm.scorer_roles} scored roles)`;
  if (!sm.scorer_roles) o.push(`No role was scored on this run, so there is no skip rate. ${wholeDataset}`, '');
  else if (skipRate < 50) o.push(`${skipLead}, below the roughly 50% its own report calls healthy. It is low because the scorer only sees companies that already passed the evidence filters above. ${wholeDataset}`, '');
  else {
    const why = timeline.factor < 1
      ? `the timeline factor is ${timeline.factor}${gates.G3_timeline.status === 'CLOSED' ? ' (the gate is closed)' : ''}, which lowers every composite, so the scorer sets roles aside whatever their evidence`
      : 'most of the scored companies have thin evidence, and the recipe sets the Thin tier aside';
    o.push(`${skipLead}, at or above the roughly 50% its own report calls healthy. It is high here because ${why}. ${wholeDataset}`, '');
  }

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
  const floor = run.scorer?.config?.consider_floor ?? 0.2;
  const closed = gates.G3_timeline.status === 'CLOSED';
  const whyText = (r) => {
    if (closed) return timeline.factor === 0 ? `the timeline gate is closed (${timeline.reason.replace(/-/g, ' ')})` : `the timeline factor ${timeline.factor} is at or below the scorer's closed-gate line of ${gates.G3_timeline.closed_below}`;
    if (r.tier?.tier === 'Thin') return r.tier.reason;
    // a Proven or Likely company that still skipped: the timeline factor multiplied its composite under the floor
    return `the timeline factor ${timeline.factor} multiplies this ${r.tier?.tier ?? ''} company's composite down to ${r.scorer?.composite?.toFixed(3)}, under the scorer's floor of ${floor}`;
  };
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
  if (fc.status !== 'ok') {
    o.push(`The Form D sample folder was ${fc.status === 'no-directory' ? 'not found' : 'empty'}, so no cross-check was made. This is not a pass: it means the funding column was not spot-checked on this run.`, '');
  } else {
    const companies = new Set(fc.pairs.map((p) => p.company)).size;
    o.push(`${fc.records_examined} sample records were examined; ${fc.matched} matched exactly one dataset company by normalized name (${companies} distinct companies, because a company can have more than one sample record; ${fc.ambiguous} were ambiguous, ${fc.unmatched} had no match). Of the matched records: ${Object.entries(fc.counts).map(([k, v]) => `${k} ${v}`).join(', ')}.`, '');
    o.push('"form-d-missed-by-table" means the sample shows a first sale later than the table\'s date for that company, and the form was filed on or before the table\'s newest funding date, so the table could have held it and did not: the funding column lagged. "form-d-filed-after-table-end" means the form was filed after the table\'s newest funding date, so the table may simply predate it: that is not counted as a miss. Only samples ship, so this is a spot check on a small subset, not a verification of the column.', '');
  }

  o.push('## Run record', '');
  o.push(`- **Recipe:** ${run.recipe} v${run.recipe_version}. **Run date (your-input):** ${run.as_of}. **Values a model produced about a company while this program ran:** 0.`);
  o.push(`- **Inputs (path, sha256):** ${Object.entries(run.inputs).filter(([, v]) => v && v.sha256).map(([k, v]) => `${k}: \`${v.path}\` \`${v.sha256.slice(0, 12)}\``).join('; ')}.`);
  o.push(`- **Code that produced this run:** prototype files combined sha256 \`${run.inputs.code.combined_sha256.slice(0, 12)}\` (per-file hashes in the run log); scorer \`${run.inputs.scorer.path}\` sha256 \`${run.inputs.scorer.sha256.slice(0, 12)}\`.`);
  o.push(`- **Parameters (labelled your-input because they are inputs to the run; the tiers and the funding window confirmed by the author on 2026-10-19, the vintage limit still a proposal by the assistant):** vintage limit ${pu.max_vintage_age_months} months; funding window ${pu.funding_window_months} months; Proven at least ${pu.tiers.proven.min_approvals} approvals and ${pu.tiers.proven.min_rate_pct}%; Likely at least ${pu.tiers.likely.min_approvals} and ${pu.tiers.likely.min_rate_pct}%; expected days to start ${run.persona_used.expected_days_to_start}.`);
  o.push(`- **Scorer:** \`${run.scorer.command}\`; outputs \`${run.scorer.outputs.join('`, `')}\`.`);
  o.push('- **Label legend:** record = read from a repo data file or arithmetic on record values; your-input = the persona values, the run date and the parameters (tiers and funding window confirmed by the author on 2026-10-19; the vintage limit still a proposal by the assistant); model-judgment = none made about a company here; run-metadata = describes the run and is not evidence. Per-field labels are in the run log under `labels`.');
  return `${o.join('\n')}\n`;
}
