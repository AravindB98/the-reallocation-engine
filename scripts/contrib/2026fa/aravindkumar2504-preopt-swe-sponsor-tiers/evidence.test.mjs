// evidence.test.mjs: offline tests for the evidence layer. Fixtures only; no network.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { InputError, isoToDay } from './timeline.mjs';
import {
  buildNameIndex, compileFamily, crossCheckFormD, filingDateToIso, fundingFacts, levelNote, loadBlsRow, loadCompanies, loadFormD,
  normalizeName, parseCsv, parseTitles, sponsorshipRecord, splitTitles, tierFor, titleMatches, toNumber, vintageOf, wageComparison,
} from './evidence.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FX = (f) => path.join(HERE, 'fixtures', f);
const params = JSON.parse(fs.readFileSync(path.join(HERE, 'params.json'), 'utf8'));
const fam = compileFamily(JSON.parse(fs.readFileSync(path.join(HERE, 'role-families.json'), 'utf8')).families['backend-platform-swe']);

test('parseCsv handles quotes, doubled quotes, embedded commas and newlines, CRLF and a BOM', () => {
  const text = '﻿a,b,c\r\n1,"x, y","say ""hi"""\r\n2,"line\nbreak",z\r\n';
  const { header, rows } = parseCsv(text);
  assert.deepEqual(header, ['a', 'b', 'c']);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].b, 'x, y');
  assert.equal(rows[0].c, 'say "hi"');
  assert.equal(rows[1].b, 'line\nbreak');
});

test('parseCsv fails loudly on a ragged row or a truncated quote, and names the file it was reading', () => {
  assert.throws(() => parseCsv('a,b\n1,2,3\n'), InputError);
  assert.throws(() => parseCsv('a,b\n1,"open\n'), InputError);
  assert.throws(() => parseCsv('a,b\n1,2,3\n', 'the BLS extract'), (e) => e instanceof InputError && /^the BLS extract row 2 has 3 fields/.test(e.message));
  assert.throws(() => parseCsv('', 'the company table'), (e) => /^the company table is empty/.test(e.message));
});

test('normalizeName ports the repo rule: strip legal suffixes, punctuation and case; null-like strings are empty', () => {
  assert.equal(normalizeName('MIP HPC Foreign Partners, L.P.'), 'miphpcforeignpartners'); // the Form D file\'s own normalized value
  assert.equal(normalizeName('COMPOSABL, INC.'), 'composabl');
  assert.equal(normalizeName('Foundation LLM Technologies, Inc.'), 'foundationllmtechnologies');
  assert.equal(normalizeName('3AM INNOVATIONS INC'), normalizeName('3AM INNOVATIONS LLC'));
  assert.equal(normalizeName('$AVY INC'), '$avy'); // only , . whitespace - & \' are removed, as in the Python rule
  assert.equal(normalizeName('nan'), '');
  assert.equal(normalizeName(null), '');
});

test('normalizeName strips suffixes repeatedly, exactly as the Python original does (expected values taken from running it)', () => {
  const python = { 'Foo Inc LLC': 'foo', 'Bar Corp Ltd': 'bar', 'Baz Co LP': 'baz', 'X L.L.C. Inc': 'x', 'Acme Holdings Co., Ltd.': 'acmeholdingsco', 'The Widget Company, Inc.': 'thewidgetcompany', 'Foo, Inc., LLC': 'fooinc', "O'Brien & Sons, Inc.": 'obriensons', 'N/A': '' };
  for (const [name, want] of Object.entries(python)) assert.equal(normalizeName(name), want, name);
});

test('parseTitles reads a Python list repr, including apostrophes and commas inside titles', () => {
  assert.deepEqual(parseTitles("['A', 'B']"), ['A', 'B']);
  assert.deepEqual(parseTitles('["Master\'s Software Engineer, Platform"]'), ["Master's Software Engineer, Platform"]);
  assert.deepEqual(parseTitles('[]'), []);
  assert.equal(parseTitles(''), null);
  assert.throws(() => parseTitles('Software Engineer'), InputError);
  assert.throws(() => parseTitles("['unterminated"), InputError);
});

test('parseTitles decodes the escapes Python writes, and refuses any it cannot decode', () => {
  // The real table holds a title such as "Software Engineer\xa0"; dropping the backslash would give "Software Engineerxa0".
  assert.deepEqual(parseTitles(String.raw`['Software Engineer\xa0']`), ['Software Engineer\u00a0']);
  assert.deepEqual(parseTitles(String.raw`['Staff\u00a0Engineer', 'Line\nBreak', 'Tab\tHere', 'Back\\slash', 'Quote\'s']`), ['Staff\u00a0Engineer', 'Line\nBreak', 'Tab\tHere', 'Back\\slash', "Quote's"]);
  assert.deepEqual(parseTitles(String.raw`['Emoji\U0001F600']`), ['Emoji\u{1F600}']);
  assert.throws(() => parseTitles(String.raw`['bad\q']`), (e) => e instanceof InputError && /escape/.test(e.message));
  assert.throws(() => parseTitles(String.raw`['short\x4']`), InputError);
});

test('parseTitles accepts only the shape Python writes: items separated by exactly ", "', () => {
  assert.deepEqual(parseTitles("['A', 'B']"), ['A', 'B']);
  for (const bad of ["['A' 'B']", "['A','B']", "['A',, 'B']", "[, 'A']", "['A', ]", "['''x''']", "['A'  'B']", "['A', 'B',]"]) {
    assert.throws(() => parseTitles(bad), InputError, bad);
  }
});

test('role family: backend-style titles match; testing, sales, frontend and management titles do not', () => {
  const yes = ['Software Engineer', 'Senior Backend Engineer', 'Platform Engineer', 'Site Reliability Engineer', 'DevOps Engineer', 'Full Stack Developer', 'Member of Technical Staff', 'Software Development Engineer'];
  const no = ['Software Development Engineer in Test', 'Sales Engineer', 'Solutions Architect', 'Frontend Software Engineer', 'iOS Software Engineer', 'Engineering Manager', 'Data Scientist', 'Software Engineer Intern', 'Product Manager', 'Senior Data Engineer'];
  for (const t of yes) assert.equal(titleMatches(t, fam), true, `should match: ${t}`);
  for (const t of no) assert.equal(titleMatches(t, fam), false, `should not match: ${t}`);
});

test('levelNote tells a new graduate whether any matched title lacks a senior marker', () => {
  assert.equal(levelNote(['Senior Software Engineer', 'Staff Software Engineer'], fam), 'all-matched-titles-senior-marked');
  assert.equal(levelNote(['Software Engineer', 'Senior Software Engineer'], fam), 'includes-titles-without-a-senior-marker');
  assert.equal(levelNote([], fam), null);
  // "Member of Technical Staff" is a common entry-level title at some companies; the word "staff" there is not a seniority marker.
  assert.equal(levelNote(['Member of Technical Staff'], fam), 'includes-titles-without-a-senior-marker');
  assert.equal(levelNote(['Staff Software Engineer'], fam), 'all-matched-titles-senior-marked');
});

test('tierFor: thresholds, small-sample caution, and the unscored role-type-unverified outcome', () => {
  const t = (approvals, denials, matched = ['Software Engineer']) => tierFor({ approvals, denials, matchedTitles: matched }, params.tiers);
  assert.equal(t(10, 0).tier, 'Proven');
  assert.equal(t(10, 0).p, 0.9);
  assert.equal(t(9, 0).tier, 'Likely'); // one short of the Proven count bar
  assert.equal(t(2, 0).tier, 'Thin'); // 100 percent but only 2 reported approvals: small samples never earn Proven or Likely
  assert.equal(t(50, 6).tier, 'Likely'); // 89.29 percent: just under the Proven rate bar
  assert.equal(t(6, 4).tier, 'Thin'); // 60 percent
  assert.equal(t(0, 2).tier, 'Thin');
  assert.equal(t(0, 2).rate_pct, 0);
  const unverified = t(20, 0, []);
  assert.equal(unverified.tier, 'role-type-unverified');
  assert.equal(unverified.p, null);
  assert.equal(unverified.scored, false);
});

test('tierFor: a count or rate exactly on a bar is on the higher side of it', () => {
  const t = (approvals, denials) => tierFor({ approvals, denials, matchedTitles: ['Software Engineer'] }, params.tiers);
  assert.equal(t(90, 10).rate_pct, 90);
  assert.equal(t(90, 10).tier, 'Proven'); // exactly 90.0 percent
  assert.equal(t(899, 101).tier, 'Likely'); // 89.9 percent
  assert.equal(t(70, 30).tier, 'Likely'); // exactly 70.0 percent
  assert.equal(t(699, 301).tier, 'Thin'); // 69.9 percent
  assert.equal(t(4, 0).tier, 'Likely'); // exactly the Likely count bar
  assert.equal(t(3, 0).tier, 'Thin'); // one short
  assert.equal(t(10, 1).tier, 'Proven'); // exactly the Proven count bar, 90.9 percent
});

test('tierFor: a negative record is described as one, not as a low rate', () => {
  const t = tierFor({ approvals: 0, denials: 2, matchedTitles: ['Software Engineer'] }, params.tiers);
  assert.equal(t.tier, 'Thin');
  assert.match(t.reason, /0 approvals and 2 denials, a negative record/);
  assert.match(tierFor({ approvals: 0, denials: 1, matchedTitles: ['Software Engineer'] }, params.tiers).reason, /1 denial, a negative record/);
  assert.doesNotMatch(tierFor({ approvals: 6, denials: 4, matchedTitles: ['Software Engineer'] }, params.tiers).reason, /negative/);
});

test('sponsorshipRecord separates no-record, incomplete-record and record; checks the given rate', () => {
  assert.equal(sponsorshipRecord({ 'Total Approvals': '', 'Total Denials': '' }).status, 'no-record');
  assert.equal(sponsorshipRecord({ 'Total Approvals': 'x', 'Total Denials': '1' }).status, 'incomplete-record');
  assert.equal(sponsorshipRecord({ 'Total Approvals': '2.5', 'Total Denials': '0' }).status, 'incomplete-record');
  // 0 approvals and 0 denials is no evidence either way: it must not become a Thin tier and a scorer Skip
  assert.equal(sponsorshipRecord({ 'Total Approvals': '0.0', 'Total Denials': '0.0' }).status, 'empty-record');
  const ok = sponsorshipRecord({ 'Total Approvals': '12.0', 'Total Denials': '0.0', Approval_Rate: '100.0', median_salary_offered: '140000.0' });
  assert.equal(ok.status, 'record');
  assert.equal(ok.rate_consistent, true);
  assert.equal(sponsorshipRecord({ 'Total Approvals': '6.0', 'Total Denials': '4.0', Approval_Rate: '99.0' }).rate_consistent, false);
});

test('toNumber never returns NaN', () => {
  assert.equal(toNumber('nan'), null);
  assert.equal(toNumber(''), null);
  assert.equal(toNumber(' 12.5 '), 12.5);
});

test('fixture CSV loads; the data vintage is its newest funding date', () => {
  const csv = loadCompanies(FX('companies.fixture.csv'));
  assert.equal(csv.rows.length, 17);
  assert.equal(csv.sha256.length, 64);
  assert.equal(vintageOf(csv.rows).iso, '2025-06-30');
});

test('named failure case F7: schema drift stops the run and names the missing column', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'drift-'));
  const text = fs.readFileSync(FX('companies.fixture.csv'), 'utf8').replace('Total Approvals', 'Total_Approvals_Renamed');
  fs.writeFileSync(path.join(dir, 'drifted.csv'), text);
  assert.throws(() => loadCompanies(path.join(dir, 'drifted.csv')), (e) => e instanceof InputError && /Total Approvals/.test(e.message));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('name index flags an ambiguous name; the fixture pair collides', () => {
  const csv = loadCompanies(FX('companies.fixture.csv'));
  const index = buildNameIndex(csv.rows);
  assert.equal(index.get('hotelcloud').length, 2);
  assert.equal(index.get('alphaplatform').length, 1);
});

test('fundingFacts measures recency against the data vintage, not the run date', () => {
  const v = isoToDay('2025-06-30');
  const f = fundingFacts({ latest_funding_date: '2025-03-15', latest_funding_stage: 'Seed', latest_funding_amount: '3000000.0' }, v, 24, 30.4375);
  assert.equal(f.status, 'ok');
  assert.equal(f.months_before_vintage, 3.5);
  assert.equal(f.within_window, true);
  assert.equal(fundingFacts({ latest_funding_date: '2019-04-01' }, v, 24, 30.4375).within_window, false);
  assert.equal(fundingFacts({ latest_funding_date: '' }, v, 24, 30.4375).status, 'no-funding-record');
  assert.equal(fundingFacts({ latest_funding_date: 'soon' }, v, 24, 30.4375).status, 'unreadable-funding-date');
});

test('named failure case F3: a SOC code with no BLS row, an unreadable median, and a duplicate row are all "missing" with a reason', () => {
  assert.equal(loadBlsRow(FX('bls.fixture.csv'), '15-1252').annual_median_wage, 133080);
  assert.deepEqual(['99-9999', '99-0001', '15-9999', '11-1011'].map((s) => loadBlsRow(FX('bls.fixture.csv'), s).reason),
    ['no-soc-row', 'median-not-numeric', 'ambiguous-soc-rows', 'median-not-numeric']);
  const missing = loadBlsRow(FX('bls.fixture.csv'), '99-9999');
  assert.equal(wageComparison(140000, missing).status, 'missing');
  assert.equal(wageComparison(140000, missing).reason, 'bls-no-soc-row');
});

test('wageComparison is plain arithmetic on two records', () => {
  const ok = loadBlsRow(FX('bls.fixture.csv'), '15-1252');
  assert.equal(wageComparison(140000, ok).ratio, 1.05);
  assert.equal(wageComparison(null, ok).reason, 'no-offered-wage');
});

test('Form D cross-check classifies every kind of pair, by FILING date, and never compares an ambiguous name', () => {
  const csv = loadCompanies(FX('companies.fixture.csv'));
  const index = buildNameIndex(csv.rows);
  const formd = loadFormD(FX('formd'));
  const x = crossCheckFormD(csv.rows, index, formd, vintageOf(csv.rows).iso);
  assert.equal(x.records_examined, 12);
  assert.equal(x.matched, 10);
  assert.equal(x.ambiguous, 1);
  assert.equal(x.unmatched, 1);
  assert.deepEqual(x.counts, { agrees: 2, 'form-d-missed-by-table': 1, 'form-d-filed-after-table-end': 3, 'form-d-older': 1, 'same-date-amount-differs': 1, 'csv-has-no-funding': 1, 'form-d-has-no-first-sale': 1 });
  // Counts alone cannot tell the classes apart, so check the class record by record.
  assert.deepEqual(x.pairs.map((p) => [p.company, p.class]), [
    ['ALPHA PLATFORM INC', 'agrees'],
    ['BRAVO SYSTEMS LLC', 'form-d-filed-after-table-end'], // first sale 2025-08-01 and filed 2025-08-05, both after the table's newest date (2025-06-30)
    ['CHARLIE DATA INC', 'form-d-older'], // Form D first sale 2024-01-01, before the CSV's 2025-02-01
    ['LIMA NOFUND INC', 'csv-has-no-funding'],
    ['DELTA HEALTH INC', 'same-date-amount-differs'],
    ['FOXTROT LABS INC', 'form-d-has-no-first-sale'],
    ['GOLF ROBOTICS INC', 'form-d-missed-by-table'], // first sale 2025-02-01, filed 2025-02-10: long before the table's newest date, yet the table holds only 2024-12-01
    ['ECHO FOODS INC', 'form-d-filed-after-table-end'], // first sale 2025-05-15 is inside the table's span, but it was filed 2025-07-15, after the table's newest date
    ['KILO QUOTES INC', 'agrees'],
    ['KILO QUOTES INC', 'form-d-filed-after-table-end'], // a second record for the same company, filed 2025-07-02
  ]);
});

test('Form D cross-check falls back to the first-sale date only when a record has no filing date', () => {
  const csv = loadCompanies(FX('companies.fixture.csv'));
  const index = buildNameIndex(csv.rows);
  const rec = (first_sale, filed) => ({ norm: 'golfrobotics', first_sale, filed, offering: 1, accession: 'x' });
  const cls = (r) => crossCheckFormD(csv.rows, index, { status: 'ok', records: [r] }, '2025-06-30').pairs[0].class;
  assert.equal(cls(rec('2025-02-01', null)), 'form-d-missed-by-table'); // no filing date, first sale before the newest date
  assert.equal(cls(rec('2025-08-01', null)), 'form-d-filed-after-table-end'); // no filing date, first sale after it
  assert.equal(cls(rec('2025-02-01', '2025-07-01')), 'form-d-filed-after-table-end'); // filed after it: the table cannot be blamed
  assert.equal(cls(rec('2025-02-01', '2025-06-30')), 'form-d-missed-by-table'); // filed on the newest date itself: the table could hold it
});

test('filing dates are read from the DD-MON-YYYY form the samples use, and anything else is unknown, never guessed', () => {
  assert.equal(filingDateToIso('30-JUN-2025'), '2025-06-30');
  assert.equal(filingDateToIso('01-JAN-2026'), '2026-01-01');
  for (const bad of ['2025-06-30', '30-Jun-2025', '31-FEB-2025', '30-XXX-2025', '', null, undefined, 'soon']) assert.equal(filingDateToIso(bad), null, String(bad));
});

test('a missing Form D directory, or a file given as the directory, is reported as such, not treated as a failure', () => {
  assert.equal(loadFormD('/nonexistent/path/for/test').status, 'no-directory');
  assert.equal(loadFormD(FX('companies.fixture.csv')).status, 'no-directory');
});

test('splitTitles separates matched from unmatched titles', () => {
  const s = splitTitles(['Software Engineer', 'Sales Engineer', 'Backend Engineer'], fam);
  assert.deepEqual(s.matched, ['Software Engineer', 'Backend Engineer']);
  assert.deepEqual(s.unmatched, ['Sales Engineer']);
});
