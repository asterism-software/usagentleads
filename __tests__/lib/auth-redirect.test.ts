import { describe, expect, it } from "vitest"

import {
  buildAuthCallbackUrl,
  DEFAULT_AUTH_RETURN_PATH,
  sanitizeAuthReturnPath,
} from "@/lib/auth-redirect"

describe("sanitizeAuthReturnPath", () => {
  it("keeps local paths with query strings and fragments", () => {
    expect(sanitizeAuthReturnPath("/dashboard/api-keys?tab=active#new")).toBe(
      "/dashboard/api-keys?tab=active#new"
    )
  })

  it.each([
    null,
    undefined,
    "",
    "dashboard",
    "https://evil.example/dashboard",
    "//evil.example/dashboard",
    "/\\evil.example/dashboard",
  ])("falls back for an unsafe return path: %s", (path) => {
    expect(sanitizeAuthReturnPath(path)).toBe(DEFAULT_AUTH_RETURN_PATH)
  })
})

describe("buildAuthCallbackUrl", () => {
  it("builds a same-origin callback with a sanitized return path", () => {
    expect(
      buildAuthCallbackUrl(
        "https://www.usagentleads.com",
        "/dashboard?view=saved"
      )
    ).toBe(
      "https://www.usagentleads.com/auth/callback?next=%2Fdashboard%3Fview%3Dsaved"
    )
  })
})
