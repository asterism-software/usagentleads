const ATTRIBUTION_VERSION = 1 as const
const MAX_ATTRIBUTION_VALUE_LENGTH = 500

export const FIRST_TOUCH_ATTRIBUTION_STORAGE_KEY =
  "usagentleads:first-touch-attribution:v1"

export interface FirstTouchAttribution {
  version: typeof ATTRIBUTION_VERSION
  referrer: string
  firstLandingPage: string
}

export interface CheckoutAttribution {
  referrer: string
  firstLandingPage: string
  timezone: string
  posthogDistinctId?: string
}

const POSTHOG_DISTINCT_ID_RE = /^[A-Za-z0-9._:-]{8,200}$/

function boundedString(value: unknown): string {
  return typeof value === "string"
    ? value.slice(0, MAX_ATTRIBUTION_VALUE_LENGTH)
    : ""
}

function referrerOrigin(value: unknown): string {
  const candidate = boundedString(value)
  if (!candidate) return ""

  try {
    const url = new URL(candidate)
    return url.protocol === "http:" || url.protocol === "https:"
      ? boundedString(url.origin)
      : ""
  } catch {
    return ""
  }
}

function currentFirstTouch(): FirstTouchAttribution {
  let referrer = ""
  let firstLandingPage = ""

  try {
    // Attribution only needs the source origin. Paths and query strings can
    // contain search terms, email addresses, or auth tokens.
    referrer = referrerOrigin(document.referrer)
  } catch {
    // Browser globals and storage can be unavailable in restricted contexts.
  }

  try {
    firstLandingPage = boundedString(window.location.pathname)
  } catch {
    // An empty path is safer than allowing attribution to break checkout.
  }

  return {
    version: ATTRIBUTION_VERSION,
    referrer,
    firstLandingPage,
  }
}

function parseStoredAttribution(value: string): FirstTouchAttribution | null {
  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== "object") return null

    const candidate = parsed as Record<string, unknown>
    if (
      candidate.version !== ATTRIBUTION_VERSION ||
      typeof candidate.referrer !== "string" ||
      typeof candidate.firstLandingPage !== "string"
    ) {
      return null
    }

    return {
      version: ATTRIBUTION_VERSION,
      referrer: referrerOrigin(candidate.referrer),
      firstLandingPage: boundedString(candidate.firstLandingPage),
    }
  } catch {
    return null
  }
}

/**
 * Saves the browser's first-touch attribution as one immutable localStorage
 * record. Any existing value, including an invalid one, is deliberately left
 * untouched so a later page can never replace the first landing page.
 */
export function captureFirstTouchAttribution(): FirstTouchAttribution | null {
  if (typeof window === "undefined") return null

  try {
    const existing = window.localStorage.getItem(FIRST_TOUCH_ATTRIBUTION_STORAGE_KEY)
    if (existing !== null) return parseStoredAttribution(existing)

    const attribution = currentFirstTouch()
    window.localStorage.setItem(
      FIRST_TOUCH_ATTRIBUTION_STORAGE_KEY,
      JSON.stringify(attribution)
    )
    return attribution
  } catch {
    return null
  }
}

function currentTimezone(): string {
  try {
    return boundedString(Intl.DateTimeFormat().resolvedOptions().timeZone)
  } catch {
    return ""
  }
}

function currentPostHogDistinctId(): string | undefined {
  try {
    const value = window.localStorage.getItem("ph_" + process.env.NEXT_PUBLIC_POSTHOG_KEY + "_posthog")
    if (!value) return undefined
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== "object") return undefined
    const distinctId = (parsed as Record<string, unknown>).distinct_id
    return typeof distinctId === "string" && POSTHOG_DISTINCT_ID_RE.test(distinctId)
      ? distinctId
      : undefined
  } catch {
    return undefined
  }
}

/** Returns the optional browser context to spread into a checkout request body. */
export function getCheckoutAttribution(
  explicitPostHogDistinctId?: unknown
): { attribution: CheckoutAttribution } {
  const firstTouch = captureFirstTouchAttribution() ?? currentFirstTouch()
  const posthogDistinctId =
    sanitizePostHogDistinctId(explicitPostHogDistinctId) ||
    currentPostHogDistinctId()

  return {
    attribution: {
      referrer: firstTouch.referrer,
      firstLandingPage: firstTouch.firstLandingPage,
      timezone: currentTimezone(),
      ...(posthogDistinctId ? { posthogDistinctId } : {}),
    },
  }
}

function referrerHostname(referrer: string): string | null {
  if (!referrer || referrer === "direct") return null
  try {
    return new URL(referrer).hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return null
  }
}

function matchesDomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`)
}

export function deriveAttributionSource(referrer: string): string {
  const hostname = referrerHostname(referrer)
  if (!hostname) return "direct"
  if (matchesDomain(hostname, "google.com") || hostname.startsWith("google.")) return "google"
  if (matchesDomain(hostname, "bing.com")) return "bing"
  if (matchesDomain(hostname, "yahoo.com")) return "yahoo"
  if (matchesDomain(hostname, "duckduckgo.com")) return "duckduckgo"
  if (matchesDomain(hostname, "search.brave.com")) return "brave"
  if (matchesDomain(hostname, "chatgpt.com") || matchesDomain(hostname, "openai.com")) return "chatgpt"
  if (matchesDomain(hostname, "perplexity.ai")) return "perplexity"
  if (matchesDomain(hostname, "copilot.com")) return "copilot"
  if (matchesDomain(hostname, "facebook.com")) return "facebook"
  if (matchesDomain(hostname, "linkedin.com")) return "linkedin"
  if (matchesDomain(hostname, "reddit.com")) return "reddit"
  if (matchesDomain(hostname, "x.com") || matchesDomain(hostname, "twitter.com") || matchesDomain(hostname, "t.co")) return "x"
  return hostname
}

export function deriveAttributionMedium(source: string): string {
  if (source === "direct") return "direct"
  if (["google", "bing", "yahoo", "duckduckgo", "brave"].includes(source)) {
    return "organic_search"
  }
  if (["chatgpt", "perplexity", "copilot"].includes(source)) return "ai"
  if (["facebook", "linkedin", "reddit", "x"].includes(source)) return "organic_social"
  return "referral"
}

export function sanitizePostHogDistinctId(value: unknown): string | null {
  return typeof value === "string" && POSTHOG_DISTINCT_ID_RE.test(value)
    ? value
    : null
}
