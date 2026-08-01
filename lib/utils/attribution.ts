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
}

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

/** Returns the optional browser context to spread into a checkout request body. */
export function getCheckoutAttribution(): { attribution: CheckoutAttribution } {
  const firstTouch = captureFirstTouchAttribution() ?? currentFirstTouch()

  return {
    attribution: {
      referrer: firstTouch.referrer,
      firstLandingPage: firstTouch.firstLandingPage,
      timezone: currentTimezone(),
    },
  }
}
