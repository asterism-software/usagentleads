import { NextResponse } from "next/server"
import { authenticateApiKey, finalizeApiUsage, getQuotaHeaders, MONTHLY_QUOTA, reserveApiUsage } from "@/lib/utils/apiKeyAuth"
import { rateLimit } from "@/lib/utils/rateLimit"
import { queryAgents } from "@/lib/queries/agents"

// GET /api/v1/agents — public API endpoint, authenticated via API key
export async function GET(request: Request) {
  const startTime = Date.now()

  // Authenticate via API key
  const authResult = await authenticateApiKey(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { apiKeyId } = authResult

  // Per-minute rate limit
  const { success, remaining } = await rateLimit(`api-v1:${apiKeyId}`, 60)
  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 60 requests per minute." },
      { status: 429, headers: { "X-RateLimit-Limit": "60", "X-RateLimit-Remaining": "0" } }
    )
  }

  const reservation = await reserveApiUsage(authResult, request, "/api/v1/agents")
  if (reservation instanceof NextResponse) return reservation

  // Parse query params
  const { searchParams } = new URL(request.url)
  const state = searchParams.get("state") || undefined
  const search = searchParams.get("search") || undefined
  const page = searchParams.get("page") || "1"
  const pageSize = searchParams.get("pageSize") || "25"

  let result
  let statusCode = 200
  try {
    result = await queryAgents({ state, search, page, pageSize })
  } catch {
    statusCode = 500
    await finalizeApiUsage(reservation.logId, statusCode, Date.now() - startTime)
    return NextResponse.json({ error: "Query failed" }, { status: 500 })
  }

  // Get current monthly usage for quota headers
  const now = new Date()
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  const used = reservation.used
  const quotaHeaders = getQuotaHeaders(used)

  await finalizeApiUsage(reservation.logId, statusCode, Date.now() - startTime)

  return NextResponse.json(
    {
      data: result.data,
      count: result.count,
      page: result.page,
      totalPages: result.totalPages,
      quota: {
        used,
        limit: MONTHLY_QUOTA,
        resets_at: nextMonth.toISOString(),
      },
    },
    {
      headers: {
        ...quotaHeaders,
        "X-RateLimit-Remaining": String(remaining ?? 0),
      },
    }
  )
}
