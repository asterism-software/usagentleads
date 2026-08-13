import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  rateLimit: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  insert: vi.fn(),
  storageFrom: vi.fn(),
  createSignedUrl: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: mocks.createServiceClient,
}))
vi.mock("@/lib/utils/rateLimit", () => ({
  rateLimit: mocks.rateLimit,
}))

import { GET } from "@/app/api/download/route"

const TOKEN = "123e4567-e89b-42d3-a456-426614174000"

function purchase(overrides: Record<string, unknown> = {}) {
  return {
    id: "purchase-id",
    user_id: null,
    guest_email: "buyer@example.com",
    purchase_type: "full_database",
    state_code: null,
    expires_at: "2099-01-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("GET /api/download", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.rateLimit.mockResolvedValue({ success: true })

    const purchaseQuery = {
      select: mocks.select,
      update: mocks.update,
      eq: mocks.eq,
      single: mocks.single,
    }
    mocks.select.mockReturnValue(purchaseQuery)
    mocks.update.mockReturnValue(purchaseQuery)
    mocks.eq.mockReturnValue(purchaseQuery)
    mocks.insert.mockResolvedValue({ error: null })
    mocks.from.mockImplementation((table: string) =>
      table === "purchases" ? purchaseQuery : { insert: mocks.insert }
    )
    mocks.storageFrom.mockReturnValue({ createSignedUrl: mocks.createSignedUrl })
    mocks.createServiceClient.mockReturnValue({
      schema: vi.fn(() => ({ from: mocks.from })),
      storage: { from: mocks.storageFrom },
    })
    mocks.single
      .mockResolvedValueOnce({ data: purchase(), error: null })
      .mockResolvedValueOnce({ data: { id: "purchase-id" }, error: null })
  })

  it("serves the Excel-safe ZIP and claims the token afterward", async () => {
    mocks.createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://storage.example/full.zip" },
      error: null,
    })

    const response = await GET(new Request(
      `https://www.usagentleads.com/api/download?token=${TOKEN}`
    ))

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe("https://storage.example/full.zip")
    expect(mocks.createSignedUrl).toHaveBeenCalledWith(
      "full/usa_agents_full.zip",
      300,
      { download: "usa_agents_full.zip" }
    )
    expect(mocks.update).toHaveBeenCalledWith({ token_used: true })
  })

  it("falls back to the legacy archive during rollout", async () => {
    mocks.createSignedUrl
      .mockResolvedValueOnce({ data: null, error: new Error("Object not found") })
      .mockResolvedValueOnce({
        data: { signedUrl: "https://storage.example/full.csv.gz" },
        error: null,
      })

    const response = await GET(new Request(
      `https://www.usagentleads.com/api/download?token=${TOKEN}`
    ))

    expect(response.status).toBe(307)
    expect(mocks.createSignedUrl.mock.calls.map(([path]) => path)).toEqual([
      "full/usa_agents_full.zip",
      "full/usa_agents_full.csv.gz",
    ])
  })

  it("does not consume the token when Storage cannot create a URL", async () => {
    mocks.createSignedUrl.mockResolvedValue({
      data: null,
      error: new Error("Storage unavailable"),
    })

    const response = await GET(new Request(
      `https://www.usagentleads.com/api/download?token=${TOKEN}`
    ))

    expect(response.status).toBe(500)
    expect(mocks.update).not.toHaveBeenCalled()
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it("continues to serve a single state CSV", async () => {
    mocks.single.mockReset()
    mocks.single
      .mockResolvedValueOnce({
        data: purchase({ purchase_type: "state", state_code: "TX" }),
        error: null,
      })
      .mockResolvedValueOnce({ data: { id: "purchase-id" }, error: null })
    mocks.createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://storage.example/TX.csv" },
      error: null,
    })

    const response = await GET(new Request(
      `https://www.usagentleads.com/api/download?token=${TOKEN}`
    ))

    expect(response.status).toBe(307)
    expect(mocks.createSignedUrl).toHaveBeenCalledWith(
      "states/TX.csv",
      300,
      { download: "TX.csv" }
    )
  })
})
