import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { hashApiKey } from "./apiKeys"
import { getSubscriptionAccess } from "@/lib/subscriptions"

const MONTHLY_QUOTA = 10_000

interface AuthResult {
  userId: string
  apiKeyId: string
}

interface UsageReservation {
  logId: string
  used: number
}

export async function authenticateApiKey(
  request: Request
): Promise<AuthResult | NextResponse> {
  // Extract key from headers
  const apiKey =
    request.headers.get("x-api-key") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    null

  if (!apiKey || !apiKey.startsWith("sk_live_")) {
    return NextResponse.json(
      { error: "Missing or invalid API key" },
      { status: 401 }
    )
  }

  const keyHash = hashApiKey(apiKey)
  const serviceClient = createServiceClient()

  // Look up key + subscription in one query
  const { data: keyRecord, error } = await serviceClient
    .schema("usagentleads")
    .from("api_keys")
    .select("id, user_id, revoked_at, expires_at")
    .eq("key_hash", keyHash)
    .single()

  if (error || !keyRecord) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
  }

  // Check key not revoked
  if (keyRecord.revoked_at) {
    return NextResponse.json(
      { error: "API key has been revoked" },
      { status: 401 }
    )
  }

  // Check key not expired
  if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "API key has expired" },
      { status: 401 }
    )
  }

  // Check subscription is active + pro_api plan
  const { data: subscription } = await serviceClient
    .schema("usagentleads")
    .from("subscriptions")
    .select("status, plan, current_period_end, cancel_at_period_end, trial_ends_at")
    .eq("user_id", keyRecord.user_id)
    .single()

  if (!subscription || subscription.plan !== "pro_api") {
    return NextResponse.json(
      { error: "Pro API subscription required" },
      { status: 403 }
    )
  }

  if (!getSubscriptionAccess(subscription).hasApi) {
    return NextResponse.json(
      { error: "Subscription is not active" },
      { status: 403 }
    )
  }

  await serviceClient
    .schema("usagentleads")
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRecord.id)

  return { userId: keyRecord.user_id, apiKeyId: keyRecord.id }
}

export async function reserveApiUsage(
  auth: AuthResult,
  request: Request,
  endpoint: string
): Promise<UsageReservation | NextResponse> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null
  const userAgent = request.headers.get("user-agent") || null
  const { data, error } = await createServiceClient()
    .schema("usagentleads")
    .rpc("reserve_api_usage", {
      p_api_key_id: auth.apiKeyId,
      p_user_id: auth.userId,
      p_endpoint: endpoint,
      p_ip_address: ip,
      p_user_agent: userAgent,
      p_monthly_limit: MONTHLY_QUOTA,
    })

  if (error) {
    console.error("API usage reservation error:", error)
    return NextResponse.json({ error: "Unable to reserve API quota" }, { status: 500 })
  }

  const reservation = Array.isArray(data) ? data[0] : data
  if (!reservation?.allowed) {
    return NextResponse.json(
      { error: "Monthly API quota exceeded", quota: { used: reservation?.used ?? MONTHLY_QUOTA, limit: MONTHLY_QUOTA } },
      { status: 429 }
    )
  }

  return { logId: reservation.log_id, used: reservation.used }
}

export async function finalizeApiUsage(logId: string, statusCode: number, responseTimeMs: number) {
  const { error } = await createServiceClient()
    .schema("usagentleads")
    .from("api_usage_logs")
    .update({ status_code: statusCode, response_time_ms: responseTimeMs })
    .eq("id", logId)
    .eq("status_code", 102)
  if (error) console.error("API usage finalization error:", error)
}

export function getQuotaHeaders(used: number) {
  return {
    "X-RateLimit-Limit": "60",
    "X-Monthly-Quota-Limit": String(MONTHLY_QUOTA),
    "X-Monthly-Quota-Remaining": String(Math.max(0, MONTHLY_QUOTA - used)),
  }
}

export { MONTHLY_QUOTA }
