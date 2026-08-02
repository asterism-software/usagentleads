import { describe, it, expect, vi, beforeEach } from "vitest"

describe("GET /api/api-keys/usage", () => {
  let GET: typeof import("@/app/api/api-keys/usage/route").GET
  let mockAuthClient: { auth: { getUser: ReturnType<typeof vi.fn> } }
  let mockQuery: Record<string, ReturnType<typeof vi.fn>>

  beforeEach(async () => {
    vi.resetModules()

    mockQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      gte: vi.fn(),
      lt: vi.fn(),
      order: vi.fn(),
      single: vi.fn(),
    }

    for (const key of Object.keys(mockQuery)) {
      if (!["single"].includes(key)) {
        mockQuery[key].mockReturnValue(mockQuery)
      }
    }

    mockAuthClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
        }),
      },
    }

    const mockFrom = vi.fn(() => mockQuery)
    const mockSchema = vi.fn(() => ({ from: mockFrom }))

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn(() => Promise.resolve(mockAuthClient)),
      createServiceClient: vi.fn(() => ({ schema: mockSchema })),
    }))

    const mod = await import("@/app/api/api-keys/usage/route")
    GET = mod.GET
  })

  it("returns 401 for unauthenticated users", async () => {
    mockAuthClient.auth.getUser.mockResolvedValue({ data: { user: null } })

    const res = await GET()
    const json = await res.json()
    expect(json.error).toBe("Unauthorized")
  })

  it("returns the monthly quota and usage", async () => {
    // Monthly usage count
    mockQuery.lt.mockResolvedValueOnce({ count: 45 })

    // Daily logs
    mockQuery.order.mockResolvedValueOnce({
      data: [
        { created_at: "2026-03-20T10:00:00Z" },
        { created_at: "2026-03-20T11:00:00Z" },
        { created_at: "2026-03-21T09:00:00Z" },
      ],
    })

    const res = await GET()
    const json = await res.json()

    expect(json.monthly_limit).toBe(10000)
    expect(json.monthly_used).toBe(45)
    expect(json.on_trial).toBeUndefined()
  })

  it("reports the full quota regardless of usage level", async () => {
    // Monthly usage count
    mockQuery.lt.mockResolvedValueOnce({ count: 5000 })

    // Daily logs
    mockQuery.order.mockResolvedValueOnce({ data: [] })

    const res = await GET()
    const json = await res.json()

    expect(json.monthly_limit).toBe(10000)
    expect(json.monthly_used).toBe(5000)
  })

  it("returns daily counts aggregated by date", async () => {
    mockQuery.single.mockResolvedValueOnce({
      data: { status: "active", trial_ends_at: null },
      error: null,
    })

    mockQuery.lt.mockResolvedValueOnce({ count: 3 })

    mockQuery.order.mockResolvedValueOnce({
      data: [
        { created_at: "2026-03-20T10:00:00Z" },
        { created_at: "2026-03-20T15:00:00Z" },
        { created_at: "2026-03-21T09:00:00Z" },
      ],
    })

    const res = await GET()
    const json = await res.json()

    expect(json.daily_counts).toEqual([
      { date: "2026-03-20", count: 2 },
      { date: "2026-03-21", count: 1 },
    ])
  })

  it("includes resets_at timestamp for start of next month", async () => {
    mockQuery.single.mockResolvedValueOnce({
      data: { status: "active", trial_ends_at: null },
      error: null,
    })
    mockQuery.lt.mockResolvedValueOnce({ count: 0 })
    mockQuery.order.mockResolvedValueOnce({ data: [] })

    const res = await GET()
    const json = await res.json()

    expect(json.resets_at).toBeDefined()
    const resetDate = new Date(json.resets_at)
    expect(resetDate.getDate()).toBe(1) // 1st of the month
  })
})
