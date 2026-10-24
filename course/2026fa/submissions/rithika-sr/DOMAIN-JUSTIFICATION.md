# Domain justification — ds-newgrad-h1b-15-2051

## Who, in exactly what situation

An international F-1 master's student in data science, graduating December 2026,
whose OPT EAD is expected in January 2027, applying for entry-level **Data
Scientist** roles (SOC 15-2051) that need H-1B sponsorship later. The 90-day
OPT unemployment clock starts at the EAD date, so every week spent on a
non-sponsor or a dead posting comes out of that window.

## The information asymmetry

From the outside, this student cannot easily see:

1. **Whether a company has actually sponsored, and for data-science titles.** A
   brand name hides the legal entity in the records ("Instacart" is MAPLEBEAR INC).
2. **Whether "no record" means "no."** In the shipped CSV, 94.9% of companies
   have a blank approvals field. Treating blank as zero would wrongly rule out
   almost every company.
3. **Whether a posting is real.** A job board can keep a removed job's page and
   apply button online; in my worked run, one removed in June 2025 still checked
   as active.
4. **Whether "sponsors data scientists" means "sponsors new grads."** 31% of the
   DS titles in the records are Senior/Staff/Principal.

## Engine layers used

- **80 Days to Stay:** sponsorship approvals, rate, top titles, funding (record).
- **Job-Ops:** `ats:liveness`, used only as a gate.
- **The Cognitive Pivot:** BLS OEWS wage for 15-2051, report only (scorer weight 0, Fact 1).
- **Ch.11 scorer:** called unchanged as a subprocess.

## Where it fits the 3-3-2 day

It takes over the **research half of the two research-and-apply hours**:
looking up a company's sponsorship history, checking whether the posting is
live, and working out whether the hiring timeline fits the OPT window.

**Estimate (mine, not measured):** about 15–20 minutes per role by hand
(searching H-1B sites, opening the posting, doing the date math) versus about
3–5 minutes with the recipe (one liveness command, one run, reading the
report). At roughly 15 candidate roles a week, that is about **3–4 hours saved
per week**.

It also **feeds the networking hours**: every held role ("no record," "ask a
contact," "name not found") and every ⚠ Apply becomes a concrete networking
target instead of a cold application.

## Domain-specific failure modes

1. **Aggregator ghost posting.** The shape of the error: an aggregator page
   outlives the employer's posting and keeps an apply button, so the liveness
   gate passes it and a strong sponsor pushes it to Apply. Hardest to catch for
   a student under deadline pressure who trusts the green check and never opens
   the page. Caught here only by the G4 hand check.
2. **Sponsorship-only Apply for a senior role.** A Proven sponsor alone clears
   the Apply line, and the matched title may be "Sr Data Scientist." A new grad
   could spend tailoring hours on Staff roles they cannot get. Hardest to catch
   for someone who reads only the Apply column, not the matched titles and fit.
