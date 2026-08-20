# Make customer downloads reliable and scanner-safe

**Date:** 2026-08-20

## Summary

Purchase emails now open a branded, secure download page instead of linking
directly to a one-use file endpoint. A file is authorized only after the
customer presses the download button, and the page supports safe retries when a
browser, email scanner, proxy, or temporary Storage error interrupts the flow.

## Customer impact

Customers reported that links in otherwise successful fulfillment emails would
not open, or that the secure download page opened but its download button
returned an error. The failures affected both newly delivered links and direct
links that had already been opened by automated email-security systems.

## Root causes

### One-use links were consumed by non-customer traffic

The original email linked directly to a `GET /api/download` endpoint. That
request both authorized the file and marked the token as used. Email security
scanners and link-preview services routinely follow links before a recipient
clicks them, so an automated request could consume the customer's only access.
Browser retries and interrupted transfers had the same one-use failure mode.

### Apex and `www` origins differed behind the proxy

The first scanner-safe implementation correctly required an explicit
same-origin `POST`, but Cloudflare and Vercel could expose different canonical
hosts during the same request. A page opened on `usagentleads.com` could reach
the download route as `www.usagentleads.com`, causing a legitimate customer
request to fail with `Invalid request origin`.

### A redirect-only form submission did not reliably start the file transfer

After authorization, the server returned a `303` redirect to a short-lived
Supabase Storage URL. In the production browser, proxy, and content-security
policy path, the form request completed but the redirected attachment download
did not consistently begin. The page also gave no visual indication while the
file URL was being prepared.

## Solutions

### Separate page access from file authorization

- Fulfillment emails now link to `/download?token=...`, a branded page that can
  be opened safely without consuming an authorization.
- Legacy `GET /api/download?token=...` links redirect to the same secure page,
  so unexpired emails already in customer inboxes remain compatible.
- Only an explicit button press sends the authorization `POST`; link scanners
  and preview bots normally issue `GET` or `HEAD` and therefore cannot consume
  access.
- The email explains that opening the page does not use a download and shows
  only the 48-hour expiration period.

### Make authorization retryable and atomic

- Replace the one-use flag as the access decision with `download_count` and
  `download_limit` fields while retaining the legacy flag for compatibility.
- Authorize at most five explicit file requests per purchase within the
  existing 48-hour access window.
- Use a service-role-only database function to increment the counter atomically
  and prevent concurrent requests from exceeding the limit.
- Generate the signed Storage URL before reserving an authorization, so a
  Storage failure does not consume one of the customer's attempts.
- Record authorization outcomes in `download_attempts`, including anonymized IP
  hashes and request IDs, for support diagnostics without storing raw IP
  addresses in the new audit table.

### Accept legitimate first-party proxy traffic

- Treat `usagentleads.com` and `www.usagentleads.com` as explicit first-party
  aliases while continuing to reject unrelated, lookalike, and cross-site
  origins.
- Prefer browser Fetch Metadata for same-origin requests because it is not
  rewritten by the reverse proxy.
- Add structured warnings when an origin is rejected so future proxy problems
  can be diagnosed from production logs.

### Use an interactive browser download flow

- Submit the token with `fetch`, return the signed file URL as JSON, and start
  the attachment navigation deliberately in the browser.
- Show a spinner and `Preparing download…` state immediately after the button
  is pressed, disable duplicate submissions during processing, and display a
  customer-readable error when preparation fails.
- Return specific error states for invalid, pending, expired, exhausted,
  Storage, concurrent-request, and rate-limit conditions.
- Allow both public first-party origins in the page's connection policy and
  return narrowly scoped CORS headers only after the request passes the
  first-party origin check.

### Simplify customer-facing allowance copy

- Reduce the default and existing download allowance from ten to five, while
  preserving the database invariant for a purchase that had already recorded
  more than five authorizations.
- Remove the remaining-download counter from the secure page.
- Remove numeric allowance wording from both the HTML and plain-text delivery
  email. The email now states only `Expires in 48 hours`; the five-request limit
  remains enforced internally.

## Database changes

- Add download counters and first/last authorization timestamps to purchases.
- Add the private `download_attempts` audit table and its purchase/date index.
- Add `authorize_purchase_download(uuid)` for atomic, service-role-only claims.
- Set the purchase download-limit default to five and bring existing limits down
  safely with `greatest(5, download_count)`.

Migrations:

- `supabase/migrations/20260820033330_retryable_downloads.sql`
- `supabase/migrations/20260820052548_reduce_download_limit_to_five.sql`

## Compatibility and recovery

- Previously sent links continue to work when their purchase is completed,
  unexpired, and below the authorization limit; they do not need to be resent
  solely because of this deployment.
- Support should issue a refreshed link only when the 48-hour access window has
  expired, the allowance has been reached, or purchase verification requires a
  replacement.
- Temporary Storage failures and concurrent claim conflicts return a retryable
  state without consuming an authorization.

## Verification

- Regression coverage verifies scanner-safe legacy redirects, explicit
  authorization, origin validation, retry behavior, atomic claims, signed-URL
  failures, customer-facing error responses, and download email copy.
- The complete Vitest suite passes with 297 tests.
- TypeScript type checking passes.
- ESLint reports no errors; three warnings are pre-existing and unrelated.
- The production deployments for the download flow and final email-copy update
  reached Ready.
