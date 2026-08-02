import { describe, expect, it } from "vitest"
import { getSubscriptionAccess } from "@/lib/subscriptions"

const now = new Date("2026-08-02T00:00:00Z").getTime()
const base = {
  billing_provider: "stripe",
  status: "active",
  plan: "pro_monthly",
  current_period_start: "2026-08-01T00:00:00Z",
  current_period_end: "2026-09-01T00:00:00Z",
  trial_ends_at: null,
  cancel_at_period_end: false,
}

describe("getSubscriptionAccess", () => {
  it("grants dashboard but not API access to Pro Dashboard", () => {
    expect(getSubscriptionAccess(base, now)).toMatchObject({ hasDashboard: true, hasApi: false })
  })

  it("grants API and dashboard access to Pro API", () => {
    expect(getSubscriptionAccess({ ...base, plan: "pro_api" }, now)).toMatchObject({ hasDashboard: true, hasApi: true })
  })

  it("preserves access through a future cancel-at-period-end date", () => {
    const access = getSubscriptionAccess({ ...base, status: "cancelled", cancel_at_period_end: true }, now)
    expect(access.hasDashboard).toBe(true)
  })

  it("denies access when the entitlement window has expired", () => {
    const access = getSubscriptionAccess({ ...base, current_period_end: "2026-08-01T00:00:00Z" }, now)
    expect(access).toMatchObject({ hasDashboard: false, hasApi: false })
  })

  it("allows an unexpired trial", () => {
    const access = getSubscriptionAccess({ ...base, status: "on_trial", current_period_end: null, trial_ends_at: "2026-08-10T00:00:00Z" }, now)
    expect(access.hasDashboard).toBe(true)
  })
})
