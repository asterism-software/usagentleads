import { describe, it, expect, vi, beforeEach } from "vitest"

const VALID_UUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

describe("API Key Management Routes", () => {
  let mockQuery: Record<string, ReturnType<typeof vi.fn>>
  let mockAuthClient: { auth: { getUser: ReturnType<typeof vi.fn> } }
  let mockSubscription: Record<string, unknown>

  beforeEach(async () => {
    vi.resetModules()

    mockQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      is: vi.fn(),
      order: vi.fn(),
      single: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
    }

    for (const key of Object.keys(mockQuery)) {
      if (!["single"].includes(key)) {
        mockQuery[key].mockReturnValue(mockQuery)
      }
    }

    mockAuthClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123", email: "test@test.com" } },
        }),
      },
    }

    mockSubscription = {
      billing_provider: "stripe",
      plan: "pro_api",
      status: "active",
      current_period_end: "2099-01-01T00:00:00Z",
      trial_ends_at: null,
      cancel_at_period_end: false,
    }

    const mockFrom = vi.fn((table: string) => {
      if (table !== "subscriptions") return mockQuery
      const subscriptionQuery = {
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(async () => ({ data: mockSubscription, error: null })),
      }
      subscriptionQuery.select.mockReturnValue(subscriptionQuery)
      subscriptionQuery.eq.mockReturnValue(subscriptionQuery)
      return subscriptionQuery
    })
    const mockSchema = vi.fn(() => ({ from: mockFrom }))

    vi.doMock("@/lib/supabase/server", () => ({
      createServiceClient: vi.fn(() => ({ schema: mockSchema })),
      createClient: vi.fn(() => Promise.resolve(mockAuthClient)),
    }))
  })

  describe("GET /api/api-keys", () => {
    it("returns 401 for unauthenticated users", async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({ data: { user: null } })

      const { GET } = await import("@/app/api/api-keys/route")
      const res = await GET()
      const json = await res.json()
      expect(json.error).toBe("Unauthorized")
    })

    it("returns a locked preview for non-pro_api subscribers", async () => {
      mockSubscription.plan = "pro_monthly"

      const { GET } = await import("@/app/api/api-keys/route")
      const res = await GET()
      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.keys).toEqual([])
      expect(json.access.hasApi).toBe(false)
    })

    it("returns keys list for pro_api subscribers", async () => {
      const mockKeys = [
        { id: "k1", name: "Production", key_prefix: "sk_live_ab", created_at: "2026-01-01" },
      ]

      // Keys list
      mockQuery.order.mockReturnValue(
        Promise.resolve({ data: mockKeys, error: null })
      )

      const { GET } = await import("@/app/api/api-keys/route")
      const res = await GET()
      const json = await res.json()
      expect(json.keys).toBeDefined()
    })
  })

  describe("POST /api/api-keys", () => {
    it("returns 401 for unauthenticated users", async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({ data: { user: null } })

      const { POST } = await import("@/app/api/api-keys/route")
      const res = await POST(
        new Request("https://example.com/api/api-keys", {
          method: "POST",
          body: JSON.stringify({ name: "Test" }),
        })
      )
      const json = await res.json()
      expect(json.error).toBe("Unauthorized")
    })

    it("returns 403 for non-pro_api subscribers", async () => {
      mockSubscription.plan = "pro_monthly"

      const { POST } = await import("@/app/api/api-keys/route")
      const res = await POST(
        new Request("https://example.com/api/api-keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Test" }),
        })
      )
      const json = await res.json()
      expect(json.error).toBe("Pro API subscription required")
    })

    it("limits to 3 active keys", async () => {
      // Count active keys returns 3
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.is.mockReturnValue(
        Promise.resolve({ count: 3 })
      )

      const { POST } = await import("@/app/api/api-keys/route")
      const res = await POST(
        new Request("https://example.com/api/api-keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Test" }),
        })
      )
      const json = await res.json()
      expect(json.error).toContain("Maximum of 3")
    })
  })

  describe("DELETE /api/api-keys/[id]", () => {
    it("returns 401 for unauthenticated users", async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({ data: { user: null } })

      const { DELETE } = await import("@/app/api/api-keys/[id]/route")
      const res = await DELETE(
        new Request(`https://example.com/api/api-keys/${VALID_UUID}`, { method: "DELETE" }),
        { params: Promise.resolve({ id: VALID_UUID }) }
      )
      const json = await res.json()
      expect(json.error).toBe("Unauthorized")
    })

    it("returns 404 when key not found or not owned by user", async () => {
      mockQuery.single.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } })

      const { DELETE } = await import("@/app/api/api-keys/[id]/route")
      const res = await DELETE(
        new Request(`https://example.com/api/api-keys/${VALID_UUID}`, { method: "DELETE" }),
        { params: Promise.resolve({ id: VALID_UUID }) }
      )
      const json = await res.json()
      expect(json.error).toBe("API key not found")
    })

    it("successfully revokes an owned key", async () => {
      mockQuery.single.mockResolvedValueOnce({ data: { id: VALID_UUID }, error: null })

      const { DELETE } = await import("@/app/api/api-keys/[id]/route")
      const res = await DELETE(
        new Request(`https://example.com/api/api-keys/${VALID_UUID}`, { method: "DELETE" }),
        { params: Promise.resolve({ id: VALID_UUID }) }
      )
      const json = await res.json()
      expect(json.message).toBe("API key revoked")
    })
  })

  describe("PATCH /api/api-keys/[id]", () => {
    it("returns 401 for unauthenticated users", async () => {
      mockAuthClient.auth.getUser.mockResolvedValue({ data: { user: null } })

      const { PATCH } = await import("@/app/api/api-keys/[id]/route")
      const res = await PATCH(
        new Request(`https://example.com/api/api-keys/${VALID_UUID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "New Name" }),
        }),
        { params: Promise.resolve({ id: VALID_UUID }) }
      )
      const json = await res.json()
      expect(json.error).toBe("Unauthorized")
    })

    it("returns 400 for invalid name", async () => {
      const { PATCH } = await import("@/app/api/api-keys/[id]/route")
      const res = await PATCH(
        new Request(`https://example.com/api/api-keys/${VALID_UUID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "" }),
        }),
        { params: Promise.resolve({ id: VALID_UUID }) }
      )
      const json = await res.json()
      expect(json.error).toBe("Invalid name")
    })

    it("returns 400 for name longer than 50 chars", async () => {
      const { PATCH } = await import("@/app/api/api-keys/[id]/route")
      const res = await PATCH(
        new Request(`https://example.com/api/api-keys/${VALID_UUID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "x".repeat(51) }),
        }),
        { params: Promise.resolve({ id: VALID_UUID }) }
      )
      const json = await res.json()
      expect(json.error).toBe("Invalid name")
    })

    it("renames an owned key", async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { id: VALID_UUID, name: "Renamed", key_prefix: "sk_live_ab", created_at: "2026-01-01" },
        error: null,
      })

      const { PATCH } = await import("@/app/api/api-keys/[id]/route")
      const res = await PATCH(
        new Request(`https://example.com/api/api-keys/${VALID_UUID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Renamed" }),
        }),
        { params: Promise.resolve({ id: VALID_UUID }) }
      )
      const json = await res.json()
      expect(json.name).toBe("Renamed")
    })
  })
})
