# prpathak1-network-sponsorship-text: scripts

## Executive summary

These small tools fetch public job postings from Lever boards with all their text, keep only
network-engineering titles, and pull out every sentence about sponsorship, work authorization,
citizenship or clearance. They never decide what a sentence means; a person does. They refuse to
write anywhere except the private, git-ignored folder, so raw posting text never ends up in a
commit. Standard-library Python only.

## Files

| File | Does | Writes |
|---|---|---|
| `fetch_lever_full.py` | one GET per board to `https://api.lever.co/v0/postings/<slug>?mode=json`; keeps `descriptionPlain`, `lists` (one line per bullet, with its section heading) and `additionalPlain` | `private/` only |
| `filter_titles.py` | include / flag / exclude network titles (a hand-predictable rule; false friends like "road network" excluded; software titles flagged for a human) | stdout; `private/` if `--out` |
| `extract_auth_sentences.py` | read-only keyword extraction with the field, section and text SHA-256; `label: null` always | stdout; `private/` if `--out` |
| `_common.py` | `private_path()` (exit 2 outside `private/`), `load_postings()` (reads both this format and `scripts/ats/fetch-real-postings.py` output), `text_sha256()` | — |
| `fixtures/BROKEN-*.json` | synthetic break fixtures (Visa false friend; title false friends) | — |
| `test/test_extract.py` | 8 stdlib unit tests | — |

## Commands

```
python -m unittest discover -s scripts/contrib/2026fa/prpathak1-network-sponsorship-text/test -v
python scripts/contrib/2026fa/prpathak1-network-sponsorship-text/fetch_lever_full.py shieldai zoox palantir -o private/real-postings/<run>-full.json
python scripts/contrib/2026fa/prpathak1-network-sponsorship-text/filter_titles.py private/real-postings/<run>-full.json --out private/network-sponsorship-text/<run>/titles.json
python scripts/contrib/2026fa/prpathak1-network-sponsorship-text/extract_auth_sentences.py private/real-postings/<run>-full.json --titles private/network-sponsorship-text/<run>/titles.json --out private/network-sponsorship-text/<run>/full
```

Exit codes: 0 ok; 2 a conformance stop (output outside `private/`, malformed input); 1 from
`fetch_lever_full.py` if no board was found.
