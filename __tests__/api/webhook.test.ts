import { beforeEach, describe, expect, it, vi } from "vitest"
import { STRIPE_PLANS } from "@/components/pricing/PlanGroups"

const USER_ID = "11111111-1111-4111-8111-111111111111"
const PURCHASE_ID = "22222222-2222-4222-8222-222222222222"
const CHECKOUT_ATTEMPT_ID = "33333333-3333-4333-8333-333333333333"

interface QueryMock {
  eq: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  then: ReturnType<typeof vi.fn>
}

function queryResult(data: unknown = null, error: unknown = null): QueryMock {
  const result = { data, error }
  const query = {} as QueryMock
  query.eq = vi.fn(() => query)
  query.select = vi.fn(() => query)
  query.single = vi.fn().mockResolvedValue(result)
  query.maybeSingle = vi.fn().mockResolvedValue(result)
  query.then = vi.fn((resolve, reject) => Promise.resolve(result).then(resolve, reject))
  return query
}

describe("POST /api/webhooks/stripe", () => {
  let POST: typeof import("@/app/api/webhooks/stripe/route").POST
  let normalizeSubscriptionStatus: typeof import("@/app/api/webhooks/stripe/route").normalizeSubscriptionStatus
  let currentEvent: Record<string, unknown>
  let mockConstructWebhookEvent: ReturnType<typeof vi.fn>
  let mockRetrieveSession: ReturnType<typeof vi.fn>
  let mockRetrieveSubscription: ReturnType<typeof vi.fn>
  let mockRetrieveCustomer: ReturnType<typeof vi.fn>
  let mockEventSelect: ReturnType<typeof vi.fn>
  let mockEventInsert: ReturnType<typeof vi.fn>
  let eventLookupQueries: QueryMock[]
  let processedEvent: Record<string, unknown> | null
  let processedEventLookupError: Record<string, unknown> | null
  let mockPurchaseUpdate: ReturnType<typeof vi.fn>
  let purchaseUpdates: Array<{ values: Record<string, unknown>; query: QueryMock }>
  let mockSubscriptionUpsert: ReturnType<typeof vi.fn>
  let mockCheckoutAttemptDelete: ReturnType<typeof vi.fn>
  let checkoutAttemptDeleteQueries: QueryMock[]
  let existingSubscription: Record<string, unknown> | null
  let mockSendDownloadEmail: ReturnType<typeof vi.fn>
  let mockSendSubscriptionWelcome: ReturnType<typeof vi.fn>
  let mockSendSubscriptionCancelled: ReturnType<typeof vi.fn>
  let mockSendSubscriptionRenewed: ReturnType<typeof vi.fn>
  let mockSendPaymentFailed: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.resetModules()
    vi.restoreAllMocks()

    currentEvent = {
      id: "evt_ignored",
      type: "product.updated",
      data: { object: {} },
    }
    mockConstructWebhookEvent = vi.fn(() => currentEvent)
    mockRetrieveSession = vi.fn()
    mockRetrieveSubscription = vi.fn()
    mockRetrieveCustomer = vi.fn()
    processedEvent = null
    processedEventLookupError = null
    eventLookupQueries = []
    mockEventSelect = vi.fn(() => {
      const query = queryResult(processedEvent, processedEventLookupError)
      eventLookupQueries.push(query)
      return query
    })
    mockEventInsert = vi.fn().mockResolvedValue({ error: null })
    purchaseUpdates = []
    mockPurchaseUpdate = vi.fn((values: Record<string, unknown>) => {
      const fulfilledPurchase = values.status === "completed"
        ? { download_token: "download-token", fulfillment_email_sent_at: null }
        : null
      const query = queryResult(fulfilledPurchase)
      purchaseUpdates.push({ values, query })
      return query
    })
    existingSubscription = null
    mockSubscriptionUpsert = vi.fn().mockResolvedValue({ error: null })
    checkoutAttemptDeleteQueries = []
    mockCheckoutAttemptDelete = vi.fn(() => {
      const query = queryResult()
      checkoutAttemptDeleteQueries.push(query)
      return query
    })

    const mockFrom = vi.fn((table: string) => {
      if (table === "stripe_webhook_events") {
        return { select: mockEventSelect, insert: mockEventInsert }
      }
      if (table === "purchases") {
        return { update: mockPurchaseUpdate }
      }
      if (table === "subscriptions") {
        return {
          select: vi.fn(() => queryResult(existingSubscription)),
          upsert: mockSubscriptionUpsert,
        }
      }
      if (table === "stripe_checkout_attempts") {
        return { delete: mockCheckoutAttemptDelete }
      }
      throw new Error(`Unexpected table: ${table}`)
    })

    mockSendDownloadEmail = vi.fn().mockResolvedValue(undefined)
    mockSendSubscriptionWelcome = vi.fn().mockResolvedValue(undefined)
    mockSendSubscriptionCancelled = vi.fn().mockResolvedValue(undefined)
    mockSendSubscriptionRenewed = vi.fn().mockResolvedValue(undefined)
    mockSendPaymentFailed = vi.fn().mockResolvedValue(undefined)

    vi.doMock("@/lib/stripe/webhook", () => ({
      constructWebhookEvent: mockConstructWebhookEvent,
    }))
    vi.doMock("@/lib/stripe/client", () => ({
      getStripe: vi.fn(() => ({
        checkout: { sessions: { retrieve: mockRetrieveSession } },
        subscriptions: { retrieve: mockRetrieveSubscription },
        customers: { retrieve: mockRetrieveCustomer },
      })),
    }))
    vi.doMock("@/lib/supabase/server", () => ({
      createServiceClient: vi.fn(() => ({
        schema: vi.fn(() => ({ from: mockFrom })),
      })),
    }))
    vi.doMock("@/lib/resend/emails", () => ({
      sendDownloadEmail: mockSendDownloadEmail,
      sendSubscriptionWelcome: mockSendSubscriptionWelcome,
      sendSubscriptionCancelled: mockSendSubscriptionCancelled,
      sendSubscriptionRenewed: mockSendSubscriptionRenewed,
      sendPaymentFailed: mockSendPaymentFailed,
    }))
    vi.doMock("@/lib/utils/states", () => ({
      getStateByCode: vi.fn((code: string) =>
        code.toUpperCase() === "CA" ? { code: "CA", name: "California" } : undefined
      ),
    }))

    const route = await import("@/app/api/webhooks/stripe/route")
    POST = route.POST
    normalizeSubscriptionStatus = route.normalizeSubscriptionStatus
  })

  function request(signature: string | null = "t=123,v1=signature", body = "raw-body") {
    const headers = new Headers({ "Content-Type": "application/json" })
    if (signature) headers.set("stripe-signature", signature)
    return new Request("https://example.com/api/webhooks/stripe", {
      method: "POST",
      headers,
      body,
    })
  }

  it("rejects a missing Stripe signature before reading the event log", async () => {
    const response = await POST(request(null))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Missing Stripe signature" })
    expect(mockConstructWebhookEvent).not.toHaveBeenCalled()
    expect(mockEventSelect).not.toHaveBeenCalled()
    expect(mockEventInsert).not.toHaveBeenCalled()
  })

  it("rejects a signature that Stripe cannot verify", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mockConstructWebhookEvent.mockImplementationOnce(() => {
      throw new Error("No signatures found matching the expected signature")
    })

    const response = await POST(request())

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Invalid signature" })
    expect(mockConstructWebhookEvent).toHaveBeenCalledWith("raw-body", "t=123,v1=signature")
    expect(mockEventSelect).not.toHaveBeenCalled()
    expect(mockEventInsert).not.toHaveBeenCalled()
  })

  it("acknowledges a duplicate event without running its handler", async () => {
    currentEvent = {
      id: "evt_duplicate",
      type: "checkout.session.completed",
      data: { object: { id: "cs_duplicate" } },
    }
    processedEvent = { id: "evt_duplicate" }

    const response = await POST(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ received: true, duplicate: true })
    expect(eventLookupQueries[0].eq).toHaveBeenCalledWith("id", "evt_duplicate")
    expect(mockRetrieveSession).not.toHaveBeenCalled()
    expect(mockPurchaseUpdate).not.toHaveBeenCalled()
    expect(mockEventInsert).not.toHaveBeenCalled()
  })

  it("accepts concurrent completions when one processed-log insert wins the race", async () => {
    currentEvent = {
      id: "evt_concurrent",
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_concurrent",
          refunded: true,
          amount_refunded: STRIPE_PLANS.state.amount,
          payment_intent: "pi_concurrent",
        },
      },
    }
    mockEventInsert
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { code: "23505", message: "duplicate key" } })

    const responses = await Promise.all([POST(request()), POST(request())])

    expect(responses.map((response) => response.status)).toEqual([200, 200])
    await expect(Promise.all(responses.map((response) => response.json()))).resolves.toEqual([
      { received: true },
      { received: true },
    ])
    expect(mockEventSelect).toHaveBeenCalledTimes(2)
    expect(purchaseUpdates).toHaveLength(2)
    expect(purchaseUpdates.map(({ values }) => values)).toEqual([
      { amount_refunded: STRIPE_PLANS.state.amount, status: "refunded" },
      { amount_refunded: STRIPE_PLANS.state.amount, status: "refunded" },
    ])
    expect(mockEventInsert).toHaveBeenCalledTimes(2)
    expect(mockEventInsert).toHaveBeenNthCalledWith(1, {
      id: "evt_concurrent",
      event_type: "charge.refunded",
    })
    expect(mockEventInsert).toHaveBeenNthCalledWith(2, {
      id: "evt_concurrent",
      event_type: "charge.refunded",
    })
  })

  it("fulfills an allowlisted one-time state purchase and sends one download email", async () => {
    currentEvent = {
      id: "evt_checkout",
      type: "checkout.session.completed",
      data: { object: { id: "cs_state" } },
    }
    mockRetrieveSession.mockResolvedValueOnce({
      id: "cs_state",
      mode: "payment",
      payment_status: "paid",
      metadata: { purchase_id: PURCHASE_ID, state_code: "ca" },
      line_items: { data: [{ price: { id: STRIPE_PLANS.state.priceId }, quantity: 1 }] },
      amount_total: STRIPE_PLANS.state.amount - 1_000,
      currency: "usd",
      customer_details: { email: "buyer@example.com" },
      customer_email: null,
      payment_intent: "pi_state",
      customer: "cus_state",
    })

    const response = await POST(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ received: true })
    expect(mockRetrieveSession).toHaveBeenCalledWith("cs_state", {
      expand: ["line_items.data.price"],
    })
    expect(purchaseUpdates[0].values).toEqual(
      expect.objectContaining({
        guest_email: "buyer@example.com",
        purchase_type: "state",
        state_code: "CA",
        stripe_checkout_session_id: "cs_state",
        stripe_payment_intent_id: "pi_state",
        stripe_customer_id: "cus_state",
        amount_paid: STRIPE_PLANS.state.amount - 1_000,
        currency: "usd",
        status: "completed",
      })
    )
    expect(purchaseUpdates[0].query.eq).toHaveBeenNthCalledWith(1, "id", PURCHASE_ID)
    expect(purchaseUpdates[0].query.eq).toHaveBeenNthCalledWith(2, "billing_provider", "stripe")
    expect(mockSendDownloadEmail).toHaveBeenCalledWith({
      to: "buyer@example.com",
      downloadUrl: expect.stringContaining("/api/download?token=download-token"),
      productName: "California",
      purchaseType: "state",
      idempotencyKey: "download:cs_state",
    })
    expect(purchaseUpdates[1].values).toEqual({
      fulfillment_email_sent_at: expect.any(String),
    })
    expect(mockEventInsert).toHaveBeenCalledWith({
      id: "evt_checkout",
      event_type: "checkout.session.completed",
    })
  })

  it("rejects a one-time Checkout Session whose Price is not allowlisted", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    currentEvent = {
      id: "evt_bad_price",
      type: "checkout.session.completed",
      data: { object: { id: "cs_bad_price" } },
    }
    mockRetrieveSession.mockResolvedValueOnce({
      id: "cs_bad_price",
      mode: "payment",
      payment_status: "paid",
      metadata: { purchase_id: PURCHASE_ID },
      line_items: { data: [{ price: { id: "price_not_owned_by_this_app" }, quantity: 1 }] },
      amount_total: STRIPE_PLANS.full_database.amount,
      currency: "usd",
      customer_details: { email: "buyer@example.com" },
    })

    const response = await POST(request())

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: "Processing error" })
    expect(mockPurchaseUpdate).not.toHaveBeenCalled()
    expect(mockSendDownloadEmail).not.toHaveBeenCalled()
    expect(mockEventInsert).not.toHaveBeenCalled()
  })

  it.each([
    {
      label: "quantity is not one",
      lineItems: [{ price: { id: STRIPE_PLANS.full_database.priceId }, quantity: 2 }],
    },
    {
      label: "more than one line item is present",
      lineItems: [
        { price: { id: STRIPE_PLANS.full_database.priceId }, quantity: 1 },
        { price: { id: STRIPE_PLANS.full_database.priceId }, quantity: 1 },
      ],
    },
  ])("rejects a one-time Checkout Session when $label", async ({ lineItems }) => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    currentEvent = {
      id: "evt_bad_line_items",
      type: "checkout.session.completed",
      data: { object: { id: "cs_bad_line_items" } },
    }
    mockRetrieveSession.mockResolvedValueOnce({
      id: "cs_bad_line_items",
      mode: "payment",
      payment_status: "paid",
      metadata: { purchase_id: PURCHASE_ID },
      line_items: { data: lineItems },
      amount_total: STRIPE_PLANS.full_database.amount,
      currency: "usd",
      customer_details: { email: "buyer@example.com" },
    })

    const response = await POST(request())

    expect(response.status).toBe(500)
    expect(mockPurchaseUpdate).not.toHaveBeenCalled()
    expect(mockEventInsert).not.toHaveBeenCalled()
  })

  it("does not record an event when processing fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    currentEvent = {
      id: "evt_processing_failure",
      type: "checkout.session.completed",
      data: { object: { id: "cs_processing_failure" } },
    }
    mockRetrieveSession.mockRejectedValueOnce(new Error("Stripe temporarily unavailable"))

    const response = await POST(request())

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: "Processing error" })
    expect(mockEventInsert).not.toHaveBeenCalled()
  })

  it("syncs an API trial subscription using Stripe item period fields", async () => {
    const periodStart = 1_800_000_000
    const periodEnd = 1_802_678_400
    const trialEnd = 1_800_086_400
    currentEvent = {
      id: "evt_subscription",
      type: "customer.subscription.created",
      data: { object: { id: "sub_api" } },
    }
    mockRetrieveSubscription.mockResolvedValueOnce({
      id: "sub_api",
      customer: "cus_subscription",
      status: "trialing",
      metadata: {
        user_id: USER_ID,
        purchase_type: "subscription_api",
        checkout_attempt_id: CHECKOUT_ATTEMPT_ID,
      },
      items: {
        data: [
          {
            price: { id: STRIPE_PLANS.subscription_api.priceId },
            current_period_start: periodStart,
            current_period_end: periodEnd,
          },
        ],
      },
      trial_end: trialEnd,
      cancel_at_period_end: false,
      canceled_at: null,
    })
    mockRetrieveCustomer.mockResolvedValueOnce({
      id: "cus_subscription",
      deleted: false,
      email: "subscriber@example.com",
    })

    const response = await POST(request())

    expect(response.status).toBe(200)
    expect(mockRetrieveSubscription).toHaveBeenCalledWith("sub_api", {
      expand: ["items.data.price"],
    })
    expect(mockSubscriptionUpsert).toHaveBeenCalledWith(
      {
        user_id: USER_ID,
        billing_provider: "stripe",
        stripe_subscription_id: "sub_api",
        stripe_customer_id: "cus_subscription",
        stripe_price_id: STRIPE_PLANS.subscription_api.priceId,
        provider_status: "trialing",
        status: "on_trial",
        plan: "pro_api",
        current_period_start: new Date(periodStart * 1_000).toISOString(),
        current_period_end: new Date(periodEnd * 1_000).toISOString(),
        trial_ends_at: new Date(trialEnd * 1_000).toISOString(),
        cancel_at_period_end: false,
        cancelled_at: null,
        updated_at: expect.any(String),
      },
      { onConflict: "user_id" }
    )
    expect(mockCheckoutAttemptDelete).toHaveBeenCalledTimes(1)
    expect(checkoutAttemptDeleteQueries[0].eq).toHaveBeenNthCalledWith(
      1,
      "user_id",
      USER_ID
    )
    expect(checkoutAttemptDeleteQueries[0].eq).toHaveBeenNthCalledWith(
      2,
      "attempt_id",
      CHECKOUT_ATTEMPT_ID
    )
  })

  it("releases the matching claim when a subscription Checkout Session expires", async () => {
    currentEvent = {
      id: "evt_subscription_expired",
      type: "checkout.session.expired",
      data: {
        object: {
          id: "cs_subscription_expired",
          mode: "subscription",
          metadata: {
            user_id: USER_ID,
            checkout_attempt_id: CHECKOUT_ATTEMPT_ID,
          },
        },
      },
    }

    const response = await POST(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ received: true })
    expect(mockCheckoutAttemptDelete).toHaveBeenCalledTimes(1)
    expect(checkoutAttemptDeleteQueries[0].eq).toHaveBeenNthCalledWith(
      1,
      "user_id",
      USER_ID
    )
    expect(checkoutAttemptDeleteQueries[0].eq).toHaveBeenNthCalledWith(
      2,
      "attempt_id",
      CHECKOUT_ATTEMPT_ID
    )
    expect(mockEventInsert).toHaveBeenCalledWith({
      id: "evt_subscription_expired",
      event_type: "checkout.session.expired",
    })
  })

  it("uses the matched API plan in a subscription welcome email", async () => {
    currentEvent = {
      id: "evt_invoice_welcome",
      type: "invoice.paid",
      data: {
        object: {
          id: "in_welcome",
          customer_email: "subscriber@example.com",
          billing_reason: "subscription_create",
          parent: {
            type: "subscription_details",
            subscription_details: { subscription: "sub_api_welcome" },
          },
        },
      },
    }
    mockRetrieveSubscription.mockResolvedValueOnce({
      id: "sub_api_welcome",
      customer: "cus_api_welcome",
      status: "active",
      metadata: { user_id: USER_ID },
      items: {
        data: [
          {
            price: { id: STRIPE_PLANS.subscription_api.priceId },
            current_period_start: 1_800_000_000,
            current_period_end: 1_802_678_400,
          },
        ],
      },
      trial_end: null,
      cancel_at_period_end: false,
      canceled_at: null,
    })
    mockRetrieveCustomer.mockResolvedValueOnce({
      id: "cus_api_welcome",
      deleted: false,
      email: "subscriber@example.com",
    })

    const response = await POST(request())

    expect(response.status).toBe(200)
    expect(mockSendSubscriptionWelcome).toHaveBeenCalledWith({
      to: "subscriber@example.com",
      planName: "Pro API",
      idempotencyKey: "welcome:sub_api_welcome",
    })
    expect(mockEventInsert).toHaveBeenCalledWith({
      id: "evt_invoice_welcome",
      event_type: "invoice.paid",
    })
  })

  it("uses the matched dashboard plan in a failed-payment email", async () => {
    currentEvent = {
      id: "evt_invoice_failed",
      type: "invoice.payment_failed",
      data: {
        object: {
          id: "in_failed",
          customer_email: "subscriber@example.com",
          attempt_count: 2,
          parent: {
            type: "subscription_details",
            subscription_details: { subscription: "sub_dashboard_failed" },
          },
        },
      },
    }
    mockRetrieveSubscription.mockResolvedValueOnce({
      id: "sub_dashboard_failed",
      customer: "cus_dashboard_failed",
      status: "past_due",
      metadata: { user_id: USER_ID },
      items: {
        data: [
          {
            price: { id: STRIPE_PLANS.subscription.priceId },
            current_period_start: 1_800_000_000,
            current_period_end: 1_802_678_400,
          },
        ],
      },
      trial_end: null,
      cancel_at_period_end: false,
      canceled_at: null,
    })
    mockRetrieveCustomer.mockResolvedValueOnce({
      id: "cus_dashboard_failed",
      deleted: false,
      email: "subscriber@example.com",
    })

    const response = await POST(request())

    expect(response.status).toBe(200)
    expect(mockSendPaymentFailed).toHaveBeenCalledWith({
      to: "subscriber@example.com",
      planName: "Pro Dashboard",
      idempotencyKey: "payment-failed:in_failed:2",
    })
  })

  it("normalizes all Stripe subscription access statuses", () => {
    expect(normalizeSubscriptionStatus("active")).toBe("active")
    expect(normalizeSubscriptionStatus("trialing")).toBe("on_trial")
    expect(normalizeSubscriptionStatus("canceled")).toBe("cancelled")
    expect(normalizeSubscriptionStatus("incomplete_expired")).toBe("expired")
    expect(normalizeSubscriptionStatus("past_due")).toBe("paused")
    expect(normalizeSubscriptionStatus("unpaid")).toBe("paused")
  })

  it("records a full Stripe charge refund against its PaymentIntent", async () => {
    currentEvent = {
      id: "evt_refund",
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_refunded",
          refunded: true,
          amount_refunded: STRIPE_PLANS.full_database.amount,
          payment_intent: "pi_refunded",
        },
      },
    }

    const response = await POST(request())

    expect(response.status).toBe(200)
    expect(purchaseUpdates).toHaveLength(1)
    expect(purchaseUpdates[0].values).toEqual({
      status: "refunded",
      amount_refunded: STRIPE_PLANS.full_database.amount,
    })
    expect(purchaseUpdates[0].query.eq).toHaveBeenCalledWith(
      "stripe_payment_intent_id",
      "pi_refunded"
    )
  })

  it("records a partial refund without marking the whole purchase refunded", async () => {
    currentEvent = {
      id: "evt_partial_refund",
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_partially_refunded",
          refunded: false,
          amount_refunded: 2_500,
          payment_intent: "pi_partially_refunded",
        },
      },
    }

    const response = await POST(request())

    expect(response.status).toBe(200)
    expect(purchaseUpdates).toHaveLength(1)
    expect(purchaseUpdates[0].values).toEqual({ amount_refunded: 2_500 })
    expect(purchaseUpdates[0].values).not.toHaveProperty("status")
    expect(purchaseUpdates[0].query.eq).toHaveBeenCalledWith(
      "stripe_payment_intent_id",
      "pi_partially_refunded"
    )
    expect(mockEventInsert).toHaveBeenCalledWith({
      id: "evt_partial_refund",
      event_type: "charge.refunded",
    })
  })
})
