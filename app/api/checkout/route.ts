import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import {
  compactStripeMetadata,
  createCheckout,
  expireCheckoutSession,
  getCheckoutSessionSummary,
  type CheckoutMetadata,
} from "@/lib/stripe/client"
import { STRIPE_PLANS, type PurchaseType } from "@/components/pricing/PlanGroups"
import { isValidStateCode } from "@/lib/utils/security"
import { rateLimit } from "@/lib/utils/rateLimit"
import { getCountryCodeForTimezone } from "@/lib/utils/timezone"
import { z } from "zod"

const checkoutSchema = z.object({
  purchaseType: z.enum(["state", "full_database", "subscription", "subscription_api"]),
  stateCode: z.string().optional(),
  // Attribution must never prevent a valid purchase. The browser helper sends
  // a small object, while this route safely normalizes any stale/tampered value.
  attribution: z.unknown().optional(),
})

type SubscriptionPurchaseType = "subscription" | "subscription_api"

interface SubscriptionCheckoutAttempt {
  user_id: string
  purchase_type: SubscriptionPurchaseType
  attempt_id: string
  stripe_checkout_session_id: string | null
  expires_at: string
  metadata: Record<string, unknown> | null
}

type SubscriptionCheckoutClaim =
  | { kind: "create"; attemptId: string; expiresAt: string; metadata: CheckoutMetadata }
  | { kind: "reuse"; attemptId: string; sessionId: string; url: string }
  | { kind: "blocked"; message: string }

function attributionRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function normalizedMetadataValue(
  value: unknown,
  fallback: string,
  maxLength: number
): string {
  if (typeof value !== "string") return fallback
  return value.trim().slice(0, maxLength) || fallback
}

function normalizedReferrer(value: unknown): string {
  const candidate = normalizedMetadataValue(value, "", 500)
  if (!candidate) return "direct"

  try {
    const url = new URL(candidate)
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.origin.slice(0, 500)
      : "direct"
  } catch {
    return "direct"
  }
}

function buildCheckoutMetadata(
  purchaseType: PurchaseType,
  ip: string,
  rawAttribution: unknown
): CheckoutMetadata {
  const attribution = attributionRecord(rawAttribution)
  const timezone = normalizedMetadataValue(attribution.timezone, "unknown", 100)
  const plan = STRIPE_PLANS[purchaseType]

  return {
    purchase_type: purchaseType,
    checkout_attempt_id: crypto.randomUUID(),
    ip: normalizedMetadataValue(ip, "unknown", 100),
    timezone,
    country: getCountryCodeForTimezone(timezone) || "unknown",
    referrer: normalizedReferrer(attribution.referrer),
    first_landing_page: normalizedMetadataValue(
      attribution.firstLandingPage,
      "/",
      500
    ),
    plan_name: plan.name,
    plan_price: (plan.amount / 100).toFixed(2),
    plan_price_cents: String(plan.amount),
    currency: plan.currency,
  }
}

function metadataForExistingAttempt(
  attempt: SubscriptionCheckoutAttempt,
  userId: string
): CheckoutMetadata {
  // Empty metadata identifies a claim created before attribution snapshots
  // existed. Retrying only its legacy keys preserves Stripe idempotency.
  const stored = compactStripeMetadata(attempt.metadata)
  return {
    ...stored,
    purchase_type: attempt.purchase_type,
    checkout_attempt_id: attempt.attempt_id,
    user_id: userId,
  }
}

const serviceDb = () => createServiceClient().schema("usagentleads")

interface ExistingSubscription {
  billing_provider: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  status: string
  current_period_end: string | null
  trial_ends_at: string | null
  cancel_at_period_end: boolean
}

async function loadSubscription(userId: string): Promise<ExistingSubscription | null> {
  const { data, error } = await serviceDb()
    .from("subscriptions")
    .select(
      "billing_provider, stripe_subscription_id, stripe_customer_id, status, current_period_end, trial_ends_at, cancel_at_period_end"
    )
    .eq("user_id", userId)
    .maybeSingle()
  if (error) throw new Error(`Unable to check existing subscription: ${error.message}`)
  return data as ExistingSubscription | null
}

function hasManagedSubscription(subscription: ExistingSubscription | null): boolean {
  const accessEnds = [subscription?.current_period_end, subscription?.trial_ends_at]
    .filter((value): value is string => Boolean(value))
  const accessStillValid =
    accessEnds.length === 0 || accessEnds.some((value) => new Date(value).getTime() > Date.now())
  const hasOpenStripeSubscription = Boolean(
    subscription?.billing_provider === "stripe" &&
      subscription.stripe_subscription_id &&
      !["cancelled", "expired"].includes(subscription.status)
  )
  const hasLiveEntitlement = Boolean(
    subscription &&
      accessStillValid &&
      (["active", "on_trial", "paused"].includes(subscription.status) ||
        subscription.cancel_at_period_end)
  )
  return hasOpenStripeSubscription || hasLiveEntitlement
}

async function deleteCheckoutAttempt(userId: string, attemptId: string) {
  const { error } = await serviceDb()
    .from("stripe_checkout_attempts")
    .delete()
    .eq("user_id", userId)
    .eq("attempt_id", attemptId)
  if (error) throw new Error(`Unable to release subscription checkout: ${error.message}`)
}

async function claimSubscriptionCheckout(
  userId: string,
  purchaseType: SubscriptionPurchaseType,
  requestedMetadata: CheckoutMetadata
): Promise<SubscriptionCheckoutClaim> {
  // The primary key on user_id is the cross-instance lock. Only one plan can
  // own an open Checkout Session for an account at a time.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const attemptId = crypto.randomUUID()
    // A one-hour absolute expiry leaves a 30-minute recovery window while
    // still satisfying Stripe's minimum Session lifetime on an uncached retry.
    const expiresAt = new Date(Date.now() + 60 * 60 * 1_000).toISOString()
    const attemptMetadata: CheckoutMetadata = {
      ...requestedMetadata,
      purchase_type: purchaseType,
      checkout_attempt_id: attemptId,
      user_id: userId,
    }
    const { error: insertError } = await serviceDb()
      .from("stripe_checkout_attempts")
      .insert({
        user_id: userId,
        purchase_type: purchaseType,
        attempt_id: attemptId,
        expires_at: expiresAt,
        metadata: compactStripeMetadata(attemptMetadata),
      })

    if (!insertError) {
      return { kind: "create", attemptId, expiresAt, metadata: attemptMetadata }
    }
    if (insertError.code !== "23505") {
      throw new Error(`Unable to reserve subscription checkout: ${insertError.message}`)
    }

    const { data, error: selectError } = await serviceDb()
      .from("stripe_checkout_attempts")
      .select(
        "user_id, purchase_type, attempt_id, stripe_checkout_session_id, expires_at, metadata"
      )
      .eq("user_id", userId)
      .maybeSingle()
    if (selectError) {
      throw new Error(`Unable to read subscription checkout: ${selectError.message}`)
    }
    const existing = data as SubscriptionCheckoutAttempt | null
    // A conflicting row can disappear between INSERT and SELECT. Retry the
    // atomic claim instead of treating that harmless race as an error.
    if (!existing) continue

    if (!existing.stripe_checkout_session_id) {
      if (new Date(existing.expires_at).getTime() <= Date.now()) {
        await deleteCheckoutAttempt(userId, existing.attempt_id)
        continue
      }
      // A previous process may have stopped after Stripe accepted the request
      // but before the Session ID was persisted. Retrying the same plan with
      // the same idempotency key safely recovers that Session.
      if (existing.purchase_type === purchaseType) {
        return {
          kind: "create",
          attemptId: existing.attempt_id,
          expiresAt: existing.expires_at,
          metadata: metadataForExistingAttempt(existing, userId),
        }
      }
      return {
        kind: "blocked",
        message: "Your subscription checkout is being prepared. Please retry in a moment.",
      }
    }

    const session = await getCheckoutSessionSummary(existing.stripe_checkout_session_id)
    if (session.status === "complete") {
      return {
        kind: "blocked",
        message: "Your completed subscription is still being activated. Please retry shortly.",
      }
    }

    const locallyExpired = new Date(existing.expires_at).getTime() <= Date.now()
    if (session.status === "expired" || locallyExpired) {
      if (session.status === "open") {
        await expireCheckoutSession(existing.stripe_checkout_session_id)
      }
      await deleteCheckoutAttempt(userId, existing.attempt_id)
      continue
    }

    if (session.status === "open" && session.allowPromotionCodes === false) {
      // Checkout Session settings are immutable. Rotate a Session created
      // before promotion-code entry was enabled instead of reusing it for up
      // to an hour with the old hosted-page configuration.
      await expireCheckoutSession(existing.stripe_checkout_session_id)
      await deleteCheckoutAttempt(userId, existing.attempt_id)
      continue
    }

    if (existing.purchase_type === purchaseType && session.status === "open" && session.url) {
      return {
        kind: "reuse",
        attemptId: existing.attempt_id,
        sessionId: existing.stripe_checkout_session_id,
        url: session.url,
      }
    }

    if (existing.purchase_type !== purchaseType && session.status === "open") {
      // Switching plans explicitly expires the previous hosted page before the
      // unique user claim is rotated, so both plans can never remain payable.
      await expireCheckoutSession(existing.stripe_checkout_session_id)
      await deleteCheckoutAttempt(userId, existing.attempt_id)
      continue
    }

    return {
      kind: "blocked",
      message: "Your subscription checkout is unavailable. Please retry shortly.",
    }
  }

  throw new Error("Unable to reserve subscription checkout after concurrent updates")
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const { success } = await rateLimit(`checkout:${ip}`, 10)
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await request.json()
    const parsed = checkoutSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const { purchaseType } = parsed.data
    const stateCode = parsed.data.stateCode?.toUpperCase()

    if (purchaseType === "state" && (!stateCode || !isValidStateCode(stateCode))) {
      return NextResponse.json({ error: "Invalid state code" }, { status: 400 })
    }

    let metadata = buildCheckoutMetadata(purchaseType, ip, parsed.data.attribution)
    if (purchaseType === "state") metadata.state_code = stateCode!
    let customerEmail: string | undefined
    let stripeCustomerId: string | undefined
    let successPageToken: string | undefined
    let pendingPurchaseId: string | undefined
    let subscriptionAttemptId: string | undefined
    let subscriptionAttemptExpiresAt: string | undefined
    let subscriptionUserId: string | undefined

    // Create the pending purchase before Checkout. Stripe receives only its
    // internal row ID as metadata; the opaque page token remains dedicated to
    // the existing purchase-success polling workflow.
    if (purchaseType !== "subscription" && purchaseType !== "subscription_api") {
      successPageToken = crypto.randomUUID()
      pendingPurchaseId = crypto.randomUUID()
      metadata.purchase_id = pendingPurchaseId

      const { error: purchaseError } = await serviceDb()
        .from("purchases")
        .insert({
          id: pendingPurchaseId,
          purchase_type: purchaseType,
          state_code: purchaseType === "state" ? stateCode : null,
          amount_paid: 0,
          status: "pending",
          page_token: successPageToken,
          billing_provider: "stripe",
          metadata: compactStripeMetadata(metadata),
        })

      if (purchaseError) throw new Error(`Unable to initialize purchase: ${purchaseError.message}`)
    }

    if (purchaseType === "subscription" || purchaseType === "subscription_api") {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { error: "Authentication required for subscription" },
          { status: 401 }
        )
      }
      metadata.user_id = user.id
      customerEmail = user.email

      // Reuse a Stripe Customer on a later checkout so payment history and the
      // customer portal remain attached to one billing identity.
      const existingSubscription = await loadSubscription(user.id)

      // One account maps to one recurring entitlement. Existing subscribers
      // manage billing in the portal instead of creating a second charge whose
      // webhook would overwrite their single subscription row.
      if (hasManagedSubscription(existingSubscription)) {
        return NextResponse.json(
          {
            error: "An existing subscription is already attached to this account.",
            url: "/api/billing-portal",
          },
          { status: 409 }
        )
      }

      if (
        existingSubscription?.billing_provider === "stripe" &&
        existingSubscription.stripe_customer_id
      ) {
        stripeCustomerId = existingSubscription.stripe_customer_id
      }

      const claim = await claimSubscriptionCheckout(user.id, purchaseType, metadata)
      if (claim.kind === "blocked") {
        return NextResponse.json({ error: claim.message }, { status: 409 })
      }

      // The completion webhook upserts entitlement before releasing its claim.
      // Re-reading after our claim therefore closes the checkout/webhook race.
      const refreshedSubscription = await loadSubscription(user.id)
      if (hasManagedSubscription(refreshedSubscription)) {
        if (claim.kind === "reuse") await expireCheckoutSession(claim.sessionId)
        await deleteCheckoutAttempt(user.id, claim.attemptId)
        return NextResponse.json(
          {
            error: "An existing subscription is already attached to this account.",
            url: "/api/billing-portal",
          },
          { status: 409 }
        )
      }

      if (claim.kind === "reuse") return NextResponse.json({ url: claim.url })
      subscriptionAttemptId = claim.attemptId
      subscriptionAttemptExpiresAt = claim.expiresAt
      subscriptionUserId = user.id
      metadata = claim.metadata
      if (
        refreshedSubscription?.billing_provider === "stripe" &&
        refreshedSubscription.stripe_customer_id
      ) {
        stripeCustomerId = refreshedSubscription.stripe_customer_id
      }
    }

    let checkout: Awaited<ReturnType<typeof createCheckout>> | undefined
    try {
      checkout = await createCheckout({
        purchaseType,
        metadata,
        customerEmail,
        stripeCustomerId,
        successPageToken,
        subscriptionExpiresAt: subscriptionAttemptExpiresAt,
      })
      if (subscriptionAttemptId && subscriptionUserId) {
        const { data: savedAttempt, error: attemptUpdateError } = await serviceDb()
          .from("stripe_checkout_attempts")
          .update({
            stripe_checkout_session_id: checkout.id,
            ...(checkout.expiresAt ? { expires_at: checkout.expiresAt } : {}),
          })
          .eq("user_id", subscriptionUserId)
          .eq("attempt_id", subscriptionAttemptId)
          .select("attempt_id")
          .maybeSingle()
        if (attemptUpdateError) {
          throw new Error(`Unable to persist subscription checkout: ${attemptUpdateError.message}`)
        }
        if (!savedAttempt) {
          await expireCheckoutSession(checkout.id)
          throw new Error("Subscription checkout claim expired before it could be persisted")
        }
      }
    } catch (error) {
      if (pendingPurchaseId) {
        await serviceDb().from("purchases").delete().eq("id", pendingPurchaseId)
      }
      // Keep a subscription claim after an ambiguous Stripe/DB failure. A
      // same-plan retry reuses its idempotency key and can recover the Session;
      // the one-hour expiry rotates truly failed attempts safely.
      throw error
    }

    return NextResponse.json({ url: checkout.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Checkout error:", message)
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    )
  }
}
