import { describe, expect, it } from "vitest"
import { isInitialAuthSession } from "@/lib/auth-analytics"

describe("isInitialAuthSession", () => {
  it("recognizes Supabase's first sign-in timestamp skew", () => {
    expect(isInitialAuthSession({
      created_at: "2026-08-12T10:00:00.000Z",
      last_sign_in_at: "2026-08-12T10:00:08.000Z",
    })).toBe(true)
  })

  it("does not count later sign-ins as registrations", () => {
    expect(isInitialAuthSession({
      created_at: "2026-08-12T10:00:00.000Z",
      last_sign_in_at: "2026-08-12T10:05:00.000Z",
    })).toBe(false)
  })
})
