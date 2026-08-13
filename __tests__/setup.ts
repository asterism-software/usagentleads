import { vi } from "vitest"

// Mock Upstash Redis + Ratelimit (used by rateLimit utility)
vi.mock("@upstash/redis", () => ({
  Redis: class MockRedis {
    constructor() {}
  },
}))

vi.mock("@upstash/ratelimit", () => {
  class MockRatelimit {
    async limit() {
      return { success: true, remaining: 99 }
    }
    static slidingWindow(maxRequests: number) {
      return { maxRequests }
    }
  }
  return { Ratelimit: MockRatelimit }
})

// Mock next/server
vi.mock("next/server", () => {
  class MockNextResponse {
    body: string
    status: number
    headers: Map<string, string>

    constructor(body: string | null, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body || ""
      this.status = init?.status || 200
      this.headers = new Map(Object.entries(init?.headers || {}))
    }

    async json() {
      return JSON.parse(this.body)
    }

    static json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      return new MockNextResponse(JSON.stringify(data), init)
    }

    static redirect(url: string | URL, status = 307) {
      return new MockNextResponse(null, {
        status,
        headers: { location: url.toString() },
      })
    }
  }

  return { NextResponse: MockNextResponse }
})

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((cb: (v: unknown) => void) => cb({ data: null, error: null })),
  }

  const mockSchema = {
    from: vi.fn(() => mockQuery),
  }

  const mockServiceClient = {
    schema: vi.fn(() => mockSchema),
  }

  const mockAuthClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
    schema: vi.fn(() => mockSchema),
  }

  return {
    createServiceClient: vi.fn(() => mockServiceClient),
    createClient: vi.fn(() => Promise.resolve(mockAuthClient)),
    __mockQuery: mockQuery,
    __mockSchema: mockSchema,
    __mockServiceClient: mockServiceClient,
    __mockAuthClient: mockAuthClient,
  }
})
