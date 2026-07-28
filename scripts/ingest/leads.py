"""Shared normalization + upsert for the Python ingest scrapers.

Python mirror of `lib.mjs`. The .mjs adapters are plain fetch scripts and can
import `upsertLeads` directly; the scrapers that need curl_cffi/pydoll/Playwright
to get past bot protection are Python, and long enough (nestfully is ~4.9k pages,
zillow ~33k zips) that they upsert incrementally as they crawl rather than
harvesting to CSV first. This module keeps that second implementation of the
dedup rules in one place instead of four.

Normalized lead shape: {name, state, email, phone} — the only four fields we
ingest. `state` must be a full state name from the valid list in
`infra/leads-db/db/01-schema.sql`. A lead is worth keeping if it has an email
**or** a phone; only rows with neither are dropped.

Upserts go to the self-hosted PostgREST in front of the VPS Postgres (see
`infra/leads-db/README.md`): POST /rest/v1/leads?on_conflict=email with
Prefer: resolution=ignore-duplicates. Existing rows carry email-campaign state
(email1_sent_at…email6_sent_at, replied, …) and must never be overwritten —
ignore-duplicates guarantees only brand-new emails insert.

    from leads import normalize, upsert_leads

    rows = [r for r in (normalize(n, st, em, ph) for ...) if r]
    stats = upsert_leads(rows)   # {'unique', 'inserted', 'already_known', ...}

Needs LEADS_REST_URL / LEADS_REST_KEY in the environment (or in `.env.local` /
`.env` at the repo root). Set LEADS_DRY_RUN=1 to count rows without writing.
Standard library only — no packages beyond what each scraper already needs.
"""

import json
import os
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

REQUEST_TIMEOUT = 120
MAX_ATTEMPTS = 4
PHONE_LOOKUP_CHUNK = 400

_env_loaded = False


def load_env():
    """Populate os.environ from .env.local / .env at the repo root (once)."""
    global _env_loaded
    if _env_loaded:
        return
    _env_loaded = True
    for name in (".env.local", ".env"):
        path = ROOT / name
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            m = re.match(r"^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$", line)
            if m and os.environ.get(m.group(1)) is None:
                os.environ[m.group(1)] = re.sub(r'^["\']|["\']$', "", m.group(2))


# ─────────────────────────── normalization ───────────────────────────

EMAIL_RE = re.compile(r"^[a-z0-9._%+'-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$")
JUNK_EMAIL = re.compile(r"noemail|nomail|none@|@none\.|no@no|donotemail|test@test")


def clean_email(raw):
    e = str(raw or "").strip().lower()
    if not e or len(e) > 254 or not EMAIL_RE.match(e) or JUNK_EMAIL.search(e):
        return None
    return e


def clean_phone(raw):
    digits = re.sub(r"\D", "", str(raw or ""))
    if len(digits) == 10:
        return digits
    if len(digits) == 11 and digits.startswith("1"):
        return digits[1:]
    return None


def title_case(raw):
    s = re.sub(r"\s+", " ", str(raw or "")).strip()
    if not s:
        return None
    return re.sub(r"(^|[\s\-'.])([a-z])", lambda m: m.group(1) + m.group(2).upper(), s.lower())


# Directory sources give two-letter states; the table wants full names.
STATE_NAMES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
    "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "DC": "District of Columbia",
    "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois",
    "IN": "Indiana", "IA": "Iowa", "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana",
    "ME": "Maine", "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan",
    "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri", "MT": "Montana",
    "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
    "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota",
    "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania",
    "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee",
    "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington",
    "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
}

_STATE_BY_LOWER_NAME = {v.lower(): v for v in STATE_NAMES.values()}


def state_name(raw):
    """Two-letter code (or already-full name) -> full state name, else None."""
    s = str(raw or "").strip()
    if not s:
        return None
    return STATE_NAMES.get(s.upper()) or _STATE_BY_LOWER_NAME.get(s.lower())


def normalize(name, state, email=None, phone=None):
    """Clean one scraped record into a lead row, or None if it is unusable."""
    n = title_case(name)
    st = state_name(state)
    e = clean_email(email)
    p = clean_phone(phone)
    if not n or not st or (not e and not p):
        return None
    return {"name": n, "state": st, "email": e, "phone": p}


# ─────────────────────────── PostgREST I/O ───────────────────────────


def credentials():
    """(base_url, key) from the environment. Raises if either is missing."""
    load_env()
    url = os.environ.get("LEADS_REST_URL")
    key = os.environ.get("LEADS_REST_KEY")
    if not url or not key:
        raise RuntimeError(
            "LEADS_REST_URL / LEADS_REST_KEY are not set (see infra/leads-db/README.md)"
        )
    return url.rstrip("/"), key


def _send(req):
    """urlopen with lib.mjs's retry policy: 4 attempts, 3s/6s/9s backoff on 5xx."""
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
                return json.loads(resp.read().decode("utf-8") or "[]")
        except urllib.error.HTTPError as err:
            detail = err.read().decode("utf-8", "replace")[:500]
            if err.code >= 500 and attempt < MAX_ATTEMPTS:
                time.sleep(attempt * 3)
                continue
            raise RuntimeError(f"PostgREST {err.code}: {detail}") from None
        except Exception:
            if attempt >= MAX_ATTEMPTS:
                raise
            time.sleep(attempt * 3)
    raise RuntimeError("unreachable")


def _post_batch(endpoint, key, rows):
    req = urllib.request.Request(
        endpoint,
        method="POST",
        data=json.dumps(rows).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Content-Profile": "usagentleads",
            "Prefer": "resolution=ignore-duplicates,return=representation",
        },
    )
    return _send(req)


def _existing_phones(base, key, phones):
    """
    Look up which of `phones` already exist in the table, so phone-only rows can
    be filtered before insert. `email` is the only UNIQUE column, and Postgres
    treats NULL emails as distinct — without this check every phone-only row
    would re-insert on each run instead of being ignored as a duplicate.
    """
    found = set()
    for i in range(0, len(phones), PHONE_LOOKUP_CHUNK):
        chunk = phones[i : i + PHONE_LOOKUP_CHUNK]
        req = urllib.request.Request(
            f"{base}/rest/v1/leads?select=phone&phone=in.({','.join(chunk)})",
            headers={
                "Authorization": f"Bearer {key}",
                "Accept-Profile": "usagentleads",
            },
        )
        for row in _send(req):
            found.add(row["phone"])
    return found


def upsert_leads(leads, dry_run=None, batch=1000):
    """
    Upsert already-normalized leads (see `normalize`). A row is kept when it has
    an email **or** a phone; only rows with neither are skipped.

    Rows with an email go through the `on_conflict=email` upsert. Phone-only rows
    have no unique key to conflict on, so they are de-duplicated against the
    table by phone first and then plain-inserted.

    De-duplication here is within the passed batch — callers upserting page by
    page rely on the table itself (ignore-duplicates + the phone pre-check) to
    absorb repeats across pages, which is what makes a resumed crawl idempotent.

    Returns {unique, dupes_in_batch, skipped_no_contact, inserted, already_known}.
    With dry_run no network calls are made.
    """
    if dry_run is None:
        dry_run = os.environ.get("LEADS_DRY_RUN", "") not in ("", "0", "false")

    seen_email = set()
    seen_phone = set()
    email_rows = []
    phone_rows = []
    skipped_no_contact = 0

    for lead in leads:
        email = lead.get("email") or None
        phone = lead.get("phone") or None
        row = {"name": lead.get("name"), "state": lead.get("state"), "email": email, "phone": phone}
        if email:
            if email in seen_email:
                continue
            seen_email.add(email)
            email_rows.append(row)
        elif phone:
            # Two agents can share an office line, but we cannot tell them apart
            # without an email, so one phone == one lead.
            if phone in seen_phone:
                continue
            seen_phone.add(phone)
            phone_rows.append(row)
        else:
            skipped_no_contact += 1

    total_unique = len(email_rows) + len(phone_rows)
    stats = {
        "unique": total_unique,
        "dupes_in_batch": len(leads) - total_unique - skipped_no_contact,
        "skipped_no_contact": skipped_no_contact,
        "inserted": 0,
        "already_known": 0,
        "dry_run": bool(dry_run),
    }

    if dry_run or not total_unique:
        stats["already_known"] = 0 if dry_run else total_unique
        return stats

    base, key = credentials()
    inserted = 0

    email_endpoint = f"{base}/rest/v1/leads?on_conflict=email&select=id"
    for i in range(0, len(email_rows), batch):
        inserted += len(_post_batch(email_endpoint, key, email_rows[i : i + batch]))

    if phone_rows:
        known = _existing_phones(base, key, [r["phone"] for r in phone_rows])
        fresh = [r for r in phone_rows if r["phone"] not in known]
        phone_endpoint = f"{base}/rest/v1/leads?select=id"
        for i in range(0, len(fresh), batch):
            inserted += len(_post_batch(phone_endpoint, key, fresh[i : i + batch]))

    stats["inserted"] = inserted
    stats["already_known"] = total_unique - inserted
    return stats
