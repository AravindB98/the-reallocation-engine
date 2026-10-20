#!/usr/bin/env python3
"""tailor_or_ask.py — does this ML/AI posting deserve a tailored application?

Recipe: recipes/cases/2026fa/sukethrp-ml-tailor-or-ask.md

For each posting in a queue the mode runs every check it has, then suggests one of:
  TAILOR     every gate is open and the engine's scorer says Apply
  ASK FIRST  the evidence is soft or unknown in one specific way; the report gives the question to ask
  MOVE ON    the posting is closed, or the scorer says Skip
  HOLD       a check could not be resolved, so the mode makes no recommendation; the report says what
             to resolve. Withheld dates are a HOLD: nothing that depends on timing is recommended.
The person decides every posting. A decision written into the queue (choice, reason, by, at) is
logged next to the suggestion; the mode never decides on anyone's behalf.

Checks (all of them run, so the report shows everything that was verified):
  input gate    queue + persona; the persona must state needs_sponsorship: true
  source gate   the 80 Days sponsorship file, pinned by SHA-256
  company       the engine's name normaliser; no match or several matches -> HOLD. A single exact-name match
                is used but labelled computed, and every reason and question names the matched row, because
                a name match is not an identity (the posting's "Meta" matches a small namesake). A person can
                record the identity decision instead (company_identity): confirmed, with what was checked and
                the sources, or a candidate not yet cleared, which HOLDs even when the name matches exactly
  sponsorship   A3's role-level check (an ML/AI title with no seniority marker on the record)
  liveness      the engine's classifier: a saved page (sample) or scripts/ats/check-liveness.mjs (--live)
  timeline      a factor declared by a named declarer with a reason, or computed (v0.2.0, book chapter 10) from
                the persona's dates and a time-to-start a person declares; missing, withheld, left unset or
                without the dates it needs -> HOLD
  fit           the person's own value with a reason; missing or left unset -> HOLD (the scorer would count
                a missing fit as zero, and a high fit never clears another gate)
  requirements  the posting's own text: required vs preferred lines, and minimum-experience lines compared
                with the documented experience (full-time and co-op/internship months counted apart).
                Every other line is listed as not checked. Live mode reads Greenhouse postings only.
  guard         guard.py refuses scorer input the scorer would quietly accept (fail closed)
  scorer        scripts/score/role-scorer.mjs through its CLI, never re-implemented

Labels: record (read from a repo record or a live check) · your-input (declared by the student) ·
model-judgment (proposed by Claude Code) · computed (produced by a script from labelled inputs: the
scorer's arithmetic, or a name match; not a fact about the world). A declared value's label comes from
its `by` field ("student" or "claude-code"), never from a default.

Outputs (in --out-dir): run-log.json (for agents), report.md (for the person), and roles.json plus
the scorer's own role-scores.json / role-scores.md when anything was scored.

Run from the repo root:
    python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py
    python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py --queue <queue.json> --out-dir <dir> [--live]
Your own data (outputs are forced under private/, which git ignores):
    python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py --private \\
        --persona search/profile.yml --queue private/<queue.json> --out-dir private/<run>

Exit codes: 0 run complete (HOLD is not a failure) · 1 run void (the scorer broke its contract)
· 2 stopped at the input or source gate · 3 the guard refused the scorer input.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import importlib.util
import json
import re
import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import evidence as ev  # noqa: E402  (this folder has no package name)
import guard  # noqa: E402
import requirements as rq  # noqa: E402
import timeline as tl  # noqa: E402

from evidence import MODEL, REC, YOU, Stop, lab, show  # noqa: E402

COMP = "computed"  # a script's result from labelled inputs (the scorer's arithmetic, a name match), not a fact

REPO = ev.REPO
WORKFLOW = ev.WORKFLOW
RECIPE = f"recipes/cases/2026fa/{WORKFLOW}.md"
RECIPE_VERSION = "0.2.1"
DEFAULT_QUEUE = HERE / "fixtures" / "sample-queue.json"
DEFAULT_RULES = HERE / "rules.json"
WRITABLE_PREFIXES = ["output/", "course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/"]
PRIVATE_PREFIX = "private/"
CHOICES = ("TAILOR", "ASK FIRST", "MOVE ON", "HOLD")
LIVE_RESULTS = ("active", "expired", "uncertain")
GREENHOUSE_WATCH = REPO / ".claude" / "skills" / "greenhouse-watch" / "scripts" / "greenhouse_watch.py"
GREENHOUSE_JOB = re.compile(r"^https://(?:job-boards|boards)\.greenhouse\.io/([a-z0-9][a-z0-9-]{0,63})/jobs/(\d+)")

HOLD_CHECKS = {
    "no-company-match": "The company name on the posting matched no company in the sponsorship file exactly. "
                        "The file uses legal names (for example '... INC'). Find the legal name and add its row "
                        "number as `csv_row` in the queue, or accept that the file does not cover this company.",
    "ambiguous-company-match": "Several companies in the file share this name. Pick the right one from the "
                               "candidates and add its row number as `csv_row` in the queue.",
    "csv-row-not-found": "The `csv_row` given in the queue does not exist in the file. Check the number.",
    "no-approvals-on-record": "The H-1B record shows zero approvals. Read the record yourself before deciding; "
                              "the mode will not call it either way.",
    "unparseable-sponsored-titles": "The file's sponsored-title list for this company could not be read, so "
                                    "the role-level check cannot run. Read the row yourself.",
    "shared-h1b-record": "This company's H-1B record appears, value for value, on a company with a different "
                         "name. The join behind the file can copy one employer's history onto a lookalike, so "
                         "this record may not be this company's. Check public H-1B / LCA records; if it is "
                         "theirs, add `shared_record_checked` with what you checked.",
    "liveness-unchecked": "Nobody checked whether this posting is open. Run with --live, or open the posting "
                          "yourself and record what you saw in the queue.",
    "liveness-uncertain": "The liveness check could not tell whether the posting is open (the page had content "
                          "but no apply control). Open it yourself.",
    "stale-liveness": "The posting check is older than the allowed age. Check it again before deciding.",
    "liveness-date-after-run-date": "The posting check is dated after this run's date. Fix the date.",
    "host-not-allowed": "Live mode only checks job-board hosts the rules name. Open this posting yourself.",
    "redirects-off-allowed-host": "The job board forwards this posting to a host the rules do not name, so the "
                                  "mode did not follow it. Open the posting yourself and record what you saw.",
    "liveness-check-failed": "The live check returned no result for this posting. See the liveness output in "
                             "the log.",
    "timeline-missing": "No timeline factor was given, so nothing that depends on timing is recommended. "
                        "State a factor between 0 and 1 with its reason, or leave the posting on HOLD.",
    "posting-text-unavailable": "The mode has no text for this posting (sample mode: no saved text; live mode: "
                                "only Greenhouse postings are read in this version), so its requirements are "
                                "unchecked. Read them yourself, or leave the posting on HOLD.",
    "posting-text-fetch-failed": "The posting's text could not be fetched from the job board's public API. See "
                                 "the posting-text output in the log, and read the posting yourself.",
    "identity-unconfirmed": "A person marked this company row as a candidate, not a confirmed identity. Confirm the "
                            "employer behind the row (legal name, location, website) and record it as confirmed "
                            "before any sponsorship evidence is used.",
    "fit-unset": "The person left fit unset, with the reason recorded. Nothing that depends on fit is recommended "
                 "until they state one.",
    "timeline-unset": "The person left the timeline unset, with the reason recorded. Nothing that depends on timing is "
                      "recommended until they state one.",
    "fit-missing": "No fit value was given. Without one the engine's scorer counts fit as zero, which pushes "
                   "every posting toward Skip. Read the posting's requirements and state a fit between 0 and 1 "
                   "with its reason, or leave the posting on HOLD.",
    "requirements-not-found": "No heading the rules know marks this posting's required qualifications, so none of its "
                              "requirement lines were read. Read them yourself; the heading can be added to the rules.",
    "location-unclear": "The posting's location could not be placed in or outside the US. Check the country, the work "
                        "arrangement and relocation expectations, then record it as location_checked in the queue.",
    "timeline-dates-missing": "The timeline is set to be computed, but the persona file lacks a date it needs "
                              "(EAD start, unemployment days used and their as-of date, the ceiling, the buffer). "
                              "Add them, or state a factor with its reason.",
    "timeline-withheld": "The dates needed to check timing were withheld on purpose. Nothing that depends on "
                         "timing is recommended until a factor is given.",
}

# The specific question ASK FIRST hands the person, by what made the evidence soft.
QUESTIONS = {
    "no-h1b-record": "The public H-1B data this mode reads has no sponsorship history for {company}. Does "
                     "{company} sponsor H-1B visas for the {title} role?",
    "no-h1b-record-unconfirmed": "Does {company} sponsor H-1B visas for the {title} role?",
    "marked-only": "{record} lists these ML/AI titles: {titles}. Each carries a seniority "
                   "or level marker. Has the team sponsored an early-career ML/AI engineer, or only "
                   "experienced hires?",
    "no-role-family-title": "{record} lists these sponsored titles: {titles}. None is an "
                            "ML/AI role. Does {company} sponsor ML/AI engineers at this level?",
    "thin-record": "{record} lists {titles}, from {approvals} approval(s) in total. Is "
                   "sponsoring an early-career ML/AI hire something {company} still does?",
    "consider-no-soft-spot": "No single check failed, but the evidence is middling (composite {composite}). Before "
                             "tailoring, ask whether the {title} team hires early-career engineers who will need "
                             "H-1B sponsorship.",
    "needs-context": "{record} lists these ML/AI titles: {titles}. Titles like these can "
                     "cover different levels. Were any of these roles filled by early-career engineers?",
    "requirements-conditional": "The posting requires '{line}', which gives more than one path. Which path applies "
                                "to an applicant with my documented experience, and does that experience meet it?",
    # The student's own wording (design answers, 2026-10-19), with the stated minimum filled in.
    "requirements-gap": "Is '{stated}' a firm minimum, or would you consider someone with {fewer} who has relevant "
                        "production ML experience?",
    "timeline-soft": "The timing is tight (timeline factor {factor}). Can the start date for this {title} role "
                     "move, and how long does the hiring process usually take?",
}

CANNOT_VERIFY = [
    "Whether this employer will sponsor this person for this role now. A history of sponsorship is not a "
    "policy, and policies, budgets and teams change.",
    "When a title was sponsored. The sponsorship file has no filing years, so a matching title may be old.",
    "Whether a sponsored title without a seniority word was an early-career hire. No marker is not proof.",
    "Titles beyond the file's short 'top titles' list, and companies the file does not cover (it carries "
    "H-1B fields for about 5% of its rows and covers six states).",
    "Whether the company in the file is the employer on the posting. The join behind the file has no "
    "published error rate.",
    "Most of a posting's requirements. This version checks only minimum-experience lines; skills, tools, "
    "degree and every other line are listed for the person to read, not checked.",
    "Whether the counted months are the kind of experience a line asks for ('in ML infra', 'using Python with ML "
    "frameworks'). The mode adds up the duration of every documented job; the kind is shown for a person to judge, "
    "never checked.",
    "What the sponsorship numbers mean. 0.9 and 0.6 are declared screening assumptions, not chances of "
    "sponsorship, and approvals are company-wide, not ML-engineering approvals.",
    "Employment type and hours. A job whose title doesn't say co-op, internship or similar is counted as "
    "employment of unstated type, never assumed full-time; assistantships, contract and fellowship work need "
    "supporting information before they count.",
    "Whether co-op or internship time counts toward a stated minimum, or whether a 'required' line is enforced. "
    "Postings rarely say, so that becomes the question to ask; a posting can also soften its own requirements "
    "elsewhere in its text.",
    "Whether the résumé file is complete. The mode counts only the experience the file lists, and cannot see a "
    "job listed anywhere else, such as a CV.",
    "Anything about timeline or fit. Those numbers are declared by a person (or proposed by Claude Code), "
    "not measured.",
    "Legal eligibility (OPT, STEM OPT, cap-gap). That is a question for the school's DSO or an attorney.",
    "Whether applying works. For a discovered posting, 'available' means listed on its board and returned by its "
    "job endpoint at the time checked, nothing more.",
    "What a computed timeline factor promises. It is a planning multiplier from declared dates and a declared "
    "time-to-start, not legal advice and not a forecast of any employer's hiring speed.",
]


# ── inputs ───────────────────────────────────────────────────────────────────

def scrub(output: str | None) -> str | None:
    """Captured command output can carry the local home folder (a Playwright launch error names its cache path).
    The run log is meant for a public repo, so the home folder is written as ~."""
    return output.replace(str(Path.home()), "~") if output else output


def text(x) -> bool:
    return isinstance(x, str) and x.strip() != ""


def parse_day(value) -> dt.date:
    return dt.date.fromisoformat(str(value)[:10])


def repo_path(p: str | Path) -> Path:
    p = Path(p)
    return p if p.is_absolute() else REPO / p


def inside_repo(p: Path) -> str | None:
    try:
        return p.resolve().relative_to(REPO).as_posix()
    except ValueError:
        return None


def check_declared(where: str, value, number_key: str | None, problems: list[str]) -> None:
    """A declared value: {<number_key>: 0..1, reason, by: student | claude-code}."""
    if not isinstance(value, dict):
        problems.append(f"{where} must be an object")
        return
    if value.get("by") not in ev.DECLARERS:
        problems.append(f"{where}.by must say who declared it: 'student' or 'claude-code'")
    if not text(value.get("reason")):
        problems.append(f"{where}.reason is required")
    if number_key is not None and not guard.unit_number(value.get(number_key)):
        problems.append(f"{where}.{number_key} must be a number between 0 and 1")


def load_queue(path: Path) -> dict:
    try:
        queue = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise Stop("input", f"cannot read the queue {show(path)}: {exc}")
    problems: list[str] = []
    if queue.get("queue_by") not in ev.DECLARERS:
        problems.append("`queue_by` must say who chose these postings: 'student' or 'claude-code'")
    try:
        parse_day(queue.get("as_of", ""))
    except ValueError:
        problems.append("`as_of` must be a date (YYYY-MM-DD)")
    postings = queue.get("postings")
    if not isinstance(postings, list) or not postings:
        problems.append("`postings` must be a non-empty list")
        postings = []
    seen = set()
    for i, p in enumerate(postings):
        where = f"postings[{i}]"
        if not isinstance(p, dict):
            problems.append(f"{where} must be an object")
            continue
        for key in ("posting_id", "company", "title", "url"):
            if not text(p.get(key)):
                problems.append(f"{where}.{key} is required")
        if p.get("posting_id") in seen:
            problems.append(f"{where}.posting_id {p['posting_id']!r} is duplicated")
        seen.add(p.get("posting_id"))
        if "csv_row" in p and (not isinstance(p["csv_row"], int) or isinstance(p["csv_row"], bool) or p["csv_row"] < 1):
            problems.append(f"{where}.csv_row must be a positive row number")
        if "timeline" in p:
            t = p["timeline"]
            if isinstance(t, dict) and (t.get("withheld") is True or t.get("unset") is True):
                check_declared(f"{where}.timeline", t, None, problems)
            elif isinstance(t, dict) and "compute" in t:
                check_declared(f"{where}.timeline", t, None, problems)
                weeks = (t["compute"] or {}).get("weeks") if isinstance(t["compute"], dict) else None
                if isinstance(weeks, bool) or not isinstance(weeks, (int, float)) or not 0 < weeks <= 104:
                    problems.append(f"{where}.timeline.compute.weeks must be a number of weeks between 0 and 104")
            else:
                check_declared(f"{where}.timeline", t, "factor", problems)
        if "fit" in p:
            f = p["fit"]
            check_declared(f"{where}.fit", f, None if isinstance(f, dict) and f.get("unset") is True else "p", problems)
        if "company_identity" in p:
            ci = p["company_identity"]
            if not isinstance(ci, dict) or ci.get("status") not in ("confirmed", "candidate"):
                problems.append(f"{where}.company_identity.status must be 'confirmed' or 'candidate'")
            else:
                if ci["status"] == "confirmed" and not (isinstance(ci.get("csv_row"), int) and ci["csv_row"] >= 1):
                    problems.append(f"{where}.company_identity: a confirmed identity names its csv_row")
                for key in ("checked", "by"):
                    if not text(ci.get(key)):
                        problems.append(f"{where}.company_identity.{key} is required (an identity gate is cleared by a "
                                        "named person who says what they checked)")
                if ci.get("by") == "claude-code":
                    problems.append(f"{where}.company_identity.by: an identity is confirmed by a person, never by Claude Code")
                try:
                    parse_day(ci.get("at", ""))
                except ValueError:
                    problems.append(f"{where}.company_identity.at must be a date")
            if "csv_row" in p:
                problems.append(f"{where}: give the row inside company_identity, not also as csv_row")
        if "posting_text" in p and not (isinstance(p["posting_text"], dict) and text(p["posting_text"].get("path"))):
            problems.append(f"{where}.posting_text must be {{path}} (a saved posting text file)")
        if "shared_record_checked" in p and not text(p["shared_record_checked"]):
            problems.append(f"{where}.shared_record_checked must say what you checked")
        liv = p.get("liveness")
        if liv is not None:
            if not isinstance(liv, dict) or not ("snapshot" in liv or liv.get("result") in LIVE_RESULTS):
                problems.append(f"{where}.liveness must be {{snapshot}} or {{result, checked_at, evidence}}")
            elif "result" in liv:
                try:
                    parse_day(liv.get("checked_at", ""))
                except ValueError:
                    problems.append(f"{where}.liveness.checked_at must be a date")
        if "decision" in p:
            d = p["decision"]
            if not isinstance(d, dict) or d.get("choice") not in CHOICES:
                problems.append(f"{where}.decision.choice must be one of {', '.join(CHOICES)}")
            else:
                for key in ("reason", "by"):
                    if not text(d.get(key)):
                        problems.append(f"{where}.decision.{key} is required (a gate is cleared by a named person, with a reason)")
                if d.get("by") == "claude-code":
                    problems.append(f"{where}.decision.by: a decision is made by a person, never by Claude Code")
                try:
                    parse_day(d.get("at", ""))
                except ValueError:
                    problems.append(f"{where}.decision.at must be a date")
        if "question" in p:
            q = p["question"]
            if not isinstance(q, dict) or not text(q.get("text")) or q.get("by") not in ev.DECLARERS:
                problems.append(f"{where}.question must be {{text, by: student | claude-code}}")
        if "location_checked" in p:
            lc = p["location_checked"]
            if not isinstance(lc, dict) or lc.get("result") not in ("us", "outside-us") or not text(lc.get("checked")):
                problems.append(f"{where}.location_checked must be {{result: us | outside-us, checked, by, at}}")
            elif lc.get("by") in (None, "claude-code"):
                problems.append(f"{where}.location_checked.by: a location is checked by a named person, never by Claude Code")
        if "discovered" in p and not (isinstance(p["discovered"], dict) and text(p["discovered"].get("listing_url"))):
            problems.append(f"{where}.discovered must name the board listing it came from (listing_url)")
    if "resume" in queue and not text(queue["resume"]):
        problems.append("`resume` must be a path to a résumé JSON file")
    if problems:
        raise Stop("input", "the queue failed the input gate:\n  - " + "\n  - ".join(problems))
    return queue


def load_persona(path: Path, private: bool) -> dict:
    inside = inside_repo(path)
    public = inside is not None and inside.startswith("search/examples/")
    if not public and not private:
        raise Stop("input", f"persona {show(path)} is not a fictional persona under search/examples/. "
                            "Real profiles are read only with --private, which keeps every output in private/.")
    if not path.exists():
        raise Stop("input", f"persona file not found: {show(path)}")
    persona = ev.read_yaml(path)
    if persona.get("needs_sponsorship") is not True:
        raise Stop("input", "the persona must state `needs_sponsorship: true` explicitly. This mode is for people "
                            "who need sponsorship, and free-text visa status is not trusted (the scorer reads "
                            "'work authorized' as 'no sponsorship needed').")
    persona["_public"] = public
    return persona


def prepare_out_dir(out_dir: Path, private: bool, overwrite: bool) -> Path:
    out = out_dir.resolve()
    inside = inside_repo(out)
    rel = inside + "/" if inside is not None else None
    if private:
        if rel is None or not rel.startswith(PRIVATE_PREFIX):
            raise Stop("input", "--private runs write only under private/ (git ignores it); choose an --out-dir there")
    elif rel is not None and not any(rel.startswith(p) for p in WRITABLE_PREFIXES):
        raise Stop("input", f"--out-dir {rel} is outside this mode's folders ({', '.join(WRITABLE_PREFIXES)})")
    scratch = rel is None or rel.startswith("output/") or rel.startswith(PRIVATE_PREFIX)
    if out.exists() and any(out.iterdir()) and not (overwrite or scratch):
        raise Stop("input", f"{show(out)} already holds a run. Pass --overwrite, or choose a new folder.")
    out.mkdir(parents=True, exist_ok=True)
    return out


# ── per-posting checks ───────────────────────────────────────────────────────

def check(result: str, **detail) -> dict:
    return {"result": result, **detail}


def row_summary(row_no: int, by_row: dict) -> dict:
    row = by_row[row_no]
    return {"csv_row": row_no, "company_name": row["company_name"], "city": row["city"], "state": row["state"],
            "website": row["website"], "industry": row["industry"]}


def company_check(p: dict, r: dict, index: dict, by_row: dict, normalize, queue_label: str) -> int | None:
    ci = p.get("company_identity")
    if ci is not None:  # a person's identity decision outranks any automatic match
        decided = {"by": ci["by"], "at": ci["at"], "checked": ci["checked"], "sources": ci.get("sources", []),
                   "unverified": ci.get("unverified", [])}
        row_no = ci.get("csv_row")
        if row_no is not None and row_no not in by_row:
            r["checks"]["company"] = check("unresolved", code="csv-row-not-found", csv_row=row_no)
            return None
        if ci["status"] == "candidate":
            r["checks"]["company"] = check("unresolved", code="identity-unconfirmed",
                                           candidate=row_summary(row_no, by_row) if row_no else None,
                                           decision=lab(decided, YOU))
            return None
        row = by_row[row_no]
        r["checks"]["company"] = check("pass", match=lab(row["company_name"], YOU, csv_row=row_no, confirmed=True,
                                                           basis="person",
                                                           how=f"identity confirmed by {ci['by']} on {ci['at']}",
                                                           city=row["city"], state=row["state"], website=row["website"],
                                                           checked=ci["checked"], sources=decided["sources"],
                                                           unverified=decided["unverified"]))
        return row_no
    if "csv_row" in p:
        row_no = p["csv_row"]
        if row_no not in by_row:
            r["checks"]["company"] = check("unresolved", code="csv-row-not-found", csv_row=row_no)
            return None
        source, basis, how = queue_label, "queue", "row chosen in the queue (csv_row), not confirmed by a person"
    else:
        key = normalize(p["company"])
        candidates = index.get(key, [])
        if not candidates:
            r["checks"]["company"] = check("unresolved", code="no-company-match", normalized=key)
            return None
        if len(candidates) > 1:
            r["checks"]["company"] = check("unresolved", code="ambiguous-company-match", normalized=key,
                                           candidates=[{"csv_row": n, "company_name": by_row[n]["company_name"],
                                                        "city": by_row[n]["city"], "state": by_row[n]["state"]}
                                                       for n in candidates])
            return None
        # A name match is the script's result, not a fact about who the employer is: labelled computed.
        row_no, source, basis = candidates[0], COMP, "name"
        how = f"exact normalized name '{key}': a name match, not confirmed by a person"
    row = by_row[row_no]
    r["checks"]["company"] = check("pass", match=lab(row["company_name"], source, csv_row=row_no, confirmed=False,
                                                       basis=basis, how=how, city=row["city"], state=row["state"]))
    return row_no


def sponsorship_check(p: dict, r: dict, row_no: int, by_row: dict, rules: dict, queue_label: str) -> None:
    evidence, reason = ev.sponsorship_evidence(by_row[row_no], rules)
    if reason == "no-h1b-record":
        r["checks"]["sponsorship"] = check("unknown", code=reason,
                                           note="no H-1B record in the file; unknown is not 'does not sponsor'")
        return
    if reason:
        r["checks"]["sponsorship"] = check("unresolved", code=reason)
        return
    others = ev.lookalikes(row_no, by_row)
    if others and not p.get("shared_record_checked"):
        shown = {k: v for k, v in evidence.items() if k not in ("tier", "p")}
        r["checks"]["sponsorship"] = check("unresolved", code="shared-h1b-record", shared_with=others, evidence=shown)
        return
    if others:
        for k in ("approvals", "denials", "approval_rate_pct", "median_salary_offered_company", "sponsored_titles"):
            evidence[k]["source"] = queue_label
            evidence[k]["note"] = (evidence[k].get("note", "") + " · read through a record the person vouched for: "
                                   + p["shared_record_checked"]).strip(" ·")
    gap = evidence["tier"]["gap"]
    r["checks"]["sponsorship"] = check("pass", tier=evidence["tier"]["value"], gap=gap, evidence=evidence)


def location_check(p: dict, r: dict) -> None:
    """v0.2.0, the student's call: a discovered posting whose location discover.py could not place stays unresolved
    until a person checks the country, the work arrangement and relocation expectations."""
    flags = (p.get("discovered") or {}).get("flags") or []
    if not any(f.startswith("location unclear") for f in flags):
        return
    lc = p.get("location_checked")
    if lc is None:
        r["checks"]["location"] = check("unresolved", code="location-unclear", listed=p["discovered"].get("location"))
    else:
        r["checks"]["location"] = check("pass" if lc["result"] == "us" else "outside-us",
                                        decision=lab(lc, YOU), listed=p["discovered"].get("location"))


def section_label(rules: dict, section: str) -> str:
    """A rules section added after the file's adoption carries its own declarer (v0.2.0)."""
    who = ((rules.get(section) or {}).get("declared_by") or {}).get("who")
    return ev.label_for(who) if who in ev.DECLARERS else rules["_label"]


def timeline_check(p: dict, r: dict, persona: dict | None = None, as_of: dt.date | None = None,
                   rules: dict | None = None) -> None:
    t = p.get("timeline")
    if isinstance(t, dict) and "compute" in t:
        got = tl.compute((persona or {}).get("visa"), as_of, t["compute"]["weeks"])
        if got["result"] != "pass":
            r["checks"]["timeline"] = check("unresolved", code=got["code"], missing=got["missing"],
                                            reason=lab(t["reason"], ev.label_for(t["by"])))
            return
        # your-input only when a person declared the weeks and adopted the formula; otherwise model-judgment
        label = YOU if ev.label_for(t["by"]) == YOU and section_label(rules, "timeline") == YOU else MODEL
        r["checks"]["timeline"] = check("pass", factor=lab(got["factor"], label, reason=t["reason"], computed=True,
                                                           weeks=got["weeks"], dates=got["dates"], why=got["why"],
                                                           days_left=got["days_left"]))
        return
    if t is None:
        r["checks"]["timeline"] = check("unresolved", code="timeline-missing")
    elif t.get("withheld") is True:
        r["checks"]["timeline"] = check("unresolved", code="timeline-withheld",
                                        reason=lab(t["reason"], ev.label_for(t["by"])))
    elif t.get("unset") is True:
        r["checks"]["timeline"] = check("unresolved", code="timeline-unset",
                                        reason=lab(t["reason"], ev.label_for(t["by"])))
    else:
        r["checks"]["timeline"] = check("pass", factor=lab(t["factor"], ev.label_for(t["by"]), reason=t["reason"]))


def fit_check(p: dict, r: dict) -> None:
    f = p.get("fit")
    if f is None:
        r["checks"]["fit"] = check("unresolved", code="fit-missing")
    elif f.get("unset") is True:
        r["checks"]["fit"] = check("unresolved", code="fit-unset", reason=lab(f["reason"], ev.label_for(f["by"])))
    else:
        r["checks"]["fit"] = check("pass", p=lab(f["p"], ev.label_for(f["by"]), reason=f["reason"]))


def greenhouse_api_url(url: str) -> str | None:
    m = GREENHOUSE_JOB.match(url)
    return f"https://boards-api.greenhouse.io/v1/boards/{m.group(1)}/jobs/{m.group(2)}" if m else None


BOARD_API_METHOD = ("board/API availability at the time checked: listed when discover.py read the board, and returned "
                    "by the same posting's job endpoint (boards-api.greenhouse.io); this does not show the application "
                    "process works")


def discovered_api_url(p: dict) -> str | None:
    """A posting discover.py found: its Greenhouse job endpoint, from the board slug and the job id. Many companies
    serve their Greenhouse board from their own site, so the posting's public URL is not a Greenhouse URL."""
    d = p.get("discovered") or {}
    board, job = str(d.get("board", "")), d.get("job_id")
    if board.startswith("greenhouse/") and str(job).isdigit():
        return f"https://boards-api.greenhouse.io/v1/boards/{board.split('/', 1)[1]}/jobs/{job}"
    return None


def fetch_posting_json(api_url: str) -> dict:
    """One request through the engine's own allow-listed, no-redirect Greenhouse fetcher
    (.claude/skills/greenhouse-watch/scripts/greenhouse_watch.py fetch_board). Network."""
    ev.network_guard()
    spec = importlib.util.spec_from_file_location("greenhouse_watch", GREENHOUSE_WATCH)
    gw = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(gw)
    return gw.fetch_board(api_url)


def load_resume(path: Path, private: bool) -> tuple[dict, str]:
    inside = inside_repo(path)
    public = inside is not None and inside.startswith("search/examples/")
    if not public and not private:
        raise Stop("input", f"résumé {show(path)} is not a fictional persona file under search/examples/. "
                            "Real résumés are read only with --private.")
    try:
        return rq.read_resume(path), (REC if public else YOU)
    except (OSError, ValueError) as exc:
        raise Stop("input", f"cannot read the résumé {show(path)}: {exc}")


def requirements_check(p: dict, r: dict, resume: dict, resume_label: str, rules: dict, as_of: dt.date,
                       live: bool, out_dir: Path, queue_label: str, fetches: list) -> None:
    content, source = None, None
    api = discovered_api_url(p) or greenhouse_api_url(p["url"])
    if live and api:
        try:
            data = fetch_posting_json(api)
        except Stop:
            raise
        except Exception as exc:  # the fetch is reported, never retried or guessed around
            fetches.append({"posting_id": p["posting_id"], "url": api, "error": str(exc),
                            "http_status": getattr(exc, "code", None)})
            r["checks"]["requirements"] = check("unresolved", code="posting-text-fetch-failed")
            return
        saved = out_dir / "postings" / f"{p['posting_id']}.json"
        saved.parent.mkdir(parents=True, exist_ok=True)
        saved.write_text(json.dumps(data, indent=1) + "\n", encoding="utf-8")
        digest = ev.sha256_file(saved)
        fetches.append({"posting_id": p["posting_id"], "url": api, "saved": show(saved), "sha256": digest,
                        "updated_at": data.get("updated_at"), "http_status": 200,
                        "fetched_at": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()})
        content, source = data.get("content", ""), lab(api, REC, saved=show(saved), sha256=digest,
                                                         fetched_at=dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat())
    elif not live and "posting_text" in p:
        path = repo_path(p["posting_text"]["path"])
        try:
            content = path.read_text(encoding="utf-8")
        except OSError:
            r["checks"]["requirements"] = check("unresolved", code="posting-text-unavailable", missing=show(path))
            return
        source = lab(show(path), queue_label, sha256=ev.sha256_file(path))
    if content is None or not content.strip():
        r["checks"]["requirements"] = check("unresolved", code="posting-text-unavailable")
        return
    result = rq.check(content, resume, rules, as_of)
    if not any(x["section"] == "required" for x in result["items"]):
        # v0.2.1: no heading the rules know marks a required section, so nothing was read. Reporting that as "0 months
        # short" would make the posting look closer than it is (found in the student's v0.2.0 run).
        r["checks"]["requirements"] = check("unresolved", code="requirements-not-found", text_source=source,
                                            lines_read=len(result["items"]))
        return
    exp = result["experience"]
    r["checks"]["requirements"] = check(
        "checked", text_source=source,
        experience=lab({k: v for k, v in exp.items() if k.startswith("months_")}, resume_label,
                       entries=exp["entries"], problems=exp["problems"]),
        items=lab(result["items"], rules["_label"], derived_from="the posting text + the declared requirement patterns"),
        summary=result["summary"])


def liveness_checks(pairs: list[tuple[dict, dict]], rules: dict, as_of: dt.date, live: bool, queue_label: str,
                    fetches: list | None = None) -> dict:
    """Adapted from A3's liveness_stage: same classifier, hosts and age rule, but it records a check
    on every posting instead of holding the role, and the label of a recorded result follows its evidence."""
    max_age = rules["liveness"]["max_age_days"]
    ran = {"mode": "live" if live else "sample", "classified_snapshots": 0, "live_urls": []}

    def settle(r: dict, result: str, source: str, checked: dt.date | None, **detail) -> None:
        if checked is not None:
            age = (as_of - checked).days
            if age < 0:
                r["checks"]["liveness"] = check("unresolved", code="liveness-date-after-run-date", checked=str(checked))
                return
            if age > max_age:
                r["checks"]["liveness"] = check("unresolved", code="stale-liveness", checked=str(checked),
                                                age_days=age, max_age_days=max_age)
                return
        if result == "uncertain":
            r["checks"]["liveness"] = check("unresolved", code="liveness-uncertain", status=lab(result, source, **detail))
            return
        r["checks"]["liveness"] = check("pass" if result == "active" else "closed",
                                        status=lab(result, source, factor=1.0 if result == "active" else 0.0,
                                                   checked=str(checked) if checked else None, **detail))

    if live:
        allowed = set(rules["liveness"]["live_hosts"])
        to_check, hops = [], []
        by_posting = {f["posting_id"]: f for f in (fetches or [])}
        board_api = []
        for p, r in pairs:
            if discovered_api_url(p):  # v0.2.0: a discovered posting's liveness comes from its board's own API
                f = by_posting.get(p["posting_id"], {})
                board_api.append(p["posting_id"])
                if f.get("http_status") == 200:
                    settle(r, "active", REC, as_of, checked_at=f["fetched_at"], method=BOARD_API_METHOD, api=f["url"],
                           listing=p["discovered"]["listing_url"])
                elif f.get("http_status") == 404:
                    settle(r, "expired", REC, as_of, why="the job endpoint returned 404: the board no longer lists it",
                           method=BOARD_API_METHOD, api=f.get("url"))
                else:
                    r["checks"]["liveness"] = check("unresolved", code="liveness-check-failed")
                continue
            parsed = urlparse(p["url"])
            if parsed.scheme != "https" or parsed.hostname not in allowed:
                r["checks"]["liveness"] = check("unresolved", code="host-not-allowed", host=parsed.hostname)
                continue
            status, location = ev.first_hop(p["url"])
            target = (urlparse(urljoin(p["url"], location)).hostname
                      if location and status and 300 <= status < 400 else None)
            hops.append({"url": p["url"], "status": status, "location": location})
            if target and target not in allowed:
                r["checks"]["liveness"] = check("unresolved", code="redirects-off-allowed-host", status=status,
                                                redirect_to=location, host=target)
            else:
                to_check.append((p, r))
        ran["first_hops"] = hops
        ran["board_api"] = board_api
        if to_check:
            urls = [p["url"] for p, _ in to_check]
            ran["live_urls"] = urls
            proc, found = ev.check_live(urls)
            ran.update(command=f"node {show(ev.LIVENESS_CLI)} " + " ".join(urls), exit_code=proc.returncode,
                       stdout=scrub(proc.stdout), stderr=scrub(proc.stderr))
            checked_at = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
            for p, r in to_check:
                hit = found.get(p["url"])
                if not hit:
                    r["checks"]["liveness"] = check("unresolved", code="liveness-check-failed")
                    continue
                settle(r, hit["result"], REC, as_of, why=hit["reason"], checked_at=checked_at,
                       method="scripts/ats/check-liveness.mjs (npm run ats:liveness)")
        return ran

    snapshots, waiting = [], []
    for p, r in pairs:
        given = p.get("liveness")
        if not given:
            r["checks"]["liveness"] = check("unresolved", code="liveness-unchecked")
            continue
        if "snapshot" in given:
            snap_path = repo_path(given["snapshot"])
            snap = json.loads(snap_path.read_text(encoding="utf-8"))
            source = REC if snap.get("provenance") == "captured" else queue_label
            snapshots.append({k: snap.get(k) for k in ("status", "finalUrl", "bodyText", "applyControls")})
            waiting.append((r, source, parse_day(snap["captured_at"]),
                            {"snapshot": show(snap_path), "provenance": snap.get("provenance")}))
        else:  # a result recorded from an earlier live check, backed by its saved terminal output
            evidence_path = repo_path(given["evidence"]) if given.get("evidence") else None
            backed = bool(evidence_path and evidence_path.is_file() and
                          re.search(rf"\b{given['result']}\b\s+{re.escape(p['url'])}",
                                    evidence_path.read_text(encoding="utf-8")))
            settle(r, given["result"], REC if backed else queue_label, parse_day(given["checked_at"]),
                   checked_at=given["checked_at"], method=given.get("method"),
                   evidence=show(evidence_path) if evidence_path else None, evidence_verified=backed)
    if snapshots:
        verdicts = ev.classify_snapshots(snapshots)
        ran["classified_snapshots"] = len(verdicts)
        for (r, source, captured, detail), verdict in zip(waiting, verdicts):
            settle(r, verdict["result"], source, captured, code=verdict["code"], why=verdict["reason"],
                   classifier="scripts/ats/liveness-core.mjs classifyLiveness", **detail)
    return ran


# ── scoring ──────────────────────────────────────────────────────────────────

def ready_for_scorer(r: dict) -> bool:
    c = r["checks"]
    return (c.get("company", {}).get("result") == "pass" and c.get("sponsorship", {}).get("result") == "pass"
            and c.get("liveness", {}).get("result") == "pass" and c.get("timeline", {}).get("result") == "pass"
            and c.get("fit", {}).get("result") == "pass")


def scorer_role(r: dict) -> dict:
    c = r["checks"]
    spons, live, time = c["sponsorship"]["evidence"], c["liveness"]["status"], c["timeline"]["factor"]
    role = {"role_id": r["posting_id"], "company": c["company"]["match"]["value"], "title": r["title"]["value"],
            "sponsorship": {"p": spons["p"]["value"], "tier": spons["tier"]["value"], "source": spons["p"]["source"]},
            "liveness": {"factor": live["factor"], "source": live["source"]},
            "timeline": {"factor": time["value"], "source": time["source"]},
            "fit": {"p": c["fit"]["p"]["value"], "source": c["fit"]["p"]["source"]}}
    return role


def score(ready: list[dict], out_dir: Path, log: dict) -> None:
    sent = [scorer_role(r) for r in ready]
    problems = guard.validate(sent)
    log["guard"] = {"roles_checked": len(sent), "problems": problems}
    if problems:
        log["status"] = "refused"
        log["stop"] = {"gate": "guard", "problems": problems}
        return
    roles_json = out_dir / "roles.json"
    roles_json.write_text(json.dumps(sent, indent=2) + "\n", encoding="utf-8")
    proc = ev.run_scorer(roles_json, out_dir)
    log["scorer"] = {"command": f"node {show(ev.SCORER)} {show(roles_json)} --out-dir {show(out_dir)}",
                     "exit_code": proc.returncode, "stdout": scrub(proc.stdout), "stderr": scrub(proc.stderr)}
    problems = ["the scorer exited with a non-zero code"] if proc.returncode != 0 else []
    scored = {}
    if not problems:
        try:
            scored = json.loads((out_dir / "role-scores.json").read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            problems.append(f"role-scores.json is unreadable: {exc}")
    problems = problems or ev.contract_problems(sent, scored)
    if problems:
        log["status"] = "void"
        log["stop"] = {"gate": "scorer-contract", "problems": problems}
        return
    by_id = {x["role_id"]: x for x in scored["roles"]}
    for r in ready:
        got = by_id[r["posting_id"]]
        r["scorer"] = {k: got[k] for k in ("composite", "recommendation", "machine_recommendation", "reason", "trace")}


# ── the suggestion ───────────────────────────────────────────────────────────

def suggest(r: dict, on_gap: str = "MOVE ON") -> dict:
    """The suggestion, prefixed with the company row it rests on, so a wrong-company match is visible
    (the posting's "Meta" can match a small namesake in the file)."""
    s = _suggest(r, on_gap)
    s.setdefault("short_by_months", _short(r["checks"]))
    req = r["checks"].get("requirements", {})
    if req.get("result") == "checked":
        unclear = req["summary"]["section_unclear"]
        conditions = req["summary"]["work_conditions"]
        if unclear:
            s["next"] += (f" Review {len(unclear)} line(s) the mode could not place in a section (starting with "
                          f"'{unclear[0]['text']}').")
        if conditions:
            s["next"] += " Work conditions to review: " + "; ".join(f"'{x['text']}'" for x in conditions) + "."
    review = [f for f in r.get("review_flags", []) if not f.startswith("location unclear")]
    if review:
        s["next"] += " Review before tailoring: " + "; ".join(review) + "."
    if s["choice"] in ("TAILOR", "ASK FIRST") and r["checks"].get("liveness", {}).get("result") == "pass":
        s["next"] += " Refresh the liveness check on the day you apply."
    m = r["checks"].get("company", {}).get("match")
    if m and m["how"].startswith("identity confirmed"):
        unverified = f" Still unverified: {', '.join(m['unverified'])}." if m.get("unverified") else ""
        s["next"] = (f"Row {m['csv_row']}: {m['value']} ({m['city']}, {m['state']}); {m['how']}.{unverified} "
                     + s["next"])
    elif m:
        basis = "Matched by name only" if m["basis"] == "name" else "Picked in the queue"
        s["next"] = (f"{basis}, not confirmed by a person: row {m['csv_row']}: {m['value']} ({m['city']}, "
                     f"{m['state']}). First check this is the employer on the posting. " + s["next"])
    return s


def months(n: int) -> str:
    return f"{n} month" if n == 1 else f"{n} months"


def sponsorship_unknown(r: dict) -> tuple[str, str]:
    """(why, question) when the file has no H-1B record for the matched row. Only a person's confirmation lets the
    question say the data has no history for this employer; otherwise the reason names the row, which may be
    another company, and the question asks only whether the employer sponsors this role."""
    company, title, m = r["company_on_posting"]["value"], r["title"]["value"], r["checks"]["company"]["match"]
    if m["confirmed"]:
        return ("no H-1B history for this company in the file (unknown, not 'no')",
                QUESTIONS["no-h1b-record"].format(company=company, title=title))
    how = "matched to '{}' by name only".format(company) if m["basis"] == "name" else f"picked for '{company}' in the queue"
    return (f"the row {how}, row {m['csv_row']}: {m['value']} ({m['city']}, {m['state']}), has no H-1B history. It "
            "may be a different company: unknown, not 'no'",
            QUESTIONS["no-h1b-record-unconfirmed"].format(company=company, title=title))


def record_words(r: dict) -> str:
    """Whose H-1B record a question cites. Only a person's confirmation makes the row the posting's employer;
    a name match, or a row picked in the queue that nobody confirmed, is named as such."""
    company, m = r["company_on_posting"]["value"], r["checks"]["company"]["match"]
    if m["confirmed"]:
        return f"{company}'s public H-1B record"
    how = "matched to {} by name only".format(company) if m["basis"] == "name" else f"picked for {company} in the queue"
    return f"The public H-1B record {how} ({m['value']}, {m['city']}, {m['state']})"


def rank_key(c: dict) -> list:
    """Shortlist order: Proven, then Likely, then no record; then fewer months short; then the higher timeline factor."""
    s = c.get("sponsorship", {})
    tier = {"Proven": 0, "Likely": 1}.get(s.get("tier"), 2) if s.get("result") == "pass" else 2
    t = c.get("timeline", {})
    factor = t["factor"]["value"] if t.get("result") == "pass" else 0
    short = _short(c)
    return [tier, 9999 if short is None else short, -factor]  # a gap that could not be compared ranks after known ones


def _short(c: dict) -> int | None:
    """How far the documented experience falls short of the posting's required minimums: 0 when every stated
    minimum is met, None (unset) when no minimum could be compared, because the requirements were not read or the
    required lines state none (the student's call, v0.2.1: "zero months short" only when the comparison was made)."""
    req = c.get("requirements", {})
    if req.get("result") != "checked":
        return None
    s = req["summary"]
    if not any(x.get("check") for x in req["items"]["value"] if x["section"] == "required"):
        return None
    return max([x["short_by_months"] for x in s["required_gap"] + s["required_unclear"]] or [0])


def _short_full_time(c: dict) -> int | None:
    """The same gap counting only months stated as full-time (the student asked to see it beside the all-months gap)."""
    req = c.get("requirements", {})
    if req.get("result") != "checked":
        return None
    s = req["summary"]
    vals = [x.get("short_full_time_months") for x in s["required_gap"] + s["required_unclear"]]
    return max([v for v in vals if v is not None] or [0]) if _short(c) is not None else None


def short_words(c: dict) -> str:
    short, ft = _short(c), _short_full_time(c)
    if short is None:
        return "not compared: no stated minimum was read"
    if short == 0:
        return "0 months: every stated minimum is met"
    return f"{months(short)} counting every documented month; {months(ft)} counting only stated full-time months"


def gap_question(g: dict) -> str:
    fewer = "fewer years" if "year" in g["stated_as"].lower() else "less time"
    return QUESTIONS["requirements-gap"].format(stated=g["stated_as"], fewer=fewer)


UNRESOLVED_ASKS = {
    "co-op acceptance": "Does co-op or internship time count toward this requirement?",
    "supporting information": "Does research, teaching, contract or fellowship work count toward it?",
    "full-time status": "Does the experience need to be full-time employment?",
}


def documented_words(exp: dict) -> str:
    words = f"{months(exp['months_employment'])} of employment"
    if exp["months_coop"]:
        words += f", plus {months(exp['months_coop'])} of co-op or internship"
    if exp["months_needs_info"]:
        words += f", plus {months(exp['months_needs_info'])} of research, teaching, contract, fellowship or part-time work"
    return words


def _req_questions(c: dict) -> list[str]:
    """The questions a required line leaves open: an alternative path (R5), or a minimum reachable only once
    co-op acceptance, supporting information or full-time status is resolved (R6)."""
    req = c.get("requirements", {})
    if req.get("result") != "checked":
        return []
    exp = req["experience"]["value"]
    qs = [QUESTIONS["requirements-conditional"].format(line=x["text"]) for x in req["summary"]["required_conditional"]]
    for u in req["summary"]["required_unclear"]:
        asks = " ".join(UNRESOLVED_ASKS[k] for k in u["unresolved"]) or "Does my documented experience count toward it?"
        qs.append(f"The posting requires '{u['text']}'. My documented experience is {documented_words(exp)}. {asks}")
    return qs


def _suggest(r: dict, on_gap: str) -> dict:
    c = r["checks"]
    company, title = r["company_on_posting"]["value"], r["title"]["value"]
    if c.get("liveness", {}).get("result") == "closed":
        return {"choice": "MOVE ON", "why": "the posting is closed (liveness: expired)",
                "next": "No research or application time here."}
    # Records decide first (the student's call, v0.2.0): what no fit value could change is settled before any hold.
    if c.get("location", {}).get("result") == "outside-us":
        return {"choice": "MOVE ON", "why": "outside the US, by the person's location check",
                "next": "No application time here under the US-only filter."}
    t = c.get("timeline", {})
    if t.get("result") == "pass" and t["factor"]["value"] == 0:
        dates = t["factor"].get("dates")
        return {"choice": "MOVE ON", "why": "the calendar rules it out (timeline factor 0)" + (
                    f": expected start {dates['expected_start']} is after the latest start {dates['latest_start']}"
                    if dates else ""),
                "next": "No research or application time here: chapter 10's skip-regardless case. A person who knows the "
                        "process is faster can override with a reason."}
    req0 = c.get("requirements", {})
    if req0.get("result") == "checked" and req0["summary"]["required_gap"]:
        gaps0 = req0["summary"]["required_gap"]
        firm0 = [g for g in gaps0 if g.get("non_negotiable")]
        if firm0 or on_gap == "MOVE ON":
            exp0, g = req0["experience"]["value"], (firm0 or gaps0)[0]
            documented0 = (f"documented experience: {documented_words(exp0)}; {months(exp0['months_all'])} of all "
                           "documented work, which still falls short")
            why = (f"a required line says its minimum is firm, and it is out of reach: '{g['text']}' ({documented0})"
                   if firm0 else f"a required line is out of reach: '{g['text']}' ({documented0})")
            return {"choice": "MOVE ON", "why": why, "short_by_months": max(x["short_by_months"] for x in gaps0),
                    "next": "No tailoring time here. If you know the minimum is soft, override with your reason."}
    unresolved = [(name, c[name]["code"]) for name in ("company", "sponsorship", "liveness", "location", "timeline", "fit",
                                                       "requirements")
                  if c.get(name, {}).get("result") == "unresolved"]
    if unresolved:
        reasons = []
        for name, _ in unresolved:
            given = c[name].get("reason") or c[name].get("decision")
            if given:
                v = given["value"]
                reasons.append(f"{name}: the person's reason: \"{v['checked'] if isinstance(v, dict) else v}\"")
        hold = {"choice": "HOLD", "why": "unresolved: " + ", ".join(f"{n} ({code})" for n, code in unresolved),
                "next": " ".join([HOLD_CHECKS[code] for _, code in unresolved] + reasons)}
        if [n for n, _ in unresolved] == ["fit"]:  # every record-based gate is open: only the person's fit call is left
            hold["shortlist"] = True
            hold["rank"] = rank_key(c)
        return hold
    req = c["requirements"]
    exp = req["experience"]["value"]
    gaps = req["summary"]["required_gap"]
    if gaps:
        firm = [g for g in gaps if g.get("non_negotiable")]
        short = max(g["short_by_months"] for g in gaps)
        documented = (f"documented experience: {documented_words(exp)}; {months(exp['months_all'])} of all documented "
                      "work, which still falls short")
        if firm or on_gap == "MOVE ON":
            g = (firm or gaps)[0]
            why = (f"a required line says its minimum is firm, and it is out of reach: '{g['text']}' ({documented})"
                   if firm else f"a required line is out of reach: '{g['text']}' ({documented})")
            return {"choice": "MOVE ON", "why": why, "short_by_months": short,
                    "next": "No tailoring time here. If you know the minimum is soft, override with your reason."}
        why = (f"a stretch: {months(short)} short of a stated minimum ('{gaps[0]['text']}'; {documented}); "
               f"{months(_short_full_time(c))} short counting only stated full-time months; "
               "the employer's reading of the minimum could change the decision")
        questions = [gap_question(g) for g in gaps]
        if c.get("sponsorship", {}).get("result") == "unknown":  # an F-1 applicant still needs the sponsorship question
            unknown_why, unknown_question = sponsorship_unknown(r)
            why += f"; also, {unknown_why}"
            questions.append(unknown_question)
        return {"choice": "ASK FIRST", "short_by_months": short, "why": why,
                "questions": questions + _req_questions(c),
                "next": "Ask before spending tailoring time, and put postings closer to the documented experience first."}
    req_qs = _req_questions(c)
    if c.get("sponsorship", {}).get("result") == "unknown":
        why, question = sponsorship_unknown(r)
        return {"choice": "ASK FIRST", "why": why, "questions": [question] + req_qs,
                "next": "Ask before tailoring: a recruiter, or someone on the team."}
    rec = r["scorer"]["recommendation"]
    if rec == "Skip":
        return {"choice": "MOVE ON", "why": f"the scorer says Skip: {r['scorer']['reason']}",
                "next": "No research or application time here; reallocate it."}
    unchecked = req["summary"]["required_not_checked"]
    if rec == "Apply" and req_qs:
        return {"choice": "ASK FIRST", "why": ("the scorer says Apply, but a required line depends on something the "
                                               "mode cannot resolve (an alternative path, co-op acceptance, supporting "
                                               "information or full-time status)"),
                "questions": req_qs, "next": "Ask this before spending tailoring time."}
    if rec == "Apply":
        return {"choice": "TAILOR", "why": f"every gate is open and the scorer says Apply: {r['scorer']['reason']}",
                "next": (f"Worth tailoring, but only the duration of experience minimums was checked: not the kind of "
                         f"experience, and not the other {unchecked} required line(s). Read them yourself first, and "
                         "confirm sponsorship with the recruiter early. Passing this check is not a claim of meeting "
                         "the whole job description.")}
    spons = c["sponsorship"]
    factor = c["timeline"]["factor"]["value"]
    if spons["tier"] == "Likely" and spons["gap"] in QUESTIONS:
        field = {"marked-only": "ml_titles", "no-role-family-title": "sponsored_titles",
                 "thin-record": "ml_titles_counted", "needs-context": "ml_titles_needing_context"}[spons["gap"]]
        titles = ", ".join(f"'{t}'" for t in spons["evidence"][field]["value"])
        question = QUESTIONS[spons["gap"]].format(company=company, titles=titles, record=record_words(r),
                                                  approvals=spons["evidence"]["approvals"]["value"])
        why = f"the scorer says Consider; the sponsorship evidence is soft: {spons['evidence']['tier']['rule']}"
    elif factor < 0.6:
        question = QUESTIONS["timeline-soft"].format(factor=factor, title=title)
        why = f"the scorer says Consider: {r['scorer']['reason']}"
    else:
        question = QUESTIONS["consider-no-soft-spot"].format(composite=f"{r['scorer']['composite']:.3f}", title=title)
        why = f"the scorer says Consider: {r['scorer']['reason']}"
    return {"choice": "ASK FIRST", "why": why, "questions": [question] + req_qs,
            "next": "Ask this before spending tailoring time."}


# ── outputs ──────────────────────────────────────────────────────────────────

def shortlist_unchecked(r: dict) -> str:
    req = r["checks"].get("requirements", {})
    return str(req["summary"]["required_not_checked"]) if req.get("result") == "checked" else "—"


def shortlist_timeline(r: dict) -> str:
    f = r["checks"]["timeline"]["factor"]
    if f.get("computed"):
        return f"{f['value']} ({f['dates']['expected_start']}; {f['weeks']} weeks, the person's assumption)"
    return f"{f['value']} (stated)"


def shortlist_sponsorship(r: dict) -> str:
    s = r["checks"].get("sponsorship", {})
    if s.get("result") == "pass":
        return f"{s['tier']} ({s['evidence']['approvals']['value']} approvals, company-wide)"
    return "no H-1B record in the file: unknown"


def md(value) -> str:
    return str(value).replace("|", "\\|").replace("\n", " ")


def value_rows(r: dict) -> list[tuple[str, str, str, str]]:
    """(value, what it says, label, where it came from) for the report's verified-vs-inferred table."""
    rows = [("posting", f"{r['company_on_posting']['value']} — {r['title']['value']}", r["title"]["source"],
             "the board's public API, via discover.py" if r["title"].get("from_board") else "the queue")]
    c = r["checks"]
    if c["company"]["result"] == "pass":
        m = c["company"]["match"]
        where = f"row {m['csv_row']}: {m['value']} ({m['city']}, {m['state']})"
        if m["confirmed"]:
            rows.append(("company record", where, m["source"], m["how"]))
        else:  # the row's content is a record; that it is the posting's employer is not
            rows.append(("company row", where, REC, "the sponsorship file"))
            rows.append(("identity", ("exact name match" if m["basis"] == "name" else "row picked in the queue")
                         + ", not confirmed by a person", m["source"], m["how"]))
        if m.get("checked"):
            rows.append(("identity evidence", m["checked"] + (f" Sources: {'; '.join(m['sources'])}." if m.get("sources") else "")
                         + (f" Still unverified: {', '.join(m['unverified'])}." if m.get("unverified") else ""),
                         m["source"], "the person's identity decision"))
    elif c["company"].get("code") == "identity-unconfirmed":
        cand, d = c["company"].get("candidate"), c["company"]["decision"]
        if cand:
            rows.append(("candidate company row (not cleared)", f"row {cand['csv_row']}: {cand['company_name']} ({cand['city']}, "
                         f"{cand['state']}; file website {cand['website']})", REC, "the sponsorship file"))
        rows.append(("identity decision", f"candidate, not cleared: {d['value']['checked']}", d["source"],
                     f"decided by {d['value']['by']} on {d['value']['at']}"))
    s = c.get("sponsorship", {})
    if s.get("result") == "unknown":
        rows.append(("H-1B record", f"none in the file for row {c['company']['match']['csv_row']}: unknown, not \"no\"",
                     REC, "the sponsorship file (no H-1B fields on this row)"))
    elif s.get("result") == "unresolved":
        rows.append(("H-1B record", f"not usable ({s['code']}): see the next step", REC, "the sponsorship file"))
    if s.get("result") == "pass":
        e = s["evidence"]
        rows += [("H-1B approvals / denials", f"{e['approvals']['value']} / {e['denials']['value']}", REC, "Total Approvals, Total Denials"),
                 ("sponsored titles", "; ".join(e["sponsored_titles"]["value"]), e["sponsored_titles"]["source"], "top_job_titles_sponsored"),
                 ("ML/AI titles counted as evidence", "; ".join(e["ml_titles_counted"]["value"]) or "none",
                  e["ml_titles_counted"]["source"], "the title rules (exact titles shown; never proof of qualifying)"),
                 ("ML/AI titles needing context", "; ".join(e["ml_titles_needing_context"]["value"]) or "none",
                  e["ml_titles_needing_context"]["source"], "the title rules"),
                 ("sponsorship tier and p", f"{e['tier']['value']} -> {e['p']['value']} (a declared screening "
                  "assumption, not a probability)", e["p"]["source"], "the title rules' tier mapping")]
    liv = c.get("liveness", {})
    if "status" in liv:
        st = liv["status"]
        if st["value"] == "active":
            shown = ("available on the board's API at the time checked (listed, and returned by its job endpoint); "
                     "not a check that applying works"
                     if st.get("method") == BOARD_API_METHOD else "active (an apply control was detected; nothing more)")
        else:
            shown = st["value"]
        rows.append(("posting liveness", shown, st["source"], st.get("classifier") or st.get("method") or "recorded check"))
    loc = c.get("location")
    if loc:
        said = {"unresolved": "unclear: unresolved until a person checks it", "pass": "in the US, by the person's check",
                "outside-us": "outside the US, by the person's check"}[loc["result"]]
        rows.append(("location", f"{loc.get('listed')}: {said}", loc["decision"]["source"] if "decision" in loc else REC,
                     "the board listing" + (", and the person's location check" if "decision" in loc else "")))
    t = c.get("timeline", {})
    if t.get("result") == "pass" and t["factor"].get("computed"):
        f_, d_ = t["factor"], t["factor"]["dates"]
        rows.append(("timeline factor", f"{f_['value']}: expected start {d_['expected_start']} (run date + {f_['weeks']} "
                     f"weeks, never before the EAD start {d_['ead_start']}); target start {d_['target_start']}; latest start "
                     f"{d_['latest_start']}. {f_['why']}. Weeks: {f_['reason']}", f_["source"],
                     "computed from the persona's dates and the declared time-to-start (timeline.py)"))
    elif t.get("result") == "pass":
        rows.append(("timeline factor", f"{t['factor']['value']} ({t['factor']['reason']})", t["factor"]["source"], "declared in the queue"))
    f = c.get("fit", {})
    if f.get("result") == "pass":
        rows.append(("fit", f"{f['p']['value']} ({f['p']['reason']})", f["p"]["source"], "declared in the queue"))
    if "scorer" in r:
        rows.append(("scorer", f"{r['scorer']['recommendation']} (composite {r['scorer']['composite']:.3f})",
                     COMP, "scripts/score/role-scorer.mjs"))
    return rows


def result_words(x: dict) -> str:
    words = _result_words(x)
    if x.get("degree_named"):
        words += "; the degree it names is not checked (being enrolled is not holding it)"
    return words


def _result_words(x: dict) -> str:
    if x["result"] == "met":
        return "duration met (kind not checked)"
    if x["result"] == "unclear":
        return (f"duration met only if {' and '.join(x['unresolved'])} is resolved "
                f"({months(x['short_by_months'])} short without it)")
    if x["result"] == "gap":
        return (f"duration short by {months(x['short_by_months'])}, counting every documented month"
                + (f" ({months(x['short_full_time_months'])} counting only stated full-time months)"
                   if x.get("short_full_time_months") not in (None, x["short_by_months"]) else "")
                + ("; the line says the minimum is firm" if x.get("non_negotiable") else ""))
    if x["result"] == "conditional":
        return "more than one path (for example by degree): the applicable path is left unresolved"
    if x["result"] == "condition":
        return "work condition: awaiting review"
    if x["result"] == "not-a-requirement-section":
        return "not a requirements section: shown so no line is hidden"
    if x["section"] == "unclear":
        return "section unclear: review it" + (" (a possible heading the rules don't know)" if x.get("possible_heading") else "")
    return "not checked: read it yourself"


def render_report(log: dict) -> str:
    s, results = log["summary"], log["postings"]
    counts = s["suggestions"]
    o = [f"# Tailor or ask — {log['as_of']} ({log['mode']} mode)", "", "## Executive summary", ""]
    if log["status"] in ("void", "refused"):
        o += [f"**This run is {log['status'].upper()}.** " + "; ".join(log["stop"]["problems"]) + ". "
              "No suggestion below should be trusted.", ""]
    o += [f"This report looks at {s['evaluated']} job posting(s) for someone who will need H-1B sponsorship and "
          "asks, for each one, whether it deserves the time a tailored application takes. It checks whether the "
          "posting is still open, whether the company's public H-1B history includes this kind of role below "
          "senior level, whether the posting's stated experience minimum is within reach, and whether the timing "
          "works, then suggests one next step. Read it before spending application time on any of these "
          "postings.", ""]
    if log["mode"] == "sample":
        o += ["*Sample mode: the postings, page snapshots, posting texts, fit and timeline values are illustrative fixtures written "
              "by Claude Code (labelled model-judgment). The sponsorship evidence is read from the real file.*", ""]
    o += [f"**What it found.** Tailor {counts.get('TAILOR', 0)} · ask first {counts.get('ASK FIRST', 0)} · "
          f"move on {counts.get('MOVE ON', 0)} · hold {counts.get('HOLD', 0)}"
          + (f", of which {s['shortlist']} wait only for your fit call" if s.get("shortlist") else "") + ". "
          "A hold means a check could not be resolved, so there is no suggestion until a person resolves it. "
          "Of each posting's own requirements, only the duration of experience minimums is checked; the kind of "
          "experience and every other line are listed for you to read. Every suggestion is a suggestion: the person decides each posting.", ""]
    o += ["## What to do next", ""]
    for choice in CHOICES:
        group = [r for r in results if r.get("suggestion", {}).get("choice") == choice]
        if not group:
            continue
        if choice == "ASK FIRST":  # closer to the documented experience first (the student's priority)
            group.sort(key=lambda r: r["suggestion"].get("short_by_months") or 0)
        o += [f"### {choice.title()} ({len(group)})", ""]
        if choice == "HOLD":
            short = sorted([r for r in group if r["suggestion"].get("shortlist")], key=lambda r: r["suggestion"]["rank"])
            if short:
                o += [f"#### Shortlist: every record-based gate is open; waiting only for your fit call ({len(short)})", "",
                      "Ranked by sponsorship evidence (Proven, then Likely, then no record), then months short of a "
                      "stated minimum, then the timeline factor. State a fit with your reason in the queue and run again.", "",
                      "| # | Posting | Category | Sponsorship | Short of a minimum | Required lines not checked | "
                      "Timeline (expected start; weeks) | To review | Link |", "|---|---|---|---|---|---|---|---|---|"]
                o += [f"| {i} | {md(r['company_on_posting']['value'])} — {md(r['title']['value'])} | {md(r.get('category') or '—')} | "
                      f"{shortlist_sponsorship(r)} | {short_words(r['checks'])} | "
                      f"{shortlist_unchecked(r)} | {shortlist_timeline(r)} | "
                      f"{md('; '.join(r.get('review_flags') or []) or '—')} | {r['url']['value']} |" for i, r in enumerate(short, 1)]
                o += ["", "#### Every hold, with what to resolve", ""]
            group = short + [r for r in group if not r["suggestion"].get("shortlist")]
        for r in group:
            sg = r["suggestion"]
            o.append(f"- **{md(r['company_on_posting']['value'])} — {md(r['title']['value'])}** "
                     f"(`{r['posting_id']}`). Why: {md(sg['why'])}.")
            if sg.get("short_by_months"):
                o.append(f"  - Stretch: {months(sg['short_by_months'])} short of a stated experience minimum.")
            for q in sg.get("questions", []):
                o.append(f"  - Question to ask: \"{md(q)}\"")
            o.append(f"  - Next: {md(sg['next'])}")
            if r.get("decision"):
                d = r["decision"]
                o.append(f"  - **Decided by {md(d['by'])} on {d['at']}: {d['choice']}.** {md(d['reason'])}")
        o.append("")
    if log.get("compared_with"):
        o += render_changes(log)
    o += ["## Verified vs inferred, posting by posting", "",
          "`record` = read from a repo record or a live check · `your-input` = declared by the student · "
          "`model-judgment` = proposed by Claude Code · `computed` = produced by a script from the labelled inputs (the "
          "scorer's arithmetic, or a name match), not a fact · \"not checked\" = a posting line shown for you to read, "
          "which the mode did not check.", ""]
    for r in results:
        o += [f"### {md(r['company_on_posting']['value'])} — {md(r['title']['value'])}", "",
              "| Value | What it says | Label | From |", "|---|---|---|---|"]
        o += [f"| {md(a)} | {md(b)} | {c} | {md(d)} |" for a, b, c, d in value_rows(r)]
        o.append("")
        req = r["checks"].get("requirements", {})
        if req.get("result") == "checked":
            exp = req["experience"]
            o += [f"Requirements, from the posting's own text ({req['text_source']['source']}; lines sorted and checked by "
                  f"rules labelled {req['items']['source']}). Documented experience ({exp['source']}): "
                  f"{months(exp['value']['months_employment'])} of employment (type not stated unless the résumé says; "
                  f"{exp['value']['months_full_time_stated']} stated full-time), {exp['value']['months_coop']} of co-op or "
                  f"internship, {exp['value']['months_needs_info']} needing supporting information; projects are not "
                  "counted. Only the duration of an experience minimum is checked; the kind of experience a line asks "
                  "for is shown, not checked, and every other line is for you to read.", "",
                  "| Section | Under heading | Line | Checked | Kind asked (not checked) | Result |", "|---|---|---|---|---|---|"]
            o += [f"| {x['section']} | {md(x.get('heading') or '—')} | {md(x['text'])} | {('duration: ' + x['stated_as']) if x['check'] else 'no'} | "
                  f"{md(x['kind_asked']) if x['check'] else '—'} | {result_words(x)} |" for x in req["items"]["value"]]
            o.append("")
    o += ["## What this run cannot verify", ""] + [f"- {x}" for x in log["cannot_verify"]] + [""]
    o += ["## Run record", "",
          f"- Recipe: `{log['recipe']}` v{log['recipe_version']} · run `{log['run_id']}` · status {log['status']}",
          f"- Queue: `{log['inputs']['queue']['path']}` (sha256 `{log['inputs']['queue']['sha256'][:12]}…`), chosen by "
          f"{log['inputs']['queue']['chosen_by']}",
          f"- Rules: `{log['inputs']['rules']['path']}` v{log['inputs']['rules']['version']}, declared by "
          f"{log['inputs']['rules']['declared_by']} (values they produce are labelled {log['inputs']['rules']['label']})",
          f"- Sponsorship file: `{log['source']['csv']}` · sha256 `{log['source']['sha256']}` · {log['source']['rows']} rows",
          f"- Scorer: `{log['scorer'].get('command', 'not run')}`",
          f"- Agent log: `{log['outputs']['agent_log']}`", ""]
    return "\n".join(o)


# ── the run ──────────────────────────────────────────────────────────────────

def run(args) -> int:
    rules = ev.load_rules(Path(args.rules))
    queue_path = Path(args.queue).resolve()
    queue = load_queue(queue_path)
    queue_label = ev.label_for(queue["queue_by"])
    as_of = dt.date.today() if args.live else parse_day(queue["as_of"])  # live: the person's local date
    mode = "live" if args.live else "sample"
    # Where outputs go is checked before any profile or résumé is read, so private data is never read
    # by a run that would write outside private/.
    out_dir = prepare_out_dir(Path(args.out_dir) if args.out_dir else REPO / "output" / WORKFLOW / f"{as_of}-{mode}",
                              args.private, args.overwrite)
    persona_path = repo_path(args.persona or queue.get("persona", ""))
    persona = load_persona(persona_path, args.private)
    resume_path = repo_path(args.resume or queue.get("resume") or persona_path.with_name("resume.example.json"))
    resume, resume_label = load_resume(resume_path, args.private)

    csv_path = repo_path(args.csv or rules["source"]["csv"])
    if args.csv and not args.csv_sha256:
        raise Stop("source", "a non-default sponsorship file needs an explicit --csv-sha256: pin what you ran on")
    actual = ev.source_gate(csv_path, args.csv_sha256 or rules["source"]["sha256"])

    normalize = ev.load_normalizer()
    index, by_row, row_count = ev.load_sponsorship(csv_path, normalize)
    postings = {p["posting_id"]: p for p in queue["postings"]}
    results, fetches = [], []
    for p in queue["postings"]:
        found = p.get("discovered")  # written by discover.py from the board's public API
        board = (lambda v: lab(v, REC, from_board=found["listing_url"])) if found else (lambda v: lab(v, queue_label))
        r = {"posting_id": p["posting_id"], "company_on_posting": lab(p["company"], queue_label),
             "title": board(p["title"]), "url": board(p["url"]), "checks": {},
             **({"category": found.get("category"), "review_flags": found.get("flags") or []} if found else {}),
             "requirements": {"result": "not-checked",
                              "note": "the requirements check is a typed proposal in this recipe version"}}
        row_no = company_check(p, r, index, by_row, normalize, queue_label)
        if row_no is not None:
            sponsorship_check(p, r, row_no, by_row, rules, queue_label)
        location_check(p, r)
        timeline_check(p, r, persona, as_of, rules)
        fit_check(p, r)
        requirements_check(p, r, resume, resume_label, rules, as_of, args.live, out_dir, queue_label, fetches)
        results.append(r)
    liveness_run = liveness_checks(list(zip(queue["postings"], results)), rules, as_of, args.live, queue_label, fetches)

    run_id = f"{as_of}-{mode}-{hashlib.sha256(queue_path.read_bytes()).hexdigest()[:8]}"
    log = {
        "workflow": WORKFLOW, "recipe": RECIPE, "recipe_version": RECIPE_VERSION, "run_id": run_id,
        "status": "complete", "mode": mode, "as_of": str(as_of),
        "generated_at": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(),
        "labels": {REC: "read from a repo record or a live check", YOU: "declared by the student",
                   MODEL: "proposed by Claude Code (a model), including every sample fixture value",
                   COMP: "produced by a script from labelled inputs (the scorer's arithmetic, a name match); "
                         "not a fact about the world"},
        "inputs": {
            "queue": {"path": show(queue_path), "sha256": ev.sha256_file(queue_path), "chosen_by": queue["queue_by"]},
            "persona": ({"path": show(persona_path), "fictional": True,
                         "name": persona.get("candidate", {}).get("name"),
                         "target_role": persona.get("target_role", {}).get("primary")}
                        if persona["_public"] else {"path": "private (not recorded)", "fictional": False}),
            "needs_sponsorship": lab(True, REC if persona["_public"] else YOU,
                                     note="stated explicitly in the persona file"),
            "resume": ({"path": show(resume_path), "fictional": True} if resume_label == REC
                       else {"path": "private (not recorded)", "fictional": False}),
            "rules": {"path": show(Path(args.rules)), "version": rules["rules_version"], "sha256": rules["_sha256"],
                      "declared_by": rules["declared_by"]["who"], "label": rules["_label"]},
        },
        "source": {"csv": show(csv_path), "sha256": actual, "pinned": actual == rules["source"]["sha256"],
                   "rows": row_count, "columns_read": ev.KEEP_COLUMNS},
        "liveness_run": liveness_run, "posting_text_run": fetches, "guard": {}, "scorer": {}, "postings": results,
        "cannot_verify": list(CANNOT_VERIFY) + (["The postings themselves: in sample mode they are illustrative "
                                                 "fixtures."] if mode == "sample" else []),
    }

    ready = [r for r in results if ready_for_scorer(r)]
    if ready:
        score(ready, out_dir, log)
    else:
        log["scorer"] = {"command": "not run: no posting cleared every gate", "exit_code": None}

    if log["status"] == "complete":
        for r in results:
            r["suggestion"] = suggest(r, rules["requirements"]["on_required_gap"])
            own = postings[r["posting_id"]].get("question")
            if own:  # the person's own words replace the template experience question (v0.2.1)
                r["person_question"] = lab(own["text"], ev.label_for(own["by"]))
                sg = r["suggestion"]
                if sg["choice"] == "ASK FIRST":
                    sg["questions"] = [own["text"]] + [q for q in sg.get("questions", []) if not q.startswith("Is '")]
                else:
                    sg["next"] += f" Your own question, for when the other checks resolve: \"{own['text']}\""
            if "decision" in postings[r["posting_id"]]:
                d = postings[r["posting_id"]]["decision"]
                r["decision"] = {**d, "label": YOU}

    if args.compare:
        log["compared_with"], log["changes"] = compare_runs(Path(args.compare), results)

    counts: dict[str, int] = {}
    for r in results:
        if "suggestion" in r:
            counts[r["suggestion"]["choice"]] = counts.get(r["suggestion"]["choice"], 0) + 1
    scored = [r for r in results if "scorer" in r]
    log["summary"] = {"evaluated": len(results), "scored": len(scored), "suggestions": counts,
                      "shortlist": sum(1 for r in results if r.get("suggestion", {}).get("shortlist")),
                      "decided": sum(1 for r in results if "decision" in r),
                      "move_on_rate": f"{round(100 * counts.get('MOVE ON', 0) / len(results))}%"}
    log["outputs"] = {"agent_log": show(out_dir / "run-log.json"), "human_report": show(out_dir / "report.md"),
                      "scorer_input": show(out_dir / "roles.json") if (out_dir / "roles.json").exists() else None}
    (out_dir / "run-log.json").write_text(json.dumps(log, indent=2) + "\n", encoding="utf-8")
    (out_dir / "report.md").write_text(render_report(log), encoding="utf-8")

    print(f"{log['status'].upper() if log['status'] != 'complete' else '✓'} {len(results)} postings → "
          + ", ".join(f"{k} {counts.get(k, 0)}" for k in CHOICES) + f" · scored {len(scored)}")
    print(f"  {show(out_dir / 'report.md')}  +  {show(out_dir / 'run-log.json')}")
    if log["status"] == "refused":
        raise Stop("guard", "; ".join(log["stop"]["problems"]), code=3)
    if log["status"] == "void":
        raise Stop("scorer-contract", "; ".join(log["stop"]["problems"]), code=1)
    return 0


def _req_counts(r: dict) -> str:
    req = r.get("checks", {}).get("requirements", {})
    if req.get("result") != "checked":
        return f"not read ({req.get('code', req.get('result', '—'))})"
    by = {}
    for x in req["items"]["value"]:
        by[x["section"]] = by.get(x["section"], 0) + 1
    return ", ".join(f"{k} {by[k]}" for k in ("required", "preferred", "unclear", "conditions", "other") if k in by) or "none"


def compare_runs(prev_path: Path, results: list[dict]) -> tuple[dict, list[dict]]:
    """What changed for each posting since an earlier run (the student asked that the next run show it exactly)."""
    try:
        prev = json.loads(prev_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise Stop("input", f"cannot read the run to compare with, {show(prev_path)}: {exc}")
    before = {r["posting_id"]: r for r in prev.get("postings", [])}
    changes = []
    for r in results:
        b = before.get(r["posting_id"])
        if b is None:
            changes.append({"posting_id": r["posting_id"], "what": "new in this run"})
            continue
        fit_b, fit_n = b["checks"].get("fit", {}), r["checks"].get("fit", {})
        changes.append({
            "posting_id": r["posting_id"], "posting": f"{r['company_on_posting']['value']} — {r['title']['value']}",
            "before": b.get("suggestion", {}).get("choice"), "now": r.get("suggestion", {}).get("choice"),
            "requirements_before": _req_counts(b), "requirements_now": _req_counts(r),
            "short_before": b.get("suggestion", {}).get("short_by_months"),
            "short_now": r.get("suggestion", {}).get("short_by_months"),
            "fit_before": fit_b.get("p", {}).get("value") if fit_b.get("result") == "pass" else fit_b.get("code"),
            "fit_now": fit_n.get("p", {}).get("value") if fit_n.get("result") == "pass" else fit_n.get("code")})
    gone = [pid for pid in before if pid not in {r["posting_id"] for r in results}]
    changes += [{"posting_id": pid, "what": "not in this run"} for pid in gone]
    meta = {"path": show(prev_path), "sha256": ev.sha256_file(prev_path), "run_id": prev.get("run_id"),
            "recipe_version": prev.get("recipe_version"), "rules_version": prev.get("inputs", {}).get("rules", {}).get("version")}
    return meta, changes


def render_changes(log: dict) -> list[str]:
    m, rows = log["compared_with"], log["changes"]
    o = ["## What changed since the previous run", "",
         f"Compared with run `{m['run_id']}` (recipe v{m['recipe_version']}, rules v{m['rules_version']}; `{m['path']}`). "
         f"This run: recipe v{log['recipe_version']}, rules v{log['inputs']['rules']['version']}. The earlier run's files "
         "are kept unchanged.", "",
         "| Posting | Before | Now | Requirement lines read: before → now | Months short: before → now | Fit: before → now |",
         "|---|---|---|---|---|---|"]
    show_short = lambda v: "unset" if v is None else str(v)  # noqa: E731
    for c in rows:
        if "what" in c:
            o.append(f"| `{c['posting_id']}` | {c['what']} | | | | |")
            continue
        o.append(f"| {md(c['posting'])} | {c['before']} | {c['now']} | {md(c['requirements_before'])} → "
                 f"{md(c['requirements_now'])} | {show_short(c['short_before'])} → {show_short(c['short_now'])} | "
                 f"{c['fit_before']} → {c['fit_now']} |")
    return o + [""]


def parse_args(argv=None):
    ap = argparse.ArgumentParser(description="Does this ML/AI posting deserve a tailored application?")
    ap.add_argument("--queue", default=str(DEFAULT_QUEUE), help="posting queue JSON (default: the sample fixture)")
    ap.add_argument("--rules", default=str(DEFAULT_RULES), help="declared title and tier rules")
    ap.add_argument("--persona", help="persona profile.yml (default: the queue's)")
    ap.add_argument("--resume", help="résumé JSON (default: the queue's, else resume.example.json beside the persona)")
    ap.add_argument("--out-dir", help="where to write outputs (default: output/<workflow>/<date>-<mode>/)")
    ap.add_argument("--overwrite", action="store_true", help="allow replacing an earlier run in --out-dir")
    ap.add_argument("--live", action="store_true", help="check posting liveness live (network, Playwright)")
    ap.add_argument("--private", action="store_true",
                    help="allow a real profile; every output must then go under private/ (gitignored)")
    ap.add_argument("--csv", help="a different sponsorship file (requires --csv-sha256)")
    ap.add_argument("--csv-sha256", help="the SHA-256 you accept for --csv")
    ap.add_argument("--compare", help="an earlier run-log.json: the report shows what changed for each posting")
    return ap.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv)
    try:
        return run(args)
    except Stop as stop:
        print(f"STOP at the {stop.gate} gate: {stop}", file=sys.stderr)
        return stop.code


if __name__ == "__main__":
    sys.exit(main())
