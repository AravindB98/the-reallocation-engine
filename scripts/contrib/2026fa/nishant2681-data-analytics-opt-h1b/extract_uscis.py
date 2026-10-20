"""extract_uscis.py — builds the small USCIS extract the prototype commits.

The full USCIS FY2022 Employer Data Hub file is downloaded to an untracked
folder and never committed. This script keeps only the rows for sample
employers that have NO row in the 80 Days CSV, using the same exact
normalized-name match as sponsorship.find_uscis_employer.

    python3 scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/extract_uscis.py \
      --source data/80-days-to-stay/scratch/uscis-fy2022/h1b_datahubexport-2022.csv \
      --jobs   scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/jobs.sample.json \
      --csv    data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv \
      --out    scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/uscis-fy2022.extract.csv

Refuses to overwrite --out. Standard library only.
"""

import argparse
import csv
import hashlib
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import sponsorship  # noqa: E402


# Read the command-line options; all of them are required.
def parse_args(argv):
    parser = argparse.ArgumentParser(description="Extract USCIS rows for sample employers missing from the 80 Days CSV.")
    for name in ["--source", "--jobs", "--csv", "--out"]:
        parser.add_argument(name, required=True)
    return parser.parse_args(argv)


# Fingerprint a file, so the provenance note can name the exact version.
def sha256_of(path):
    digest = hashlib.sha256()
    with open(path, "rb") as fh:
        for block in iter(lambda: fh.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


# The sample companies that have no 80 Days row. A company that matches
# several rows (Deloitte) IS in the CSV, so it is not missing.
def missing_companies(jobs, rows):
    missing = set()
    for job in jobs:
        if "csv_company_name" in job:
            continue
        try:
            if sponsorship.find_company(job["company"], rows) is None:
                missing.add(job["company"])
        except sponsorship.AmbiguousCompanyError:
            pass
    return sorted(missing)


def main(argv=None):
    args = parse_args(argv)
    if os.path.exists(args.out):
        print(f"STOP: {args.out} already exists; refusing to overwrite.", file=sys.stderr)
        sys.exit(2)

    with open(args.jobs, encoding="utf-8") as fh:
        jobs = json.load(fh)["jobs"]
    missing = missing_companies(jobs, sponsorship.load_rows(args.csv))
    keys = {sponsorship.normalize_name(name) for name in missing}

    with open(args.source, newline="", encoding="utf-8-sig") as fh:
        fieldnames = csv.DictReader(fh).fieldnames
    kept = [r for r in sponsorship.load_uscis_rows(args.source) if sponsorship.normalize_name(r["Employer"]) in keys]

    with open(args.out, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(kept)

    print(f"missing from the 80 Days CSV: {', '.join(missing) or 'none'}")
    print(f"source: {args.source} ({os.path.getsize(args.source)} bytes, sha256 {sha256_of(args.source)})")
    print(f"kept {len(kept)} row(s) -> {args.out} (sha256 {sha256_of(args.out)})")


if __name__ == "__main__":
    main()
