#!/usr/bin/env python3
"""
Nestfully Agent Scraper
=======================
Scrapes all ~244,688 real estate agent records from nestfully.com
Fields: full_name, state, email, phone

Uses curl_cffi to impersonate real browser TLS fingerprints (bypasses 403).

Features:
  - Crash recovery: resumes from the last completed page
  - Deduplication: by (name, email, phone) composite key
  - Per-page CSV flush + upsert into usagentleads.leads (see leads.py)
  - Retries with exponential backoff on failures
  - Session rotation on repeated failures
  - Detailed file + console logging

Usage:
    LEADS_REST_URL=… LEADS_REST_KEY=… python3 scripts/ingest/nestfully_requests.py
"""

import csv
import hashlib
import logging
import os
import re
import sys
import time
import random
import json
from datetime import datetime
from urllib.parse import unquote

from curl_cffi import requests as cffi_requests
from bs4 import BeautifulSoup

from leads import normalize, upsert_leads

# ─────────────────────────── CONFIGURATION ───────────────────────────

BASE_URL = (
    "https://www.nestfully.com/agentsearch/results.aspx"
    "?SearchType=agent&FirstName=&LastName=&OfficeName="
    "&Address=&City=&State=&Country=-32768&Zip="
    "&Languages=&Titles=&Specialties=&Accreditations="
    "&Areas=&rpp={rpp}&page={page}&SortOrder="
)

RESULTS_PER_PAGE = 50
TOTAL_AGENTS     = 244_688
TOTAL_PAGES      = -(-TOTAL_AGENTS // RESULTS_PER_PAGE)  # ceil → 4894

OUTPUT_CSV       = "nestfully_agents.csv"
PROGRESS_FILE    = "scraper_progress.json"
SEEN_HASHES_FILE = "seen_hashes.txt"
LOG_FILE         = "scraper.log"

REQUEST_TIMEOUT  = 30
MAX_RETRIES      = 5
RETRY_BASE_DELAY = 3
MIN_DELAY        = 1.5       # min seconds between requests
MAX_DELAY        = 3.5       # max seconds between requests

CSV_FIELDS = ["full_name", "state", "email", "phone"]

# curl_cffi browser impersonation targets — rotated on session refresh
IMPERSONATE_TARGETS = [
    "chrome124",
    "chrome120",
    "chrome119",
    "chrome116",
    "safari17_2_ios",
    "edge101",
]

# Extra headers to look like a real browser
EXTRA_HEADERS = {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "priority": "u=0, i",
    "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": "\"Android\"",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "cookie": "ExternalReferrer=https://www.google.com/; rBW-ListingSearch=a7e2e7bb-bcb0-484f-b52d-c88a55ee8bfb; BrokerOffice_Session=SessionCookie=28bab241-2bc5-49b9-93c5-a4a61048c68b; BrokerOffice_Visit=0=084ec636-a06e-479a-9721-bf02dfebb633&1=35070-0-0-False; _ga=GA1.1.269269809.1775385880; _fbp=fb.1.1775385881867.238949831245831834; _clck=14ttfj5%5E2%5Eg4y%5E0%5E2286; rBW-IpLocation=%257b%2522IPAddressFrom%2522%253a%2522149.40.209.0%2522%252c%2522IPAddressTo%2522%253a%2522149.40.209.224%2522%252c%2522ContinentCode%2522%253a%2522AS%2522%252c%2522CountryCode%2522%253a%2522PK%2522%252c%2522StateCode%2522%253a%2522KP%2522%252c%2522State%2522%253a%2522Khyber%2BPakhtunkhwa%2522%252c%2522District%2522%253a%2522Charsadda%2522%252c%2522City%2522%253a%2522Shabqadar%2522%252c%2522PostalCode%2522%253anull%252c%2522Latitude%2522%253a34.216%252c%2522Longitude%2522%253a71.5548%252c%2522GeonameId%2522%253a%25221165744%2522%252c%2522TimezoneOffset%2522%253a5%252c%2522Timezone%2522%253a%2522Asia%252fKarachi%2522%252c%2522WeatherCode%2522%253a%2522PKXX3620%2522%252c%2522Pin%2522%253a%257b%2522Lat%2522%253a34.216%252c%2522Lon%2522%253a71.5548%252c%2522IsValid%2522%253atrue%257d%257d; _cfuvid=Wz.inp6dTAihexKPKnjBim_pJq8siHXf5txA9GnA9gA-1775386294.382278-1.0.1.1-GVi_VOe9P3ZqX5DK4ij_xhl5.DSRt_t.8eVGas6Ledw; cf_clearance=un4bHp7XY5xuLD5BUb3TAJQ.cflHCTq4jpODziF_NW8-1775386302-1.2.1.1-qYqfUMXs8fh_dDLPlACzYeiKdx9L9vJ.d0iNSIEkiNHDiLAeySXohJ0VRc3TpAMNhYbKSEKDjpVCiKZtP0XcNmqe_qjqE0FOHD8uSxuAbHGoiL.lwCAX3bybOIa0_YBzmGDo_JVFuMHEHRjrBzYOCiJGTvCKUTwVIIclbLugN3k6SNhtOuT5rKLlDHndYj149jrRWu0HFnCnCdT_BdjYdgxHRib0ws8cMopwK5wIFeJJIIyuC1hJHgwFOFC6iuig8Xzp2ZWQmabZTOnZ22q1.kguEqsXrcIQ_LhbjXzbzv51_h2fV9In8ccpsrxicERK4ASYC4f6lHA7lVpCFnWLUg; _ga_0JDSWBHYS8=GS2.1.s1775385880$o1$g1$t1775386846$j25$l0$h631593499; _clsk=fn9988%5E1775386847977%5E16%5E1%5Em.clarity.ms%2Fcollect; __cf_bm=WmFyWWtHD3P_uBKKXKqf2qQ9s5E6R02dcpw3DWPXph8-1775387216.2859964-1.0.1.1-hDhyImLyyxXywR8jOe419.LukjdQ9dx8EJFC82syprrGTrLWZsidcvCoqb97pC8JLI16lXDz0IqaNDiYWrunXLJU2QrP79DUUW6gx0689O2KmiaOHLSo4G7U04NKYRnZ",
}

# ─────────────────────────── LOGGING SETUP ───────────────────────────

logger = logging.getLogger("nestfully_scraper")
logger.setLevel(logging.DEBUG)

fh = logging.FileHandler(LOG_FILE, encoding="utf-8")
fh.setLevel(logging.DEBUG)
fh.setFormatter(logging.Formatter(
    "%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
))

ch = logging.StreamHandler(sys.stdout)
ch.setLevel(logging.INFO)
ch.setFormatter(logging.Formatter(
    "%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
))

logger.addHandler(fh)
logger.addHandler(ch)


# ─────────────────────────── PROGRESS / DEDUP ────────────────────────

def load_progress() -> int:
    """Return the next page to scrape (1-indexed). Defaults to 1."""
    if os.path.exists(PROGRESS_FILE):
        try:
            with open(PROGRESS_FILE, "r") as f:
                data = json.load(f)
                last_done = data.get("last_completed_page", 0)
                logger.info(
                    f"Resuming from page {last_done + 1} "
                    f"(last completed: {last_done})"
                )
                return last_done + 1
        except (json.JSONDecodeError, KeyError):
            logger.warning("Corrupt progress file; starting from page 1.")
    return 1


def save_progress(page: int):
    """Persist the last successfully completed page number."""
    with open(PROGRESS_FILE, "w") as f:
        json.dump({
            "last_completed_page": page,
            "timestamp": datetime.now().isoformat(),
            "total_pages": TOTAL_PAGES,
        }, f, indent=2)


def load_seen_hashes() -> set:
    """Load the set of already-seen record hashes for deduplication."""
    hashes = set()
    if os.path.exists(SEEN_HASHES_FILE):
        with open(SEEN_HASHES_FILE, "r") as f:
            for line in f:
                h = line.strip()
                if h:
                    hashes.add(h)
        logger.info(f"Loaded {len(hashes):,} existing dedup hashes.")
    return hashes


def record_hash(name: str, email: str, phone: str) -> str:
    """Create a deterministic hash for deduplication."""
    key = f"{name.strip().lower()}|{email.strip().lower()}|{phone.strip()}"
    return hashlib.sha256(key.encode()).hexdigest()


def append_seen_hash(h: str):
    """Append a single hash to the persistent dedup file."""
    with open(SEEN_HASHES_FILE, "a") as f:
        f.write(h + "\n")


# ─────────────────────────── CSV HELPERS ─────────────────────────────

def init_csv():
    """Create the CSV with a header row if it doesn't already exist."""
    if not os.path.exists(OUTPUT_CSV):
        with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
            writer.writeheader()
        logger.info(f"Created new CSV file: {OUTPUT_CSV}")
    else:
        logger.info(f"Appending to existing CSV file: {OUTPUT_CSV}")


def append_rows_to_csv(rows: list[dict]):
    """Append a batch of rows to the output CSV."""
    if not rows:
        return
    with open(OUTPUT_CSV, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writerows(rows)


# ─────────────────────────── LEADS UPSERT ────────────────────────────

def upsert_rows(rows: list[dict]) -> dict:
    """Normalize one page of agents and upsert them into usagentleads.leads.

    Returns the upsert stats, or zeroed stats when the write failed — the rows
    are already in the CSV, so a DB blip must not end a 4,894-page crawl.
    """
    empty = {"inserted": 0, "already_known": 0}
    if not rows:
        return empty

    leads = [
        lead
        for lead in (
            normalize(r["full_name"], r["state"], r["email"], r["phone"]) for r in rows
        )
        if lead
    ]
    if not leads:
        return empty

    try:
        return upsert_leads(leads)
    except Exception as e:
        logger.error(
            f"Upsert failed for {len(leads)} row(s) — kept in CSV, continuing: {e}"
        )
        return empty


# ─────────────────────────── SESSION MGMT ────────────────────────────

def create_session() -> tuple[cffi_requests.Session, str]:
    """
    Create a fresh curl_cffi session with browser impersonation.
    Returns (session, impersonate_target_name).
    """
    target = random.choice(IMPERSONATE_TARGETS)
    session = cffi_requests.Session(impersonate=target)
    session.headers.update(EXTRA_HEADERS)

    # Warm up the session — visit the homepage first to get cookies
    try:
        logger.info(f"Creating new session (impersonate={target}), warming up…")
        resp = session.get(
            "https://www.nestfully.com/",
            timeout=REQUEST_TIMEOUT,
        )
        logger.debug(f"Homepage warm-up: HTTP {resp.status_code}")
        time.sleep(random.uniform(1, 2))
    except Exception as e:
        logger.warning(f"Homepage warm-up failed: {e}")

    return session, target


# ─────────────────────────── HTTP FETCH ──────────────────────────────

def fetch_page(
    session: cffi_requests.Session,
    page: int,
    impersonate_target: str,
) -> str:
    """
    Fetch a single results page with retries and exponential backoff.
    Returns HTML text on success; raises after MAX_RETRIES failures.
    """
    url = BASE_URL.format(rpp=RESULTS_PER_PAGE, page=page)

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            # Set a referer to look like natural navigation
            session.headers["Referer"] = BASE_URL.format(
                rpp=RESULTS_PER_PAGE, page=max(1, page - 1)
            )

            resp = session.get(url, timeout=REQUEST_TIMEOUT)

            if resp.status_code == 200:
                # Quick sanity check: does the response contain agent data?
                if "ao-info-container" in resp.text or "AgentSearch" in resp.text:
                    return resp.text
                else:
                    logger.warning(
                        f"Page {page}: HTTP 200 but no agent data found "
                        f"(attempt {attempt}/{MAX_RETRIES}). "
                        f"Possible CAPTCHA/challenge page."
                    )
                    # Might be a challenge page — wait and retry
                    time.sleep(RETRY_BASE_DELAY * (2 ** attempt))
                    continue

            if resp.status_code == 403:
                wait = RETRY_BASE_DELAY * (2 ** attempt) + random.uniform(2, 5)
                logger.warning(
                    f"403 Forbidden on page {page}, "
                    f"attempt {attempt}/{MAX_RETRIES}. "
                    f"Waiting {wait:.1f}s then retrying…"
                )
                time.sleep(wait)
                # If we've failed 3 times with 403, rotate the session
                if attempt == 3:
                    logger.info("Rotating session due to persistent 403…")
                    new_session, new_target = create_session()
                    session.headers = new_session.headers
                    session.cookies = new_session.cookies
                continue

            if resp.status_code == 429:
                wait = RETRY_BASE_DELAY * (2 ** attempt) + random.uniform(5, 15)
                logger.warning(
                    f"Rate-limited (429) on page {page}, "
                    f"attempt {attempt}/{MAX_RETRIES}. Waiting {wait:.1f}s…"
                )
                time.sleep(wait)
                continue

            if resp.status_code >= 500:
                wait = RETRY_BASE_DELAY * (2 ** attempt) + random.uniform(1, 3)
                logger.warning(
                    f"Server error {resp.status_code} on page {page}, "
                    f"attempt {attempt}/{MAX_RETRIES}. Waiting {wait:.1f}s…"
                )
                time.sleep(wait)
                continue

            # Other errors
            logger.error(
                f"HTTP {resp.status_code} on page {page} "
                f"(attempt {attempt}/{MAX_RETRIES})."
            )
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_BASE_DELAY * attempt)

        except cffi_requests.errors.RequestsError as e:
            wait = RETRY_BASE_DELAY * (2 ** attempt) + random.uniform(1, 5)
            logger.warning(
                f"Request error on page {page}, "
                f"attempt {attempt}/{MAX_RETRIES}: {e}. "
                f"Waiting {wait:.1f}s…"
            )
            time.sleep(wait)

        except Exception as e:
            logger.error(
                f"Unexpected error on page {page}, "
                f"attempt {attempt}/{MAX_RETRIES}: {type(e).__name__}: {e}"
            )
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_BASE_DELAY * attempt)

    raise RuntimeError(
        f"Failed to fetch page {page} after {MAX_RETRIES} attempts."
    )


# ─────────────────────────── HTML PARSING ────────────────────────────

EMAIL_RE = re.compile(r"AgentEmailAddress=([^&'\"]+)", re.IGNORECASE)
STATE_RE = re.compile(r",\s*([A-Za-z\s]+?)\s+\d{5}")


def parse_agents(html: str) -> list[dict]:
    """
    Parse all agent records from one page of HTML.
    Returns list of dicts: full_name, state, email, phone.
    """
    soup = BeautifulSoup(html, "html.parser")
    agents = []

    # Primary selector: each agent block is div.ao-info-container
    containers = soup.select("div.ao-info-container")

    # Fallback: find by heading links to /AgentSearch/
    if not containers:
        logger.debug("No .ao-info-container found; trying heading fallback.")
        for tag in ("h3", "h2"):
            headings = soup.select(tag)
            parents = [
                h.parent
                for h in headings
                if h.find("a", href=re.compile(r"/AgentSearch/"))
            ]
            if parents:
                containers = parents
                break

    for container in containers:
        try:
            record = _parse_single_agent(container)
            if record and record["full_name"]:
                agents.append(record)
        except Exception as e:
            logger.debug(f"Error parsing one agent block: {e}")
            continue

    return agents


def _parse_single_agent(container) -> dict | None:
    """Extract fields from one agent container element."""

    # ── Full Name ──
    name_tag = container.select_one(
        'h3 a[href*="/AgentSearch/"], h2 a[href*="/AgentSearch/"]'
    )
    if not name_tag:
        name_tag = container.find("a", href=re.compile(r"/AgentSearch/"))
    full_name = name_tag.get_text(strip=True) if name_tag else ""
    if not full_name:
        return None

    # ── State ──
    state = ""
    addr_div = container.select_one("div.ao-address")
    if addr_div:
        addr_text = addr_div.get_text(" ", strip=True)
        m = STATE_RE.search(addr_text)
        if m:
            state = m.group(1).strip()
    if not state:
        full_text = container.get_text(" ", strip=True)
        m = STATE_RE.search(full_text)
        if m:
            state = m.group(1).strip()

    # ── Email ──
    email = ""
    contact_link = container.find(
        "a", href=re.compile(r"openContactMe|ContactMe", re.I)
    )
    if contact_link:
        href = contact_link.get("href", "")
        em = EMAIL_RE.search(href)
        if em:
            email = unquote(em.group(1)).strip()

    # ── Phone (prefer Mobile, fall back to Office) ──
    phone = ""
    mobile_div = container.find("div", id="ao-cell")
    if mobile_div:
        phone_link = mobile_div.find("a", href=re.compile(r"^tel:"))
        if phone_link:
            phone = phone_link.get_text(strip=True)

    if not phone or phone == "(000) 000-0000":
        office_div = container.find("div", id="ao-phone")
        if office_div:
            phone_link = office_div.find("a", href=re.compile(r"^tel:"))
            if phone_link:
                phone = phone_link.get_text(strip=True)

    if not phone or phone == "(000) 000-0000":
        all_tel = container.find_all("a", href=re.compile(r"^tel:"))
        for tel in all_tel:
            p = tel.get_text(strip=True)
            if p and p != "(000) 000-0000":
                phone = p
                break

    if phone == "(000) 000-0000":
        phone = ""

    return {
        "full_name": full_name,
        "state": state,
        "email": email,
        "phone": phone,
    }


# ─────────────────────────── MAIN LOOP ───────────────────────────────

def main():
    logger.info("=" * 65)
    logger.info("Nestfully Agent Scraper — Starting (curl_cffi)")
    logger.info(
        f"Total agents: {TOTAL_AGENTS:,}  |  "
        f"Pages: {TOTAL_PAGES:,}  |  Per page: {RESULTS_PER_PAGE}"
    )
    logger.info("=" * 65)

    init_csv()
    start_page = load_progress()
    seen = load_seen_hashes()
    session, imp_target = create_session()

    total_new = 0
    total_dupes = 0
    total_errors = 0
    total_upserted = 0
    consecutive_failures = 0
    scrape_start = time.time()

    # Rotate session every N pages to stay fresh
    SESSION_ROTATE_INTERVAL = 200
    pages_since_rotation = 0

    for page in range(start_page, TOTAL_PAGES + 1):
        page_start = time.time()

        # ── Periodic session rotation ──
        pages_since_rotation += 1
        if pages_since_rotation >= SESSION_ROTATE_INTERVAL:
            logger.info(
                f"Rotating session after {SESSION_ROTATE_INTERVAL} pages…"
            )
            try:
                session.close()
            except Exception:
                pass
            session, imp_target = create_session()
            pages_since_rotation = 0

        # ── Fetch page ──
        try:
            html = fetch_page(session, page, imp_target)
            consecutive_failures = 0
        except RuntimeError as e:
            logger.error(str(e))
            total_errors += 1
            consecutive_failures += 1

            # If too many consecutive failures, rotate session and retry once
            if consecutive_failures >= 3:
                logger.warning(
                    "3+ consecutive failures — rotating session and pausing 60s…"
                )
                try:
                    session.close()
                except Exception:
                    pass
                time.sleep(60)
                session, imp_target = create_session()
                pages_since_rotation = 0
                consecutive_failures = 0

            # Save progress so we resume at this page
            save_progress(page - 1)

            # Don't stop entirely — skip this page and continue
            logger.info(f"Skipping page {page}, will continue with next.")
            continue

        # ── Parse agents ──
        agents = parse_agents(html)

        if not agents:
            logger.warning(f"Page {page}: 0 agents parsed — possible issue.")

        # ── Deduplicate ──
        new_rows = []
        page_dupes = 0
        for agent in agents:
            h = record_hash(
                agent["full_name"], agent["email"], agent["phone"]
            )
            if h in seen:
                page_dupes += 1
                continue
            seen.add(h)
            append_seen_hash(h)
            new_rows.append(agent)

        # ── Flush to CSV + upsert immediately ──
        append_rows_to_csv(new_rows)
        stats = upsert_rows(new_rows)

        total_new += len(new_rows)
        total_dupes += page_dupes
        total_upserted += stats["inserted"]

        # ── Save progress ──
        save_progress(page)

        # ── Stats ──
        elapsed = time.time() - page_start
        overall = time.time() - scrape_start
        pages_done = page - start_page + 1
        pages_left = TOTAL_PAGES - page
        avg_per_page = overall / pages_done if pages_done else 0
        eta_seconds = avg_per_page * pages_left
        eta_str = (
            f"{int(eta_seconds // 3600)}h "
            f"{int((eta_seconds % 3600) // 60)}m"
        )

        logger.info(
            f"Page {page:>5}/{TOTAL_PAGES} | "
            f"Parsed: {len(agents):>3} | "
            f"New: {len(new_rows):>3} | "
            f"Dupes: {page_dupes:>3} | "
            f"Upserted: {stats['inserted']:>3} | "
            f"Total: {total_new:>7,} | "
            f"Skipped: {total_dupes:>6,} | "
            f"{elapsed:.1f}s | "
            f"ETA: {eta_str}"
        )

        # ── Polite delay ──
        delay = random.uniform(MIN_DELAY, MAX_DELAY)
        time.sleep(delay)

    # ── Final summary ──
    total_time = time.time() - scrape_start
    logger.info("=" * 65)
    logger.info("Scraping complete!")
    logger.info(f"  New records written : {total_new:,}")
    logger.info(f"  Inserted into leads : {total_upserted:,}")
    logger.info(f"  Duplicates skipped  : {total_dupes:,}")
    logger.info(f"  Failed pages        : {total_errors}")
    logger.info(f"  Total time          : {total_time / 3600:.2f} hours")
    logger.info(f"  Output file         : {OUTPUT_CSV}")
    logger.info("=" * 65)


if __name__ == "__main__":
    main()