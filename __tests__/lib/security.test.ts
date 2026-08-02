import { describe, it, expect } from "vitest"
import {
  timingSafeCompare,
  sanitizeSearchInput,
  escapeHtml,
  isValidStateCode,
  clampPage,
  isValidUUID,
  isSameOriginRequest,
} from "@/lib/utils/security"

describe("isSameOriginRequest", () => {
  it("accepts a matching Origin header", () => {
    const request = new Request("https://example.com/api/settings", { headers: { origin: "https://example.com" } })
    expect(isSameOriginRequest(request)).toBe(true)
  })

  it("rejects a cross-site Origin header", () => {
    const request = new Request("https://example.com/api/settings", { headers: { origin: "https://attacker.example" } })
    expect(isSameOriginRequest(request)).toBe(false)
  })

  it("rejects browser requests marked cross-site", () => {
    const request = new Request("https://example.com/api/settings", { headers: { "sec-fetch-site": "cross-site" } })
    expect(isSameOriginRequest(request)).toBe(false)
  })
})

describe("sanitizeSearchInput", () => {
  it("passes through alphanumeric strings", () => {
    expect(sanitizeSearchInput("John Smith")).toBe("John Smith")
  })

  it("allows hyphens and @ signs", () => {
    expect(sanitizeSearchInput("Jane-Doe")).toBe("Jane-Doe")
    expect(sanitizeSearchInput("user@example")).toBe("user@example")
  })

  it("strips SQL injection characters", () => {
    expect(sanitizeSearchInput("'; DROP TABLE agents; --")).toBe("DROP TABLE agents --")
  })

  it("strips HTML/XSS payloads", () => {
    expect(sanitizeSearchInput('<script>alert("xss")</script>')).toBe("scriptalertxssscript")
  })

  it("strips dots (PostgREST filter separator)", () => {
    expect(sanitizeSearchInput("name.eq.admin")).toBe("nameeqadmin")
  })

  it("truncates to 100 characters", () => {
    const long = "a".repeat(200)
    expect(sanitizeSearchInput(long).length).toBe(100)
  })

  it("trims whitespace", () => {
    expect(sanitizeSearchInput("  hello  ")).toBe("hello")
  })

  it("returns empty string for all-special input", () => {
    expect(sanitizeSearchInput("!@#$%^&*()")).toBe("@")
  })

  it("handles unicode by stripping non-ASCII", () => {
    expect(sanitizeSearchInput("café résumé")).toBe("caf rsum")
  })

  it("handles empty string", () => {
    expect(sanitizeSearchInput("")).toBe("")
  })
})

describe("escapeHtml", () => {
  it("escapes ampersands", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b")
  })

  it("escapes angle brackets", () => {
    expect(escapeHtml("<div>")).toBe("&lt;div&gt;")
  })

  it("escapes quotes", () => {
    expect(escapeHtml('"hello\' world"')).toBe("&quot;hello&#39; world&quot;")
  })

  it("escapes a full XSS payload", () => {
    const input = '<script>alert("xss")</script>'
    const escaped = escapeHtml(input)
    expect(escaped).not.toContain("<")
    expect(escaped).not.toContain(">")
    expect(escaped).toContain("&lt;script&gt;")
  })

  it("leaves clean text unchanged", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World")
  })
})

describe("isValidStateCode", () => {
  it("accepts valid two-letter state codes", () => {
    expect(isValidStateCode("CA")).toBe(true)
    expect(isValidStateCode("TX")).toBe(true)
    expect(isValidStateCode("NY")).toBe(true)
    expect(isValidStateCode("FL")).toBe(true)
  })

  it("is case-insensitive", () => {
    expect(isValidStateCode("ca")).toBe(true)
    expect(isValidStateCode("Ca")).toBe(true)
  })

  it("rejects invalid codes", () => {
    expect(isValidStateCode("XX")).toBe(false)
    expect(isValidStateCode("ZZ")).toBe(false)
    expect(isValidStateCode("")).toBe(false)
  })

  it("rejects non-standard inputs", () => {
    expect(isValidStateCode("California")).toBe(false)
    expect(isValidStateCode("C")).toBe(false)
    expect(isValidStateCode("CAL")).toBe(false)
  })
})

describe("clampPage", () => {
  it("returns 1 for page 1", () => {
    expect(clampPage("1")).toBe(1)
  })

  it("clamps negative numbers to 1", () => {
    expect(clampPage("-5")).toBe(1)
    expect(clampPage("0")).toBe(1)
  })

  it("clamps values above 1000", () => {
    expect(clampPage("5000")).toBe(1000)
    expect(clampPage("1001")).toBe(1000)
  })

  it("floors decimal values", () => {
    expect(clampPage("2.7")).toBe(2)
    expect(clampPage("10.99")).toBe(10)
  })

  it("returns 1 for NaN inputs", () => {
    expect(clampPage("abc")).toBe(1)
    expect(clampPage(undefined)).toBe(1)
    expect(clampPage(null)).toBe(1)
  })

  it("handles numeric input", () => {
    expect(clampPage(50)).toBe(50)
  })

  it("allows exactly 1000", () => {
    expect(clampPage("1000")).toBe(1000)
  })
})

describe("isValidUUID", () => {
  it("accepts valid UUIDs", () => {
    expect(isValidUUID("123e4567-e89b-12d3-a456-426614174000")).toBe(true)
    expect(isValidUUID("00000000-0000-0000-0000-000000000000")).toBe(true)
  })

  it("accepts uppercase UUIDs", () => {
    expect(isValidUUID("123E4567-E89B-12D3-A456-426614174000")).toBe(true)
  })

  it("rejects invalid UUIDs", () => {
    expect(isValidUUID("not-a-uuid")).toBe(false)
    expect(isValidUUID("")).toBe(false)
    expect(isValidUUID("123e4567-e89b-12d3-a456")).toBe(false) // too short
    expect(isValidUUID("123e4567-e89b-12d3-a456-426614174000-extra")).toBe(false) // too long
  })

  it("rejects UUIDs without dashes", () => {
    expect(isValidUUID("123e4567e89b12d3a456426614174000")).toBe(false)
  })

  it("rejects SQL injection in UUID field", () => {
    expect(isValidUUID("'; DROP TABLE--")).toBe(false)
    expect(isValidUUID("00000000-0000-0000-0000-00000' OR 1=1")).toBe(false)
  })
})

describe("timingSafeCompare", () => {
  it("matches identical strings", () => {
    expect(timingSafeCompare("Bearer secret", "Bearer secret")).toBe(true)
    expect(timingSafeCompare("", "")).toBe(true)
  })

  it("rejects different strings of equal length", () => {
    expect(timingSafeCompare("Bearer secretA", "Bearer secretB")).toBe(false)
  })

  it("rejects strings of different length without throwing", () => {
    expect(timingSafeCompare("short", "a much longer value")).toBe(false)
  })

  // Regression: crypto.timingSafeEqual compares BYTE length, but callers guard
  // on String.length. A multi-byte char passes a .length check while producing a
  // longer buffer, which used to throw RangeError and 500 the route.
  it("rejects equal-char-length but different-byte-length input", () => {
    const a = "Bearer abcdefgé" // 15 chars, 16 bytes
    const b = "Bearer abcdefgh" // 15 chars, 15 bytes
    expect(a.length).toBe(b.length)
    expect(() => timingSafeCompare(a, b)).not.toThrow()
    expect(timingSafeCompare(a, b)).toBe(false)
  })

  it("rejects emoji padding used to match a length guard", () => {
    expect(() => timingSafeCompare("Bearer 🔑", "Bearer ab")).not.toThrow()
    expect(timingSafeCompare("Bearer 🔑", "Bearer ab")).toBe(false)
  })
})
