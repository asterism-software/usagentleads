import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { getUserAvatarUrl } from "@/lib/auth-user"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getSubscriptionAccess, type SubscriptionRecord } from "@/lib/subscriptions"

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/pricing")

  const service = createServiceClient().schema("usagentleads")
  const [{ data: subscription }, { data: counts }, { data: preferences }] = await Promise.all([
    service.from("subscriptions").select("billing_provider, status, plan, stripe_subscription_id, stripe_customer_id, current_period_start, current_period_end, trial_ends_at, cancel_at_period_end, cancelled_at, created_at").eq("user_id", user.id).maybeSingle(),
    service.from("state_count").select("count"),
    service.from("user_preferences").select("default_state, default_page_size").eq("user_id", user.id).maybeSingle(),
  ])

  const access = getSubscriptionAccess(subscription)
  if (!access.hasDashboard) redirect("/pricing?upgrade=true")

  const metadata = user.user_metadata || {}
  const identity = user.identities?.[0]
  const totalCount = (counts || []).reduce((sum, row) => sum + Number(row.count || 0), 0)
  const defaultPageSize = preferences?.default_page_size

  return (
    <DashboardShell
      user={{
        id: user.id,
        email: user.email || "",
        name: typeof metadata.full_name === "string" ? metadata.full_name : "",
        avatarUrl: getUserAvatarUrl(metadata),
        createdAt: user.created_at,
        provider: identity?.provider || "email",
        emailVerified: Boolean(user.email_confirmed_at),
      }}
      subscription={subscription as SubscriptionRecord}
      access={access}
      preferences={{
        defaultState: preferences?.default_state || null,
        defaultPageSize: ([25, 50, 100].includes(defaultPageSize) ? defaultPageSize : 25) as 25 | 50 | 100,
      }}
      totalCount={totalCount}
    >
      {children}
    </DashboardShell>
  )
}
