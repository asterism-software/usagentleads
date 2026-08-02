import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/utils/rateLimit"
import { queryAgents } from "@/lib/queries/agents"
import { getSubscriptionAccess } from "@/lib/subscriptions"

export async function GET(request: Request) {
  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Rate limit per user
  const { success } = await rateLimit(`agents:${user.id}`, 30)
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  // Check active subscription
  const serviceClient = createServiceClient()
  const { data: subscription } = await serviceClient
    .schema("usagentleads")
    .from("subscriptions")
    .select("status, current_period_end, cancel_at_period_end, trial_ends_at")
    .eq("user_id", user.id)
    .single()

  if (!getSubscriptionAccess(subscription).hasDashboard) {
    return NextResponse.json(
      { error: "Active subscription required" },
      { status: 403 }
    )
  }

  // Parse params and query
  const { searchParams } = new URL(request.url)

  try {
    const result = await queryAgents({
      state: searchParams.get("state") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || "1",
      pageSize: searchParams.get("pageSize") || "25",
    })
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Query failed" }, { status: 500 })
  }
}
