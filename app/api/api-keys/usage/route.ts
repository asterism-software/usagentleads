import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/utils/rateLimit"
import { MONTHLY_QUOTA } from "@/lib/utils/apiKeyAuth"

const db = () => createServiceClient().schema("usagentleads")

interface ActivityLog {
  id: string
  api_key_id: string
  endpoint: string
  status_code: number
  response_time_ms: number | null
  created_at: string
}

interface ApiKeySummary {
  id: string
  name: string
  key_prefix: string
}

// GET — monthly usage stats for current user
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { success } = await rateLimit(`api-keys-usage:${user.id}`, 10)
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  const activityStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Total monthly count
  const { count: monthlyUsed } = await db()
    .from("api_usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", monthStart.toISOString())
    .lt("status_code", 400)

  // Daily breakdown for current month
  const { data: logs } = await db()
    .from("api_usage_logs")
    .select("created_at")
    .eq("user_id", user.id)
    .gte("created_at", monthStart.toISOString())
    .lt("status_code", 400)
    .order("created_at", { ascending: true })

  // Aggregate by day
  const dailyCounts: Record<string, number> = {}
  for (const log of logs || []) {
    const day = log.created_at.slice(0, 10)
    dailyCounts[day] = (dailyCounts[day] || 0) + 1
  }

  // Usage logs are intentionally scoped to the signed-in user. Keep the
  // activity sample bounded while the exact monthly quota remains count-based.
  let activityLogs: ActivityLog[] = []
  let apiKeys: ApiKeySummary[] = []
  try {
    const [activityResult, keyResult] = await Promise.all([
      db()
        .from("api_usage_logs")
        .select("id, api_key_id, endpoint, status_code, response_time_ms, created_at")
        .eq("user_id", user.id)
        .gte("created_at", activityStart.toISOString())
        .order("created_at", { ascending: false })
        .limit(5000),
      db()
        .from("api_keys")
        .select("id, name, key_prefix")
        .eq("user_id", user.id),
    ])
    activityLogs = (activityResult.data || []) as ActivityLog[]
    apiKeys = (keyResult.data || []) as ApiKeySummary[]
  } catch {
    // The core quota summary should remain available if activity analytics fail.
  }

  const successfulLogs = activityLogs.filter(
    (log) => log.status_code >= 200 && log.status_code < 400
  )
  const failedLogs = activityLogs.filter((log) => log.status_code >= 400)
  const timedLogs = activityLogs.filter((log) => log.response_time_ms !== null)
  const averageLatency = timedLogs.length
    ? Math.round(
        timedLogs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) /
          timedLogs.length
      )
    : 0

  const endpointCounts = activityLogs.reduce<Record<string, number>>((counts, log) => {
    counts[log.endpoint] = (counts[log.endpoint] || 0) + 1
    return counts
  }, {})
  const topEndpoints = Object.entries(endpointCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([endpoint, count]) => ({ endpoint, count }))
  const keyById = new Map(apiKeys.map((key) => [key.id, key]))

  return NextResponse.json({
    monthly_used: monthlyUsed ?? 0,
    monthly_limit: MONTHLY_QUOTA,
    resets_at: nextMonth.toISOString(),
    daily_counts: Object.entries(dailyCounts).map(([date, count]) => ({
      date,
      count,
    })),
    activity: {
      window_days: 30,
      total_requests: activityLogs.length,
      success_count: successfulLogs.length,
      error_count: failedLogs.length,
      success_rate: activityLogs.length
        ? Math.round((successfulLogs.length / activityLogs.length) * 1000) / 10
        : 100,
      avg_latency_ms: averageLatency,
      top_endpoints: topEndpoints,
      recent: activityLogs.slice(0, 25).map((log) => {
        const key = keyById.get(log.api_key_id)
        return {
          id: log.id,
          method: "GET",
          endpoint: log.endpoint,
          status_code: log.status_code,
          response_time_ms: log.response_time_ms,
          created_at: log.created_at,
          key_name: key?.name || "API key",
          key_prefix: key?.key_prefix || null,
        }
      }),
    },
  })
}
