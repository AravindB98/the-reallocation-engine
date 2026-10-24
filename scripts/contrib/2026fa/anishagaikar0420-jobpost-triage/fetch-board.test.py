#!/usr/bin/env python3
"""Verification harness for fetch-board.py. OFFLINE: the network is replaced by a stub, and
the stub FAILS the test if any code path touches it when it should not.

  python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/fetch-board.test.py
"""
import importlib.util
import io
import json
import sys
import tempfile
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

spec = importlib.util.spec_from_file_location("fb", Path(__file__).with_name("fetch-board.py"))
fb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fb)

passed = failed = 0
CALLS = []


def check(name, ok, detail=""):
    global passed, failed
    passed += bool(ok)
    failed += not ok
    print(("  ✓ " if ok else "  ✗ ") + name + ("" if ok else f"  {detail}"))


def run_main(argv, stub=None):
    CALLS.clear()
    fb.get_json = stub or (lambda url: CALLS.append(url) or (_ for _ in ()).throw(AssertionError("network touched: " + url)))
    old = sys.argv
    sys.argv = ["fetch-board.py"] + argv
    out, err = io.StringIO(), io.StringIO()
    try:
        with redirect_stdout(out), redirect_stderr(err):
            code = fb.main()
    except AssertionError as e:
        code = "NETWORK:" + str(e)
    except SystemExit as e:  # argparse rejects option-like values (e.g. "-lead") with exit 2 before any network call
        code = e.code
    finally:
        sys.argv = old
    return code, out.getvalue(), err.getvalue()


print("fetch-board verification harness (offline)\n")
check("escaped HTML becomes plain text with line breaks",
      fb.html_to_text("&lt;p&gt;Hello &amp;amp; welcome&lt;/p&gt;&lt;ul&gt;&lt;li&gt;SQL&lt;/li&gt;&lt;li&gt;Tableau&lt;/li&gt;&lt;/ul&gt;") == "Hello & welcome\nSQL\nTableau",
      repr(fb.html_to_text("&lt;p&gt;Hello &amp;amp; welcome&lt;/p&gt;&lt;ul&gt;&lt;li&gt;SQL&lt;/li&gt;&lt;li&gt;Tableau&lt;/li&gt;&lt;/ul&gt;")))
rec = fb.to_record("acme", "Acme", {"id": 7, "title": " Data Analyst ", "absolute_url": "https://x/7", "location": {"name": "Boston, MA"},
                                     "first_published": "2026-01-02", "content": "&lt;p&gt;Use SQL&lt;/p&gt;"})
check("a job becomes a unified record with the required fields",
      rec["job_id"] == "7" and rec["title"] == "Data Analyst" and rec["company_name"] == "Acme" and rec["description_text"] == "Use SQL"
      and rec["location"] == "Boston, MA" and rec["source_url"] == "https://x/7", rec)
recs = [{"title": "Data Analyst"}, {"title": "Chef"}, {"title": "BI Analyst II"}]
check("title regex keeps matches only, case-insensitively",
      [r["title"] for r in fb.title_filter(recs, "analyst")] == ["Data Analyst", "BI Analyst II"])
check("no regex keeps everything", len(fb.title_filter(recs, None)) == 3)

for bad in ("../etc/passwd", "UPPER", "", "a b", "-lead", "x" * 70, "a/b"):
    code, _, err = run_main([bad, "--out", "/tmp/x.json"])
    check(f"BREAK: invalid slug {bad[:12]!r} is refused with exit 2 and NO network call", code == 2 and not CALLS, f"code={code} calls={CALLS}")
code, _, _ = run_main(["acme"])
check("BREAK: neither --out nor --job is refused (exit 2, no network)", code == 2 and not CALLS, f"code={code}")
code, _, _ = run_main(["acme", "--job", "123"])
check("BREAK: --job without --text-out is refused (exit 2, no network)", code == 2 and not CALLS, f"code={code}")
code, _, _ = run_main(["acme", "--job", "12x", "--text-out", "/tmp/x.txt"])
check("BREAK: a non-numeric job id is refused (exit 2, no network)", code == 2 and not CALLS, f"code={code}")
code, _, _ = run_main(["acme", "--out", "/tmp/x.json", "--title-regex", "("])
check("BREAK: a broken title regex is refused (exit 2, no network)", code == 2 and not CALLS, f"code={code}")

with tempfile.TemporaryDirectory() as d:
    out = Path(d) / "b.json"
    stub = lambda url: {"jobs": [{"id": 1, "title": "Data Analyst", "location": {"name": "NYC"}, "content": "&lt;p&gt;x&lt;/p&gt;", "absolute_url": "u"},
                                {"id": 2, "title": "Chef", "location": {"name": "NYC"}, "content": "", "absolute_url": "v"}]}
    code, o, _ = run_main(["acme", "--company", "Acme", "--out", str(out), "--title-regex", "analyst"], stub)
    data = json.loads(out.read_text())
    check("whole-board mode writes only the filtered records and reports counts", code == 0 and len(data) == 1 and "2 postings on the board -> 1 written" in o, f"{code} {o}")
    txt = Path(d) / "p.txt"
    stub2 = lambda url: {"id": 9, "title": "BI Analyst", "location": {"name": "Boston, MA"}, "content": "&lt;p&gt;5+ years of experience&lt;/p&gt;", "absolute_url": "u", "first_published": "2026-03-04"}
    code, o, _ = run_main(["acme", "--job", "9", "--text-out", str(txt)], stub2)
    check("single-posting mode writes title, location, then the body", code == 0 and txt.read_text().splitlines()[:3] == ["BI Analyst", "Boston, MA", "5+ years of experience"], txt.read_text())
    code, _, err = run_main(["acme", "--out", str(out)], lambda url: {"jobs": []})
    check("BREAK: an empty board is an error (exit 1), not a silent empty file", code == 1, f"{code}")
    import urllib.error
    def boom(url): raise urllib.error.URLError("down")
    code, _, err = run_main(["acme", "--out", str(out)], boom)
    check("BREAK: a network failure is surfaced (exit 1), not swallowed", code == 1 and "could not fetch" in err, f"{code} {err}")

print(f"\n{passed} passed, {failed} failed")
sys.exit(1 if failed else 0)
