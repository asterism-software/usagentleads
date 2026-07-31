import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { makeUnsubToken, verifyUnsubToken } from "@/lib/utils/unsubscribe"

const ORIGINAL_CRON = process.env.CRON_SECRET
const ORIGINAL_UNSUBSCRIBE = process.env.UNSUBSCRIBE_SECRET

beforeEach(() => {
  delete process.env.UNSUBSCRIBE_SECRET
  process.env.CRON_SECRET = "unsubscribe-test-secret"
})

afterEach(() => {
  if (ORIGINAL_CRON === undefined) delete process.env.CRON_SECRET
  else process.env.CRON_SECRET = ORIGINAL_CRON
  if (ORIGINAL_UNSUBSCRIBE === undefined) delete process.env.UNSUBSCRIBE_SECRET
  else process.env.UNSUBSCRIBE_SECRET = ORIGINAL_UNSUBSCRIBE
})

describe("unsubscribe tokens", () => {
  it("verifies a token it minted", () => {
    const token = makeUnsubToken("Person@Example.com")
    expect(verifyUnsubToken("person@example.com", token)).toBe(true)
  })

  it("is case- and whitespace-insensitive on the address", () => {
    const token = makeUnsubToken("person@example.com")
    expect(verifyUnsubToken("  PERSON@EXAMPLE.COM  ", token)).toBe(true)
  })

  it("rejects a token minted for a different address", () => {
    const token = makeUnsubToken("someone@example.com")
    expect(verifyUnsubToken("victim@example.com", token)).toBe(false)
  })

  it("rejects malformed tokens without throwing", () => {
    expect(() => verifyUnsubToken("a@b.com", "")).not.toThrow()
    expect(verifyUnsubToken("a@b.com", "")).toBe(false)
    expect(verifyUnsubToken("a@b.com", "deadbeef")).toBe(false)
    // 32 chars but multi-byte -> different byte length
    expect(() => verifyUnsubToken("a@b.com", "é".repeat(32))).not.toThrow()
    expect(verifyUnsubToken("a@b.com", "é".repeat(32))).toBe(false)
  })

  it("changes when the secret changes", () => {
    const token = makeUnsubToken("person@example.com")
    process.env.CRON_SECRET = "a-different-secret"
    expect(verifyUnsubToken("person@example.com", token)).toBe(false)
  })

  it("prefers a dedicated unsubscribe secret over the cron secret", () => {
    process.env.UNSUBSCRIBE_SECRET = "dedicated-secret"
    const token = makeUnsubToken("person@example.com")

    delete process.env.UNSUBSCRIBE_SECRET
    expect(verifyUnsubToken("person@example.com", token)).toBe(false)
  })

  // Regression: the module used to fall back to a hardcoded literal secret,
  // so anyone could derive a valid opt-out token for any address on a deploy
  // that was missing both env vars.
  it("fails closed when no secret is configured", () => {
    delete process.env.UNSUBSCRIBE_SECRET
    delete process.env.CRON_SECRET
    expect(verifyUnsubToken("person@example.com", "0".repeat(32))).toBe(false)
    expect(() => makeUnsubToken("person@example.com")).toThrow()
  })
})
