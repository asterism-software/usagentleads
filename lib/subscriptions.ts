export type SubscriptionPlan = "pro_monthly" | "pro_api"

export interface SubscriptionRecord {
  billing_provider: string
  status: string
  plan: string
  stripe_subscription_id?: string | null
  stripe_customer_id?: string | null
  current_period_start: string | null
  current_period_end: string | null
  trial_ends_at: string | null
  cancel_at_period_end: boolean
  cancelled_at?: string | null
  created_at?: string | null
}

export interface SubscriptionAccess {
  hasDashboard: boolean
  hasApi: boolean
  isLegacyBilling: boolean
}

function isFuture(value: string | null | undefined, now: number): boolean {
  if (!value) return false
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) && timestamp > now
}

/** The single entitlement rule shared by proxy, APIs, and dashboard pages. */
export function getSubscriptionAccess(
  subscription: Partial<SubscriptionRecord> | null | undefined,
  now = Date.now()
): SubscriptionAccess {
  if (!subscription) {
    return { hasDashboard: false, hasApi: false, isLegacyBilling: false }
  }

  const periodValid = isFuture(subscription.current_period_end, now)
  const trialValid = isFuture(subscription.trial_ends_at, now)
  const accessWindowValid = periodValid || trialValid
  const statusActive = ["active", "on_trial"].includes(subscription.status || "")
  const hasDashboard = accessWindowValid && (
    statusActive || subscription.cancel_at_period_end === true
  )

  return {
    hasDashboard,
    hasApi: hasDashboard && subscription.plan === "pro_api",
    isLegacyBilling: subscription.billing_provider !== "stripe",
  }
}

export function planLabel(plan: string | null | undefined): string {
  return plan === "pro_api" ? "Pro API" : "Pro Dashboard"
}
