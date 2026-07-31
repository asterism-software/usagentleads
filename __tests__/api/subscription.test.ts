import { beforeEach, describe, expect, it, vi } from "vitest"

const USER_ID = "11111111-1111-4111-8111-111111111111"

interface AwaitableQuery {
  eq: ReturnType<typeof vi.fn>
  then: ReturnType<typeof vi.fn>
}

function awaitableResult(result: unknown): AwaitableQuery {
  const query = {} as AwaitableQuery
  query.eq = vi.fn(() => query)
  query.then = vi.fn((resolve, reject) => Promise.resolve(result).then(resolve, reject))
  return query
}

describe("/api/subscription local Stripe sync", () => {
  let DELETE: typeof import("@/app/api/subscription/route").DELETE
  let PATCH: typeof import("@/app/api/subscription/route").PATCH
  let selectedSubscription: Record<string, unknown>
  let localUpdateError: Record<string, unknown> | null
  let mockStripeUpdate: ReturnType<typeof vi.fn>
  let mockDbUpdate: ReturnType<typeof vi.fn>
  let updateQueries: AwaitableQuery[]
  let mockRateLimit: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.resetModules()
    vi.restoreAllMocks()

    selectedSubscription = {
      billing_provider: "stripe",
      stripe_subscription_id: "sub_test",
      status: "active",
      cancel_at_period_end: false,
      updated_at: "2026-07-31T12:00:00.000Z",
    }
    localUpdateError = null
    mockStripeUpdate = vi.fn()
    updateQueries = []
    mockRateLimit = vi.fn().mockResolvedValue({ success: true, remaining: 4 })
    mockDbUpdate = vi.fn(() => {
      const query = awaitableResult({ data: null, error: localUpdateError })
      updateQueries.push(query)
      return query
    })

    const selectionQuery = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(async () => ({ data: selectedSubscription, error: null })),
    }
    const mockFrom = vi.fn((table: string) => {
      if (table !== "subscriptions") throw new Error(`Unexpected table: ${table}`)
      return {
        select: vi.fn(() => selectionQuery),
        update: mockDbUpdate,
      }
    })

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn(async () => ({
        auth: {
          getUser: vi.fn(async () => ({ data: { user: { id: USER_ID } } })),
        },
      })),
      createServiceClient: vi.fn(() => ({
        schema: vi.fn(() => ({ from: mockFrom })),
      })),
    }))
    vi.doMock("@/lib/stripe/client", () => ({
      getStripe: vi.fn(() => ({ subscriptions: { update: mockStripeUpdate } })),
    }))
    vi.doMock("@/lib/utils/rateLimit", () => ({ rateLimit: mockRateLimit }))

    const route = await import("@/app/api/subscription/route")
    DELETE = route.DELETE
    PATCH = route.PATCH
  })

  it("returns syncing when Stripe accepts cancellation but the local update fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    localUpdateError = { message: "database unavailable" }
    mockStripeUpdate.mockResolvedValueOnce({
      status: "active",
      cancel_at_period_end: true,
      canceled_at: null,
    })

    const response = await DELETE()

    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toEqual({
      message: "Cancellation was accepted by Stripe and is still syncing.",
      syncing: true,
    })
    expect(mockRateLimit).toHaveBeenCalledWith(`sub-cancel:${USER_ID}`, 5)
    expect(mockStripeUpdate).toHaveBeenCalledWith(
      "sub_test",
      { cancel_at_period_end: true },
      { idempotencyKey: "cancel:sub_test:2026-07-31T12:00:00.000Z" }
    )
    expect(mockDbUpdate).toHaveBeenCalledWith({
      provider_status: "active",
      status: "active",
      cancel_at_period_end: true,
      cancelled_at: null,
      updated_at: expect.any(String),
    })
    expect(updateQueries[0].eq).toHaveBeenCalledWith("user_id", USER_ID)
  })

  it("returns syncing when Stripe accepts resume but the local update fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    selectedSubscription = {
      ...selectedSubscription,
      cancel_at_period_end: true,
    }
    localUpdateError = { message: "database unavailable" }
    mockStripeUpdate.mockResolvedValueOnce({
      status: "trialing",
      cancel_at_period_end: false,
      canceled_at: null,
    })

    const response = await PATCH()

    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toEqual({
      message: "Resume was accepted by Stripe and is still syncing.",
      syncing: true,
    })
    expect(mockRateLimit).toHaveBeenCalledWith(`sub-resume:${USER_ID}`, 5)
    expect(mockStripeUpdate).toHaveBeenCalledWith(
      "sub_test",
      { cancel_at_period_end: false },
      { idempotencyKey: "resume:sub_test:2026-07-31T12:00:00.000Z" }
    )
    expect(mockDbUpdate).toHaveBeenCalledWith({
      status: "on_trial",
      provider_status: "trialing",
      cancel_at_period_end: false,
      cancelled_at: null,
      updated_at: expect.any(String),
    })
    expect(updateQueries[0].eq).toHaveBeenCalledWith("user_id", USER_ID)
  })
})
