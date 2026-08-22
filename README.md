# USAgentLeads

A real estate agent data marketplace. We compile US realtor contacts (name, email,
phone, licensing state) from public licensing records and brokerage directories,
then sell them as instant CSV downloads, a searchable dashboard, and a REST API.

Live at **https://www.usagentleads.com** — ~1.16M contacts across 50 states + DC.

---

## 1. How it works, end to end

There are really only four moving parts. Everything in the repo hangs off one of them:

```
  ┌── INGEST ─────────────┐   scripts/ingest/*.mjs pull public licensing files +
  │  public data sources  │   brokerage directories → upsert into the leads table
  └───────────┬───────────┘
              ▼
  ┌── STORE ──────────────┐   usagentleads.leads (~1.17M rows) in the same Pro
  │  Supabase Postgres    │   Supabase project used for Auth and billing.
  └───────────┬───────────┘
              ▼
  ┌── DERIVE ─────────────┐   crons turn raw rows into the things the site sells:
  │  counts + CSV exports │   state_count table, per-state CSVs, full DB CSV
  └───────────┬───────────┘
              ▼
  ┌── SELL ───────────────┐   Next.js app on Vercel: SEO pages → checkout →
  │  Next.js on Vercel    │   Stripe → webhook → emailed download link
  └───────────────────────┘
```

### Database boundary

The app uses one Pro Supabase project. Auth, billing, Storage, state counts, and
the static ~500 MB `usagentleads.leads` table all live there. Server code keeps two
client helpers only to make intent obvious:

| Client | Objects |
|---|---|
| `createClient()` / `createServiceClient()` in [lib/supabase/server.ts](lib/supabase/server.ts) | Auth-linked application tables, state counts, billing, and Storage |
| `createLeadsClient()` in [lib/supabase/leads.ts](lib/supabase/leads.ts) | The static, service-role-readable `usagentleads.leads` table |

The former Hetzner PostgREST database is retained temporarily as a read-only
rollback source. Migration and rollback details are in
[docs/hetzner-to-supabase-leads-migration-plan.md](docs/hetzner-to-supabase-leads-migration-plan.md).

Two more rules that follow from this:

- **Always use the `usagentleads` schema, never `public`.** The Supabase project is
  shared with another app that owns `public.*` — `public.leads` there is a
  different, empty table.
- **`leads` is read-only.** Supabase grants the service role only `SELECT`; the
  replacement `refresh_states()` RPC aggregates without mutating rows. Ingest and
  enrichment remain disabled.

---

## 2. Data pipeline

### Ingestion — [scripts/ingest/](scripts/ingest/)

Each source gets one adapter that emits `{ name, state, email, phone }` objects and
hands them to `upsertLeads()` in [lib.mjs](scripts/ingest/lib.mjs), which owns
validation, dedup, batching, and retries. `email` is the dedup key with
`resolution=ignore-duplicates`, so **existing rows are never modified** — their
email-campaign history stays intact. Phone-only rows are checked against the table
by phone before insert, since NULL emails don't conflict.

| Command | Source |
|---|---|
| `npm run ingest:mi` | Michigan LARA licensing export (xlsx) |
| `npm run ingest:va` | Virginia DPOR regulant lists (txt) |
| `npm run ingest:anywhere` | Anywhere Real Estate API (C21, ERA, BHG, Sotheby's, Corcoran) |
| `npm run ingest:compass` | Compass agent-page crawl (~35k pages) |
| `npm run ingest:har` | HAR.com adapter (written; blocked by PerimeterX) |
| `npm run ingest:csv` | Generic CSV importer (used for the `bhhs.py` output) |
| `npm run ingest:enrich` | Fills emails on *existing* rows (records-request data) |

All support `--dry-run`, `--limit`, `--csv`, `--batch`, `--concurrency`.
[scripts/ingest/README.md](scripts/ingest/README.md) is the real reference: verified
sources with volumes, per-source gotchas, and a long **"dead ends — don't
re-research these"** list of states that have stripped contact data from public files.

### After every ingest — three steps, in order

Derived data does not update itself. Skipping a step leaves customer-facing files
stale at the previous ingest:

```bash
# a. Recount: read-only aggregation in Supabase, then upsert state_count
GET /api/cron/update-state-counts

# b. Re-export CSVs — the bare call only LISTS state codes, it generates nothing
GET /api/cron/generate-csvs                # → { states: ["AL", "AK", ...] }
GET /api/cron/generate-csvs?state=XX       # → builds + uploads one state CSV  (×51)
GET /api/cron/generate-csvs?combine=true   # → gzips them into the full-DB CSV

# c. Re-sync the static constants the site renders from
node scripts/sync-state-counts.mjs
```

There is no scheduled GitHub workflow for these operations. Run the authenticated
endpoints deliberately after an approved data refresh; the static production
snapshot does not require periodic regeneration.

Step (c) exists because [lib/utils/states.ts](lib/utils/states.ts) hardcodes each
state's `agentCount`. `TOTAL_AGENTS` is summed from those constants and backs every
headline number plus the fallback in [lib/utils/agent-count.ts](lib/utils/agent-count.ts)
when the DB is unreachable — so a stale file means the site advertises stale counts.

### Scheduled jobs

| Job | Runs on | Schedule | Does |
|---|---|---|---|
| `/api/cron/nurture-drip` | Vercel Cron ([vercel.json](vercel.json)) | daily 15:00 UTC | Advances free-sample leads through the 3-email drip |

`update-state-counts`, `generate-csvs`, and `indexnow` remain authenticated
operator endpoints but are not scheduled. The first two should run only after an
approved leads-data refresh.

All cron routes are Bearer-authenticated with `CRON_SECRET` via
[lib/utils/cronAuth.ts](lib/utils/cronAuth.ts). **Local `CRON_SECRET` ≠ production** —
pull prod env with the Vercel CLI before hitting live endpoints.

---

## 3. The money path

```
 PricingCards → POST /api/checkout → dynamic Stripe Checkout Session → payment
                       │                                               │
              mints page_token                                            ▼
                       │                                  POST /api/webhooks/stripe
                       ▼                                               │
             /purchase-success?pt=…  ◀── polls /api/purchase ── updates purchase
                                                                       │
                                                         Resend sends download link
                                                                       ▼
                                                       GET /api/download?token=…
                                                    single-use, 48h, → signed Storage
                                                       URL valid 5 minutes
```

Four products, all defined in [lib/billing/plans.ts](lib/billing/plans.ts)
with their public Stripe Price IDs. Those IDs are deliberately committed beside
the displayed plans and double as the server-side checkout allowlist; they are not
environment variables or secrets.

The subscription products remain implemented for existing customers and a future
relaunch, but `SUBSCRIPTION_PLANS_VISIBLE` keeps them off public pricing surfaces.

| Plan | Price | Stripe Price ID | Grants |
|---|---:|---|---|
| State Pack | $99 one-time | `price_1U5NQ1ItJWsYAnxnyFSsLmBG` | One state CSV |
| Full Database | $399 one-time | `price_1U5NQ8ItJWsYAnxnbrvaXD0d` | Gzipped CSV of all ~1.16M contacts |
| Pro Dashboard | $49/mo | `price_1TzG2tItJWsYAnxnlVVNJgPc` | Searchable in-app agent browser |
| Pro API | $79/mo | `price_1TzG32ItJWsYAnxnBI0j2xQn` | `/api/v1/agents`, 10k requests/month |

Details that matter when touching this code:

- **No static payment links**: `/api/checkout` validates the requested plan, creates
  the pending one-time purchase first, and asks Stripe for a hosted Checkout Session.
  Checkout creation carries an idempotency key and only uses an allowlisted Price ID.
- **Webhook integrity and idempotency**: `/api/webhooks/stripe` verifies the raw body
  and `Stripe-Signature` with Stripe's SDK. Each handler uses deterministic updates
  and email idempotency keys, then records the unique event ID in
  `stripe_webhook_events` only after it succeeds. Failures remain retryable, while
  completed and concurrent duplicate deliveries are safe no-ops.
- **`page_token` vs `download_token`**: `page_token` is minted at checkout and rides
  the redirect URL so only the buyer can look up their own order; `download_token`
  is the single-use claim on the file. The claim is a conditional `UPDATE … WHERE
  token_used = false`, so two concurrent clicks can't both win.
- **Subscriptions** are the only flow requiring a logged-in user. The `user_id` is
  copied into Stripe Checkout and subscription metadata so webhook events attach to
  the correct account. A user-keyed `stripe_checkout_attempts` claim permits only
  one payable subscription Session at a time across both plans; same-plan retries
  recover the Session with Stripe idempotency, while switching plans expires the
  previous hosted page first. Existing Stripe Customer IDs are reused, and
  `/api/billing-portal` creates a short-lived Customer Portal session for billing
  management.
- **Discounts**: the nurture drip mints a unique, single-use Stripe promotion code
  for $10 off the State Pack. It expires after 72 hours and is backed by a
  product-scoped coupon, so it cannot discount another plan.

---

## 4. How buyers reach the data

Three surfaces, three levels of access, all reading the same `leads` table:

**Public directory** — [/directory](app/directory/) → [/api/directory](app/api/directory/route.ts) →
[lib/queries/directory.ts](lib/queries/directory.ts). Free, unauthenticated, and the
top-of-funnel SEO asset. Contact fields are **masked server-side** before they leave
the process, page size is fixed at 25, pagination is capped at 40 pages, and it's
rate-limited to 30 req/min/IP — so it can't be walked to reconstruct a state. It
requires either a valid state or a name query; a bare unfiltered dump is refused.

**Pro Dashboard** — [/dashboard](app/dashboard/) → [/api/agents](app/api/agents/route.ts).
Gated twice: [proxy.ts](proxy.ts) (Next 16's middleware) redirects non-subscribers to
`/pricing`, and the API re-checks the subscription server-side. Unmasked rows.

**Pro API** — [/api/v1/agents](app/api/v1/agents/route.ts), documented at
[/docs](app/docs/page.tsx). `sk_live_…` keys are hashed at rest, max 3 active per
user; [apiKeyAuth.ts](lib/utils/apiKeyAuth.ts) validates key → subscription → plan
`pro_api` → 10k/month quota, then 60 req/min on top. Every call is logged to
`api_usage_logs`, which is also what the quota counts.

Both authenticated surfaces share `queryAgents()` in [lib/queries/agents.ts](lib/queries/agents.ts),
so filtering and pagination behave identically.

**Query performance note**: on a 1M-row table, ordering a name search is the
difference between ~20ms and several seconds. `searchDirectory()` deliberately
applies `ORDER BY` *only* to unfiltered state browses; name searches run unordered
so the pg_trgm GIN indexes ([0006](supabase/migrations/0006_directory_search_indexes.sql))
can stop after one page. Don't "fix" the missing sort.

---

## 5. Growth machinery

**Free sample → nurture drip.** [/api/free-sample](app/api/free-sample/route.ts)
persists the email to `sample_leads` (tagged with a capture-point source), then
emails a 7-day signed link to a pre-generated 500-row CSV. The daily
[nurture-drip](app/api/cron/nurture-drip/route.ts) cron walks leads through three
gated stages (day 2 / 4 / 6); the final email mints a **unique, single-use Stripe
promotion code** for $10 off a State Pack, valid for 72 hours. Anyone who has
already purchased is marked `converted` and dropped from the sequence. Opt-out is
a stateless HMAC token, so unsubscribe links work without per-lead storage
(CAN-SPAM).

**Programmatic SEO.** Most of the route tree is generated from typed data files in
[lib/data/](lib/data/) — 50 state pages, 50 directory pages, 12 personas, 13
competitor comparisons, 7 alternatives, 10 import guides, 14 glossary terms — plus
20 MDX blog posts in [content/blog/](content/blog/) rendered via `next-mdx-remote`.
Everything is statically generated with ISR (1h for money pages, 24h for state
pages) and enumerated in [app/sitemap.ts](app/sitemap.ts); the IndexNow cron pings
search engines daily.

> Content rule: competitor pricing and tool claims must be research-verified, never
> invented. Site facts (sample size, prices, counts) come from the repo.

**Analytics**: PostHog, reverse-proxied through `/ingest/*` rewrites in
[next.config.ts](next.config.ts) to survive ad blockers.

---

## 6. Security posture

- **Two Supabase clients**: anon client for user-scoped reads (RLS enforced),
  service client only in server routes. RLS is on for every `usagentleads` table;
  the service role is the only writer.
- **Rate limiting** via Upstash Redis on every public endpoint
  ([rateLimit.ts](lib/utils/rateLimit.ts)). The directory limiter deliberately
  **fails open** — its rows are already masked and capped, so a Redis blip
  shouldn't take down the free tool. Everything else fails closed.
- **Input validation**: state codes go through an allow-list, search input through
  `sanitizeSearchInput()` (strips PostgREST filter metacharacters), tokens through
  UUID validation, request bodies through Zod.
- **CSP + security headers** set in [next.config.ts](next.config.ts); apex →
  `www` redirect is a permanent 308 there too.
- **Auth** is Supabase Auth — Google OAuth plus server-minted magic links, which are
  generated with the admin SDK and delivered through Resend so branding and
  deliverability stay ours. Auth endpoints always return success to prevent email
  enumeration.

---

## 7. Repo layout

```
app/                  Next.js App Router — pages, API routes, cron routes
  api/                checkout · webhooks · download · directory · agents · v1 · cron
components/           React components (home, states, directory, dashboard, blog, ui)
lib/
  supabase/           server.ts (application data) · leads.ts (static leads) — same project, separate intent
  queries/            agents.ts (authed, unmasked) · directory.ts (public, masked)
  data/               typed content for the programmatic SEO page sets
  utils/              states.ts (generated counts) · security · rateLimit · seo · mask
  stripe/             Checkout Sessions + webhook signature verification
  resend/             all transactional + drip email templates
content/blog/         MDX posts
scripts/ingest/       source adapters + the ingestion runbook
scripts/              sync-state-counts.mjs · announce-1m.mjs
supabase/migrations/  ordered schema migrations (see note below)
infra/leads-db/       retired Hetzner Postgres + PostgREST history and rollback runbook
__tests__/            Vitest — API routes and security-critical libs
```

> **Migration note**: `0001_initial.sql` was authored against the `public` schema.
> Production lives in `usagentleads`; the 2026-08-22 migrations restore `leads`
> to the current Pro Supabase project. The self-hosted schema under
> [infra/leads-db/](infra/leads-db/) is retained as source history and rollback
> documentation.

---

## 8. Local development

```bash
npm install
cp .env.local.example .env.local   # fill in every value
npm run dev                        # http://localhost:3000
```

You need credentials for three services: **Supabase** (URL + anon + service role), **Stripe**
(`STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`), and **Resend**. The four Stripe
Price IDs live in `PlanGroups.tsx`, not in the environment. Upstash Redis is
optional locally but required for rate limiting in production. See
[.env.example](.env.example) for the annotated list.

Without the Supabase service credential the marketing pages still render (counts
fall back to static constants), but the directory, dashboard, and API return empty.

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run type-check` | TypeScript, no emit |
| `npm run lint` | ESLint |
| `npm test` | Vitest suite |
| `npm run db:push` | Push Supabase migrations |
| `npm run ingest:*` | Lead ingestion — see §2 |

**Stack**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 + shadcn/ui ·
Supabase Postgres/Auth/Storage · Stripe · Resend · Upstash ·
PostHog · Vercel.

---

## 9. Deployment

Five pieces deploy independently. Only the first changes on a normal day:

| Piece | Where | Deployed by |
|---|---|---|
| Next.js app | Vercel (`usagentleads`) | git push to `main` |
| Auth, orders, Storage, `leads` DB | Supabase project `vgbzldrsuxhzjxibyatw` | `npm run db:push`; leads migration runbook below |
| Retired leads DB | Hetzner VPS via Coolify | rollback-only during stabilization — [infra/leads-db/README.md](infra/leads-db/README.md) |
| Scheduled cron | Vercel Cron | committed in [vercel.json](vercel.json) |
| Payments / email | Stripe + Resend dashboards | manual config |

### Routine deploy

Push to `main` → Vercel builds and promotes to production. Every PR gets a preview
deployment with its own env values.

Before promoting the app, run `npm run db:push` so both Stripe migrations are
applied in order: `20260731130718_stripe_payments.sql`, then
`20260801081007_add_checkout_metadata.sql`. The checkout and webhook routes depend
on the Stripe tables and the new JSON metadata columns.

```bash
npm run type-check && npm run lint && npm test   # build fails on TS errors by design
git push origin main
```

`ignoreBuildErrors` is `false` in [next.config.ts](next.config.ts) — a type error is a
failed deploy, not a warning. To deploy without a push (project is already linked;
`.vercel/` is gitignored):

```bash
npx vercel --prod          # or: npx vercel   → preview deploy
npx vercel env pull .env.local   # sync production env down (local CRON_SECRET differs)
```

### Environment variables

Set these in **Vercel → Settings → Environment Variables** for both Production and
Preview. [.env.example](.env.example) contains the annotated local
template; never commit the corresponding secret values.

| Variable | Purpose | Missing = |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | Client + SSR auth | App dead |
| `SUPABASE_SERVICE_ROLE_KEY` | Server writes, Storage signing | Orders, downloads dead |
| `LEADS_REST_URL` / `LEADS_REST_KEY` | Temporary Hetzner migration/rollback source; not read by the deployed app | Migration tools unavailable |
| `STRIPE_SECRET_KEY` | Checkout, Portal, subscription, and promotion-code API calls | Billing routes fail |
| `STRIPE_WEBHOOK_SECRET` | Verify `/api/webhooks/stripe` signatures | Paid orders and subscriptions never sync |
| `RESEND_API_KEY` | All transactional + promotional email | Buyers get no download link |
| `EMAIL_POSTAL_ADDRESS` | Valid postal address shown in promotional email footers | Nurture and campaign sends fail closed |
| `NEXT_PUBLIC_APP_URL` | Absolute URLs in emails | Broken download links |
| `CRON_SECRET` | Bearer auth on `/api/cron/*` | All crons 401 (fails closed) |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Rate limiting | Public endpoints unprotected |
| `INDEXNOW_KEY` | IndexNow submissions | Indexing cron fails |
| `NEXT_PUBLIC_POSTHOG_KEY` / `_HOST` | Analytics | No analytics |

`CRON_SECRET` deserves attention: Vercel injects it as the `Authorization: Bearer`
header on its own cron invocations automatically, and
[cronAuth.ts](lib/utils/cronAuth.ts) **fails closed** if it is unset. Operators
calling an unscheduled cron endpoint must use the production value securely.

### First-time / from-scratch deploy

1. **Supabase** — create the project, then `npm run db:push` (migrations 0002+ are the
   accurate ones; see the note in §7). Enable Google OAuth under Authentication →
   Providers. Create a **private** Storage bucket named `agent-csvs`.
2. **Leads DB** — apply the three 2026-08-22 leads migrations and load a verified
   snapshot using [the migration runbook](docs/hetzner-to-supabase-leads-migration-plan.md).
   Confirm RLS denies client access, the service role is read-only after loading,
   and `refresh_states()` is executable only by `service_role`.
3. **Stripe** — confirm the four products and Prices in the table in §3 exist in
   the same Stripe account and mode as `STRIPE_SECRET_KEY`. Configure the Customer
   Portal, keep the State Pack's $10 coupon product-scoped, and point a webhook at
   `https://<domain>/api/webhooks/stripe`. Subscribe it to
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `checkout.session.expired`,
   `charge.refunded`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `customer.subscription.paused`, `customer.subscription.resumed`, `invoice.paid`,
   and `invoice.payment_failed`. Copy that endpoint's signing secret to
   `STRIPE_WEBHOOK_SECRET`.
4. **Resend** — verify `mail.usagentleads.com` as the sending domain (SPF/DKIM),
   publish a DMARC policy that covers it, then copy the API key. Sender identities
   are centralized in [email-config.ts](lib/resend/email-config.ts); all customer
   replies route to the monitored `support@usagentleads.com` inbox. Email markup,
   plain-text alternatives, and content live in
   [email-templates.ts](lib/resend/email-templates.ts). Configure
   `EMAIL_POSTAL_ADDRESS` with the business's valid postal address before enabling
   any nurture or campaign send.
5. **Upstash Redis** and **PostHog** — create both, copy credentials.
6. **Vercel** — import the GitHub repo, set every variable above, deploy.
7. **Domain** — add apex *and* `www`. The app 308-redirects apex → `www`
   ([next.config.ts](next.config.ts)), so both must resolve or half your traffic
   dead-ends.
8. **Operations** — no GitHub Actions are installed. Keep state-count, CSV, and
   IndexNow operations unscheduled unless a separately reviewed scheduler is
   introduced. Run derived-data endpoints manually only when their source data
   changes.
9. **IndexNow** — the key file in [public/](public/) is served at
   `https://<domain>/<key>.txt` and its filename *is* the key. If you rotate
   `INDEXNOW_KEY`, rename that file to match or every submission is rejected.
10. **Bootstrap derived data** — a fresh deploy has no CSVs and no counts. Run, in
    order: `update-state-counts` → `generate-csvs` (all three steps, §2) →
    `generate-free-sample` → `node scripts/sync-state-counts.mjs`, then commit the
    regenerated [lib/utils/states.ts](lib/utils/states.ts).

### Post-deploy smoke checks

```bash
curl -sI https://www.usagentleads.com | head -1                      # 200
curl -s "https://www.usagentleads.com/api/directory?state=TX" | jq '.rows | length'
curl -s -H "Authorization: Bearer $CRON_SECRET" \
     https://www.usagentleads.com/api/cron/update-state-counts | jq .   # fresh totals
```

Then, in a browser: a state page renders live counts, the free-sample dialog delivers
an email, and a real $99 checkout produces a purchase row plus a working download
link. Stripe Dashboard's webhook delivery log is the fastest place to confirm
fulfillment; a signature mismatch returns `400 Invalid signature` at the endpoint.

### Rollback

Vercel → Deployments → **Instant Rollback** reverts the app in seconds, and is safe
because deploys are stateless. What it does *not* undo: applied Supabase migrations,
ingested `leads` rows, or already-sent emails. Reverse those deliberately — schema
changes with a follow-up migration. During the 7–14 day stabilization window, the
retained read-only Hetzner deployment is the leads rollback source described in
[the migration runbook](docs/hetzner-to-supabase-leads-migration-plan.md).
