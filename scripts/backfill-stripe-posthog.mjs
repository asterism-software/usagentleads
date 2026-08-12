import { PostHog } from "posthog-node"
import Stripe from "stripe"

const execute = process.argv.includes("--execute")
const daysArgument = process.argv.find((value) => value.startsWith("--days="))
const days = daysArgument ? Number(daysArgument.split("=", 2)[1]) : 180

if (!Number.isInteger(days) || days < 1 || days > 730) {
  throw new Error("--days must be an integer between 1 and 730")
}
if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is required")
if (execute && !process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  throw new Error("NEXT_PUBLIC_POSTHOG_KEY is required with --execute")
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const posthog = execute
  ? new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      flushAt: 20,
      flushInterval: 500,
    })
  : null
const createdGte = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60
const counts = {}

function increment(event) {
  counts[event] = (counts[event] || 0) + 1
}

function objectId(value) {
  if (!value) return null
  return typeof value === "string" ? value : value.id
}

function sourceForReferrer(value) {
  if (!value || value === "direct") return "direct"
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, "")
    if (hostname === "google.com" || hostname.endsWith(".google.com") || hostname.startsWith("google.")) return "google"
    if (hostname === "bing.com" || hostname.endsWith(".bing.com")) return "bing"
    if (hostname === "yahoo.com" || hostname.endsWith(".yahoo.com")) return "yahoo"
    if (hostname === "duckduckgo.com" || hostname.endsWith(".duckduckgo.com")) return "duckduckgo"
    if (hostname === "chatgpt.com" || hostname.endsWith(".chatgpt.com")) return "chatgpt"
    if (hostname === "perplexity.ai" || hostname.endsWith(".perplexity.ai")) return "perplexity"
    return hostname
  } catch {
    return "direct"
  }
}

function attributionProperties(...sources) {
  const metadata = Object.assign({}, ...sources.filter(Boolean))
  const source = metadata.attribution_source || sourceForReferrer(metadata.referrer)
  const medium = metadata.attribution_medium || (
    source === "direct"
      ? "direct"
      : ["google", "bing", "yahoo", "duckduckgo"].includes(source)
        ? "organic_search"
        : ["chatgpt", "perplexity", "copilot"].includes(source)
          ? "ai"
          : "referral"
  )
  return Object.fromEntries(Object.entries({
    referrer: metadata.referrer || "direct",
    first_landing_page: metadata.first_landing_page || "unknown",
    attribution_source: source,
    attribution_medium: medium,
    timezone: metadata.timezone,
    country: metadata.country,
  }).filter(([, value]) => typeof value === "string" && value))
}

function distinctId(metadata, fallback) {
  return metadata?.user_id || metadata?.posthog_distinct_id || fallback
}

function capture({ distinctId: id, event, timestamp, properties }) {
  increment(event)
  posthog?.capture({
    distinctId: id,
    event,
    timestamp: new Date(timestamp * 1000),
    properties: { ...properties, historical_backfill: true },
  })
}

async function backfillCheckoutSessions() {
  for await (const session of stripe.checkout.sessions.list({
    created: { gte: createdGte },
    limit: 100,
  })) {
    if (session.mode !== "payment") continue
    const metadata = session.metadata || {}
    const id = distinctId(metadata, `stripe-checkout:${session.id}`)
    const attribution = attributionProperties(metadata)
    const customerId = objectId(session.customer)
    capture({
      distinctId: id,
      event: "checkout_session_created",
      timestamp: session.created,
      properties: {
        $insert_id: `stripe:checkout.session.created:${session.id}`,
        billing_provider: "stripe",
        stripe_customer_id: customerId,
        checkout_session_id: session.id,
        purchase_type: "one_time",
        ...attribution,
      },
    })
    if (session.payment_status !== "paid") continue
    const amountPaidCents = session.amount_total || 0
    const taxCents = session.total_details?.amount_tax || 0
    const grossRevenueCents = Math.max(0, amountPaidCents - taxCents)
    capture({
      distinctId: id,
      event: "payment_succeeded",
      timestamp: session.created,
      properties: {
        $insert_id: `stripe:payment.succeeded:checkout:${session.id}`,
        $revenue: grossRevenueCents / 100,
        $currency: session.currency?.toUpperCase() || "USD",
        billing_provider: "stripe",
        stripe_customer_id: customerId,
        checkout_session_id: session.id,
        payment_intent_id: objectId(session.payment_intent),
        purchase_type: "one_time",
        amount_paid_cents: amountPaidCents,
        gross_revenue_cents: grossRevenueCents,
        subtotal_cents: session.amount_subtotal || amountPaidCents,
        discount_cents: session.total_details?.amount_discount || 0,
        tax_cents: taxCents,
        total_cents: amountPaidCents,
        is_first_payment: amountPaidCents > 0,
        is_trial_conversion: false,
        ...attribution,
      },
    })
  }
}

async function main() {
  try {
    await backfillCheckoutSessions()
    await posthog?.shutdown()
    process.stdout.write(`${execute ? "Backfilled" : "Dry run"} ${days} days: ${JSON.stringify(counts)}\n`)
  } catch (error) {
    await posthog?.shutdown().catch(() => undefined)
    throw error
  }
}

await main()
