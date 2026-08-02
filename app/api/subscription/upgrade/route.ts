import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe/client"
import { STRIPE_PLANS } from "@/lib/billing/plans"
import { getSubscriptionAccess } from "@/lib/subscriptions"
import { rateLimit } from "@/lib/utils/rateLimit"
import { isSameOriginRequest } from "@/lib/utils/security"
import { SITE_URL } from "@/lib/utils/site"

const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL || SITE_URL).replace(/\/$/, "")

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { success } = await rateLimit(`subscription-upgrade:${user.id}`, 5)
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

  const { data: subscription } = await createServiceClient()
    .schema("usagentleads")
    .from("subscriptions")
    .select("billing_provider, status, plan, stripe_subscription_id, stripe_customer_id, current_period_end, trial_ends_at, cancel_at_period_end")
    .eq("user_id", user.id)
    .maybeSingle()

  const access = getSubscriptionAccess(subscription)
  if (!access.hasDashboard) {
    return NextResponse.json({ error: "Active dashboard subscription required" }, { status: 403 })
  }
  if (access.hasApi) {
    return NextResponse.json({ error: "Pro API is already active" }, { status: 409 })
  }
  if (subscription?.cancel_at_period_end) {
    return NextResponse.json({ error: "Resume your subscription in Billing before upgrading" }, { status: 409 })
  }
  if (subscription?.billing_provider !== "stripe" || !subscription.stripe_subscription_id || !subscription.stripe_customer_id) {
    return NextResponse.json({ error: "Please contact support to migrate billing before upgrading", support: true }, { status: 409 })
  }

  try {
    const stripe = getStripe()
    const remote = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
    const item = remote.items.data[0]
    if (!item) return NextResponse.json({ error: "Subscription item not found" }, { status: 409 })

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${appUrl()}/dashboard/billing`,
      flow_data: {
        type: "subscription_update_confirm",
        subscription_update_confirm: {
          subscription: subscription.stripe_subscription_id,
          items: [{ id: item.id, price: STRIPE_PLANS.subscription_api.priceId, quantity: 1 }],
        },
        after_completion: {
          type: "redirect",
          redirect: { return_url: `${appUrl()}/dashboard/api-keys?upgraded=1` },
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Stripe Pro API upgrade flow error:", error)
    return NextResponse.json({ error: "Unable to start upgrade" }, { status: 500 })
  }
}
