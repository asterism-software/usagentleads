# Changelog

## 2026-08-22

- [x] [migrate the static leads database from Hetzner to the existing Pro Supabase project](docs/changelog/2026-08-22-supabase-leads-migration-and-actions-removal.md)
- [x] validate all 1,168,815 rows, lock the migrated table to read-only service access, and tune exact-count performance
- [x] cut production over to Supabase with a retained Hetzner rollback deployment
- [x] remove all GitHub Actions while preserving existing customer CSV downloads in private Supabase Storage

## 2026-08-20

- [x] [make customer downloads retryable, scanner-safe, and reliable across the apex/`www` proxy path](docs/changelog/2026-08-20-reliable-scanner-safe-downloads.md)
- [x] add a branded secure download page with explicit authorization, customer-readable errors, and a loading indicator
- [x] reduce the internal download allowance from ten to five and remove allowance counts from the page and fulfillment email

## 2026-08-19

- [x] Sender refactor
- [x] update Resend API key
- [x] new email templates

## 2026-08-14

- [x] increase pricing: state pack $49 -> $99, whole database $199 -> $399
- [x] remove subscription temporarily
- [x] implemented the privacy-safe social proof

## 2026-08-13

- [x] [deliver the Full Database as dynamically sized, Excel-safe CSV parts](docs/changelog/2026-08-13-excel-safe-full-database-downloads.md)
- [x] resend the affected Full Database customer a fresh 48-hour link to the balanced two-part ZIP

## 2026-08-12

- [x] [fix discounted Full Database Stripe webhook fulfillment](docs/changelog/2026-08-12-discounted-full-database-webhook-fulfillment.md)
- [x] [add PostHog one-time purchase tracking, revenue attribution dashboards, and an idempotent 180-day Stripe backfill](posthog-setup-report.md)

## 2026-08-11

- [x] [fix Stripe webhook processing for unsuccessful Checkout Sessions](docs/changelog/2026-08-11-stripe-webhook-failure-processing.md)

## 2026-08-08

- [x] add free agent outreach campaign planner
- [x] add cold-email compliance, subject-line, domain authentication, brokerage recruiting ROI, and agent partnership value tools
- [x] make domain authentication checks portable with DNS-over-HTTPS fallback
- [x] upate opengraph and twitter image
- [x] reorganize footer navigation
- [x] add free tools

## 2026-08-03

- [x] add new logo

## 2026-08-02

- [x] add Google OAuth
- [x] fix dashboard sidebar

## 2026-08-01

- [x] add customer meta data
- [ ] adjust pricing

## 2026-07-31

- [x] refactor app pages
- [x] local dev sign-in flow
- [x] change to Stripe checkout
- [ ] change sign in button when user is already logged in
- [ ] add Google OAuth
- [ ] change system email domain
- [ ] refactor github actions
