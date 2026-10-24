"""BROKEN-uscis-no-cap.py — a deliberate mutant for a break attempt. Never use it.

It is sponsorship.assign_uscis_tier with the tier cap removed: a USCIS-only
employer with 10 or more initial approvals is rated Proven (p 0.9), even though
the USCIS file has no job titles. tests/test_uscis.py checks that the cap test
catches this mutant (CONTRIBUTING.md:50: mutants live in fixtures/ as BROKEN-*).
"""


# The mutant: same shape as the real function, minus the cap.
def assign_uscis_tier(record):
    if record is None:
        return {"tier": "Unknown", "p": None, "reason": "no-match-either-source"}
    if record["approvals"] >= 10:
        return {"tier": "Proven", "p": 0.9, "reason": "mutant: no cap"}
    if record["approvals"] >= 1:
        return {"tier": "Possible", "p": 0.3, "reason": "mutant"}
    return {"tier": "Unknown", "p": None, "reason": "uscis-zero-approvals"}
