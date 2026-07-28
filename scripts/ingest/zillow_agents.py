#!/usr/bin/env python3
"""
Zillow Real Estate Agent Scraper
=================================
Extracts: full_name, state, phone, email
for every US zip code via Zillow's agent directory.

Uses curl_cffi to impersonate a real browser TLS fingerprint and
bypass Cloudflare / anti-bot protections.

Every page is upserted into usagentleads.leads (see leads.py) as it is
scraped; the CSV is kept alongside as a raw local record because it also
carries source_zip / profile_url, which the leads table does not store.

Install:
    pip install curl_cffi beautifulsoup4

Usage:
    LEADS_REST_URL=… LEADS_REST_KEY=… python3 scripts/ingest/zillow_agents.py
"""

import csv
import json
import logging
import math
import os
import random
import re
import time
from datetime import datetime
from pathlib import Path

from curl_cffi import requests
from bs4 import BeautifulSoup

from leads import normalize, upsert_leads

# ─────────────────────────── configuration ────────────────────────────

OUTPUT_DIR = "output"
OUTPUT_CSV = os.path.join(OUTPUT_DIR, "zillow_agents.csv")
PROGRESS_FILE = os.path.join(OUTPUT_DIR, "progress.json")
ZIP_FILE = os.path.join(OUTPUT_DIR, "us_zipcodes.txt")

LISTING_URL = "https://www.zillow.com/professionals/real-estate-agent-reviews/{zip}/?page={page}"
PROFILE_URL = "https://www.zillow.com/profile/{screen_name}"

BROWSER_IMPERSONATE = "chrome124"  # curl_cffi browser fingerprint

# ─────────────────────────── proxies ──────────────────────────────────
# Format per line: host:port:username:password
# All requests are routed through a randomly chosen proxy from this pool.
# (Residential rotating proxies — duplicates are harmless, the upstream
#  rotates the exit IP on every connection.)
#
# Credentials are NOT committed. Supply them at run time:
#     PROXY_POOL="host:port:user:pass" python3 scripts/ingest/zillow_agents.py
# or paste real endpoints below, replacing the <placeholder> template. With no
# proxies configured the scraper falls back to the local IP.
PROXY_POOL_RAW = os.environ.get("PROXY_POOL") or """
<host>:<port>:<username>:<password>
""".strip()


def _parse_proxies(raw: str) -> list[dict]:
    """Parse `host:port:user:pass` lines into curl_cffi proxy dicts."""
    proxies: list[dict] = []
    for line in raw.splitlines():
        line = line.strip()
        # Blank, commented, or the un-filled <placeholder> template.
        if not line or line.startswith("#") or "<" in line:
            continue
        parts = line.split(":")
        if len(parts) != 4:
            log.warning("Skipping malformed proxy line: %s", line)
            continue
        host, port, user, pwd = parts
        url = f"http://{user}:{pwd}@{host}:{port}"
        proxies.append({"http": url, "https": url})
    return proxies


REQUEST_TIMEOUT = 30
MIN_DELAY = 1.5
MAX_DELAY = 3.5
RETRY_ATTEMPTS = 3
RETRY_BACKOFF = 10
MAX_CONSECUTIVE_ERRORS = 20
AGENTS_PER_PAGE = 15

CSV_FIELDS = ["full_name", "state", "phone", "email", "source_zip", "profile_url"]

# ─────────────────────────── logging setup ────────────────────────────

Path(OUTPUT_DIR).mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-7s │ %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(OUTPUT_DIR, "scraper.log")),
    ],
)
log = logging.getLogger("zillow_scraper")

PROXIES = _parse_proxies(PROXY_POOL_RAW)
if PROXIES:
    log.info("Loaded %d proxy endpoint(s) — routing all requests through them", len(PROXIES))
else:
    log.warning("No proxies configured — requests will go out on the local IP")

# ─────────────────────────── helpers ──────────────────────────────────


def _delay():
    time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))


def _random_proxy() -> dict | None:
    """Return a random proxy dict (or None when no proxies are configured)."""
    return random.choice(PROXIES) if PROXIES else None


def _get(session: requests.Session, url: str) -> requests.Response | None:
    """GET with retries, backoff, proxy rotation, and browser impersonation."""
    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            _delay()
            resp = session.get(
                url,
                impersonate=BROWSER_IMPERSONATE,
                timeout=REQUEST_TIMEOUT,
                proxies=_random_proxy(),
            )

            if resp.status_code == 200:
                return resp

            if resp.status_code in (403, 429, 503):
                wait = RETRY_BACKOFF * attempt + random.uniform(0, 5)
                log.warning(
                    "HTTP %s on %s – backing off %.1fs (attempt %d/%d)",
                    resp.status_code, url, wait, attempt, RETRY_ATTEMPTS,
                )
                time.sleep(wait)
                continue

            log.warning(
                "HTTP %s on %s (attempt %d/%d)",
                resp.status_code, url, attempt, RETRY_ATTEMPTS,
            )

        except Exception as exc:
            log.warning(
                "Request error on %s: %s (attempt %d/%d)",
                url, exc, attempt, RETRY_ATTEMPTS,
            )
            time.sleep(RETRY_BACKOFF * attempt)

    log.error("Failed after %d attempts: %s", RETRY_ATTEMPTS, url)
    return None


def _extract_next_data(html: str) -> dict | None:
    """Pull __NEXT_DATA__ JSON from the page."""
    soup = BeautifulSoup(html, "html.parser")
    tag = soup.find("script", id="__NEXT_DATA__")
    if tag and tag.string:
        try:
            return json.loads(tag.string)
        except json.JSONDecodeError:
            log.warning("Failed to parse __NEXT_DATA__ JSON")
    return None


def _best_phone(phones: dict | None) -> str:
    """Pick the best phone number: cell > business > brokerage.

    Skips the all-zeros placeholder — it is 10 digits, so it would survive
    normalization and land in the table as an un-fixable phone-only lead.
    """
    if not phones:
        return ""
    for key in ("cell", "business", "brokerage"):
        p = phones.get(key) or ""
        if p and re.sub(r"\D", "", p).strip("0"):
            return p
    return ""


# ──────────────────── zip code generation ─────────────────────────────


def load_zipcodes() -> list[str]:
    """Load or download the full list of US ZIP codes."""
    if os.path.exists(ZIP_FILE):
        with open(ZIP_FILE) as f:
            zips = [line.strip() for line in f if line.strip()]
        log.info("Loaded %d zip codes from cache", len(zips))
        return zips

    log.info("Downloading US zip code list …")
    try:
        from curl_cffi import requests as dl_requests

        resp = dl_requests.get(
            "https://raw.githubusercontent.com/scpike/us-state-county-zip/"
            "master/geo-data.csv",
            impersonate=BROWSER_IMPERSONATE,
            timeout=30,
            proxies=_random_proxy(),
        )
        resp.raise_for_status()
        zips = set()
        for line in resp.text.splitlines()[1:]:
            parts = line.split(",")
            if len(parts) >= 4:
                z = parts[3].strip().strip('"').zfill(5)
                if re.match(r"^\d{5}$", z):
                    zips.add(z)
        zips = sorted(zips)
        log.info("Downloaded %d zip codes", len(zips))
    except Exception as exc:
        log.warning("Could not download zip list (%s) – generating full 00000-99999 range", exc)
        zips = [str(i).zfill(5) for i in range(100_000)]

    with open(ZIP_FILE, "w") as f:
        f.write("\n".join(zips))
    log.info("Saved %d zip codes to %s", len(zips), ZIP_FILE)
    return zips


# ──────────────────── progress tracking ───────────────────────────────


def load_progress() -> dict:
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            return json.load(f)
    return {"completed_zips": [], "seen_profiles": [], "total_agents": 0}


def save_progress(progress: dict):
    with open(PROGRESS_FILE, "w") as f:
        json.dump(progress, f)


# ──────────────────── CSV export ──────────────────────────────────────


def init_csv():
    if not os.path.exists(OUTPUT_CSV):
        with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
            csv.DictWriter(f, fieldnames=CSV_FIELDS).writeheader()
        log.info("Created %s", OUTPUT_CSV)


def append_to_csv(agents: list[dict]):
    if not agents:
        return
    with open(OUTPUT_CSV, "a", newline="", encoding="utf-8") as f:
        csv.DictWriter(f, fieldnames=CSV_FIELDS).writerows(agents)
    log.info("Wrote %d agents to CSV", len(agents))


# ──────────────────── leads table upsert ──────────────────────────────


def upsert_agents(agents: list[dict]):
    """Normalize one page of agents and upsert them into usagentleads.leads."""
    if not agents:
        return
    rows = [
        lead
        for lead in (
            normalize(a["full_name"], a["state"], a["email"], a["phone"]) for a in agents
        )
        if lead
    ]
    if not rows:
        log.info("Nothing to upsert — no row had a valid state plus an email or phone")
        return
    try:
        stats = upsert_leads(rows)
        log.info(
            "Upserted %d/%d agents │ %d new │ %d already in table",
            len(rows), len(agents), stats["inserted"], stats["already_known"],
        )
    except Exception as exc:
        # The rows are already in the CSV, so a DB blip costs nothing but a
        # later `import-csv.mjs` run — never abandon the crawl over it.
        log.error("Upsert failed for %d row(s) — kept in CSV, continuing: %s", len(rows), exc)


# ──────────────────── listing page parser ─────────────────────────────


def parse_listing_page(data: dict) -> tuple[list[dict], int]:
    """
    Returns (agent_cards, total_results).
    Each card: {"screenName": str, "cardTitle": str}
    """
    search = (
        data.get("props", {})
        .get("pageProps", {})
        .get("displayData", {})
        .get("agentDirectoryFinderDisplay", {})
        .get("searchResults", {})
    )

    total = search.get("resultsFound", 0)
    results = search.get("results", {})

    if results.get("__typename") == "AgentDirectoryFinderSearchEmpty":
        return [], 0

    cards = results.get("resultsCards", [])
    agents = []
    for card in cards:
        if card.get("__typename") != "AgentDirectoryFinderProfileResultsCard":
            continue
        link = card.get("cardActionLink", "")
        screen_name = link.rstrip("/").split("/")[-1] if link else ""
        if screen_name:
            agents.append({"screenName": screen_name, "cardTitle": card.get("cardTitle", "")})
    return agents, total


# ──────────────────── profile page parser ─────────────────────────────


def parse_profile(data: dict, source_zip: str) -> dict | None:
    """
    Extract only: full_name, state, phone, email from a profile page.

    Zillow embeds this in __NEXT_DATA__ → props.pageProps.displayUser:
      - .name              → "Cody Wurst Team"
      - .email             → "cwurst@abetterway.com"
      - .phoneNumbers      → {cell, business, brokerage}
      - .businessAddress   → {state: "NC", ...}
    """
    user = data.get("props", {}).get("pageProps", {}).get("displayUser", {})
    if not user:
        return None

    name = user.get("name", "")
    if not name:
        return None

    return {
        "full_name": name,
        "state": (user.get("businessAddress") or {}).get("state", ""),
        "phone": _best_phone(user.get("phoneNumbers")),
        "email": user.get("email", ""),
        "source_zip": source_zip,
        "profile_url": f"https://www.zillow.com/profile/{user.get('screenName', '')}",
    }


# ──────────────────── main scraping loop ──────────────────────────────


def scrape_zip(session: requests.Session, zip_code: str, seen: set) -> list[dict]:
    """Scrape all agents for one zip code. Returns list of agent dicts."""
    page = 1
    all_agents: list[dict] = []

    while True:
        url = LISTING_URL.format(zip=zip_code, page=page)
        log.info("ZIP %s │ page %d", zip_code, page)

        resp = _get(session, url)
        if resp is None:
            break

        data = _extract_next_data(resp.text)
        if data is None:
            log.warning("ZIP %s │ page %d │ no __NEXT_DATA__", zip_code, page)
            break

        cards, total_results = parse_listing_page(data)

        if not cards:
            if page == 1:
                log.info("ZIP %s │ no agents found", zip_code)
            break

        log.info(
            "ZIP %s │ page %d │ %d cards │ %d total in zip",
            zip_code, page, len(cards), total_results,
        )

        # Visit each profile
        page_agents: list[dict] = []
        for card in cards:
            sn = card["screenName"]
            if sn in seen:
                log.debug("  skip duplicate: %s", sn)
                continue

            profile_url = PROFILE_URL.format(screen_name=sn)
            resp2 = _get(session, profile_url)
            if resp2 is None:
                log.warning("  ✗ %s", sn)
                continue

            pdata = _extract_next_data(resp2.text)
            if pdata is None:
                log.warning("  ✗ no data: %s", sn)
                continue

            agent = parse_profile(pdata, zip_code)
            if agent:
                page_agents.append(agent)
                seen.add(sn)
                log.info(
                    "  ✓ %-30s │ %-2s │ %-16s │ %s",
                    agent["full_name"][:30],
                    agent["state"],
                    agent["phone"],
                    agent["email"],
                )
            else:
                log.warning("  ✗ empty profile: %s", sn)

        # Incremental CSV export + upsert after every page
        append_to_csv(page_agents)
        upsert_agents(page_agents)
        all_agents.extend(page_agents)

        # Pagination
        total_pages = math.ceil(total_results / AGENTS_PER_PAGE) if total_results else 1
        if page >= total_pages:
            break
        page += 1

    return all_agents


def main():
    log.info("=" * 60)
    log.info("Zillow Agent Scraper – started at %s", datetime.now().isoformat())
    log.info("=" * 60)

    init_csv()
    progress = load_progress()
    completed_zips = set(progress.get("completed_zips", []))
    seen = set(progress.get("seen_profiles", []))

    zipcodes = load_zipcodes()
    remaining = [z for z in zipcodes if z not in completed_zips]

    log.info(
        "Zip codes: %d total │ %d done │ %d remaining │ %d agents so far",
        len(zipcodes), len(completed_zips), len(remaining), progress.get("total_agents", 0),
    )

    session = requests.Session()
    consecutive_errors = 0

    for i, zip_code in enumerate(remaining, 1):
        log.info("─" * 60)
        log.info(
            "[%d / %d]  ZIP %s  │  agents so far: %d",
            i, len(remaining), zip_code, progress.get("total_agents", 0),
        )

        try:
            new = scrape_zip(session, zip_code, seen)
            consecutive_errors = 0

            completed_zips.add(zip_code)
            progress["completed_zips"] = list(completed_zips)
            progress["seen_profiles"] = list(seen)
            progress["total_agents"] = progress.get("total_agents", 0) + len(new)
            save_progress(progress)

            log.info("ZIP %s done │ +%d agents", zip_code, len(new))

        except KeyboardInterrupt:
            log.info("Interrupted – saving progress")
            progress["seen_profiles"] = list(seen)
            save_progress(progress)
            break

        except Exception as exc:
            log.exception("Unexpected error on ZIP %s: %s", zip_code, exc)
            consecutive_errors += 1
            if consecutive_errors >= MAX_CONSECUTIVE_ERRORS:
                log.critical(
                    "%d consecutive errors – likely blocked. Stopping.", MAX_CONSECUTIVE_ERRORS
                )
                progress["seen_profiles"] = list(seen)
                save_progress(progress)
                break
            time.sleep(RETRY_BACKOFF * 3)

    log.info("=" * 60)
    log.info(
        "Finished │ %d agents │ %s", progress.get("total_agents", 0), OUTPUT_CSV
    )
    log.info("=" * 60)


if __name__ == "__main__":
    main()