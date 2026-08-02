import { describe, it, expect, vi, beforeEach } from "vitest"
import { getQuotaHeaders, MONTHLY_QUOTA } from "@/lib/utils/apiKeyAuth"

describe("MONTHLY_QUOTA", () => {
  it("is 10,000 requests per month", () => {
    expect(MONTHLY_QUOTA).toBe(10_000)
  })
})

describe("getQuotaHeaders", () => {
  it("returns correct headers", () => {
    const headers = getQuotaHeaders(500)
    expect(headers["X-RateLimit-Limit"]).toBe("60")
    expect(headers["X-Monthly-Quota-Limit"]).toBe("10000")
    expect(headers["X-Monthly-Quota-Remaining"]).toBe("9500")
  })

  it("clamps remaining to 0 when over quota", () => {
    const headers = getQuotaHeaders(10001)
    expect(headers["X-Monthly-Quota-Remaining"]).toBe("0")
  })

  it("shows 0 remaining when exactly at quota", () => {
    const headers = getQuotaHeaders(10000)
    expect(headers["X-Monthly-Quota-Remaining"]).toBe("0")
  })
})

// Integration tests for authenticateApiKey
describe("authenticateApiKey", () => {
  let authenticateApiKey: typeof import("@/lib/utils/apiKeyAuth").authenticateApiKey
  let mockSingleResults: Array<{ data: unknown; error: unknown }>
  let mockCountResult: { count: number }

  beforeEach(async () => {
    vi.resetModules()

    mockSingleResults = []
    mockCountResult = { count: 0 }

    // Build a recursive proxy that chains any method and resolves .single()
    function createChainProxy(): Record<string, unknown> {
      const handler: ProxyHandler<Record<string, unknown>> = {
        get(_target, prop: string) {
          if (prop === "single") {
            return vi.fn(() => Promise.resolve(mockSingleResults.shift() ?? { data: null, error: null }))
          }
          if (prop === "then") {
            // For fire-and-forget calls (update last_used_at)
            return vi.fn((cb: () => void) => cb())
          }
          // For count queries: select("id", { count: "exact", head: true })
          // The chain ends with .lt() resolving with { count }
          if (prop === "lt") {
            return vi.fn(() => Promise.resolve(mockCountResult))
          }
          return vi.fn(() => new Proxy({}, handler))
        },
      }
      return new Proxy({}, handler)
    }

    const mockFrom = vi.fn(() => createChainProxy())
    const mockSchema = vi.fn(() => ({ from: mockFrom }))

    vi.doMock("@/lib/supabase/server", () => ({
      createServiceClient: vi.fn(() => ({
        schema: mockSchema,
      })),
      createClient: vi.fn(),
    }))

    const mod = await import("@/lib/utils/apiKeyAuth")
    authenticateApiKey = mod.authenticateApiKey
  })

  function makeRequest(headers: Record<string, string> = {}): Request {
    return new Request("https://example.com/api/v1/agents", {
      headers: new Headers(headers),
    })
  }

  it("rejects requests without an API key", async () => {
    const result = await authenticateApiKey(makeRequest())
    const json = await (result as Response).json()
    expect(json.error).toBe("Missing or invalid API key")
  })

  it("rejects requests with a key that does not start with sk_live_", async () => {
    const result = await authenticateApiKey(
      makeRequest({ "x-api-key": "invalid_key_here" })
    )
    const json = await (result as Response).json()
    expect(json.error).toBe("Missing or invalid API key")
  })

  it("rejects empty X-API-Key header", async () => {
    const result = await authenticateApiKey(
      makeRequest({ "x-api-key": "" })
    )
    const json = await (result as Response).json()
    expect(json.error).toBe("Missing or invalid API key")
  })

  it("accepts Bearer token format", async () => {
    mockSingleResults = [{ data: null, error: { code: "PGRST116" } }]

    const result = await authenticateApiKey(
      makeRequest({ authorization: "Bearer sk_live_abc123" })
    )
    const json = await (result as Response).json()
    expect(json.error).toBe("Invalid API key")
  })

  it("rejects revoked API key", async () => {
    mockSingleResults = [
      { data: { id: "key-id", user_id: "user-id", revoked_at: "2026-01-01T00:00:00Z", expires_at: null }, error: null },
    ]

    const result = await authenticateApiKey(
      makeRequest({ "x-api-key": "sk_live_revoked_key_1234567890ab" })
    )
    const json = await (result as Response).json()
    expect(json.error).toBe("API key has been revoked")
  })

  it("rejects expired API key", async () => {
    mockSingleResults = [
      { data: { id: "key-id", user_id: "user-id", revoked_at: null, expires_at: "2020-01-01T00:00:00Z" }, error: null },
    ]

    const result = await authenticateApiKey(
      makeRequest({ "x-api-key": "sk_live_expired_key_1234567890" })
    )
    const json = await (result as Response).json()
    expect(json.error).toBe("API key has expired")
  })

  it("rejects key without pro_api subscription", async () => {
    mockSingleResults = [
      { data: { id: "key-id", user_id: "user-id", revoked_at: null, expires_at: null }, error: null },
      { data: { status: "active", plan: "pro_monthly", current_period_end: "2027-01-01T00:00:00Z", cancel_at_period_end: false, trial_ends_at: null }, error: null },
    ]

    const result = await authenticateApiKey(
      makeRequest({ "x-api-key": "sk_live_wrong_plan_1234567890" })
    )
    const json = await (result as Response).json()
    expect(json.error).toBe("Pro API subscription required")
  })

  it("rejects key with expired subscription", async () => {
    mockSingleResults = [
      { data: { id: "key-id", user_id: "user-id", revoked_at: null, expires_at: null }, error: null },
      { data: { status: "active", plan: "pro_api", current_period_end: "2020-01-01T00:00:00Z", cancel_at_period_end: false, trial_ends_at: null }, error: null },
    ]

    const result = await authenticateApiKey(
      makeRequest({ "x-api-key": "sk_live_expired_sub_1234567890" })
    )
    const json = await (result as Response).json()
    expect(json.error).toBe("Subscription is not active")
  })

  it("returns the authenticated identity before the route reserves quota", async () => {
    mockSingleResults = [
      { data: { id: "key-id", user_id: "user-id", revoked_at: null, expires_at: null }, error: null },
      { data: { status: "active", plan: "pro_api", current_period_end: "2027-01-01T00:00:00Z", cancel_at_period_end: false, trial_ends_at: null }, error: null },
    ]
    mockCountResult = { count: 10_000 }

    const result = await authenticateApiKey(
      makeRequest({ "x-api-key": "sk_live_over_quota_123456789012" })
    )
    expect(result).toHaveProperty("userId", "user-id")
    expect(result).toHaveProperty("apiKeyId", "key-id")
  })

  it("returns userId and apiKeyId for valid active subscription", async () => {
    mockSingleResults = [
      { data: { id: "key-id", user_id: "user-id", revoked_at: null, expires_at: null }, error: null },
      { data: { status: "active", plan: "pro_api", current_period_end: "2027-01-01T00:00:00Z", cancel_at_period_end: false, trial_ends_at: null }, error: null },
    ]
    mockCountResult = { count: 500 }

    const result = await authenticateApiKey(
      makeRequest({ "x-api-key": "sk_live_paid_user_12345678901" })
    )

    expect(result).toHaveProperty("userId", "user-id")
    expect(result).toHaveProperty("apiKeyId", "key-id")
  })
})
