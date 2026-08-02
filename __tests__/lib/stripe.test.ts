import crypto from "crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { STRIPE_PLANS } from "@/lib/billing/plans"

const ORIGINAL_STRIPE_SECRET = process.env.STRIPE_SECRET_KEY
const ORIGINAL_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL
const SUBSCRIPTION_EXPIRES_AT = "2099-01-01T00:00:00.000Z"
const API_ATTEMPT_ID = crypto
  .createHash("sha256")
  .update("subscription:user-123:subscription_api")
  .digest("hex")
const ATTRIBUTION_METADATA = {
  ip: "1.2.3.4",
  timezone: "America/New_York",
  country: "US",
  referrer: "https://www.google.com",
  first_landing_page: "/pricing",
  plan_name: "Full Database",
  plan_price: "199.00",
  plan_price_cents: "19900",
  currency: "usd",
}

describe("Stripe Checkout helper", () => {
  let mockSessionCreate: ReturnType<typeof vi.fn>
  let mockSessionRetrieve: ReturnType<typeof vi.fn>
  let mockSessionExpire: ReturnType<typeof vi.fn>
  let mockConstructEvent: ReturnType<typeof vi.fn>
  let mockStripeConstructor: ReturnType<
    typeof vi.fn<(secretKey: string, options: unknown) => void>
  >

  beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    process.env.STRIPE_SECRET_KEY = "sk_test_unit"
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_unit"
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com/"

    mockSessionCreate = vi.fn().mockResolvedValue({
      id: "cs_test_unit",
      url: "https://checkout.stripe.com/c/pay/cs_test_unit",
      expires_at: 1_800_000_000,
    })
    mockSessionRetrieve = vi.fn()
    mockSessionExpire = vi.fn().mockResolvedValue({ id: "cs_test_unit", status: "expired" })
    mockConstructEvent = vi.fn().mockReturnValue({
      id: "evt_verified",
      type: "checkout.session.completed",
    })
    mockStripeConstructor = vi.fn<(secretKey: string, options: unknown) => void>()
    vi.doMock("stripe", () => ({
      default: class StripeMock {
        constructor(secretKey: string, options: unknown) {
          mockStripeConstructor(secretKey, options)
        }

        checkout = {
          sessions: {
            create: mockSessionCreate,
            retrieve: mockSessionRetrieve,
            expire: mockSessionExpire,
          },
        }
        webhooks = { constructEvent: mockConstructEvent }
      },
    }))
  })

  afterEach(() => {
    if (ORIGINAL_STRIPE_SECRET === undefined) delete process.env.STRIPE_SECRET_KEY
    else process.env.STRIPE_SECRET_KEY = ORIGINAL_STRIPE_SECRET
    if (ORIGINAL_WEBHOOK_SECRET === undefined) delete process.env.STRIPE_WEBHOOK_SECRET
    else process.env.STRIPE_WEBHOOK_SECRET = ORIGINAL_WEBHOOK_SECRET
    if (ORIGINAL_APP_URL === undefined) delete process.env.NEXT_PUBLIC_APP_URL
    else process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL
  })

  it("uses the colocated Stripe Price ID and preserves the purchase-success workflow", async () => {
    const { createCheckout } = await import("@/lib/stripe/client")

    const checkout = await createCheckout({
      purchaseType: "full_database",
      metadata: {
        ...ATTRIBUTION_METADATA,
        purchase_type: "full_database",
        checkout_attempt_id: "attempt-123",
        purchase_id: "purchase-123",
      },
      successPageToken: "page-token-123",
    })

    expect(checkout).toEqual({
      id: "cs_test_unit",
      url: "https://checkout.stripe.com/c/pay/cs_test_unit",
      expiresAt: new Date(1_800_000_000 * 1_000).toISOString(),
    })
    expect(mockSessionCreate).toHaveBeenCalledWith(
      {
        mode: "payment",
        line_items: [{ price: STRIPE_PLANS.full_database.priceId, quantity: 1 }],
        success_url: "https://app.example.com/purchase-success?pt=page-token-123",
        cancel_url: "https://app.example.com/pricing",
        allow_promotion_codes: true,
        billing_address_collection: "auto",
        client_reference_id: "attempt-123",
        locale: "auto",
        metadata: {
          ...ATTRIBUTION_METADATA,
          purchase_type: "full_database",
          checkout_attempt_id: "attempt-123",
          purchase_id: "purchase-123",
        },
        origin_context: "web",
        submit_type: "pay",
        customer_creation: "always",
        payment_intent_data: {
          metadata: {
            ...ATTRIBUTION_METADATA,
            purchase_type: "full_database",
            checkout_attempt_id: "attempt-123",
            purchase_id: "purchase-123",
          },
        },
      },
      { idempotencyKey: "checkout-attempt-123" }
    )
  })

  it("attaches subscription metadata and an existing Stripe customer", async () => {
    const { createCheckout } = await import("@/lib/stripe/client")

    await createCheckout({
      purchaseType: "subscription_api",
      metadata: {
        ...ATTRIBUTION_METADATA,
        plan_name: "Pro API",
        plan_price: "79.00",
        plan_price_cents: "7900",
        purchase_type: "subscription_api",
        checkout_attempt_id: API_ATTEMPT_ID,
        user_id: "user-123",
      },
      customerEmail: "buyer@example.com",
      stripeCustomerId: "cus_existing",
      subscriptionExpiresAt: SUBSCRIPTION_EXPIRES_AT,
    })

    const params = mockSessionCreate.mock.calls[0][0]
    expect(params).toEqual(
      expect.objectContaining({
        mode: "subscription",
        line_items: [{ price: STRIPE_PLANS.subscription_api.priceId, quantity: 1 }],
        success_url: "https://app.example.com/dashboard/api-keys?welcome=1",
        cancel_url: "https://app.example.com/pricing",
        allow_promotion_codes: true,
        client_reference_id: "user-123",
        submit_type: "subscribe",
        customer: "cus_existing",
        subscription_data: {
          metadata: {
            ...ATTRIBUTION_METADATA,
            plan_name: "Pro API",
            plan_price: "79.00",
            plan_price_cents: "7900",
            purchase_type: "subscription_api",
            checkout_attempt_id: API_ATTEMPT_ID,
            user_id: "user-123",
          },
        },
      })
    )
    expect(params).not.toHaveProperty("customer_email")
    expect(params).not.toHaveProperty("payment_intent_data")
    expect(params.metadata).toEqual(params.subscription_data.metadata)
    expect(params.expires_at).toBe(
      Math.floor(Date.parse(SUBSCRIPTION_EXPIRES_AT) / 1_000)
    )
    expect(mockSessionCreate.mock.calls[0][1]).toEqual({
      idempotencyKey: `checkout-${API_ATTEMPT_ID}`,
    })
  })

  it("requires subscriptions to use the expiry persisted with their checkout claim", async () => {
    const { createCheckout } = await import("@/lib/stripe/client")

    await expect(
      createCheckout({
        purchaseType: "subscription",
        metadata: {
          purchase_type: "subscription",
          checkout_attempt_id: API_ATTEMPT_ID,
          user_id: "user-123",
        },
      })
    ).rejects.toThrow("Subscription Checkout requires a persisted expiry")
    expect(mockSessionCreate).not.toHaveBeenCalled()
  })

  it("pins the Stripe client to the live webhook API version", async () => {
    const { getStripe } = await import("@/lib/stripe/client")

    getStripe()
    getStripe()

    expect(mockStripeConstructor).toHaveBeenCalledTimes(1)
    expect(mockStripeConstructor).toHaveBeenCalledWith("sk_test_unit", {
      apiVersion: "2026-06-24.dahlia",
      appInfo: { name: "USAgentLeads" },
    })
  })

  it("enables promotion-code entry for one-time purchases", async () => {
    const { createCheckout } = await import("@/lib/stripe/client")

    await createCheckout({
      purchaseType: "state",
      metadata: {
        purchase_type: "state",
        checkout_attempt_id: "attempt-state",
        purchase_id: "purchase-state",
        state_code: "CA",
      },
      successPageToken: "state-page-token",
    })

    expect(mockSessionCreate.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        line_items: [{ price: STRIPE_PLANS.state.priceId, quantity: 1 }],
        allow_promotion_codes: true,
        cancel_url: "https://app.example.com/states",
      })
    )
  })

  it("retrieves and expires hosted Checkout Sessions", async () => {
    mockSessionRetrieve.mockResolvedValueOnce({
      id: "cs_existing",
      status: "open",
      url: "https://checkout.stripe.com/c/pay/cs_existing",
      allow_promotion_codes: true,
    })
    const { expireCheckoutSession, getCheckoutSessionSummary } = await import(
      "@/lib/stripe/client"
    )

    await expect(getCheckoutSessionSummary("cs_existing")).resolves.toEqual({
      status: "open",
      url: "https://checkout.stripe.com/c/pay/cs_existing",
      allowPromotionCodes: true,
    })
    await expect(expireCheckoutSession("cs_existing")).resolves.toBeUndefined()
    expect(mockSessionRetrieve).toHaveBeenCalledWith("cs_existing")
    expect(mockSessionExpire).toHaveBeenCalledWith("cs_existing")
  })

  it("fails closed when the Stripe secret is absent", async () => {
    delete process.env.STRIPE_SECRET_KEY
    const { createCheckout } = await import("@/lib/stripe/client")

    await expect(
      createCheckout({
        purchaseType: "full_database",
        metadata: {
          purchase_type: "full_database",
          checkout_attempt_id: "attempt-no-secret",
        },
      })
    ).rejects.toThrow("STRIPE_SECRET_KEY is not configured")
    expect(mockSessionCreate).not.toHaveBeenCalled()
  })

  it("rejects a Checkout Session without a redirect URL", async () => {
    mockSessionCreate.mockResolvedValueOnce({ id: "cs_without_url", url: null })
    const { createCheckout } = await import("@/lib/stripe/client")

    await expect(
      createCheckout({
        purchaseType: "full_database",
        metadata: {
          purchase_type: "full_database",
          checkout_attempt_id: "attempt-without-url",
        },
      })
    ).rejects.toThrow("Stripe did not return a Checkout URL")
  })

  it("delegates raw-body signature verification to Stripe with the webhook secret", async () => {
    const { constructWebhookEvent } = await import("@/lib/stripe/webhook")

    const event = constructWebhookEvent("{\"id\":\"evt_verified\"}", "t=123,v1=signed")

    expect(event).toEqual({ id: "evt_verified", type: "checkout.session.completed" })
    expect(mockConstructEvent).toHaveBeenCalledWith(
      "{\"id\":\"evt_verified\"}",
      "t=123,v1=signed",
      "whsec_test_unit"
    )
  })

  it("does not attempt signature verification without a webhook secret", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET
    const { constructWebhookEvent } = await import("@/lib/stripe/webhook")

    expect(() => constructWebhookEvent("raw-body", "t=123,v1=signed")).toThrow(
      "STRIPE_WEBHOOK_SECRET is not configured"
    )
    expect(mockConstructEvent).not.toHaveBeenCalled()
  })
})
