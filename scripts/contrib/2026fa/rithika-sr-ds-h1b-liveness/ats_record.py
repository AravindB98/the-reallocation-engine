"""ATS record checks for mode_run.py (standard library only).

Two read-only checks on an employer URL, both through one Fetcher so every
network call is recorded (P2: a contrib script making public GETs says so):

  greenhouse API  GET https://boards-api.greenhouse.io/v1/boards/<board>/jobs/<id>
                  200 with the same id -> active (title recorded); 404 -> expired;
                  anything else, or no answer -> uncertain.
  redirect chain  GET the URL, follow redirects by hand, record every hop.
                  A hop through `error=true` is an expired signal; a final URL
                  without the job id is a flag only.

Offline mode replays recorded responses from a fixture instead of the network.
"""

import json
import re
import os
import socket
import ssl
import urllib.error
import urllib.request
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse

API = "https://boards-api.greenhouse.io/v1/boards/{board}/jobs/{job_id}"
GREENHOUSE_HOSTS = {"boards.greenhouse.io", "job-boards.greenhouse.io"}
TIMEOUT_S = 15
MAX_HOPS = 10
USER_AGENT = "Mozilla/5.0 (compatible; rithika-sr-ds-h1b-liveness/0.2; read-only course contribution)"


# ---------- URL helpers ----------

def greenhouse_job(url):
    """(board, job_id) for a Greenhouse job URL, else None."""
    u = urlparse(url or "")
    parts = [p for p in u.path.split("/") if p]
    if (u.hostname or "").lower() in GREENHOUSE_HOSTS and len(parts) == 3 \
            and parts[1] == "jobs" and parts[2].isdigit():
        return parts[0], parts[2]
    return None


def job_id_of(url):
    """Greenhouse id, else the last run of 5+ digits in the path or query; None if there is none."""
    gh = greenhouse_job(url)
    if gh:
        return gh[1]
    u = urlparse(url or "")
    ids = re.findall(r"\d{5,}", f"{u.path}?{u.query}")
    return ids[-1] if ids else None


def host_match(url, domains):
    host = (urlparse(url or "").hostname or "").lower()
    for d in domains:
        if host == d or host.endswith("." + d):
            return d
    return None


def title_tokens(title):
    return set(re.sub(r"[^a-z0-9]+", " ", str(title or "").lower()).split())


def titles_match(a, b):
    return title_tokens(a) == title_tokens(b)


# ---------- fetching ----------

SYSTEM_CA_BUNDLE = "/etc/ssl/cert.pem"   # macOS system trust store export


def ssl_context():
    """A verifying TLS context. python.org builds of Python on macOS ship with no CA bundle until
    'Install Certificates.command' is run; then fall back to the macOS system bundle.
    Verification is never disabled. Returns (context, description of the CA source)."""
    ctx = ssl.create_default_context()
    if ctx.cert_store_stats()["x509_ca"] > 0:
        return ctx, "python default verify paths"
    if os.path.exists(SYSTEM_CA_BUNDLE):
        ctx = ssl.create_default_context(cafile=SYSTEM_CA_BUNDLE)
        return ctx, f"{SYSTEM_CA_BUNDLE} (python default had no CA certificates)"
    return ctx, "none found: every HTTPS call will fail verification and be recorded as an error"


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None   # surface every 3xx so each hop is recorded


class Fetcher:
    """One GET at a time. Live: urllib. Offline: replay `http` entries from a fixture.
    Every call lands in self.calls; every response subset lands in self.replay."""

    def __init__(self, mode="network", fixture_http=None):
        self.mode, self.fixture = mode, fixture_http or {}
        self.calls, self.replay = [], {}
        self.ca_source = None
        if mode != "offline":
            ctx, self.ca_source = ssl_context()
            self._opener = urllib.request.build_opener(_NoRedirect, urllib.request.HTTPSHandler(context=ctx))

    def get(self, url, purpose, want_json=False):
        if self.mode == "offline":
            resp = self.fixture.get(url) or {"status": None, "location": None, "json": None,
                                             "error": "not in offline fixture"}
            when = None
        else:
            resp = self._live(url, want_json)
            when = datetime.now(timezone.utc).isoformat(timespec="seconds")
        resp = {"status": resp.get("status"), "location": resp.get("location"),
                "json": resp.get("json"), "error": resp.get("error")}
        self.calls.append({"url": url, "method": "GET", "purpose": purpose, "status": resp["status"],
                           "location": resp["location"], "error": resp["error"], "time": when,
                           "mode": self.mode})
        self.replay[url] = resp
        return resp

    def _live(self, url, want_json):
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
        try:
            with self._opener.open(req, timeout=TIMEOUT_S) as r:
                body = r.read() if want_json else b""
                return {"status": r.status, "location": None, "json": _subset(body) if want_json else None}
        except urllib.error.HTTPError as e:
            return {"status": e.code, "location": e.headers.get("Location"), "json": None}
        except (socket.timeout, TimeoutError):
            return {"status": None, "error": "timeout"}
        except urllib.error.URLError as e:
            reason = e.reason
            return {"status": None, "error": "timeout" if isinstance(reason, (socket.timeout, TimeoutError))
                    else f"url error: {reason}"}


def _subset(body):
    """Keep only what a decision needs, so replay fixtures stay small and stable."""
    try:
        d = json.loads(body.decode("utf-8", "replace"))
    except ValueError:
        return {"_unparsed": True}
    return {k: d.get(k) for k in ("id", "title", "absolute_url")} if isinstance(d, dict) else {"_unparsed": True}


# ---------- the two checks ----------

def api_record(fetcher, board, job_id):
    url = API.format(board=board, job_id=job_id)
    r = fetcher.get(url, "greenhouse-api", want_json=True)
    rec = {"api_url": url, "http_status": r["status"], "title": None, "error": r["error"]}
    if r["status"] == 200 and isinstance(r["json"], dict) and str(r["json"].get("id")) == str(job_id):
        rec.update(status="active", title=r["json"].get("title"))
    elif r["status"] == 200:
        rec.update(status="uncertain", error="200 but the record id does not match the job id")
    elif r["status"] == 404:
        rec["status"] = "expired"
    else:
        rec["status"] = "uncertain"
    return rec


def redirect_chain(fetcher, url):
    hops, current, error_hop = [], url, None
    for _ in range(MAX_HOPS):
        r = fetcher.get(current, "redirect-hop")
        hops.append({"url": current, "status": r["status"], "location": r["location"], "error": r["error"]})
        for seen in (current, r["location"] or ""):
            if "error=true" in seen:
                error_hop = error_hop or urljoin(current, seen)
        if r["status"] in (301, 302, 303, 307, 308) and r["location"]:
            current = urljoin(current, r["location"])
            continue
        break
    final = hops[-1]["url"]
    job_id = job_id_of(url)
    return {
        "hops": hops,
        "final_url": final,
        "complete": hops[-1]["status"] is not None and hops[-1]["status"] not in (301, 302, 303, 307, 308),
        "error_hop": error_hop,
        "job_id": job_id,
        "final_has_job_id": None if job_id is None else job_id in final,
    }
