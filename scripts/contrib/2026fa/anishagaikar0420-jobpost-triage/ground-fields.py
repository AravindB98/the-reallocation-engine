#!/usr/bin/env python3
"""ground-fields.py — verify that every extracted job-posting field is backed by the posting.

The rule (from the JobPost Contracts idea): a field is either
  (a) a value WITH a verbatim quote that appears in the posting text, or
  (b) the literal "not stated" with NO quote.
Anything else fails. Pure string checks: no network, no LLM.

Checks, in order, per field:
  quote-present      value given but quote missing/empty                      -> FAIL ungrounded
  quote-length       quote shorter than --min-quote-chars                     -> FAIL quote_too_short
  quote-in-posting   whitespace/quote-normalized substring test               -> FAIL quote_not_in_posting
  numbers-in-quote   every number in the value appears in the quote           -> FAIL value_not_in_quote
  items-in-quote     "kind": "list" fields only: every comma-separated item of the
                     value appears in at least one quote ("quote" may be a list)  -> FAIL item_not_in_quote
  not-stated-cue     "not stated" but a cue (salary '$', 'remote') IS in text -> FAIL missed_value

WHAT THIS CANNOT CATCH (documented, tested as a known gap): a real quote attached to
the wrong field or a wrong claim (e.g. seniority="entry level" quoting an unrelated
sentence that contains no number). Existence is not support. A human reads those.
The items-in-quote check narrows the gap only for fields declared "kind": "list";
every other field is still checked for existence, not support.

Usage:
  python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/ground-fields.py <extraction.json> [--json out.json] [--md out.md]
extraction.json = {"posting_text": "..."  OR  "posting_file": "path.txt",
                   "fields": {"title": {"value": "...", "quote": "..." | null}, ...}}
Exit: 0 all fields grounded; 1 any FAIL; 2 bad input.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

NOT_STATED = "not stated"
MIN_QUOTE_CHARS = 8  # [DEFINE] a 1-word quote can "ground" almost anything; 8 is a floor, not a theory.
CUES = {  # deterministic cues that a field's value SHOULD exist if the text contains them
    "salary": re.compile(r"\$\s?\d"),
    "remote": re.compile(r"\bremote\b", re.I),
}


def norm(s: str) -> str:
    s = s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    return re.sub(r"\s+", " ", s).strip()


def numbers(s: str) -> list[str]:
    return [n.replace(",", "") for n in re.findall(r"\d[\d,]*(?:\.\d+)?", s)]


def check_field(name: str, f: dict, text_n: str, text_raw: str, min_chars: int) -> dict:
    value = (f.get("value") or "").strip()
    quote = f.get("quote")
    res = {"field": name, "value": value, "quote": quote, "verdict": "PASS", "reason": "grounded"}

    def fail(reason):
        res.update(verdict="FAIL", reason=reason)
        return res

    if value.lower() == NOT_STATED:
        if quote:
            return fail("not_stated_must_have_no_quote")
        cue = CUES.get(name.lower())
        if cue and cue.search(text_raw):
            return fail("missed_value: cue present in posting but field marked not stated")
        res["reason"] = "not stated (absence is only cue-checked for salary/remote; otherwise unverified)"
        return res
    if not value:
        return fail("empty_value")
    kind = f.get("kind")
    if kind not in (None, "list"):
        return fail(f"unknown_kind: {kind!r} (only 'list' is defined)")
    raw = quote if isinstance(quote, list) else [quote]
    if any(x is not None and not isinstance(x, str) for x in raw):
        return fail("quote_not_string")
    quotes = [norm(x) for x in raw if isinstance(x, str) and norm(x)]
    if not quotes:
        return fail("ungrounded: value has no quote")
    for q in quotes:
        if len(q) < min_chars:
            return fail(f"quote_too_short ({len(q)} < {min_chars})")
        if q not in text_n:
            return fail("quote_not_in_posting")
    qn = {n for q in quotes for n in numbers(q)}
    missing = [n for n in numbers(value) if n not in qn]
    if missing:
        return fail(f"value_not_in_quote: {missing}")
    if kind == "list":  # every comma-separated item must appear in at least one quote
        joined = " ".join(quotes).lower()
        absent = [i for i in (s.strip() for s in value.split(",")) if i and i.lower() not in joined]
        if absent:
            return fail(f"item_not_in_quote: {absent}")
    return res


def run(doc: dict, min_chars: int = MIN_QUOTE_CHARS, base: Path | None = None) -> dict:
    if "posting_text" in doc:
        text = doc["posting_text"]
    elif "posting_file" in doc:
        pf = Path(doc["posting_file"])
        if not pf.is_absolute() and base is not None:
            pf = base / pf
        text = pf.read_text(encoding="utf-8")
    else:
        raise ValueError("need posting_text or posting_file")
    fields = doc.get("fields")
    if not isinstance(fields, dict) or not fields:
        raise ValueError("need non-empty fields object")
    text_n = norm(text)
    results = [check_field(k, v, text_n, text, min_chars) for k, v in fields.items()]
    fails = [r for r in results if r["verdict"] == "FAIL"]
    return {"schema": "ground-fields/1", "fields_checked": len(results), "passed": len(results) - len(fails),
            "failed": len(fails), "results": results}


def to_md(rep: dict) -> str:
    out = ["## Executive summary", "",
           f"This report checks whether each fact pulled from a job posting can be traced to a line in that posting. "
           f"{rep['passed']} of {rep['fields_checked']} fields are traceable; {rep['failed']} are not. "
           "A passing field means the quote exists in the posting, NOT that the quote supports the claim; a person must read those.",
           "", "| Field | Verdict | Reason |", "|---|---|---|"]
    out += [f"| {r['field']} | {r['verdict']} | {r['reason']} |" for r in rep["results"]]
    return "\n".join(out) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("extraction")
    ap.add_argument("--min-quote-chars", type=int, default=MIN_QUOTE_CHARS)
    ap.add_argument("--json", default=None)
    ap.add_argument("--md", default=None)
    a = ap.parse_args()
    try:
        p = Path(a.extraction)
        rep = run(json.loads(p.read_text(encoding="utf-8")), a.min_quote_chars, p.parent)
    except (OSError, ValueError, json.JSONDecodeError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    if a.json:
        Path(a.json).write_text(json.dumps(rep, indent=2) + "\n", encoding="utf-8")
    if a.md:
        Path(a.md).write_text(to_md(rep), encoding="utf-8")
    for r in rep["results"]:
        print(f"{r['verdict']:4}  {r['field']:<12} {r['reason']}")
    print(f"ground-fields: {rep['passed']}/{rep['fields_checked']} grounded")
    return 1 if rep["failed"] else 0


if __name__ == "__main__":
    sys.exit(main())
