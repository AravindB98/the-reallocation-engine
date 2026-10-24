"""BROKEN mutant (fixture only, never production): treats an empty field as 0.

The test suite swaps this in for lookup.parse_number and must then fail its
missing-is-never-zero checks. If the suite still passes with this mutant, the
tests are not testing anything.
"""


def parse_number(raw):
    if raw is None or str(raw).strip().lower() in {"", "null", "none", "nan", "n/a"}:
        return 0.0
    return float(raw)
