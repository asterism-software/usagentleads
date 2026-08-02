import crypto from "crypto"
import Stripe from "stripe"
import {
  STRIPE_STATE_NURTURE_COUPON_ID,
  STRIPE_PLANS,
  type PurchaseType,
} from "@/lib/billing/plans"
import { SITE_URL } from "@/lib/utils/site"

let stripeClient: Stripe | null = null

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured")

  stripeClient ??= new Stripe(secretKey, {
    // Match the live webhook endpoint so REST responses and event payloads use
    // one version. The SDK types target a newer patch of the same Dahlia release.
    apiVersion: "2026-06-24.dahlia" as Stripe.LatestApiVersion,
    appInfo: { name: "USAgentLeads" },
  })
  return stripeClient
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || SITE_URL).replace(/\/$/, "")
}

export interface CheckoutMetadata {
  purchase_type: PurchaseType
  checkout_attempt_id: string
  ip?: string
  timezone?: string
  country?: string
  referrer?: string
  first_landing_page?: string
  plan_name?: string
  plan_price?: string
  plan_price_cents?: string
  currency?: string
  purchase_id?: string
  state_code?: string
  user_id?: string
}

export function compactStripeMetadata(
  metadata: object | null | undefined
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(metadata || {}).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && entry[1].length > 0
    )
  )
}

interface CreateCheckoutParams {
  purchaseType: PurchaseType
  metadata: CheckoutMetadata
  customerEmail?: string
  stripeCustomerId?: string
  successPageToken?: string
  subscriptionExpiresAt?: string
}

export interface CreatedCheckout {
  id: string
  url: string
  expiresAt: string | null
}

export interface CheckoutSessionSummary {
  status: Stripe.Checkout.Session.Status | null
  url: string | null
  allowPromotionCodes: boolean
}

export async function createCheckout({
  purchaseType,
  metadata,
  customerEmail,
  stripeCustomerId,
  successPageToken,
  subscriptionExpiresAt,
}: CreateCheckoutParams): Promise<CreatedCheckout> {
  const stripe = getStripe()
  const plan = STRIPE_PLANS[purchaseType]
  const isSubscription = plan.mode === "subscription"
  const isApiSubscription = purchaseType === "subscription_api"
  const stripeMetadata = compactStripeMetadata(metadata)
  // The route persists this absolute value with the user-scoped claim. Reusing
  // it verbatim is required because Stripe rejects an idempotency-key retry if
  // any request parameter changes.
  const subscriptionExpiresAtUnix = subscriptionExpiresAt
    ? Math.floor(new Date(subscriptionExpiresAt).getTime() / 1_000)
    : null
  if (isSubscription && !Number.isFinite(subscriptionExpiresAtUnix)) {
    throw new Error("Subscription Checkout requires a persisted expiry")
  }

  const successUrl = isSubscription
    ? isApiSubscription
      ? `${appUrl()}/dashboard/api-keys?welcome=1`
      : `${appUrl()}/dashboard?welcome=1`
    : `${appUrl()}/purchase-success?pt=${encodeURIComponent(successPageToken || "")}`

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: plan.mode,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: purchaseType === "state" ? `${appUrl()}/states` : `${appUrl()}/pricing`,
    // The Checkout field should be available for every plan. Stripe still
    // enforces each coupon's product and recurring-payment restrictions.
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    client_reference_id: metadata.user_id || metadata.checkout_attempt_id,
    locale: "auto",
    metadata: stripeMetadata,
    origin_context: "web",
    submit_type: isSubscription ? "subscribe" : "pay",
    ...(isSubscription
      ? {
          expires_at: subscriptionExpiresAtUnix!,
          subscription_data: { metadata: stripeMetadata },
          ...(stripeCustomerId
            ? { customer: stripeCustomerId }
            : customerEmail
              ? { customer_email: customerEmail }
              : {}),
        }
      : {
          customer_creation: "always" as const,
          payment_intent_data: { metadata: stripeMetadata },
        }),
  }

  const session = await stripe.checkout.sessions.create(params, {
    idempotencyKey: `checkout-${metadata.checkout_attempt_id}`,
  })

  if (!session.url) throw new Error("Stripe did not return a Checkout URL")
  return {
    id: session.id,
    url: session.url,
    expiresAt: session.expires_at ? new Date(session.expires_at * 1_000).toISOString() : null,
  }
}

export async function getCheckoutSessionSummary(
  sessionId: string
): Promise<CheckoutSessionSummary> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId)
  return {
    status: session.status,
    url: session.url,
    allowPromotionCodes: session.allow_promotion_codes === true,
  }
}

export async function expireCheckoutSession(sessionId: string): Promise<void> {
  await getStripe().checkout.sessions.expire(sessionId)
}

export interface StateDiscount {
  code: string
  amountCents: number
  expiresAt: string
}

/**
 * Create a unique, single-use State Pack promotion code for the nurture drip.
 * The underlying coupon is product-scoped to the State Pack, so exposing the
 * Checkout field on other plans cannot make this campaign discount apply.
 */
export async function createStateDiscount(opts?: {
  expiresInHours?: number
}): Promise<StateDiscount | null> {
  const amountCents = 1_000
  const expiresInHours = opts?.expiresInHours ?? 72
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1_000)
  const expiresAtUnix = Math.floor(expiresAt.getTime() / 1_000)
  const code = `SAMPLE${crypto.randomBytes(5).toString("hex").toUpperCase()}`

  try {
    const stripe = getStripe()
    await stripe.promotionCodes.create(
      {
        promotion: { type: "coupon", coupon: STRIPE_STATE_NURTURE_COUPON_ID },
        code,
        expires_at: expiresAtUnix,
        max_redemptions: 1,
        metadata: { app: "usagentleads", campaign: "sample_nurture" },
      },
      { idempotencyKey: `nurture-code-${code}` }
    )

    return { code, amountCents, expiresAt: expiresAt.toISOString() }
  } catch (error) {
    console.error("createStateDiscount error:", error)
    return null
  }
}
