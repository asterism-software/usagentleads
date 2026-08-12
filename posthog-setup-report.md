# PostHog one-time purchase and Stripe analytics

US Agent Leads now tracks browser intent, authentication, lead capture, Stripe checkout creation, successful one-time orders, and settled revenue. Browser and server events are stitched onto the same PostHog person using the anonymous browser ID and Supabase user ID.

| Event | Emission point |
|---|---|
| `sign_in_initiated`, `magic_link_sent` | Login page |
| `registration_completed`, `sign_in_completed` | OAuth and magic-link callbacks |
| `checkout_initiated` | One-time purchase checkout buttons |
| `checkout_session_created` | Checkout API after Stripe returns a Session |
| `stripe_customer_created` | Stripe Checkout completion webhook |
| `payment_succeeded` | Settled one-time Stripe Checkout webhook; this is the purchase conversion event |
| `lead_captured` | Successful free-sample lead capture |

All Stripe purchase events use stable `$insert_id` values, so webhook retries and historical imports cannot double count revenue or orders. Checkout metadata includes normalized `attribution_source`, `attribution_medium`, `first_landing_page`, `referrer`, timezone, and country fields.

## Dashboards

- [Analytics basics](https://us.posthog.com/project/346979/dashboard/1988233)
- [Stripe Acquisition & Revenue Attribution](https://us.posthog.com/project/346979/dashboard/1988236)

The dashboards contain ten insights covering visitor-to-purchase conversion, checkout drop-off, paid orders, leads versus sign-ins, first-touch source and landing-page performance, one-time purchase KPIs, average order value, and weekly gross revenue. Trial, subscription, churn, and recurring-payment metrics are intentionally excluded.

## Optional historical import

`npm run backfill:stripe-posthog -- --days=180` performs a read-only dry run. Adding `--execute` sends only payment-mode Checkout Session and successful one-time payment events to the configured PostHog project. It excludes subscription, invoice, and trial records. Execution should only be used after explicitly approving that historical data transfer.

On 2026-08-12, the approved 180-day import sent 38 one-time Checkout Sessions and 17 successful one-time payments to PostHog project 346979. PostHog verified all 55 events and reported $796.20 gross revenue, 44.7% checkout-to-paid conversion, and $46.84 average order value. Stable `$insert_id` values make the import safe to rerun without double counting.
