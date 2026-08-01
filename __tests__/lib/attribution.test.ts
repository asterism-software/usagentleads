import { afterEach, describe, expect, it, vi } from "vitest"
import {
  FIRST_TOUCH_ATTRIBUTION_STORAGE_KEY,
  captureFirstTouchAttribution,
  getCheckoutAttribution,
} from "@/lib/utils/attribution"

function memoryStorage(initialValue: string | null = null) {
  let value = initialValue
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, nextValue: string) => {
      value = nextValue
    }),
    value: () => value,
  }
}

function browserWith({
  storage,
  referrer,
  pathname,
}: {
  storage: ReturnType<typeof memoryStorage>
  referrer: string
  pathname: string
}) {
  vi.stubGlobal("window", {
    localStorage: storage,
    location: { pathname },
  })
  vi.stubGlobal("document", { referrer })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("first-touch attribution", () => {
  it("stores the referrer origin and bounded landing pathname as one record", () => {
    const storage = memoryStorage()
    const referrer = `https://www.google.com/search?${"q".repeat(600)}`
    const pathname = `/${"pricing".repeat(100)}`
    browserWith({ storage, referrer, pathname })

    const captured = captureFirstTouchAttribution()

    expect(captured).toEqual({
      version: 1,
      referrer: "https://www.google.com",
      firstLandingPage: pathname.slice(0, 500),
    })
    expect(storage.setItem).toHaveBeenCalledTimes(1)
    expect(storage.setItem).toHaveBeenCalledWith(
      FIRST_TOUCH_ATTRIBUTION_STORAGE_KEY,
      JSON.stringify(captured)
    )
  })

  it("never replaces the first record after navigation", () => {
    const storage = memoryStorage()
    browserWith({
      storage,
      referrer: "https://www.google.com/",
      pathname: "/pricing",
    })
    captureFirstTouchAttribution()
    const firstValue = storage.value()

    browserWith({
      storage,
      referrer: "https://www.usagentleads.com/pricing",
      pathname: "/checkout/resume",
    })
    const capturedAgain = captureFirstTouchAttribution()

    expect(storage.value()).toBe(firstValue)
    expect(storage.setItem).toHaveBeenCalledTimes(1)
    expect(capturedAgain).toEqual({
      version: 1,
      referrer: "https://www.google.com",
      firstLandingPage: "/pricing",
    })
  })

  it.each([
    JSON.stringify({
      version: 1,
      referrer: "",
      firstLandingPage: "/states/california",
    }),
    "{not-valid-json",
  ])("preserves an existing localStorage value: %s", (existing) => {
    const storage = memoryStorage(existing)
    browserWith({ storage, referrer: "https://later.example/", pathname: "/pricing" })

    captureFirstTouchAttribution()

    expect(storage.value()).toBe(existing)
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it("returns the checkout body field with stored first-touch values and timezone", () => {
    const stored = JSON.stringify({
      version: 1,
      referrer: "https://www.google.com/",
      firstLandingPage: "/pricing",
    })
    const storage = memoryStorage(stored)
    browserWith({ storage, referrer: "https://later.example/", pathname: "/checkout" })

    expect(getCheckoutAttribution()).toEqual({
      attribution: {
        referrer: "https://www.google.com",
        firstLandingPage: "/pricing",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    })
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it("falls back safely when localStorage and Intl are unavailable", () => {
    const storage = memoryStorage()
    storage.getItem.mockImplementation(() => {
      throw new Error("storage disabled")
    })
    browserWith({ storage, referrer: "", pathname: "/pricing" })
    vi.stubGlobal("Intl", {
      DateTimeFormat: () => {
        throw new Error("Intl unavailable")
      },
    })

    expect(getCheckoutAttribution()).toEqual({
      attribution: {
        referrer: "",
        firstLandingPage: "/pricing",
        timezone: "",
      },
    })
    expect(storage.setItem).not.toHaveBeenCalled()
  })
})
