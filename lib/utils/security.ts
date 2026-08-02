import crypto from "crypto"
import { VALID_STATE_CODES } from "./states"

/**
 * Constant-time string comparison that never throws.
 *
 * `crypto.timingSafeEqual` requires equal BYTE lengths, but callers naturally
 * guard on `String.length` (UTF-16 code units). A value like "é" is 1 char and
 * 2 bytes, so an attacker could pass the length guard and crash the handler
 * with a RangeError. Compare the buffers' byte lengths here instead, and return
 * false rather than throwing on any mismatch.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8")
  const bufB = Buffer.from(b, "utf8")
  if (bufA.length !== bufB.length) return false
  try {
    return crypto.timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

export function sanitizeSearchInput(input: string): string {
  // Whitelist: only allow alphanumeric, spaces, hyphens, and @
  // Dots are excluded because they are PostgREST filter separators
  return input
    .replace(/[^a-zA-Z0-9\s\-@]/g, "")
    .trim()
    .slice(0, 100)
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function isValidStateCode(code: string): boolean {
  return VALID_STATE_CODES.has(code.toUpperCase())
}

export function clampPage(page: unknown): number {
  const num = Number(page)
  if (isNaN(num) || num < 1) return 1
  if (num > 1000) return 1000
  return Math.floor(num)
}

export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

/** Reject browser cross-site mutation requests that could ride session cookies. */
export function isSameOriginRequest(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site")
  if (fetchSite === "cross-site") return false

  let targetOrigin: string
  try {
    targetOrigin = new URL(request.url).origin
  } catch {
    return false
  }

  const source = request.headers.get("origin") || request.headers.get("referer")
  // Non-browser callers do not send Fetch Metadata headers and cannot cause a
  // browser to attach session cookies implicitly. Browser cross-site requests
  // were rejected above.
  if (!source) return fetchSite !== "cross-site"

  try {
    return new URL(source).origin === targetOrigin
  } catch {
    return false
  }
}
