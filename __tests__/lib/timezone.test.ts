import { describe, expect, it } from "vitest"
import { getCountryCodeForTimezone } from "@/lib/utils/timezone"

describe("timezone country lookup", () => {
  it("maps a browser IANA timezone to its ISO country code", () => {
    expect(getCountryCodeForTimezone("America/New_York")).toBe("US")
    expect(getCountryCodeForTimezone("Europe/Paris")).toBe("FR")
  })

  it("returns null for an unknown or unsupported timezone", () => {
    expect(getCountryCodeForTimezone("Etc/Unknown")).toBeNull()
    expect(getCountryCodeForTimezone("")).toBeNull()
  })
})
