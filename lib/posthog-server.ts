import { PostHog } from "posthog-node"

let posthogClient: PostHog | null | undefined

function getPostHogClient(): PostHog | null {
  if (posthogClient !== undefined) return posthogClient

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!apiKey) {
    posthogClient = null
    return posthogClient
  }

  posthogClient = new PostHog(apiKey, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  })
  return posthogClient
}

export function captureServerEvent(options: {
  distinctId: string
  event: string
  properties?: Record<string, unknown>
}) {
  getPostHogClient()?.capture(options)
}

export function identifyServerUser(options: {
  distinctId: string
  properties?: Record<string, unknown>
}) {
  getPostHogClient()?.identify(options)
}

export function aliasServerUser(anonymousId: string | null, userId: string) {
  if (!anonymousId || anonymousId === userId) return
  getPostHogClient()?.alias({ distinctId: anonymousId, alias: userId })
}

export function stripeAnalyticsDistinctId(
  metadata: Record<string, string>,
  fallback: string
): string {
  return metadata.user_id || metadata.posthog_distinct_id || fallback
}

export function stripeAttributionProperties(
  metadata: Record<string, string>
): Record<string, string> {
  const keys = [
    "referrer",
    "first_landing_page",
    "attribution_source",
    "attribution_medium",
    "timezone",
    "country",
  ] as const
  return Object.fromEntries(
    keys.flatMap((key) => metadata[key] ? [[key, metadata[key]]] : [])
  )
}
