export const STRIPE_PLANS = {
  state: {
    name: "State Pack",
    productId: "prod_UzEVR2GPxiByS3",
    priceId: "price_1U5NQ1ItJWsYAnxnyFSsLmBG",
    amount: 9_900,
    currency: "usd",
    mode: "payment",
  },
  full_database: {
    name: "Full Database",
    productId: "prod_UzEVFqSZvkyUKx",
    priceId: "price_1U5NQ8ItJWsYAnxnbrvaXD0d",
    amount: 39_900,
    currency: "usd",
    mode: "payment",
  },
  subscription: {
    name: "Pro Dashboard",
    productId: "prod_UzEVT9L76iny23",
    priceId: "price_1TzG2tItJWsYAnxnlVVNJgPc",
    amount: 4_900,
    currency: "usd",
    mode: "subscription",
  },
  subscription_api: {
    name: "Pro API",
    productId: "prod_UzEWCJlZqPprFS",
    priceId: "price_1TzG32ItJWsYAnxnBI0j2xQn",
    amount: 7_900,
    currency: "usd",
    mode: "subscription",
  },
} as const

// Keep the subscription implementation available for existing customers and a
// future relaunch, but do not advertise or sell these plans for now.
export const SUBSCRIPTION_PLANS_VISIBLE = false

export type PurchaseType = keyof typeof STRIPE_PLANS
export type SubscriptionPurchaseType = Extract<
  PurchaseType,
  "subscription" | "subscription_api"
>

export const STRIPE_STATE_NURTURE_COUPON_ID = "tOWjxMmz"

export function subscriptionPlanForPurchaseType(
  purchaseType: SubscriptionPurchaseType
): "pro_monthly" | "pro_api" {
  return purchaseType === "subscription_api" ? "pro_api" : "pro_monthly"
}
