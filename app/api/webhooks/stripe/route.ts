import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { STRIPE_PLANS, type PurchaseType } from "@/lib/billing/plans"
import {
  sendDownloadEmail,
  sendPaymentFailed,
  sendSubscriptionCancelled,
  sendSubscriptionRenewed,
  sendSubscriptionWelcome,
} from "@/lib/resend/emails"
import { createServiceClient } from "@/lib/supabase/server"
import { compactStripeMetadata, getStripe } from "@/lib/stripe/client"
import { constructWebhookEvent } from "@/lib/stripe/webhook"
import { isValidUUID } from "@/lib/utils/security"
import { SITE_URL } from "@/lib/utils/site"
import { getStateByCode } from "@/lib/utils/states"

export const runtime = "nodejs"

const db = () => createServiceClient().schema("usagentleads")

function objectId(value: string | { id: string } | null): string | null {
  if (!value) return null
  return typeof value === "string" ? value : value.id
}

function toIso(timestamp: number | null | undefined): string | null {
  return timestamp ? new Date(timestamp * 1_000).toISOString() : null
}

export function normalizeSubscriptionStatus(
  status: Stripe.Subscription.Status
): "active" | "on_trial" | "paused" | "cancelled" | "expired" {
  switch (status) {
    case "active":
      return "active"
    case "trialing":
      return "on_trial"
    case "canceled":
      return "cancelled"
    case "incomplete_expired":
      return "expired"
    default:
      return "paused"
  }
}

export function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  start: string | null
  end: string | null
} {
  const item = subscription.items.data[0]
  return {
    start: toIso(item?.current_period_start),
    end: toIso(item?.current_period_end),
  }
}

export function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  if (invoice.parent?.type !== "subscription_details") return null
  return objectId(invoice.parent.subscription_details?.subscription || null)
}

function purchaseTypeForPrice(priceId: string): PurchaseType | null {
  const entry = Object.entries(STRIPE_PLANS).find(([, plan]) => plan.priceId === priceId)
  return (entry?.[0] as PurchaseType | undefined) || null
}

async function eventAlreadyProcessed(eventId: string): Promise<boolean> {
  const { data, error } = await db()
    .from("stripe_webhook_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle()
  if (error) throw new Error(`Unable to check Stripe event: ${error.message}`)
  return Boolean(data)
}

async function recordProcessedEvent(event: Stripe.Event): Promise<void> {
  const { error } = await db().from("stripe_webhook_events").insert({
    id: event.id,
    event_type: event.type,
  })
  // A concurrent delivery can finish first. Every handler below is idempotent,
  // so the unique event ID makes either completion equivalent.
  if (error && error.code !== "23505") {
    throw new Error(`Unable to record Stripe event: ${error.message}`)
  }
}

async function syncCheckoutCustomerMetadata(
  session: Stripe.Checkout.Session
): Promise<void> {
  const customerId = objectId(session.customer)
  const metadata = compactStripeMetadata(session.metadata)
  if (!customerId || Object.keys(metadata).length === 0) return

  // Checkout cannot put metadata directly on the Customer it creates. Once
  // confirmation has created that Customer, copy the signed Session snapshot.
  await getStripe().customers.update(customerId, { metadata })
}

async function fulfillCheckout(sessionId: string): Promise<void> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price"],
  })

  if (session.mode === "subscription") {
    const subscriptionId = objectId(session.subscription)
    if (!subscriptionId) {
      throw new Error(`Checkout Session ${session.id} has no subscription`)
    }
    const synced = await syncSubscription(subscriptionId)
    if (synced) await syncCheckoutCustomerMetadata(session)
    return
  }
  if (session.mode !== "payment") return
  const paymentIsComplete = ["paid", "no_payment_required"].includes(
    session.payment_status
  )

  const purchaseId = session.metadata?.purchase_id
  if (!purchaseId || !isValidUUID(purchaseId)) {
    throw new Error(`Checkout Session ${session.id} has no valid purchase ID`)
  }

  const lineItems = session.line_items?.data || []
  const lineItem = lineItems[0]
  const priceId = objectId(lineItem?.price || null)
  const purchaseType = priceId ? purchaseTypeForPrice(priceId) : null
  if (
    lineItems.length !== 1 ||
    lineItem?.quantity !== 1 ||
    !priceId ||
    (purchaseType !== "state" && purchaseType !== "full_database")
  ) {
    throw new Error(`Checkout Session ${session.id} has an unexpected Price`)
  }

  const plan = STRIPE_PLANS[purchaseType]
  // Checkout promotion codes apply before amount_total is calculated. Validate
  // the undiscounted subtotal against our allowlisted Price, then allow Stripe
  // to reduce the paid total with a legitimate promotion (including 100% off).
  const amountIsValid =
    session.amount_subtotal === plan.amount &&
    session.amount_total !== null &&
    session.amount_total >= 0 &&
    session.amount_total <= session.amount_subtotal
  if (session.currency !== "usd" || !amountIsValid) {
    throw new Error(`Checkout Session ${session.id} has an unexpected amount`)
  }

  const customerEmail = session.customer_details?.email || session.customer_email
  if (!customerEmail) throw new Error(`Checkout Session ${session.id} has no customer email`)

  const stateCode = purchaseType === "state"
    ? session.metadata?.state_code?.toUpperCase() || null
    : null
  const state = stateCode ? getStateByCode(stateCode) : undefined
  if (purchaseType === "state" && (!stateCode || !state)) {
    throw new Error(`Checkout Session ${session.id} has an invalid state code`)
  }
  const checkoutMetadata = compactStripeMetadata(session.metadata)
  if (!paymentIsComplete) {
    // Delayed payment methods create the Customer at Checkout completion, even
    // though fulfillment waits for checkout.session.async_payment_succeeded.
    await syncCheckoutCustomerMetadata(session)
    return
  }
  const { data: purchase, error } = await db()
    .from("purchases")
    .update({
      guest_email: customerEmail,
      purchase_type: purchaseType,
      state_code: stateCode,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: objectId(session.payment_intent),
      stripe_customer_id: objectId(session.customer),
      amount_paid: session.amount_total || 0,
      currency: session.currency,
      metadata: checkoutMetadata,
      status: "completed",
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1_000).toISOString(),
    })
    .eq("id", purchaseId)
    .eq("billing_provider", "stripe")
    .select("download_token, fulfillment_email_sent_at")
    .single()

  if (error || !purchase) {
    throw new Error(`Unable to fulfill purchase ${purchaseId}: ${error?.message || "not found"}`)
  }

  if (!purchase.fulfillment_email_sent_at) {
    const productName = purchaseType === "state" ? state?.name || stateCode || "State" : "Full USA"
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || SITE_URL).replace(/\/$/, "")
    const downloadUrl = `${appUrl}/api/download?token=${purchase.download_token}`

    await sendDownloadEmail({
      to: customerEmail,
      downloadUrl,
      productName,
      purchaseType,
      idempotencyKey: `download:${session.id}`,
    })

    const { error: emailUpdateError } = await db()
      .from("purchases")
      .update({ fulfillment_email_sent_at: new Date().toISOString() })
      .eq("id", purchaseId)
    if (emailUpdateError) throw new Error(`Unable to record fulfillment email: ${emailUpdateError.message}`)
  }

  // Customer enrichment is retried with the webhook, but a transient Stripe
  // update failure cannot prevent the paid purchase from being fulfilled.
  await syncCheckoutCustomerMetadata(session)
}

async function recordCheckoutFailure(session: Stripe.Checkout.Session): Promise<void> {
  if (session.mode === "subscription") {
    const userId = session.metadata?.user_id
    const attemptId = session.metadata?.checkout_attempt_id
    if (userId && attemptId && isValidUUID(userId) && isValidUUID(attemptId)) {
      const { error } = await db()
        .from("stripe_checkout_attempts")
        .delete()
        .eq("user_id", userId)
        .eq("attempt_id", attemptId)
      if (error) throw new Error(`Unable to release failed subscription checkout: ${error.message}`)
    }
    return
  }

  const purchaseId = session.metadata?.purchase_id
  if (!purchaseId || !isValidUUID(purchaseId)) return

  const checkoutMetadata = compactStripeMetadata(session.metadata)

  // Checkout failure is attempt state, not fulfillment state. Keep the order
  // pending while recording Stripe's final Session context for reconciliation.
  const { error } = await db()
    .from("purchases")
    .update({
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: objectId(session.payment_intent),
      stripe_customer_id: objectId(session.customer),
      guest_email: session.customer_details?.email || session.customer_email || null,
      ...(Object.keys(checkoutMetadata).length > 0
        ? { metadata: checkoutMetadata }
        : {}),
    })
    .eq("id", purchaseId)
    .eq("billing_provider", "stripe")
    .eq("status", "pending")
  if (error) throw new Error(`Unable to record failed purchase checkout: ${error.message}`)
}

async function customerEmail(customer: Stripe.Subscription["customer"]): Promise<string | null> {
  const customerId = objectId(customer)
  if (!customerId) return null
  const record = await getStripe().customers.retrieve(customerId)
  return record.deleted ? null : record.email
}

interface SyncedSubscription {
  subscription: Stripe.Subscription
  purchaseType: "subscription" | "subscription_api"
  email: string | null
  periodEnd: string | null
  wasCancelAtPeriodEnd: boolean
}

async function syncSubscription(subscriptionId: string): Promise<SyncedSubscription | null> {
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  })
  const item = subscription.items.data[0]
  const priceId = objectId(item?.price || null)
  const purchaseType = priceId ? purchaseTypeForPrice(priceId) : null
  const userId = subscription.metadata?.user_id

  // Ignore subscriptions that do not belong to this app's allowlisted plans.
  if (
    !item ||
    !priceId ||
    (purchaseType !== "subscription" && purchaseType !== "subscription_api") ||
    !userId ||
    !isValidUUID(userId)
  ) {
    return null
  }

  const { data: existing } = await db()
    .from("subscriptions")
    .select("cancel_at_period_end")
    .eq("user_id", userId)
    .maybeSingle()

  const period = getSubscriptionPeriod(subscription)
  const normalizedStatus = normalizeSubscriptionStatus(subscription.status)
  const stripeCustomerId = objectId(subscription.customer)
  const checkoutMetadata = compactStripeMetadata(subscription.metadata)

  const { error } = await db().from("subscriptions").upsert(
    {
      user_id: userId,
      billing_provider: "stripe",
      stripe_subscription_id: subscription.id,
      stripe_customer_id: stripeCustomerId,
      stripe_price_id: priceId,
      provider_status: subscription.status,
      status: normalizedStatus,
      plan: purchaseType === "subscription_api" ? "pro_api" : "pro_monthly",
      current_period_start: period.start,
      current_period_end: period.end,
      trial_ends_at: toIso(subscription.trial_end),
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancelled_at: toIso(subscription.canceled_at),
      ...(Object.keys(checkoutMetadata).length > 0
        ? { metadata: checkoutMetadata }
        : {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )
  if (error) throw new Error(`Unable to sync subscription ${subscription.id}: ${error.message}`)

  const checkoutAttemptId = subscription.metadata?.checkout_attempt_id
  if (checkoutAttemptId && isValidUUID(checkoutAttemptId)) {
    const { error: attemptError } = await db()
      .from("stripe_checkout_attempts")
      .delete()
      .eq("user_id", userId)
      .eq("attempt_id", checkoutAttemptId)
    if (attemptError) {
      throw new Error(`Unable to release completed subscription checkout: ${attemptError.message}`)
    }
  }

  return {
    subscription,
    purchaseType,
    email: await customerEmail(subscription.customer),
    periodEnd: period.end,
    wasCancelAtPeriodEnd: existing?.cancel_at_period_end === true,
  }
}

async function handleSubscriptionEvent(event: Stripe.Event): Promise<void> {
  const eventSubscription = event.data.object as Stripe.Subscription
  const synced = await syncSubscription(eventSubscription.id)
  if (!synced) return

  const isDeleted = event.type === "customer.subscription.deleted"
  const previous = event.data.previous_attributes as Partial<Stripe.Subscription> | undefined
  const justScheduledCancellation =
    synced.subscription.cancel_at_period_end && previous?.cancel_at_period_end === false

  if (
    synced.email &&
    (justScheduledCancellation || (isDeleted && !synced.wasCancelAtPeriodEnd))
  ) {
    await sendSubscriptionCancelled({
      to: synced.email,
      accessUntil: synced.periodEnd,
      idempotencyKey: `cancel:${synced.subscription.id}:${synced.periodEnd || "now"}`,
    })
  }
}

async function handleInvoice(invoice: Stripe.Invoice, paid: boolean): Promise<void> {
  const subscriptionId = getInvoiceSubscriptionId(invoice)
  if (!subscriptionId) return

  const synced = await syncSubscription(subscriptionId)
  if (!synced) return
  const email = invoice.customer_email || synced.email
  if (!email) return

  if (!paid) {
    await sendPaymentFailed({
      to: email,
      planName: synced.purchaseType === "subscription_api" ? "Pro API" : "Pro Dashboard",
      idempotencyKey: `payment-failed:${invoice.id}:${invoice.attempt_count || 0}`,
    })
    return
  }

  if (invoice.billing_reason === "subscription_create") {
    await sendSubscriptionWelcome({
      to: email,
      planName: synced.purchaseType === "subscription_api" ? "Pro API" : "Pro Dashboard",
      idempotencyKey: `welcome:${subscriptionId}`,
    })
  } else if (invoice.billing_reason === "subscription_cycle") {
    await sendSubscriptionRenewed({
      to: email,
      nextRenewal: synced.periodEnd,
      idempotencyKey: `renewal:${invoice.id}`,
    })
  }
}

async function processEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await fulfillCheckout((event.data.object as Stripe.Checkout.Session).id)
      return

    case "checkout.session.async_payment_failed":
    case "checkout.session.expired":
      await recordCheckoutFailure(event.data.object as Stripe.Checkout.Session)
      return

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId = objectId(charge.payment_intent)
      if (paymentIntentId) {
        const { error } = await db()
          .from("purchases")
          .update({
            amount_refunded: charge.amount_refunded,
            ...(charge.refunded ? { status: "refunded" } : {}),
          })
          .eq("stripe_payment_intent_id", paymentIntentId)
        if (error) throw new Error(`Unable to record refund: ${error.message}`)
      }
      return
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      await handleSubscriptionEvent(event)
      return

    case "invoice.paid":
      await handleInvoice(event.data.object as Stripe.Invoice, true)
      return

    case "invoice.payment_failed":
      await handleInvoice(event.data.object as Stripe.Invoice, false)
      return
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(rawBody, signature)
  } catch (error) {
    console.error("Stripe webhook signature error:", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    if (await eventAlreadyProcessed(event.id)) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    await processEvent(event)
    await recordProcessedEvent(event)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Stripe webhook processing error:", error)
    return NextResponse.json({ error: "Processing error" }, { status: 500 })
  }
}
