import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe/client"
import { rateLimit } from "@/lib/utils/rateLimit"
import { isSameOriginRequest } from "@/lib/utils/security"
import { captureServerEvent } from "@/lib/posthog-server"

const db = () => createServiceClient().schema("usagentleads")

async function authenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

function normalizedStatus(status: string) {
  if (status === "active") return "active"
  if (status === "trialing") return "on_trial"
  if (status === "canceled") return "cancelled"
  if (status === "incomplete_expired") return "expired"
  return "paused"
}

// GET — return the current user's normalized subscription.
export async function GET() {
  const user = await authenticatedUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { success } = await rateLimit(`sub-get:${user.id}`, 30)
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const { data: subscription } = await db()
    .from("subscriptions")
    .select(
      "billing_provider, status, plan, current_period_start, current_period_end, trial_ends_at, cancel_at_period_end, cancelled_at, created_at"
    )
    .eq("user_id", user.id)
    .single()

  return NextResponse.json({ subscription })
}

// DELETE — schedule cancellation at the end of the current billing period.
export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
  }
  const user = await authenticatedUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { success } = await rateLimit(`sub-cancel:${user.id}`, 5)
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const { data: subscription } = await db()
    .from("subscriptions")
    .select("billing_provider, stripe_subscription_id, status, cancel_at_period_end, updated_at")
    .eq("user_id", user.id)
    .single()

  if (!subscription) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 })
  }
  if (subscription.billing_provider !== "stripe" || !subscription.stripe_subscription_id) {
    return NextResponse.json(
      { error: "This subscription requires a billing migration. Please contact support." },
      { status: 409 }
    )
  }
  if (subscription.cancel_at_period_end) {
    return NextResponse.json({ error: "Already scheduled for cancellation" }, { status: 400 })
  }
  if (!["active", "on_trial"].includes(subscription.status)) {
    return NextResponse.json({ error: "Subscription is not active" }, { status: 400 })
  }

  let updated
  try {
    updated = await getStripe().subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: true },
      { idempotencyKey: `cancel:${subscription.stripe_subscription_id}:${subscription.updated_at}` }
    )
  } catch (error) {
    console.error("Stripe subscription cancellation error:", error)
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 })
  }

  captureServerEvent({
    distinctId: user.id,
    event: "subscription_cancel_requested",
    properties: {
      $insert_id: `stripe:subscription.cancel-requested:${subscription.stripe_subscription_id}:${subscription.updated_at}`,
      billing_provider: "stripe",
      subscription_id: subscription.stripe_subscription_id,
      previous_status: subscription.status,
    },
  })

  const { error: updateError } = await db()
    .from("subscriptions")
    .update({
      provider_status: updated.status,
      status: normalizedStatus(updated.status),
      cancel_at_period_end: updated.cancel_at_period_end,
      cancelled_at: updated.canceled_at
        ? new Date(updated.canceled_at * 1_000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)

  if (updateError) {
    console.error("Local subscription cancellation sync error:", updateError)
    return NextResponse.json(
      { message: "Cancellation was accepted by Stripe and is still syncing.", syncing: true },
      { status: 202 }
    )
  }

  return NextResponse.json({ message: "Subscription will cancel at end of billing period" })
}

// PATCH — stop a scheduled cancellation before the billing period ends.
export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
  }
  const user = await authenticatedUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { success } = await rateLimit(`sub-resume:${user.id}`, 5)
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const { data: subscription } = await db()
    .from("subscriptions")
    .select("billing_provider, stripe_subscription_id, cancel_at_period_end, updated_at")
    .eq("user_id", user.id)
    .single()

  if (!subscription) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 })
  }
  if (subscription.billing_provider !== "stripe" || !subscription.stripe_subscription_id) {
    return NextResponse.json(
      { error: "This subscription requires a billing migration. Please contact support." },
      { status: 409 }
    )
  }
  if (!subscription.cancel_at_period_end) {
    return NextResponse.json(
      { error: "Subscription is not scheduled for cancellation" },
      { status: 400 }
    )
  }

  let updated
  try {
    updated = await getStripe().subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: false },
      { idempotencyKey: `resume:${subscription.stripe_subscription_id}:${subscription.updated_at}` }
    )
  } catch (error) {
    console.error("Stripe subscription resume error:", error)
    return NextResponse.json({ error: "Failed to resume subscription" }, { status: 500 })
  }

  const { error: updateError } = await db()
    .from("subscriptions")
    .update({
      status: normalizedStatus(updated.status),
      provider_status: updated.status,
      cancel_at_period_end: false,
      cancelled_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)

  if (updateError) {
    console.error("Local subscription resume sync error:", updateError)
    return NextResponse.json(
      { message: "Resume was accepted by Stripe and is still syncing.", syncing: true },
      { status: 202 }
    )
  }

  return NextResponse.json({ message: "Subscription resumed successfully" })
}
