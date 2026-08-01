import { beforeEach, describe, expect, it, vi } from "vitest"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const USER_ID = "11111111-1111-4111-8111-111111111111"
const CHECKOUT_URL = "https://checkout.stripe.com/c/pay/cs_test_123"
const CHECKOUT_EXPIRES_AT = "2026-08-01T00:31:00.000Z"
const ATTRIBUTION = {
  referrer: "https://www.google.com/search?q=real-estate-agents",
  firstLandingPage: "/pricing",
  timezone: "America/New_York",
}

function compactMetadata(metadata: object | null | undefined): Record<string, string> {
  return Object.fromEntries(
    Object.entries(metadata || {}).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && entry[1].length > 0
    )
  )
}

interface AwaitableQuery {
  eq: ReturnType<typeof vi.fn>
  then: ReturnType<typeof vi.fn>
}

interface SelectQuery {
  eq: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
}

interface AttemptUpdateQuery extends SelectQuery {
  select: ReturnType<typeof vi.fn>
}

function awaitableResult(result: unknown): AwaitableQuery {
  const query = {} as AwaitableQuery
  query.eq = vi.fn(() => query)
  query.then = vi.fn((resolve, reject) => Promise.resolve(result).then(resolve, reject))
  return query
}

function checkoutAttempt(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    user_id: USER_ID,
    purchase_type: "subscription",
    attempt_id: "22222222-2222-4222-8222-222222222222",
    stripe_checkout_session_id: "cs_existing",
    expires_at: new Date(Date.now() + 20 * 60 * 1_000).toISOString(),
    metadata: {},
    ...overrides,
  }
}

describe("POST /api/checkout", () => {
  let POST: typeof import("@/app/api/checkout/route").POST
  let mockCreateCheckout: ReturnType<typeof vi.fn>
  let mockGetCheckoutSessionSummary: ReturnType<typeof vi.fn>
  let mockExpireCheckoutSession: ReturnType<typeof vi.fn>
  let mockGetUser: ReturnType<typeof vi.fn>
  let mockInsertPurchase: ReturnType<typeof vi.fn>
  let mockDeletePurchase: ReturnType<typeof vi.fn>
  let mockDeletePurchaseEq: ReturnType<typeof vi.fn>
  let mockSubscriptionMaybeSingle: ReturnType<typeof vi.fn>
  let mockRateLimit: ReturnType<typeof vi.fn>
  let mockAttemptInsert: ReturnType<typeof vi.fn>
  let mockAttemptSelect: ReturnType<typeof vi.fn>
  let mockAttemptUpdate: ReturnType<typeof vi.fn>
  let mockAttemptDelete: ReturnType<typeof vi.fn>
  let attemptInsertResults: Array<{ error: Record<string, unknown> | null }>
  let attemptSelectResults: Array<{
    data: Record<string, unknown> | null
    error: Record<string, unknown> | null
  }>
  let attemptSelectQueries: SelectQuery[]
  let attemptUpdateQueries: AttemptUpdateQuery[]
  let attemptDeleteQueries: AwaitableQuery[]
  let attemptUpdateError: Record<string, unknown> | null
  let attemptUpdateSavedData: Record<string, unknown> | null
  let attemptUpdateResults: Array<{
    data: Record<string, unknown> | null
    error: Record<string, unknown> | null
  }>
  let attemptDeleteError: Record<string, unknown> | null

  beforeEach(async () => {
    vi.resetModules()
    vi.restoreAllMocks()

    mockCreateCheckout = vi.fn().mockResolvedValue({
      id: "cs_test_123",
      url: CHECKOUT_URL,
      expiresAt: CHECKOUT_EXPIRES_AT,
    })
    mockGetCheckoutSessionSummary = vi.fn()
    mockExpireCheckoutSession = vi.fn().mockResolvedValue(undefined)
    mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: USER_ID, email: "buyer@example.com" } },
    })
    mockInsertPurchase = vi.fn().mockResolvedValue({ error: null })
    mockDeletePurchaseEq = vi.fn().mockResolvedValue({ error: null })
    mockDeletePurchase = vi.fn(() => ({ eq: mockDeletePurchaseEq }))
    mockSubscriptionMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    mockRateLimit = vi.fn().mockResolvedValue({ success: true, remaining: 9 })

    attemptInsertResults = []
    attemptSelectResults = []
    attemptSelectQueries = []
    attemptUpdateQueries = []
    attemptDeleteQueries = []
    attemptUpdateError = null
    attemptUpdateSavedData = { attempt_id: "saved" }
    attemptUpdateResults = []
    attemptDeleteError = null
    mockAttemptInsert = vi.fn(async () =>
      attemptInsertResults.shift() || { error: null }
    )
    mockAttemptSelect = vi.fn(() => {
      const result = attemptSelectResults.shift() || { data: null, error: null }
      const query = {} as SelectQuery
      query.eq = vi.fn(() => query)
      query.maybeSingle = vi.fn().mockResolvedValue(result)
      attemptSelectQueries.push(query)
      return query
    })
    mockAttemptUpdate = vi.fn(() => {
      const result = attemptUpdateResults.shift() || {
        data: attemptUpdateSavedData,
        error: attemptUpdateError,
      }
      const query = {} as AttemptUpdateQuery
      query.eq = vi.fn(() => query)
      query.select = vi.fn(() => query)
      query.maybeSingle = vi.fn().mockResolvedValue(result)
      attemptUpdateQueries.push(query)
      return query
    })
    mockAttemptDelete = vi.fn(() => {
      const query = awaitableResult({ data: null, error: attemptDeleteError })
      attemptDeleteQueries.push(query)
      return query
    })

    const subscriptionQuery: Record<string, ReturnType<typeof vi.fn>> = {}
    subscriptionQuery.select = vi.fn(() => subscriptionQuery)
    subscriptionQuery.eq = vi.fn(() => subscriptionQuery)
    subscriptionQuery.maybeSingle = mockSubscriptionMaybeSingle

    const mockFrom = vi.fn((table: string) => {
      if (table === "purchases") {
        return { insert: mockInsertPurchase, delete: mockDeletePurchase }
      }
      if (table === "subscriptions") return subscriptionQuery
      if (table === "stripe_checkout_attempts") {
        return {
          insert: mockAttemptInsert,
          select: mockAttemptSelect,
          update: mockAttemptUpdate,
          delete: mockAttemptDelete,
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    })

    vi.doMock("@/lib/stripe/client", () => ({
      compactStripeMetadata: compactMetadata,
      createCheckout: mockCreateCheckout,
      getCheckoutSessionSummary: mockGetCheckoutSessionSummary,
      expireCheckoutSession: mockExpireCheckoutSession,
    }))
    vi.doMock("@/lib/utils/rateLimit", () => ({ rateLimit: mockRateLimit }))
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
      createServiceClient: vi.fn(() => ({
        schema: vi.fn(() => ({ from: mockFrom })),
      })),
    }))

    ;({ POST } = await import("@/app/api/checkout/route"))
  })

  function makeRequest(body: unknown, forwardedFor = "1.2.3.4"): Request {
    return new Request("https://example.com/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": forwardedFor,
      },
      body: JSON.stringify(body),
    })
  }

  it("rate-limits before parsing or creating Stripe state", async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false, remaining: 0 })

    const response = await POST(makeRequest({ purchaseType: "full_database" }, "9.8.7.6, 1.2.3.4"))

    expect(response.status).toBe(429)
    await expect(response.json()).resolves.toEqual({ error: "Too many requests" })
    expect(mockRateLimit).toHaveBeenCalledWith("checkout:9.8.7.6", 10)
    expect(mockInsertPurchase).not.toHaveBeenCalled()
    expect(mockAttemptInsert).not.toHaveBeenCalled()
    expect(mockCreateCheckout).not.toHaveBeenCalled()
  })

  it.each([
    [{ purchaseType: "invalid" }, "Invalid request"],
    [{ purchaseType: "state" }, "Invalid state code"],
    [{ purchaseType: "state", stateCode: "XX" }, "Invalid state code"],
  ])("rejects invalid checkout input %#", async (body, expectedError) => {
    const response = await POST(makeRequest(body))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: expectedError })
    expect(mockInsertPurchase).not.toHaveBeenCalled()
    expect(mockAttemptInsert).not.toHaveBeenCalled()
    expect(mockCreateCheckout).not.toHaveBeenCalled()
  })

  it("falls back safely when stored attribution is malformed", async () => {
    const response = await POST(makeRequest({
      purchaseType: "full_database",
      attribution: "corrupt-local-storage-value",
    }))

    expect(response.status).toBe(200)
    expect(mockCreateCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          referrer: "direct",
          first_landing_page: "/",
          timezone: "unknown",
          country: "unknown",
        }),
      })
    )
  })

  it.each(["subscription", "subscription_api"] as const)(
    "requires authentication for %s",
    async (purchaseType) => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } })

      const response = await POST(makeRequest({ purchaseType }))

      expect(response.status).toBe(401)
      await expect(response.json()).resolves.toEqual({
        error: "Authentication required for subscription",
      })
      expect(mockAttemptInsert).not.toHaveBeenCalled()
      expect(mockCreateCheckout).not.toHaveBeenCalled()
    }
  )

  it("creates an isolated pending row and keeps the page token out of Stripe metadata", async () => {
    const response = await POST(makeRequest({
      purchaseType: "full_database",
      attribution: ATTRIBUTION,
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ url: CHECKOUT_URL })
    const pendingRow = mockInsertPurchase.mock.calls[0][0]
    expect(pendingRow).toEqual({
      id: expect.stringMatching(UUID_RE),
      purchase_type: "full_database",
      state_code: null,
      amount_paid: 0,
      status: "pending",
      page_token: expect.stringMatching(UUID_RE),
      billing_provider: "stripe",
      metadata: {
        purchase_type: "full_database",
        checkout_attempt_id: expect.stringMatching(UUID_RE),
        purchase_id: expect.stringMatching(UUID_RE),
        ip: "1.2.3.4",
        timezone: "America/New_York",
        country: "US",
        referrer: "https://www.google.com",
        first_landing_page: "/pricing",
        plan_name: "Full Database",
        plan_price: "199.00",
        plan_price_cents: "19900",
        currency: "usd",
      },
    })
    expect(pendingRow.page_token).not.toBe(pendingRow.id)
    expect(pendingRow.metadata.purchase_id).toBe(pendingRow.id)

    const checkout = mockCreateCheckout.mock.calls[0][0]
    expect(checkout).toEqual({
      purchaseType: "full_database",
      metadata: pendingRow.metadata,
      customerEmail: undefined,
      stripeCustomerId: undefined,
      successPageToken: pendingRow.page_token,
      subscriptionExpiresAt: undefined,
    })
    expect(checkout.metadata).not.toHaveProperty("page_token")
    expect(mockAttemptInsert).not.toHaveBeenCalled()
  })

  it("normalizes a lowercase state code before persistence and Stripe metadata", async () => {
    await POST(makeRequest({ purchaseType: "state", stateCode: "ca" }))

    const pendingRow = mockInsertPurchase.mock.calls[0][0]
    expect(pendingRow.state_code).toBe("CA")
    expect(mockCreateCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        purchaseType: "state",
        metadata: expect.objectContaining({
          purchase_type: "state",
          purchase_id: pendingRow.id,
          state_code: "CA",
        }),
      })
    )
  })

  it("claims one user-scoped attempt and persists the created Stripe Session", async () => {
    mockSubscriptionMaybeSingle.mockResolvedValueOnce({
      data: { billing_provider: "stripe", stripe_customer_id: "cus_existing" },
      error: null,
    })

    const response = await POST(makeRequest({
      purchaseType: "subscription_api",
      attribution: ATTRIBUTION,
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ url: CHECKOUT_URL })
    expect(mockAttemptInsert).toHaveBeenCalledTimes(1)
    const claim = mockAttemptInsert.mock.calls[0][0]
    expect(claim).toEqual({
      user_id: USER_ID,
      purchase_type: "subscription_api",
      attempt_id: expect.stringMatching(UUID_RE),
      expires_at: expect.any(String),
      metadata: {
        purchase_type: "subscription_api",
        checkout_attempt_id: expect.stringMatching(UUID_RE),
        user_id: USER_ID,
        ip: "1.2.3.4",
        timezone: "America/New_York",
        country: "US",
        referrer: "https://www.google.com",
        first_landing_page: "/pricing",
        plan_name: "Pro API",
        plan_price: "79.00",
        plan_price_cents: "7900",
        currency: "usd",
      },
    })
    expect(claim.metadata.checkout_attempt_id).toBe(claim.attempt_id)
    const remainingClaimLifetime = Date.parse(claim.expires_at) - Date.now()
    expect(remainingClaimLifetime).toBeGreaterThan(59 * 60 * 1_000)
    expect(remainingClaimLifetime).toBeLessThanOrEqual(60 * 60 * 1_000)
    expect(mockCreateCheckout).toHaveBeenCalledWith({
      purchaseType: "subscription_api",
      metadata: claim.metadata,
      customerEmail: "buyer@example.com",
      stripeCustomerId: "cus_existing",
      successPageToken: undefined,
      subscriptionExpiresAt: claim.expires_at,
    })
    expect(mockAttemptUpdate).toHaveBeenCalledWith({
      stripe_checkout_session_id: "cs_test_123",
      expires_at: CHECKOUT_EXPIRES_AT,
    })
    expect(attemptUpdateQueries[0].eq).toHaveBeenNthCalledWith(1, "user_id", USER_ID)
    expect(attemptUpdateQueries[0].eq).toHaveBeenNthCalledWith(2, "attempt_id", claim.attempt_id)
    expect(attemptUpdateQueries[0].select).toHaveBeenCalledWith("attempt_id")
  })

  it("reuses the same-plan open Stripe Session after a claim conflict", async () => {
    const existing = checkoutAttempt()
    attemptInsertResults.push({ error: { code: "23505", message: "duplicate key" } })
    attemptSelectResults.push({ data: existing, error: null })
    mockGetCheckoutSessionSummary.mockResolvedValueOnce({
      status: "open",
      url: "https://checkout.stripe.com/c/pay/cs_existing",
      allowPromotionCodes: true,
    })

    const response = await POST(makeRequest({ purchaseType: "subscription" }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      url: "https://checkout.stripe.com/c/pay/cs_existing",
    })
    expect(attemptSelectQueries[0].eq).toHaveBeenCalledWith("user_id", USER_ID)
    expect(mockGetCheckoutSessionSummary).toHaveBeenCalledWith("cs_existing")
    expect(mockCreateCheckout).not.toHaveBeenCalled()
    expect(mockAttemptUpdate).not.toHaveBeenCalled()
    expect(mockAttemptDelete).not.toHaveBeenCalled()
    expect(mockExpireCheckoutSession).not.toHaveBeenCalled()
  })

  it("rotates an older Session that lacks promotion-code entry", async () => {
    const existing = checkoutAttempt()
    attemptInsertResults.push(
      { error: { code: "23505", message: "duplicate key" } },
      { error: null }
    )
    attemptSelectResults.push({ data: existing, error: null })
    mockGetCheckoutSessionSummary.mockResolvedValueOnce({
      status: "open",
      url: "https://checkout.stripe.com/c/pay/cs_existing",
      allowPromotionCodes: false,
    })

    const response = await POST(makeRequest({ purchaseType: "subscription" }))

    expect(response.status).toBe(200)
    expect(mockAttemptInsert).toHaveBeenCalledTimes(2)
    expect(mockExpireCheckoutSession).toHaveBeenCalledWith("cs_existing")
    expect(mockAttemptDelete).toHaveBeenCalledTimes(1)
    expect(attemptDeleteQueries[0].eq).toHaveBeenNthCalledWith(1, "user_id", USER_ID)
    expect(attemptDeleteQueries[0].eq).toHaveBeenNthCalledWith(2, "attempt_id", existing.attempt_id)
    expect(mockCreateCheckout).toHaveBeenCalledTimes(1)
    expect(mockExpireCheckoutSession.mock.invocationCallOrder[0]).toBeLessThan(
      mockCreateCheckout.mock.invocationCallOrder[0]
    )
  })

  it("blocks a concurrent different-plan request while the first claim is in progress", async () => {
    attemptInsertResults.push({ error: { code: "23505", message: "duplicate key" } })
    attemptSelectResults.push({
      data: checkoutAttempt({ stripe_checkout_session_id: null }),
      error: null,
    })

    const response = await POST(makeRequest({ purchaseType: "subscription_api" }))

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error: "Your subscription checkout is being prepared. Please retry in a moment.",
    })
    expect(mockCreateCheckout).not.toHaveBeenCalled()
    expect(mockGetCheckoutSessionSummary).not.toHaveBeenCalled()
    expect(mockAttemptDelete).not.toHaveBeenCalled()
  })

  it("rotates an expired claim before creating a replacement Session", async () => {
    const expired = checkoutAttempt({
      attempt_id: "33333333-3333-4333-8333-333333333333",
      expires_at: new Date(Date.now() - 60_000).toISOString(),
    })
    attemptInsertResults.push(
      { error: { code: "23505", message: "duplicate key" } },
      { error: null }
    )
    attemptSelectResults.push({ data: expired, error: null })
    mockGetCheckoutSessionSummary.mockResolvedValueOnce({
      status: "open",
      url: "https://checkout.stripe.com/c/pay/cs_existing",
      allowPromotionCodes: true,
    })

    const response = await POST(makeRequest({ purchaseType: "subscription" }))

    expect(response.status).toBe(200)
    expect(mockAttemptInsert).toHaveBeenCalledTimes(2)
    const replacementClaim = mockAttemptInsert.mock.calls[1][0]
    expect(replacementClaim.attempt_id).toMatch(UUID_RE)
    expect(replacementClaim.attempt_id).not.toBe(expired.attempt_id)
    expect(mockExpireCheckoutSession).toHaveBeenCalledWith("cs_existing")
    expect(mockAttemptDelete).toHaveBeenCalledTimes(1)
    expect(attemptDeleteQueries[0].eq).toHaveBeenNthCalledWith(1, "user_id", USER_ID)
    expect(attemptDeleteQueries[0].eq).toHaveBeenNthCalledWith(2, "attempt_id", expired.attempt_id)
    expect(mockCreateCheckout.mock.calls[0][0].metadata.checkout_attempt_id).toBe(
      replacementClaim.attempt_id
    )
    expect(mockExpireCheckoutSession.mock.invocationCallOrder[0]).toBeLessThan(
      mockCreateCheckout.mock.invocationCallOrder[0]
    )
  })

  it("retains an ambiguous failed claim and recovers it on a same-plan retry", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mockCreateCheckout.mockRejectedValueOnce(new Error("Stripe response was interrupted"))

    const failedResponse = await POST(makeRequest({ purchaseType: "subscription" }))

    expect(failedResponse.status).toBe(500)
    const retainedClaim = mockAttemptInsert.mock.calls[0][0]
    expect(mockAttemptDelete).not.toHaveBeenCalled()

    attemptInsertResults.push({ error: { code: "23505", message: "duplicate key" } })
    attemptSelectResults.push({
      data: checkoutAttempt({
        attempt_id: retainedClaim.attempt_id,
        stripe_checkout_session_id: null,
        expires_at: retainedClaim.expires_at,
        metadata: retainedClaim.metadata,
      }),
      error: null,
    })

    const retryResponse = await POST(
      makeRequest(
        {
          purchaseType: "subscription",
          attribution: {
            referrer: "https://example.com/later",
            firstLandingPage: "/later",
            timezone: "Europe/Paris",
          },
        },
        "5.6.7.8"
      )
    )

    expect(retryResponse.status).toBe(200)
    await expect(retryResponse.json()).resolves.toEqual({ url: CHECKOUT_URL })
    expect(mockCreateCheckout).toHaveBeenCalledTimes(2)
    expect(mockCreateCheckout.mock.calls[0][0].metadata.checkout_attempt_id).toBe(
      retainedClaim.attempt_id
    )
    expect(mockCreateCheckout.mock.calls[1][0].metadata.checkout_attempt_id).toBe(
      retainedClaim.attempt_id
    )
    expect(mockCreateCheckout.mock.calls[1][0].metadata).toEqual(
      mockCreateCheckout.mock.calls[0][0].metadata
    )
    expect(mockCreateCheckout.mock.calls[0][0].subscriptionExpiresAt).toBe(
      retainedClaim.expires_at
    )
    expect(mockCreateCheckout.mock.calls[1][0].subscriptionExpiresAt).toBe(
      retainedClaim.expires_at
    )
    expect(mockAttemptDelete).not.toHaveBeenCalled()
    expect(mockAttemptUpdate).toHaveBeenCalledWith({
      stripe_checkout_session_id: "cs_test_123",
      expires_at: CHECKOUT_EXPIRES_AT,
    })
  })

  it("retains an ambiguous persistence failure and recovers with the same claim", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    attemptUpdateResults.push({
      data: null,
      error: { message: "database response was interrupted" },
    })

    const failedResponse = await POST(makeRequest({ purchaseType: "subscription_api" }))

    expect(failedResponse.status).toBe(500)
    const retainedClaim = mockAttemptInsert.mock.calls[0][0]
    expect(mockAttemptDelete).not.toHaveBeenCalled()
    expect(mockExpireCheckoutSession).not.toHaveBeenCalled()

    attemptInsertResults.push({ error: { code: "23505", message: "duplicate key" } })
    attemptSelectResults.push({
      data: checkoutAttempt({
        purchase_type: "subscription_api",
        attempt_id: retainedClaim.attempt_id,
        stripe_checkout_session_id: null,
        expires_at: retainedClaim.expires_at,
        metadata: retainedClaim.metadata,
      }),
      error: null,
    })
    attemptUpdateResults.push({ data: { attempt_id: retainedClaim.attempt_id }, error: null })

    const retryResponse = await POST(makeRequest({ purchaseType: "subscription_api" }))

    expect(retryResponse.status).toBe(200)
    await expect(retryResponse.json()).resolves.toEqual({ url: CHECKOUT_URL })
    expect(mockCreateCheckout).toHaveBeenCalledTimes(2)
    for (const [checkout] of mockCreateCheckout.mock.calls) {
      expect(checkout.metadata.checkout_attempt_id).toBe(retainedClaim.attempt_id)
      expect(checkout.subscriptionExpiresAt).toBe(retainedClaim.expires_at)
    }
    expect(mockAttemptDelete).not.toHaveBeenCalled()
  })

  it("expires a created Session when its claim vanishes before persistence", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    attemptUpdateResults.push({ data: null, error: null })

    const response = await POST(makeRequest({ purchaseType: "subscription" }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: "Failed to create checkout" })
    expect(mockExpireCheckoutSession).toHaveBeenCalledWith("cs_test_123")
    expect(mockAttemptDelete).not.toHaveBeenCalled()
  })

  it("does not reuse a customer ID from a different billing provider", async () => {
    mockSubscriptionMaybeSingle.mockResolvedValueOnce({
      data: { billing_provider: "legacy", stripe_customer_id: "cus_wrong_provider" },
      error: null,
    })

    await POST(makeRequest({ purchaseType: "subscription" }))

    expect(mockCreateCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ stripeCustomerId: undefined })
    )
  })

  it("deletes the pending one-time purchase if Stripe Checkout creation fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mockCreateCheckout.mockRejectedValueOnce(new Error("Stripe unavailable"))

    const response = await POST(makeRequest({ purchaseType: "full_database" }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: "Failed to create checkout" })
    const pendingId = mockInsertPurchase.mock.calls[0][0].id
    expect(mockDeletePurchase).toHaveBeenCalledTimes(1)
    expect(mockDeletePurchaseEq).toHaveBeenCalledWith("id", pendingId)
  })

  it("does not contact Stripe when the pending purchase cannot be persisted", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mockInsertPurchase.mockResolvedValueOnce({ error: { message: "database unavailable" } })

    const response = await POST(makeRequest({ purchaseType: "full_database" }))

    expect(response.status).toBe(500)
    expect(mockCreateCheckout).not.toHaveBeenCalled()
  })
})
