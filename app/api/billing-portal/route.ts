import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe/client"
import { SITE_URL } from "@/lib/utils/site"
import { rateLimit } from "@/lib/utils/rateLimit"

const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL || SITE_URL).replace(/\/$/, "")

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const next = encodeURIComponent("/api/billing-portal")
    return NextResponse.redirect(`${appUrl()}/login?next=${next}`)
  }

  const { success } = await rateLimit(`billing-portal:${user.id}`, 10)
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const { data: subscription } = await createServiceClient()
    .schema("usagentleads")
    .from("subscriptions")
    .select("billing_provider, stripe_customer_id")
    .eq("user_id", user.id)
    .single()

  if (!subscription) return NextResponse.redirect(`${appUrl()}/pricing`)
  if (subscription.billing_provider !== "stripe" || !subscription.stripe_customer_id) {
    return NextResponse.redirect(`${appUrl()}/contact?subject=Billing%20migration`)
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${appUrl()}/dashboard/billing`,
    })
    return NextResponse.redirect(session.url)
  } catch (error) {
    console.error("Stripe billing portal error:", error)
    return NextResponse.json({ error: "Unable to open billing portal" }, { status: 500 })
  }
}
