import { describe, it, expect, vi, beforeEach } from "vitest"

// These tests verify the route handler's behavior by testing the
// authenticateApiKey + queryAgents integration with mocked deps

describe("GET /api/v1/agents", () => {
  let GET: typeof import("@/app/api/v1/agents/route").GET
  let mockSingleResults: Array<{ data: unknown; error: unknown }>
  let mockCountResult: { count: number }

  beforeEach(async () => {
    vi.resetModules()

    mockSingleResults = []
    mockCountResult = { count: 0 }

    function createChainProxy(): Record<string, unknown> {
      const handler: ProxyHandler<Record<string, unknown>> = {
        get(_target, prop: string) {
          if (prop === "single") {
            return vi.fn(() => Promise.resolve(mockSingleResults.shift() ?? { data: null, error: null }))
          }
          if (prop === "then") {
            return vi.fn((resolve: (value: unknown) => void) => resolve({ data: null, error: null }))
          }
          if (prop === "lt") {
            return vi.fn(() => Promise.resolve(mockCountResult))
          }
          return vi.fn(() => new Proxy({}, handler))
        },
      }
      return new Proxy({}, handler)
    }

    const mockFrom = vi.fn(() => createChainProxy())
    const mockRpc = vi.fn(async () => ({
      data: [{ allowed: true, log_id: "log-1", used: mockCountResult.count + 1 }],
      error: null,
    }))
    const mockSchema = vi.fn(() => ({ from: mockFrom, rpc: mockRpc }))

    vi.doMock("@/lib/supabase/server", () => ({
      createServiceClient: vi.fn(() => ({ schema: mockSchema })),
      createClient: vi.fn(),
    }))

    // Mock queryAgents
    vi.doMock("@/lib/queries/agents", () => ({
      queryAgents: vi.fn().mockResolvedValue({
        data: [{ id: "1", name: "Test Agent", email: "test@test.com", phone: "(555) 555-5555", state: "California" }],
        count: 1,
        page: 1,
        totalPages: 1,
      }),
    }))

    const mod = await import("@/app/api/v1/agents/route")
    GET = mod.GET
  })

  function makeRequest(
    headers: Record<string, string> = {},
    params: Record<string, string> = {}
  ): Request {
    const url = new URL("https://example.com/api/v1/agents")
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }
    return new Request(url.toString(), { headers: new Headers(headers) })
  }

  it("returns 401 when no API key is provided", async () => {
    const res = await GET(makeRequest())
    const json = await res.json()
    expect(json.error).toBe("Missing or invalid API key")
  })

  it("returns 401 for an invalid API key prefix", async () => {
    const res = await GET(makeRequest({ "x-api-key": "bad_prefix_12345" }))
    const json = await res.json()
    expect(json.error).toBe("Missing or invalid API key")
  })

  it("returns 401 for a key not found in database", async () => {
    mockSingleResults = [{ data: null, error: { code: "PGRST116" } }]

    const res = await GET(makeRequest({ "x-api-key": "sk_live_unknown_key_1234567890" }))
    const json = await res.json()
    expect(json.error).toBe("Invalid API key")
  })

  it("returns 401 for a revoked key", async () => {
    mockSingleResults = [
      { data: { id: "k1", user_id: "u1", revoked_at: "2026-01-01", expires_at: null }, error: null },
    ]

    const res = await GET(makeRequest({ "x-api-key": "sk_live_revoked_test_12345678" }))
    const json = await res.json()
    expect(json.error).toBe("API key has been revoked")
  })

  it("returns 403 when subscription is not pro_api", async () => {
    mockSingleResults = [
      { data: { id: "k1", user_id: "u1", revoked_at: null, expires_at: null }, error: null },
      { data: { status: "active", plan: "pro_monthly", current_period_end: "2027-01-01", cancel_at_period_end: false, trial_ends_at: null }, error: null },
    ]

    const res = await GET(makeRequest({ "x-api-key": "sk_live_wrong_plan_123456789" }))
    const json = await res.json()
    expect(json.error).toBe("Pro API subscription required")
  })

  it("returns 200 with agent data for valid key and active subscription", async () => {
    mockSingleResults = [
      { data: { id: "k1", user_id: "u1", revoked_at: null, expires_at: null }, error: null },
      { data: { status: "active", plan: "pro_api", current_period_end: "2027-01-01T00:00:00Z", cancel_at_period_end: false, trial_ends_at: null }, error: null },
    ]
    mockCountResult = { count: 50 }

    const res = await GET(
      makeRequest(
        { "x-api-key": "sk_live_valid_key_1234567890ab" },
        { state: "CA", page: "1", pageSize: "25" }
      )
    )
    const json = await res.json()

    expect(json.data).toBeDefined()
    expect(json.data.length).toBeGreaterThan(0)
    expect(json.count).toBeDefined()
    expect(json.page).toBe(1)
    expect(json.totalPages).toBeDefined()
    expect(json.quota).toBeDefined()
    expect(json.quota.limit).toBe(10000)
    expect(json.quota.used).toBeDefined()
  })

  it("does not expose a trial flag in the quota object", async () => {
    mockSingleResults = [
      { data: { id: "k1", user_id: "u1", revoked_at: null, expires_at: null }, error: null },
      { data: { status: "active", plan: "pro_api", current_period_end: "2027-01-01T00:00:00Z", cancel_at_period_end: false, trial_ends_at: null }, error: null },
    ]
    mockCountResult = { count: 10 }

    const res = await GET(makeRequest({ "x-api-key": "sk_live_active_key_1234567890ab" }))
    const json = await res.json()

    expect(json.quota.limit).toBe(10000)
    expect(json.quota.trial).toBeUndefined()
  })
})
