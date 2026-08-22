# Hetzner VPS — Service Setup

Inventory of what runs on the Hetzner VPS for the two businesses sold to Jianping
Liu: **Foreclosure Data Hub** (to Ricci Flow) and **US Agent Leads** (to Asterism
Software). Anything unrelated to these two is out of scope. Credential values are
delivered separately through the secure channel, not in this file.

> **US Agent Leads migration status (2026-08-22):** the production app and its
> 1,168,815-row static leads snapshot now use Supabase project
> `vgbzldrsuxhzjxibyatw`. The UAL Postgres and PostgREST services described below
> are no longer in the production request path. Keep them read-only for the 7–14
> day rollback window; removal requires a separate backup/decommission approval.

## Server

- **Host:** `ubuntu-8gb-hel1-1` (Hetzner, Helsinki), Ubuntu 24.04 LTS
- **Resources:** 8 GB RAM, ~75 GB disk
- **Orchestration:** everything runs in Docker, managed by **Coolify 4.1.2**
- **Proxy/TLS:** **Traefik v3.6** (`coolify-proxy`) terminates 80/443 and routes by
  hostname to each container

Everything the products depend on beyond this box (Supabase, Upstash, Stripe,
Resend, PostHog, xAI, Google) is an external managed service reached over HTTPS.
See the table further down.

```
  foreclosuredatahub.com          api.foreclosuredatahub.com     postgrest-*.sslip.io
          |                                |                             |
        [ Traefik proxy (coolify-proxy), TLS on 80/443 ]
          |                                |                             |
   FDH frontend                     FDH backend                    PostgREST
   Next.js :3000                    Hono :3001                     :3000 (int)
          \____________ Supabase ___________/                          |
                                                              retired UAL leads Postgres
                                                              (rollback-only)
```

## Applications

### Foreclosure Data Hub — frontend (Next.js)
- **Container:** `migmgwtets3kqlsrdixmvc9a-*`, listens on **:3000**
- **Domains:** `foreclosuredatahub.com`, `www.foreclosuredatahub.com`
- **Role:** public marketing site, blog, programmatic SEO pages, and the logged-in
  subscriber dashboard UI.
- **Points at:** the backend via `NEXT_PUBLIC_API_URL`, and Supabase
  (`gsvbmwvwayrafyapqxym.supabase.co`) for auth.

### Foreclosure Data Hub — backend (Hono API)
- **Container:** `l1ttge0kr8bp4rbjbg8714dv-*`, listens on **:3001**, health at `/health`
- **Domains:** `api.foreclosuredatahub.com` (plus a Coolify `*.sslip.io` fallback)
- **Role:** the application and data API. Route groups: dashboard search, county
  directory, license, subscription, checkout, auth, cron, admin, public `/api/v1`,
  billing webhooks, AI analysis, unsubscribe.
- **Points at:** Supabase (`gsvbmwvwayrafyapqxym.supabase.co`) for data and auth.
- **Important:** all server-side secrets live on this backend service, not on the
  frontend. Set the environment here or the API breaks.

### US Agent Leads — web app (Vercel, off-box)

- **Domain:** `www.usagentleads.com`
- **Role:** marketing, Supabase Auth, directory/dashboard/API access, CSV delivery,
  and Stripe billing. The web app and active leads database do not run on this
  VPS; the former Postgres/PostgREST read path is retained temporarily for
  rollback only.
- **Checkout:** `POST /api/checkout` creates a fresh Stripe-hosted Checkout Session
  from one of the four allowlisted Price IDs committed in
  `lib/billing/plans.ts`: State Pack $99
  (`price_1U5NQ1ItJWsYAnxnyFSsLmBG`), Full Database $399
  (`price_1U5NQ8ItJWsYAnxnbrvaXD0d`), Pro Dashboard $49/month
  (`price_1TzG2tItJWsYAnxnlVVNJgPc`), and Pro API $79/month
  (`price_1TzG32ItJWsYAnxnBI0j2xQn`). These public IDs are not environment secrets.
  A short-lived Supabase claim ensures each signed-in user has at most one payable
  subscription Checkout Session across Pro Dashboard and Pro API.
- **Billing callbacks:** Stripe sends signed events to `/api/webhooks/stripe`, which
  fulfills one-time purchases and synchronizes subscriptions, renewals, failed
  payments, cancellations, and refunds. The handler uses idempotent effects and
  records each Stripe event ID in Supabase only after processing succeeds, so
  failed deliveries remain retryable and completed duplicates are harmless.
- **Billing management and discounts:** `/api/billing-portal` creates a Stripe
  Customer Portal session for signed-in subscribers. The nurture drip creates a
  unique, single-use Stripe promotion code for $10 off the State Pack, expiring
  after 72 hours.
- **Secrets:** `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` belong in the UAL
  Vercel project. The four Price IDs stay in `PlanGroups.tsx`.

### US Agent Leads — retired leads database (PostgreSQL)
- **Container:** `jv0tsd8pl7267c5vhwwpjzin`, `postgres:16-alpine`, **:5432**
- **Database `leads`, table `usagentleads.leads`: 1,168,815 rows at cutover.**
  This is the read-only rollback copy of the core dataset. Production reads the
  verified Supabase copy.
- **Columns:** `id`, `email`, `name`, `phone`, `state`, plus cold-email tracking
  (`email1_sent_at` … `email6_sent_at`, `email_status`, `email_error`,
  `email_message_id`, `replied`), `created_at`, `updated_at`.
- Do not ingest, run the mutating legacy `refresh_states()`, or otherwise write
  to this copy during the rollback window.

### US Agent Leads — retired PostgREST endpoint
- **Container:** `postgrest-ickon4toi8r3ls08j7fjh2dp`, `postgrest:v12.2.3`
- **Role:** formerly exposed the `leads` database above as the production REST API;
  it is now a rollback and migration-verification endpoint only.
- **Reachable at** a public `postgrest-*.sslip.io` hostname through Traefik, so treat
  its JWT/anon config as sensitive.
- **Cold-email sending is currently OFF.** The send-tracking columns exist but no
  outreach is running.
- The production app no longer reads `LEADS_REST_URL` or `LEADS_REST_KEY`. Retain
  them temporarily so the prior Vercel deployment can be restored if needed.

### Coolify platform (infrastructure)
Supporting containers, not a product: `coolify` (control panel, :8000),
`coolify-db` (`postgres:15`, Coolify's own state), `coolify-redis`,
`coolify-realtime`, `coolify-sentinel` (monitoring), `coolify-proxy` (Traefik).

## Data pipeline (FDH, runs off-box)

The daily scraping and ingest pipeline (`scripts/ingest.py` plus the per-source
scrapers and enrichment) loads listings into Supabase and then calls
`public.refresh_normalized_listings()` and the backend cron endpoints. Per the
sale it is being migrated to a buyer-supplied RackNerd server, so it is not hosted
on this box. It reaches the API via `BASE_API_URL`
(`https://api.foreclosuredatahub.com`) and the database via `DATABASE_URL`.

Backend cron endpoints (Bearer `ADMIN_API_KEY`): `/api/cron/` +
`daily-email-notifications`, `saved-search-alerts`, `send-lead-foreclosures`,
`lead-nurture`, `weekly-starter-expiry`, `indexnow-submit`, `license-maintenance`.
FDH email automation is currently OFF.

## External services (not on the VPS)

Referenced by env var name; values are in the secure credential handoff. Put each
secret on the service that uses it: FDH backend secrets remain in Coolify, while
US Agent Leads app secrets remain in its Vercel project.

| Service | Purpose | Key env vars |
|---|---|---|
| Supabase | FDH Postgres database + auth (Google OAuth) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` |
| Upstash Redis | Rate limiting | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| Stripe | UAL hosted Checkout Sessions, subscriptions, refunds, Customer Portal, promotion codes, webhooks | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Resend | Transactional + campaign email (HTTPS API) | `RESEND_API_KEY` |
| PostHog | Product analytics | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` |
| xAI (Grok) | AI property analysis | `XAI_API_KEY` |
| Google OAuth | Dashboard sign-in | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` |
| IndexNow | Search-engine URL submission | `INDEXNOW_KEY` |
| Admin / internal | Cron auth, admin gating, unsubscribe signing | `ADMIN_API_KEY`, `ADMIN_EMAILS`, `UNSUBSCRIBE_SECRET` |

FDH email is sent through the **Resend HTTPS API** (port 443), not SMTP from this
box.

## Deployment

- Coolify watches the tracked git branch per app and rebuilds on push (root
  `Dockerfile` for the frontend, `server/Dockerfile` for the backend).
- Environment variables are managed per service in Coolify. Backend holds the
  server secrets; frontend holds only `NEXT_PUBLIC_*` values.
- US Agent Leads deploys separately on Vercel. Configure its Stripe secrets there,
  and configure the production webhook URL and Customer Portal in Stripe.
- The FDH domain and business inbox are registered at **Hostinger**.

## Operational notes

- **Mail ports 25 and 465 are blocked** on this server (Hetzner blocks them after a
  server changes accounts). This does not affect the products: FDH email goes out
  through the Resend HTTPS API, and cold-email sending is off. To restore raw SMTP,
  the account owner can request an unblock from Hetzner support.
- **Rotate all credentials** and remove the previous owner's access: Supabase keys,
  the Stripe secret key and webhook signing secret, Resend, Upstash, xAI, `ADMIN_API_KEY`,
  `UNSUBSCRIBE_SECRET`, the leads Postgres password, the PostgREST JWT/anon secret,
  and Coolify/SSH access.
- **DNS:** point `foreclosuredatahub.com` and `api.foreclosuredatahub.com` at this
  server's IP at Hostinger, and update OAuth redirect URIs if hostnames change.
- **PostgREST exposure:** the retired leads API remains reachable on a public
  `*.sslip.io` hostname only for the rollback window. After stabilization and a
  verified backup, revoke its credential and remove the route before stopping the
  containers.
