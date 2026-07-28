#!/usr/bin/env python3
"""
Real estate agent scraper for foreclosurelistingsusa.com
Extracts agent names, emails and phones from home listing pages.
Upserts new rows into usagentleads.leads after every page (see leads.py).
"""

import re
import time
import random
import logging

from curl_cffi import requests
from bs4 import BeautifulSoup

from leads import normalize, upsert_leads

# ── Configuration ──────────────────────────────────────────────────────────────
BASE_URL         = "https://www.foreclosurelistingsusa.com"
LOG_FILE         = "scraper.log"

DELAY_MIN  = 1.0   # seconds between requests (min)
DELAY_MAX  = 3.0   # seconds between requests (max)

STATE_START_PAGES = {
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)

# ── States extracted from the provided map HTML ────────────────────────────────
STATE_HREFS = [
    "/alabama/",
    "/alaska/",
    "/arizona/",
    "/arkansas/",
    "/california/",
    "/colorado/",
    "/connecticut/",
    "/delaware/",
    "/florida/",
    "/georgia/",
    "/hawaii/",
    "/idaho/",
    "/illinois/",
    "/indiana/",
    "/iowa/",
    "/kansas/",
    "/kentucky/",
    "/louisiana/",
    "/maine/",
    "/maryland/",
    "/massachusetts/",
    "/michigan/",
    "/minnesota/",
    "/mississippi/",
    "/missouri/",
    "/montana/",
    "/nebraska/",
    "/nevada/",
    "/new-hampshire/",
    "/new-jersey/",
    "/new-mexico/",
    "/new-york/",
    "/north-carolina/",
    "/north-dakota/",
    "/ohio/",
    "/oklahoma/",
    "/oregon/",
    "/pennsylvania/",
    "/rhode-island/",
    "/south-carolina/",
    "/south-dakota/",
    "/tennessee/",
    "/texas/",
    "/utah/",
    "/vermont/",
    "/virginia/",
    "/washington/",
    "/west-virginia/",
    "/wisconsin/",
    "/wyoming/",
]

# ── HTTP helper ────────────────────────────────────────────────────────────────
session = requests.Session()

def get(url: str, retries: int = 3) -> str | None:
    """Fetch a URL with retries; returns HTML text or None on failure."""
    for attempt in range(1, retries + 1):
        try:
            resp = session.get(url, headers=HEADERS, timeout=30, impersonate="chrome124")
            resp.raise_for_status()
            return resp.text
        except Exception as exc:
            log.warning(f"Attempt {attempt}/{retries} failed for {url}: {exc}")
            if attempt < retries:
                time.sleep(random.uniform(3, 6))
    log.error(f"Giving up on {url}")
    return None


def polite_sleep():
    time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

# ── Parsing helpers ────────────────────────────────────────────────────────────
def get_total_pages(html: str) -> int:
    """Parse 'Page 1 of N' text from pagination div."""
    soup = BeautifulSoup(html, "html.parser")
    match = re.search(r"Page\s+\d+\s+of\s+(\d+)", soup.get_text())
    if match:
        return int(match.group(1))
    return 1


def get_listing_links(html: str) -> list[str]:
    """Return all /home-details/… hrefs from a state listing page."""
    soup = BeautifulSoup(html, "html.parser")
    links = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith("/home-details"):
            links.append(BASE_URL + href)
    return list(dict.fromkeys(links))  # dedupe, preserve order


def extract_contact(html: str) -> tuple:
    """
    Parse agent name, phone, and email from the inline JS.
    Returns (name, email, phone) — any field may be None if not found.
    """
    name_match  = re.search(r"Agent:\s*([^<]+)<", html)
    phone_match = re.search(r"Phone:\s*([^<\"\\]+)", html)
    email_match = re.search(r"Email:\s*([^<\"\\]+)", html)
    name  = name_match.group(1).strip()  if name_match  else None
    phone = phone_match.group(1).strip() if phone_match else None
    email = email_match.group(1).strip() if email_match else None
    return name, email, phone


def state_from_href(href: str) -> str:
    return href.strip("/").replace("-", " ").title()

# ── Core scraping logic ────────────────────────────────────────────────────────
def scrape_state(state_href: str, seen_emails: set) -> tuple[int, int]:
    """Scrape all pages for one state, upserting after each page.

    Returns (rows_inserted, rows_already_in_table).
    """
    state_label = state_from_href(state_href)
    state_url   = BASE_URL + state_href
    start_page  = STATE_START_PAGES.get(state_href, 1)

    log.info(f"=== State: {state_label} ({state_url}) — starting from page {start_page} ===")

    html = get(state_url)
    if not html:
        log.error(f"Could not load state page: {state_url}")
        return 0, 0

    total_pages = get_total_pages(html)
    log.info(f"  {state_label}: {total_pages} page(s)")

    total_new = 0
    total_known = 0

    for page_num in range(start_page, total_pages + 1):
        page_url = state_url if page_num == 1 else f"{state_url}{page_num}"
        log.info(f"  Page {page_num}/{total_pages}: {page_url}")

        try:
            if page_num == 1:
                page_html = html
            else:
                polite_sleep()
                page_html = get(page_url)
                if not page_html:
                    log.warning(f"  Skipping page {page_num} (fetch failed)")
                    continue

            listing_links = get_listing_links(page_html)
            log.info(f"    Found {len(listing_links)} listings")
        except Exception as exc:
            log.exception(f"  Error fetching/parsing listing page {page_num} for {state_label}: {exc}")
            continue

        page_rows = []

        for listing_url in listing_links:
            try:
                polite_sleep()
                listing_html = get(listing_url)
                if not listing_html:
                    continue

                name, email, phone = extract_contact(listing_html)

                # normalize() keeps a row with an email *or* a phone and drops
                # anything the table cannot use (bad state, junk email, …).
                lead = normalize(name, state_label, email, phone)
                if not lead:
                    continue

                # Cheap in-run guard so one agent listing 40 homes is posted once;
                # the table's on_conflict=email handles it across runs.
                if lead["email"]:
                    if lead["email"] in seen_emails:
                        log.debug(f"    Duplicate email skipped: {lead['email']}")
                        continue
                    seen_emails.add(lead["email"])

                page_rows.append(lead)
                log.info(f"    + {lead['name']} <{lead['email'] or ''}> {lead['phone'] or ''}")

            except Exception as exc:
                log.exception(f"    Error processing listing {listing_url}: {exc}")
                continue

        if page_rows:
            try:
                stats = upsert_leads(page_rows)
                total_new += stats["inserted"]
                total_known += stats["already_known"]
                log.info(
                    f"    Upserted after page {page_num}: {stats['inserted']} new, "
                    f"{stats['already_known']} already in table"
                )
            except Exception as exc:
                log.exception(
                    f"    FAILED to upsert {len(page_rows)} row(s) after page {page_num} "
                    f"for {state_label} — continuing: {exc}"
                )

    return total_new, total_known


# ── Entry point ────────────────────────────────────────────────────────────────
def main():
    log.info("Starting scraper")
    seen_emails: set[str] = set()

    grand_new = 0
    grand_known = 0

    for state_href in STATE_HREFS:
        try:
            new, known = scrape_state(state_href, seen_emails)
            grand_new += new
            grand_known += known
            log.info(f"  → {state_from_href(state_href)}: {new} new, {known} already known")
        except Exception as exc:
            log.exception(f"Unhandled error for state {state_href}: {exc}")
        polite_sleep()

    log.info(f"Done. Inserted: {grand_new}, already in table: {grand_known}")


if __name__ == "__main__":
    main()