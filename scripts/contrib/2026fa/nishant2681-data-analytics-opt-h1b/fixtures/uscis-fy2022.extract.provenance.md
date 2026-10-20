# Provenance — uscis-fy2022.extract.csv

## Executive summary

This note says where the small USCIS file next to it came from. The file
holds the public federal H-1B approval counts for the one sample employer
(Wayfair) that the main sponsorship dataset does not list. Read this note to
check that the rows are real and to rebuild them yourself. Result: 4 rows, all
for WAYFAIR LLC with one Tax ID, totalling 78 initial approvals in FY2022.

## Record

- **Source:** USCIS H-1B Employer Data Hub, archived FY2022 export,
  <https://www.uscis.gov/sites/default/files/document/data/h1b_datahubexport-2022.csv>
  (listed on <https://www.uscis.gov/archive/h-1b-employer-data-hub-files>).
- **Downloaded:** 2026-10-20 by Claude Code for Nishant (nishant2681), with `curl -sS`.
  The server reported `Last-Modified: Fri, 27 Jan 2023 17:15:50 GMT`.
- **Full file:** 4,040,115 bytes, 59,983 data rows, all `Fiscal Year` 2022,
  sha256 `692cc11c7d48739d5ff4363a6ba7cbe0c422334c417dd88813aa1ff596d5f879`.
  Kept untracked at `data/80-days-to-stay/scratch/uscis-fy2022/` (gitignored, `.gitignore:34`).
- **Columns:** `Fiscal Year, Employer, Initial Approval, Initial Denial,
  Continuing Approval, Continuing Denial, NAICS, Tax ID, State, City, ZIP`.
  The six-way petition-type split described in USCIS's glossary is not in this
  file.
- **Filter:** sample employers in `jobs.sample.json` with no row in
  `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`
  (`sponsorship.find_company` returns none; Deloitte matches several rows, so it
  is not missing), then USCIS rows whose `normalize_name(Employer)` equals the
  employer's normalized name exactly. Result: Wayfair only.
- **Command:** see the docstring of `../extract_uscis.py`.
- **Extract:** 4 rows, sha256 `886a4d2f974906a07706b194afa8bd43bf05f4065a5fd5dfb312693e8b315b65`.
- **Licence / terms:** neither USCIS page states one. US federal government
  works are generally public domain (17 U.S.C. §105). That is a general
  understanding, not a statement on the pages.
- **Limits:** FY2022 is not current. Counts are workers, USCIS's first decision
  only, by the petitioner's mailing address (not the worksite). No job titles.
