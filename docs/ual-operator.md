# USAgentLeads Operator Documentation

## Business and hosting

USAgentLeads sells realtor contact data (name, state, email, and phone) as
one-time CSV downloads, a searchable subscriber dashboard, and a REST API.

- **Web app:** Next.js on Vercel
- **Repository:** <https://github.com/asterism-software/usagentleads>
- **Auth, application data, leads dataset, and CSV storage:** Supabase project
  `vgbzldrsuxhzjxibyatw` (`US Agent Leads`), schema `usagentleads`, private
  Storage bucket `agent-csvs`

The former Hetzner Postgres/PostgREST service is read-only and retained only for
rollback during the migration stabilization window. The application no longer
uses `LEADS_REST_URL` or `LEADS_REST_KEY` for production reads.

## Stripe billing

The pricing catalog is intentionally defined in
`lib/billing/plans.ts`. Its public Stripe Price IDs are committed with
the plan copy and act as the checkout allowlist; do not move them into environment
variables.

| Plan | Price | Stripe Price ID | Access |
|---|---:|---|---|
| State Pack | $99 one-time | `price_1U5NQ1ItJWsYAnxnyFSsLmBG` | One state CSV |
| Full Database | $399 one-time | `price_1U5NQ8ItJWsYAnxnbrvaXD0d` | All-state CSV archive |
| Pro Dashboard | $49/month | `price_1TzG2tItJWsYAnxnlVVNJgPc` | Searchable dashboard |
| Pro API | $79/month | `price_1TzG32ItJWsYAnxnBI0j2xQn` | Dashboard plus API, 10,000 requests/month |

The Stripe secret key must belong to the account and mode containing those four
Prices. Price IDs are public identifiers; `STRIPE_SECRET_KEY` and
`STRIPE_WEBHOOK_SECRET` are secrets and must remain in Vercel.

### Checkout and fulfillment

`POST /api/checkout` validates the requested plan and creates a new Stripe-hosted
Checkout Session from the allowlist. The app does not store static checkout links.
Session creation is idempotent and carries only the metadata needed to connect the
Stripe object to the application's pending record.

For State Pack and Full Database purchases, the route first creates a pending
purchase and opaque `page_token`, preserving the existing
`/purchase-success?pt=...` polling flow. Stripe redirects the buyer there after
Checkout. Fulfillment occurs only after the signed webhook confirms payment:

1. `/api/webhooks/stripe` retrieves and validates the completed Checkout Session.
2. It verifies the Price ID, USD total, purchase ID, and customer email.
3. It marks the purchase completed and asks Resend to email the download link.
4. The link contains a separate, single-use `download_token`; it expires after 48
   hours and resolves to a five-minute signed Storage URL.

Subscriptions require a signed-in Supabase user. Checkout copies the user's ID to
Stripe Session and subscription metadata, and reuses an existing Stripe Customer
when available. `stripe_checkout_attempts` holds one short-lived, user-scoped claim
across both plans: same-plan retries recover the idempotent Session, and switching
plans expires the previous hosted page before creating another. Successful
subscriptions redirect to the relevant dashboard.

### Webhook, subscriptions, and portal

The production Stripe endpoint is:

```text
https://www.usagentleads.com/api/webhooks/stripe
```

Configure it for `checkout.session.completed`,
`checkout.session.async_payment_succeeded`,
`checkout.session.async_payment_failed`, `checkout.session.expired`,
`charge.refunded`, `customer.subscription.created`,
`customer.subscription.updated`, `customer.subscription.deleted`,
`customer.subscription.paused`, `customer.subscription.resumed`, `invoice.paid`,
and `invoice.payment_failed`. Store that endpoint's signing secret as
`STRIPE_WEBHOOK_SECRET`.

The handler verifies the raw body and `Stripe-Signature` with Stripe's SDK. Its
effects use deterministic updates and email idempotency keys, and it records each
event ID in `stripe_webhook_events` only after processing succeeds. Completed
duplicates return success without running fulfillment again; failed deliveries
remain unrecorded so Stripe can retry them.

Subscription webhooks keep the Supabase subscription row synchronized and drive
welcome, renewal, failed-payment, and cancellation emails. Signed-in subscribers
can use `/api/billing-portal` to open a short-lived Stripe Customer Portal session.
The app's subscription API also supports scheduling cancellation at period end and
resuming before that date.

### Nurture discount

The last free-sample nurture email creates a unique Stripe promotion code for $10
off a State Pack. Each code has one redemption and expires after 72 hours. Its
underlying Stripe coupon is scoped to the State Pack product, so it cannot discount
Full Database or either subscription.

## Data refresh and scheduled jobs

The leads dataset is currently a static, read-only Supabase snapshot. Ingestion
adapters in `scripts/ingest/` are retained for history but must not run without a
new write-path and derived-data plan. If ingestion is deliberately restored,
regenerate the derived data in this order:

1. Call `/api/cron/update-state-counts`.
2. Call `/api/cron/generate-csvs` once for the state worklist, once per state with
   `?state=XX`, and finally with `?combine=true`. The combine step builds
   `full/usa_agents_full.zip` with as many numbered CSV parts as needed, capped
   at 1,000,000 data rows per part so every file opens safely in Excel. Rows are
   distributed as evenly as possible across the calculated number of parts.
3. Run `node scripts/sync-state-counts.mjs` and commit the regenerated constants.

No GitHub Actions are installed. `update-state-counts`, `generate-csvs`, and
`indexnow` are authenticated operator endpoints with no automatic schedule. Do
not invoke the first two unless a data refresh has been approved. Existing CSV
objects remain available from the private Supabase Storage bucket.

## Other managed services

- **Resend:** transactional, download, subscription, and nurture emails
- **IndexNow:** search-engine URL submission
- **PostHog, Bing Webmaster Tools, Google Search Console:** analytics and search
- **Upstash Redis:** public-route rate limiting

## Deployment and payment smoke test

Run `npm run db:push` before pushing the Stripe-enabled app to production. Confirm
that both `20260731130718_stripe_payments.sql` and
`20260801081007_add_checkout_metadata.sql` have been applied, then push the
production branch to trigger the Vercel deployment.
Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in every Vercel environment that
must accept payments. Configure Stripe Customer Portal access and the production
webhook separately in the Stripe Dashboard. Never place secret values in this
document or in `PlanGroups.tsx`.

After a billing change, verify:

1. `POST /api/checkout` returns a Stripe-hosted URL for each plan.
2. A State Pack test purchase reaches `/purchase-success`, completes the purchase
   row, and sends a working download email exactly once.
3. Pro Dashboard and Pro API checkouts attach to the signed-in user and update the
   subscription after the webhook arrives.
4. `/api/billing-portal` opens for a Stripe subscriber.
5. A generated nurture promotion code discounts only State Pack and cannot be
   redeemed twice.

Use Stripe's webhook delivery log first when fulfillment or subscription state is
stale. Signature failures return HTTP 400; processing failures return HTTP 500 so
Stripe retries. CSV workflow timeouts are separate from payment processing and can
usually be recovered by rerunning the failed workflow.

## Historical ingestion notes

The original dataset was assembled incrementally with one-time adapters rather
than a single permanent pipeline. Reuse the checked-in ingestion scripts and add
new sources when the data needs refreshing. Residential.com and Keller Williams
were previously identified as possible sources, but the earlier scripts for them
were lost with an inaccessible VPS and are not part of this repository.
