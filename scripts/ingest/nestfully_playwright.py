#!/usr/bin/env python3
"""
Nestfully Agent Scraper — Hybrid (Playwright cookie farm + curl_cffi scraper)
=============================================================================
- Playwright (headless + stealth) solves Cloudflare challenges & extracts cookies
- curl_cffi uses those cookies for fast HTTP scraping
- On 403, Playwright automatically refreshes cookies
- Each page is flushed to CSV and upserted into usagentleads.leads (leads.py)

pip install curl-cffi beautifulsoup4 playwright playwright-stealth
playwright install chromium

    LEADS_REST_URL=… LEADS_REST_KEY=… python3 scripts/ingest/nestfully_playwright.py
"""

import csv
import hashlib
import json
import logging
import os
import re
import sys
import time
import random
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
TOTAL_PAGES      = -(-TOTAL_AGENTS // RESULTS_PER_PAGE)  # 4894

OUTPUT_CSV       = "nestfully_agents.csv"
PROGRESS_FILE    = "scraper_progress.json"
SEEN_HASHES_FILE = "seen_hashes.txt"
COOKIES_FILE     = "cf_cookies.json"
LOG_FILE         = "scraper.log"

REQUEST_TIMEOUT  = 30
MAX_RETRIES      = 5
RETRY_BASE_DELAY = 3
MIN_DELAY        = 1.5
MAX_DELAY        = 3.5

CSV_FIELDS = ["full_name", "state", "email", "phone"]

# curl_cffi impersonation targets
IMPERSONATE_TARGETS = [
    "chrome124",
    "chrome120",
    "chrome119",
    "chrome116",
]

# Refresh cookies proactively every N pages (before they expire)
COOKIE_REFRESH_INTERVAL = 150

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


# ─────────────────── PLAYWRIGHT COOKIE EXTRACTION ────────────────────

def extract_cookies_with_playwright() -> dict:
    """
    Launch a real headless browser with stealth, visit the site to solve
    the Cloudflare challenge, then extract ALL cookies (including HttpOnly).
    Returns a dict of {cookie_name: cookie_value}.
    """
    from playwright.sync_api import sync_playwright
    from playwright_stealth import Stealth

    logger.info("Launching Playwright to extract fresh Cloudflare cookies…")
    cookies_dict = {}

    stealth = Stealth()
    with stealth.use_sync(sync_playwright()) as pw:
        browser = pw.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-dev-shm-usage",
            ],
        )
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
            timezone_id="America/New_York",
        )
        page = context.new_page()

        try:
            # Visit a search results page to trigger CF challenge
            logger.info("  Navigating to agent search page…")
            page.goto(
                BASE_URL.format(rpp=RESULTS_PER_PAGE, page=1),
                timeout=60_000,
                wait_until="domcontentloaded",
            )

            # Wait for page content to confirm challenge passed
            logger.info("  Waiting for Cloudflare challenge to resolve…")
            try:
                page.wait_for_selector(
                    "div.ao-info-container",
                    timeout=30_000,
                )
                logger.info("  ✓ Agent data loaded — CF challenge passed.")
            except Exception:
                # Might be a Turnstile or interstitial page — wait longer
                logger.info("  Waiting extra time for CF challenge…")
                time.sleep(10)
                page.wait_for_selector(
                    "div.ao-info-container",
                    timeout=30_000,
                )
                logger.info("  ✓ Agent data loaded after extra wait.")

            # Extract ALL cookies from the browser context (includes HttpOnly)
            all_cookies = context.cookies()
            for cookie in all_cookies:
                cookies_dict[cookie["name"]] = cookie["value"]

            logger.info(
                f"  Extracted {len(cookies_dict)} cookies: "
                f"{', '.join(cookies_dict.keys())}"
            )

            # Also grab user-agent for consistency
            ua = page.evaluate("navigator.userAgent")
            cookies_dict["_user_agent"] = ua

        except Exception as e:
            logger.error(f"  Cookie extraction failed: {e}")
        finally:
            context.close()
            browser.close()

    # Cache to disk
    if cookies_dict:
        _save_cookies_to_disk(cookies_dict)

    return cookies_dict


def _save_cookies_to_disk(cookies_dict: dict):
    """Save cookies to disk with timestamp for cache."""
    data = {
        "cookies": cookies_dict,
        "extracted_at": time.time(),
        "extracted_at_str": datetime.now().isoformat(),
    }
    with open(COOKIES_FILE, "w") as f:
        json.dump(data, f, indent=2)
    logger.debug(f"Cookies saved to {COOKIES_FILE}")


def _load_cookies_from_disk() -> dict | None:
    """Load cached cookies if fresh enough (< 10 min old)."""
    if not os.path.exists(COOKIES_FILE):
        return None
    try:
        with open(COOKIES_FILE, "r") as f:
            data = json.load(f)
        age = time.time() - data.get("extracted_at", 0)
        if age < 600:  # 10 minutes
            logger.info(
                f"Using cached cookies ({age:.0f}s old)."
            )
            return data["cookies"]
        else:
            logger.info(
                f"Cached cookies too old ({age:.0f}s). Refreshing…"
            )
            return None
    except Exception:
        return None


def get_fresh_cookies() -> dict:
    """Get cookies — from disk cache if fresh, otherwise via Playwright."""
    cached = _load_cookies_from_disk()
    if cached:
        return cached
    return extract_cookies_with_playwright()


# ─────────────────────────── SESSION MGMT ────────────────────────────

def build_cookie_header(cookies_dict: dict) -> str:
    """Build a cookie header string from the dict, excluding internal keys."""
    return "; ".join(
        f"{k}={v}"
        for k, v in cookies_dict.items()
        if not k.startswith("_user_agent")
    )


def create_session(cookies_dict: dict) -> cffi_requests.Session:
    """Create a curl_cffi session with the extracted cookies."""
    target = random.choice(IMPERSONATE_TARGETS)
    session = cffi_requests.Session(impersonate=target)

    ua = cookies_dict.get(
        "_user_agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )

    session.headers.update({
        "accept": (
            "text/html,application/xhtml+xml,application/xml;"
            "q=0.9,image/avif,image/webp,image/apng,*/*;"
            "q=0.8,application/signed-exchange;v=b3;q=0.7"
        ),
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "priority": "u=0, i",
        "sec-ch-ua": (
            '"Chromium";v="124", "Not-A.Brand";v="24", '
            '"Google Chrome";v="124"'
        ),
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "user-agent": ua,
        "cookie": build_cookie_header(cookies_dict),
    })

    logger.info(f"Session created (impersonate={target})")
    return session


# ─────────────────────────── PROGRESS / DEDUP ────────────────────────

def load_progress() -> int:
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
    with open(PROGRESS_FILE, "w") as f:
        json.dump({
            "last_completed_page": page,
            "timestamp": datetime.now().isoformat(),
            "total_pages": TOTAL_PAGES,
        }, f, indent=2)


def load_seen_hashes() -> set:
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
    key = f"{name.strip().lower()}|{email.strip().lower()}|{phone.strip()}"
    return hashlib.sha256(key.encode()).hexdigest()


def append_seen_hashes(hashes_list: list[str]):
    if not hashes_list:
        return
    with open(SEEN_HASHES_FILE, "a") as f:
        for h in hashes_list:
            f.write(h + "\n")


# ─────────────────────────── CSV HELPERS ─────────────────────────────

def init_csv():
    if not os.path.exists(OUTPUT_CSV):
        with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
            csv.DictWriter(f, fieldnames=CSV_FIELDS).writeheader()
        logger.info(f"Created new CSV: {OUTPUT_CSV}")
    else:
        logger.info(f"Appending to existing CSV: {OUTPUT_CSV}")


def append_rows_to_csv(rows: list[dict]):
    if not rows:
        return
    with open(OUTPUT_CSV, "a", newline="", encoding="utf-8") as f:
        csv.DictWriter(f, fieldnames=CSV_FIELDS).writerows(rows)


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


# ─────────────────────────── HTTP FETCH ──────────────────────────────

def fetch_page(session: cffi_requests.Session, page: int) -> str | None:
    """
    Fetch one page. Returns HTML on success, None on 403 (signal to refresh cookies).
    Raises RuntimeError after MAX_RETRIES on other errors.
    """
    url = BASE_URL.format(rpp=RESULTS_PER_PAGE, page=page)

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            session.headers["Referer"] = BASE_URL.format(
                rpp=RESULTS_PER_PAGE, page=max(1, page - 1)
            )
            resp = session.get(url, timeout=REQUEST_TIMEOUT)

            if resp.status_code == 200:
                if "ao-info-container" in resp.text or "AgentSearch" in resp.text:
                    return resp.text
                logger.warning(
                    f"Page {page}: 200 but no agent data "
                    f"(attempt {attempt}/{MAX_RETRIES})."
                )
                time.sleep(RETRY_BASE_DELAY * attempt)
                continue

            if resp.status_code == 403:
                logger.warning(
                    f"Page {page}: 403 — cookies expired. "
                    f"Need refresh."
                )
                return None  # Signal to caller: refresh cookies

            if resp.status_code == 429:
                wait = RETRY_BASE_DELAY * (2 ** attempt) + random.uniform(5, 15)
                logger.warning(
                    f"429 on page {page}, attempt {attempt}. "
                    f"Waiting {wait:.1f}s…"
                )
                time.sleep(wait)
                continue

            if resp.status_code >= 500:
                wait = RETRY_BASE_DELAY * (2 ** attempt) + random.uniform(1, 3)
                logger.warning(
                    f"HTTP {resp.status_code} on page {page}, "
                    f"attempt {attempt}. Waiting {wait:.1f}s…"
                )
                time.sleep(wait)
                continue

            logger.error(
                f"HTTP {resp.status_code} on page {page} "
                f"(attempt {attempt}/{MAX_RETRIES})."
            )
            time.sleep(RETRY_BASE_DELAY * attempt)

        except cffi_requests.errors.RequestsError as e:
            wait = RETRY_BASE_DELAY * (2 ** attempt) + random.uniform(1, 5)
            logger.warning(
                f"Request error page {page}, attempt {attempt}: {e}. "
                f"Waiting {wait:.1f}s…"
            )
            time.sleep(wait)

        except Exception as e:
            logger.error(
                f"Unexpected error page {page}, attempt {attempt}: "
                f"{type(e).__name__}: {e}"
            )
            time.sleep(RETRY_BASE_DELAY * attempt)

    raise RuntimeError(
        f"Failed to fetch page {page} after {MAX_RETRIES} attempts."
    )


# ─────────────────────────── HTML PARSING ────────────────────────────

EMAIL_RE = re.compile(r"AgentEmailAddress=([^&'\"]+)", re.IGNORECASE)
STATE_RE = re.compile(r",\s*([A-Za-z\s]+?)\s+\d{5}")


def parse_agents(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    agents = []

    containers = soup.select("div.ao-info-container")
    if not containers:
        for tag in ("h3", "h2"):
            headings = soup.select(tag)
            parents = [
                h.parent for h in headings
                if h.find("a", href=re.compile(r"/AgentSearch/"))
            ]
            if parents:
                containers = parents
                break

    for container in containers:
        try:
            rec = _parse_single_agent(container)
            if rec and rec["full_name"]:
                agents.append(rec)
        except Exception as e:
            logger.debug(f"Parse error: {e}")
    return agents


def _parse_single_agent(container) -> dict | None:
    name_tag = container.select_one(
        'h3 a[href*="/AgentSearch/"], h2 a[href*="/AgentSearch/"]'
    )
    if not name_tag:
        name_tag = container.find("a", href=re.compile(r"/AgentSearch/"))
    full_name = name_tag.get_text(strip=True) if name_tag else ""
    if not full_name:
        return None

    state = ""
    addr_div = container.select_one("div.ao-address")
    if addr_div:
        m = STATE_RE.search(addr_div.get_text(" ", strip=True))
        if m:
            state = m.group(1).strip()
    if not state:
        m = STATE_RE.search(container.get_text(" ", strip=True))
        if m:
            state = m.group(1).strip()

    email = ""
    contact = container.find(
        "a", href=re.compile(r"openContactMe|ContactMe", re.I)
    )
    if contact:
        em = EMAIL_RE.search(contact.get("href", ""))
        if em:
            email = unquote(em.group(1)).strip()

    phone = ""
    for div_id in ("ao-cell", "ao-phone"):
        div = container.find("div", id=div_id)
        if div:
            link = div.find("a", href=re.compile(r"^tel:"))
            if link:
                p = link.get_text(strip=True)
                if p and p != "(000) 000-0000":
                    phone = p
                    break
    if not phone or phone == "(000) 000-0000":
        for tel in container.find_all("a", href=re.compile(r"^tel:")):
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
    logger.info("Nestfully Scraper — Hybrid (Playwright cookies + curl_cffi)")
    logger.info(
        f"Total agents: {TOTAL_AGENTS:,}  |  "
        f"Pages: {TOTAL_PAGES:,}  |  Per page: {RESULTS_PER_PAGE}"
    )
    logger.info("=" * 65)

    init_csv()
    start_page = load_progress()
    seen = load_seen_hashes()

    total_new      = 0
    total_dupes    = 0
    total_errors   = 0
    total_upserted = 0
    scrape_start   = time.time()
    pages_since_cookie_refresh = 0

    # ── Get initial cookies ──
    cookies_dict = get_fresh_cookies()
    if not cookies_dict:
        logger.error("Could not obtain cookies. Exiting.")
        sys.exit(1)

    session = create_session(cookies_dict)

    for page_num in range(start_page, TOTAL_PAGES + 1):
        page_start = time.time()

        # ── Proactive cookie refresh ──
        pages_since_cookie_refresh += 1
        if pages_since_cookie_refresh >= COOKIE_REFRESH_INTERVAL:
            logger.info(
                f"Proactive cookie refresh after "
                f"{COOKIE_REFRESH_INTERVAL} pages…"
            )
            cookies_dict = extract_cookies_with_playwright()
            if cookies_dict:
                session = create_session(cookies_dict)
                pages_since_cookie_refresh = 0
            else:
                logger.warning("Proactive refresh failed, continuing…")

        # ── Fetch page ──
        try:
            html = fetch_page(session, page_num)
        except RuntimeError as e:
            logger.warning(
                f"{e} — likely stale session. "
                f"Refreshing cookies before skipping…"
            )
            cookies_dict = extract_cookies_with_playwright()
            if cookies_dict:
                session = create_session(cookies_dict)
                pages_since_cookie_refresh = 0
                # Retry the page once with fresh cookies
                try:
                    html = fetch_page(session, page_num)
                except RuntimeError as e2:
                    logger.error(
                        f"Still failing after cookie refresh: {e2}"
                    )
                    total_errors += 1
                    save_progress(page_num - 1)
                    continue
            else:
                logger.error("Cookie refresh failed. Skipping page.")
                total_errors += 1
                save_progress(page_num - 1)
                continue

        # html is None → 403 → need cookie refresh
        if html is None:
            logger.info("Refreshing cookies via Playwright…")
            cookies_dict = extract_cookies_with_playwright()
            if not cookies_dict:
                logger.error(
                    "Cookie refresh failed. Waiting 60s then retrying…"
                )
                time.sleep(60)
                cookies_dict = extract_cookies_with_playwright()
                if not cookies_dict:
                    logger.error("Second cookie refresh failed. Exiting.")
                    save_progress(page_num - 1)
                    break

            session = create_session(cookies_dict)
            pages_since_cookie_refresh = 0

            # Retry the same page with fresh cookies
            try:
                html = fetch_page(session, page_num)
            except RuntimeError as e:
                logger.error(f"Still failing after refresh: {e}")
                total_errors += 1
                save_progress(page_num - 1)
                continue

            if html is None:
                logger.error(
                    f"Page {page_num}: 403 even after fresh cookies. "
                    f"Skipping."
                )
                total_errors += 1
                save_progress(page_num - 1)
                continue

        # ── Parse ──
        agents = parse_agents(html)
        if not agents:
            logger.warning(f"Page {page_num}: 0 agents parsed.")

        # ── Deduplicate ──
        new_rows = []
        new_hashes = []
        page_dupes = 0
        for agent in agents:
            h = record_hash(
                agent["full_name"], agent["email"], agent["phone"]
            )
            if h in seen:
                page_dupes += 1
                continue
            seen.add(h)
            new_hashes.append(h)
            new_rows.append(agent)

        # ── Persist ──
        append_rows_to_csv(new_rows)
        stats = upsert_rows(new_rows)
        append_seen_hashes(new_hashes)
        save_progress(page_num)

        total_new      += len(new_rows)
        total_dupes    += page_dupes
        total_upserted += stats["inserted"]

        # ── Stats ──
        elapsed    = time.time() - page_start
        overall    = time.time() - scrape_start
        pages_done = page_num - start_page + 1
        pages_left = TOTAL_PAGES - page_num
        avg_pp     = overall / pages_done if pages_done else 0
        eta_sec    = avg_pp * pages_left
        eta_str    = (
            f"{int(eta_sec // 3600)}h "
            f"{int((eta_sec % 3600) // 60)}m"
        )

        logger.info(
            f"Page {page_num:>5}/{TOTAL_PAGES} | "
            f"Parsed: {len(agents):>3} | "
            f"New: {len(new_rows):>3} | "
            f"Dupes: {page_dupes:>3} | "
            f"Upserted: {stats['inserted']:>3} | "
            f"Total: {total_new:>7,} | "
            f"Skip: {total_dupes:>6,} | "
            f"{elapsed:.1f}s | "
            f"ETA: {eta_str}"
        )

        # ── Polite delay ──
        time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))

    # ── Summary ──
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