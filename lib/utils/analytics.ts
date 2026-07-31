import posthog from "posthog-js"

/**
 * Conversion-funnel events. PostHog is initialized globally in
 * instrumentation-client.ts; this wrapper keeps event names typed and
 * consistent so the funnel (intent → checkout → purchase) can be built
 * reliably in the dashboard. Purchase completion itself is tracked
 * server-side via the Stripe webhook, not here.
 */
export type AnalyticsEvent =
  | "buy_button_clicked"
  | "checkout_started"
  | "subscribe_button_clicked"
  | "free_sample_opened"
  | "free_sample_submitted"

export function track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return
  try {
    posthog.capture(event, properties)
  } catch {
    // Never let analytics break a checkout flow.
  }
}
