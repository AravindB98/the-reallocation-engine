#!/usr/bin/env python3

import argparse
import csv
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]

DATASET_PATH = (
    REPO_ROOT
    / "data"
    / "80-days-to-stay"
    / "80-days-csv"
    / "mapped_student_employment_targets_v3.csv"
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Look up historical sponsorship evidence for a target company."
    )

    parser.add_argument(
        "--company",
        required=True,
        help="Company name to search for.",
    )

    parser.add_argument(
        "--role",
        required=True,
        help="Target role being evaluated.",
    )

    parser.add_argument(
    "--out-dir",
    required=True,
    help="Directory where the JSON and Markdown reports will be written.",
)

    return parser.parse_args()

def load_companies(dataset_path):
    if not dataset_path.exists():
        raise FileNotFoundError(
            f"Required sponsorship dataset not found: {dataset_path}"
        )

    with dataset_path.open(
        newline="",
        encoding="utf-8-sig",
    ) as file:
        return list(csv.DictReader(file))

def normalize_company_name(name):
    legal_suffixes = {
        "inc",
        "incorporated",
        "llc",
        "corp",
        "corporation",
        "ltd",
        "limited",
    }

    words = name.lower().replace(",", "").replace(".", "").split()

    while words and words[-1] in legal_suffixes:
        words.pop()

    return " ".join(words)

def clean_value(value):
    if value is None:
        return None

    value = value.strip()

    if value in {"", "null", "NULL", "None", "none", "NaN", "nan", "N/A", "n/a"}:
        return None

    return value


def find_company(rows, company_name):
    target = normalize_company_name(company_name)

    for row in rows:
        dataset_name = row.get("company_name", "")

        if normalize_company_name(dataset_name) == target:
            return row

    return None

def extract_sponsorship_evidence(company):
    return {
        "total_approvals": clean_value(company.get("Total Approvals")),
        "total_denials": clean_value(company.get("Total Denials")),
        "approval_rate": clean_value(company.get("Approval_Rate")),
        "median_salary_offered": clean_value(
            company.get("median_salary_offered")
        ),
        "top_job_titles_sponsored": clean_value(
            company.get("top_job_titles_sponsored")
        ),
    }

def has_sponsorship_evidence(evidence):
    return any(value is not None for value in evidence.values())


def write_reports(out_dir, company_input, role_input, company, evidence, status):
    output_dir = Path(out_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    matched_company = company["company_name"] if company else None

    agent_report = {
        "company_input": {
            "value": company_input,
            "source": "your-input",
        },
        "target_role": {
            "value": role_input,
            "source": "your-input",
        },
        "company_match": {
            "value": matched_company,
            "source": "record",
        },
        "sponsorship_evidence": {
            "total_approvals": {
                "value": evidence.get("total_approvals"),
                "source": "record",
            },
            "total_denials": {
                "value": evidence.get("total_denials"),
                "source": "record",
            },
            "approval_rate": {
                "value": evidence.get("approval_rate"),
                "source": "record",
            },
            "median_salary_offered": {
                "value": evidence.get("median_salary_offered"),
                "source": "record",
            },
            "top_job_titles_sponsored": {
                "value": evidence.get("top_job_titles_sponsored"),
                "source": "record",
            },
        },
        "evidence_status": {
            "value": status,
            "source": "record",
        },
        "limitations": [
            "Historical sponsorship evidence does not establish sponsorship for the current role.",
            "Missing sponsorship evidence is treated as unknown, not as evidence of non-sponsorship.",
            "A company that cannot be confidently matched is reported as not found rather than guessed.",
        ],
    }

    json_path = output_dir / "agent-report.json"

    with json_path.open("w", encoding="utf-8") as file:
        json.dump(agent_report, file, indent=2)

    markdown_path = output_dir / "human-report.md"

    def display(value):
        return value if value is not None else "unknown"

    markdown = f"""# Frontend / Full-Stack Sponsorship Triage

## Input

- Company: {company_input} (`your-input`)
- Target role: {role_input} (`your-input`)

## Company Match

- Matched company: {display(matched_company)} (`record`)

## Historical Sponsorship Evidence

- Total approvals: {display(evidence.get("total_approvals"))} (`record`)
- Total denials: {display(evidence.get("total_denials"))} (`record`)
- Approval rate: {display(evidence.get("approval_rate"))} (`record`)
- Median salary offered: {display(evidence.get("median_salary_offered"))} (`record`)
- Sponsored job titles: {display(evidence.get("top_job_titles_sponsored"))} (`record`)

## Evidence Status

{status}

## Limitations

- Historical sponsorship evidence does not establish sponsorship for the current role.
- Missing sponsorship evidence is treated as unknown, not as evidence of non-sponsorship.
- A company that cannot be confidently matched is reported as not found rather than guessed.

## Human Check

The job seeker must verify the current job description, employer sponsorship policy, and job-posting liveness before deciding whether to apply.
"""

    with markdown_path.open("w", encoding="utf-8") as file:
        file.write(markdown)

    print(f"JSON report: {json_path}")
    print(f"Markdown report: {markdown_path}")


def main():
    args = parse_args()

    print(f"Company: {args.company}")
    print(f"Target role: {args.role}")

    rows = load_companies(DATASET_PATH)

    print(f"Loaded {len(rows)} company records.")

    company = find_company(rows, args.company)

    if company is None:
     print("Company match: NOT FOUND")

     status = "COMPANY_NOT_FOUND"

     print(f"Evidence status: {status}")
     print(
        "Warning: No confident company match was found. "
        "This does not establish that the company lacks sponsorship history."
     )

     write_reports(
        args.out_dir,
        args.company,
        args.role,
        None,
        {},
        status,
     )
     return

    print(f"Company match: {company['company_name']}")

    evidence = extract_sponsorship_evidence(company)

    print()
    print("Sponsorship evidence:")
    print(f"  Total approvals: {evidence['total_approvals'] or 'unknown'}")
    print(f"  Total denials: {evidence['total_denials'] or 'unknown'}")
    print(f"  Approval rate: {evidence['approval_rate'] or 'unknown'}")
    print(
        f"  Median salary offered: "
        f"{evidence['median_salary_offered'] or 'unknown'}"
    )
    print(
        f"  Sponsored job titles: "
        f"{evidence['top_job_titles_sponsored'] or 'unknown'}"
    )
    print("  Evidence source: record")

    print()


    if has_sponsorship_evidence(evidence):
     status = "HISTORICAL_SPONSORSHIP_EVIDENCE_FOUND"
    else:
     status = "SPONSORSHIP_EVIDENCE_UNKNOWN"

    print(f"Evidence status: {status}")

    print(
        "Warning: Historical sponsorship evidence does not establish "
        "sponsorship for the current role."
    )

    write_reports(
    args.out_dir,
    args.company,
    args.role,
    company,
    evidence,
    status,
    )


if __name__ == "__main__":
    main()
