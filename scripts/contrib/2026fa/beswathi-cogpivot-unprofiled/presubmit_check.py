#!/usr/bin/env python3
"""presubmit_check — refuse to submit if a known past mistake has recurred.

Every check here exists because it already cost marks on the previous
assignment. The point is not to be careful; it is to make carelessness fail
loudly before a grader finds it.

  C1  personal data      — real immigration dates in any committed file (-3)
  C2  stale test counts  — a doc claims a test count the suite does not produce (-1)
  C3  stale data counts  — a doc claims a row count the data does not support (-1)
  C4  mislabelled source — self-authored fixtures labelled `record` (-1)
  C5  doc length         — domain justification over one page (-1)
  C6  unlabelled results — a headline result with no record/judgment/input label (-1)
  C7  doc/script drift    — a number in a doc that the script does not produce (-1)

Usage:  python3 presubmit_check.py [--root <repo>]
Exit:   0 all clear · 1 at least one check failed
"""
from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys

# Dates belonging to the real student. These must never appear in a committed
# file; the mode uses a fictional persona instead (DATA_CONTRACT.md).
REAL_DATE_PATTERNS = [
    r"\b2026-12-2[34]\b",
    r"\b2027-01-(?:05|22)\b",
    r"dt\.date\(\s*2026\s*,\s*12\s*,\s*2[34]\s*\)",
    r"dt\.date\(\s*2027\s*,\s*1\s*,\s*(?:5|22)\s*\)",
]

WORD_LIMIT = 450          # the assignment says one page; the ceiling is explicit
RESULT_LABELS = ("record", "model-judgment", "your-input")


class Check:
    def __init__(self):
        self.failures = []
        self.passes = []

    def ok(self, name, detail=""):
        self.passes.append((name, detail))

    def fail(self, name, detail):
        self.failures.append((name, detail))


# The one list of namespaces this script audits. mine() and the walk below both
# read it, so they cannot disagree.
SCAN_PREFIXES = (
    "scripts/contrib/2026fa/beswathi",
    "recipes/cases/2026fa",
    "course/2026fa/submissions/beswathi",
    "logs/runs/2026fa-beswathi",
)


def tracked_files(root: str) -> list[str]:
    try:
        out = subprocess.run(["git", "ls-files"], cwd=root, capture_output=True,
                             text=True, check=True).stdout
    except (subprocess.CalledProcessError, FileNotFoundError):
        return []
    return [f for f in out.splitlines() if f.strip()]


def mine(files: list[str]) -> list[str]:
    """Only this student's own namespaces — never audit someone else's files."""
    return [f for f in files if any(f.startswith(k) for k in SCAN_PREFIXES)]


def c1_personal_data(c: Check, root: str, files: list[str]):
    """-3 last time: real I-20 and OPT dates in committed files."""
    hits = []
    for f in files:
        p = os.path.join(root, f)
        if not os.path.isfile(p):
            continue
        try:
            text = open(p, encoding="utf-8", errors="replace").read()
        except OSError:
            continue
        for pat in REAL_DATE_PATTERNS:
            for m in re.finditer(pat, text):
                line = text[:m.start()].count("\n") + 1
                hits.append("%s:%d  %s" % (f, line, m.group(0)))
    if hits:
        c.fail("C1 personal data",
               "real immigration dates in committed files — DATA_CONTRACT.md "
               "requires a fictional person with invented dates:\n      "
               + "\n      ".join(hits[:12]))
    else:
        c.ok("C1 personal data", "no real immigration dates in %d tracked files" % len(files))


def c2_test_counts(c: Check, root: str, files: list[str]):
    """-1 last time: docs claimed '56 checks in 12 tests'; the suite ran 67 in 14."""
    suite = os.path.join(root, "scripts/contrib/2026fa/beswathi-cogpivot-unprofiled",
                         "test_cogpivot_unprofiled.py")
    if not os.path.exists(suite):
        c.ok("C2 test counts", "no suite yet — nothing to contradict")
        return
    r = subprocess.run([sys.executable, suite], capture_output=True, text=True)
    m = re.search(r"(\d+)\s+checks in\s+(\d+)\s+tests", r.stdout)
    if not m:
        c.fail("C2 test counts", "could not read a count from the suite output")
        return
    actual = (int(m.group(1)), int(m.group(2)))
    bad = []
    for f in files:
        p = os.path.join(root, f)
        if not p.endswith(".md") or not os.path.isfile(p):
            continue
        # Only PROSE makes a claim. A count inside a fenced block is pasted
        # terminal output — including output from a deliberately broken run,
        # where a lower count is the evidence rather than a stale figure.
        lines, in_code = [], False
        for ln in open(p, encoding="utf-8", errors="replace"):
            if ln.lstrip().startswith("```"):
                in_code = not in_code
                lines.append("")
                continue
            lines.append("" if in_code else ln)
        text = "".join(lines)
        for cm in re.finditer(r"(\d+)\s+checks\s+(?:in|across)\s+(\d+)\s+tests", text):
            claimed = (int(cm.group(1)), int(cm.group(2)))
            if claimed != actual:
                line = text[:cm.start()].count("\n") + 1
                bad.append("%s:%d claims %d checks / %d tests; suite runs %d / %d"
                           % (f, line, claimed[0], claimed[1], actual[0], actual[1]))
    if bad:
        c.fail("C2 test counts", "\n      ".join(bad))
    else:
        c.ok("C2 test counts", "every doc agrees with the suite (%d checks / %d tests)" % actual)


def c3_data_counts(c: Check, root: str, files: list[str]):
    """-1 last time: docs said 1,552 where the file holds 1,557."""
    import csv
    soc = os.path.join(root, "data/bls/compact/soc_occupation_compact.csv")
    if not os.path.exists(soc):
        c.ok("C3 data counts", "SOC table absent — skipped")
        return
    with open(soc, encoding="utf-8") as fh:
        n = sum(1 for _ in csv.DictReader(fh))
    bad = []
    for f in files:
        p = os.path.join(root, f)
        if not p.endswith(".md") or not os.path.isfile(p):
            continue
        text = open(p, encoding="utf-8", errors="replace").read()
        # Only check numbers that are CLAIMING to be the table total — the
        # denominator in "122 of 1,016 occupations", or an explicit "N
        # occupations in the table". An earlier version matched any number
        # before the word "occupations" and flagged the unprofiled count, which
        # is a different quantity and correctly differs.
        claims = []
        for m in re.finditer(r"of\s+([\d,]{3,})\s+occupations", text):
            claims.append((m.start(), int(m.group(1).replace(",", ""))))
        for m in re.finditer(r"([\d,]{3,})\s+occupations\s+in\s+the(?:\s+shipped)?\s+table",
                             text, re.I):
            claims.append((m.start(), int(m.group(1).replace(",", ""))))
        for pos, claimed in claims:
            if claimed != n:
                line = text[:pos].count("\n") + 1
                bad.append("%s:%d claims a table of %d occupations; it has %d"
                           % (f, line, claimed, n))
    if bad:
        c.fail("C3 data counts", "\n      ".join(bad))
    else:
        c.ok("C3 data counts", "occupation counts agree with the shipped table (%d)" % n)


def c4_source_labels(c: Check, root: str, files: list[str]):
    """-1 last time: fixtures I wrote myself were labelled `record`.

    Anything this student authored is `your-input`, even when repo logic ran
    over it. The classifier being real does not make the input a record.
    """
    bad = []
    for f in files:
        p = os.path.join(root, f)
        if not os.path.isfile(p) or not (p.endswith(".py") or p.endswith(".md")):
            continue
        text = open(p, encoding="utf-8", errors="replace").read()
        for m in re.finditer(r'"record[^"\n]*fixture[^"\n]*"', text, re.I):
            line = text[:m.start()].count("\n") + 1
            bad.append("%s:%d  %s  <- a fixture is your-input, not a record"
                       % (f, line, m.group(0)[:70]))
    if bad:
        c.fail("C4 source labels", "\n      ".join(bad))
    else:
        c.ok("C4 source labels", "no fixture-derived value is labelled `record`")


def c5_doc_length(c: Check, root: str, files: list[str]):
    """-1 last time: the domain justification ran to ~2,250 words against a one-page limit."""
    # Match the submission's justification SPECIFICALLY. An earlier version
    # matched any path ending "DOMAIN.md", which would also have caught the
    # repository's own root DOMAIN.md — a maintained index this student must
    # never edit, and one that would fail a 450-word limit written for a
    # one-page justification.
    targets = [f for f in files
               if f.startswith("course/2026fa/submissions/beswathi/")
               and os.path.basename(f).upper() in
                   ("DOMAIN-JUSTIFICATION.MD", "DOMAIN.MD")]
    if not targets:
        c.ok("C5 doc length", "no domain justification yet")
        return
    bad = []
    for f in targets:
        p = os.path.join(root, f)
        words = len(open(p, encoding="utf-8", errors="replace").read().split())
        if words > WORD_LIMIT:
            bad.append("%s is %d words; the limit is one page (~%d)" % (f, words, WORD_LIMIT))
    if bad:
        c.fail("C5 doc length", "\n      ".join(bad))
    else:
        c.ok("C5 doc length", "; ".join(
            "%s %d words" % (f, len(open(os.path.join(root, f), encoding="utf-8",
                                         errors="replace").read().split()))
            for f in targets))


def c6_result_labels(c: Check, root: str, files: list[str]):
    """-1 last time: inputs were labelled but results were not.

    A headline result line must carry a source label, so a reader sees what the
    conclusion rests on and not only what went into it.
    """
    runs = [f for f in files
            if (("/runs/" in f and f.endswith(".md"))
                or os.path.basename(f) == "WORKED-RUN.md")]
    # A sentence that states an OUTCOME. Inputs were labelled last time; results
    # were not, and that cost a point.
    result_pat = re.compile(
        r"\*\*(?:Apply|Scored|Refused|Result|What it produced|The result)\b"
        r"|\b(?:scored|refused|produced|returned|found)\b[^.]{0,80}?\b\d+\b",
        re.I)
    bad = []
    for f in runs:
        p = os.path.join(root, f)
        if not os.path.isfile(p):
            continue
        in_code = False
        for i, line in enumerate(open(p, encoding="utf-8", errors="replace"), 1):
            if line.lstrip().startswith("```"):
                in_code = not in_code
                continue
            if in_code or line.lstrip().startswith("|"):
                continue          # pasted output and tables carry their own labels
            if not result_pat.search(line):
                continue
            if not any(lbl in line.lower() for lbl in RESULT_LABELS):
                bad.append("%s:%d result carries no source label: %s"
                           % (f, i, line.strip()[:72]))
    if bad:
        c.fail("C6 result labels", "\n      ".join(bad[:10]))
    else:
        c.ok("C6 result labels", "headline results carry a source label")


def c7_doc_script_drift(c: Check, root: str, files: list[str]):
    """-1 last time: docs carried numbers the code no longer produced.

    Rather than trusting prose, run the mode and compare every quantity a doc
    claims against what the script actually emits. Each claim is tied to a
    specific key, so "122 unprofiled" and "119 aggregate rows" are checked as
    the different quantities they are instead of being confused for each other.
    """
    import json as _json
    script = os.path.join(root, "scripts/contrib/2026fa/beswathi-cogpivot-unprofiled",
                          "cogpivot_unprofiled.py")
    if not os.path.exists(script):
        c.ok("C7 doc/script drift", "no mode script yet")
        return
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        r = subprocess.run([sys.executable, script, "--out-dir", td],
                           capture_output=True, text=True)
        if r.returncode != 0:
            c.fail("C7 doc/script drift", "the mode did not run: %s" % r.stderr[-200:])
            return
        with open(os.path.join(td, "cogpivot-unprofiled.json"), encoding="utf-8") as fh:
            cov = _json.load(fh)["coverage"]

    # phrase -> the key whose value that phrase must equal
    claims = [
        (r"([\d,]+)\s+of\s+[\d,]+\s+occupations[^.]{0,40}(?:unscorable|no score|unprofiled)",
         "unprofiled"),
        (r"([\d,]+)\s+(?:unprofiled|unscorable)\s+(?:occupations|rows)", "unprofiled"),
        (r"([\d,]+)\s+aggregate\s+`?\.00`?\s+(?:parent\s+)?rows", "unprofiled_dot00"),
        (r"([\d,]+)\s+of\s+the\s+[\d,]+\s+unscorable\s+rows\s+end\s+in", "unprofiled_dot00"),
        # Capture the LEADING number. "45 of the 122 are named occupations"
        # previously matched 122 — the figure nearest the phrase, not the claim.
        (r"([\d,]+)(?:\s+of\s+(?:the\s+)?[\d,]+)?\s+are\s+named\s+occupations",
         "unprofiled_named"),
        (r"([\d,]+)\s+detailed\s+rows\s+with\s+no\s+profile", "unprofiled_detailed"),
    ]
    bad = []
    for f in files:
        fp = os.path.join(root, f)
        if not fp.endswith(".md") or not os.path.isfile(fp):
            continue
        text = open(fp, encoding="utf-8", errors="replace").read()
        for pat, key in claims:
            for m in re.finditer(pat, text, re.I):
                claimed = int(m.group(1).replace(",", ""))
                if claimed != cov[key]:
                    line = text[:m.start()].count("\n") + 1
                    bad.append("%s:%d claims %d for `%s`; the script emits %d"
                               % (f, line, claimed, key, cov[key]))
    if bad:
        c.fail("C7 doc/script drift", "\n      ".join(bad[:10]))
    else:
        c.ok("C7 doc/script drift",
             "docs agree with the script (unprofiled %d = %d aggregate + %d detailed)"
             % (cov["unprofiled"], cov["unprofiled_dot00"], cov["unprofiled_detailed"]))


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=None)
    a = ap.parse_args(argv)
    root = a.root or os.path.abspath(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", ".."))

    files = mine(tracked_files(root))
    # Include not-yet-committed work so a problem is caught before it is staged.
    for base, _, names in os.walk(root):
        rel = os.path.relpath(base, root)
        # Must mirror mine() exactly. These drifted apart once already: the walk
        # still named assignments/ after the work moved to course/, so the
        # submission directory was never scanned and C7 silently passed.
        if not any(rel.startswith(k) or k.startswith(rel) for k in SCAN_PREFIXES):
            continue
        for n in names:
            f = os.path.normpath(os.path.join(rel, n))
            # The directory test above is only a cheap way to prune the walk —
            # it deliberately descends into parents of a prefix (logs/runs is a
            # parent of logs/runs/2026fa-beswathi). The PER-FILE test is the
            # authoritative one. Without it this walked into logs/RUN_LOG.md and
            # other students' recipes, and would have reported their content as
            # this student's violation.
            if not any(f.startswith(k) for k in SCAN_PREFIXES):
                continue
            if f not in files and not n.endswith(".pyc"):
                files.append(f)

    c = Check()
    for fn in (c1_personal_data, c2_test_counts, c3_data_counts,
               c4_source_labels, c5_doc_length, c6_result_labels,
               c7_doc_script_drift):
        fn(c, root, files)

    print("presubmit_check — every check here is a mistake that already cost marks")
    print()
    for name, detail in c.passes:
        print("  PASS  %-20s %s" % (name, detail))
    for name, detail in c.failures:
        print("  FAIL  %-20s %s" % (name, detail))
    print()
    if c.failures:
        print("  %d check(s) failed — do not submit until these are fixed." % len(c.failures))
        return 1
    print("  all %d checks passed." % len(c.passes))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
