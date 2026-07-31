import crypto from "crypto"
import { SITE_URL } from "@/lib/utils/site"
import { timingSafeCompare } from "@/lib/utils/security"

/**
 * Stateless unsubscribe tokens for the sample-lead nurture drip. We HMAC the
 * email with a server secret so an unsubscribe link can be verified without
 * storing a per-lead token. Marketing email must offer a working opt-out
 * (CAN-SPAM), and these links keep the drip compliant.
 *
 * The secret is resolved per call (not at module load) so a lazily-populated
 * env doesn't bake in a stale value, and there is deliberately NO hardcoded
 * fallback: a literal default would let anyone derive a valid token for any
 * address and mass-unsubscribe the entire lead list.
 */
function getSecret(): string | null {
  return process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || null
}

export function makeUnsubToken(email: string): string {
  const secret = getSecret()
  if (!secret) {
    throw new Error(
      "Cannot mint unsubscribe token: UNSUBSCRIBE_SECRET / CRON_SECRET are unset"
    )
  }
  return crypto
    .createHmac("sha256", secret)
    .update(email.trim().toLowerCase())
    .digest("hex")
    .slice(0, 32)
}

export function verifyUnsubToken(email: string, token: string): boolean {
  // Fail closed rather than throw — this runs on an unauthenticated GET.
  if (!getSecret()) return false
  return timingSafeCompare(token, makeUnsubToken(email))
}

export function unsubscribeUrl(email: string): string {
  const e = encodeURIComponent(email.trim().toLowerCase())
  const t = makeUnsubToken(email)
  return `${SITE_URL}/api/unsubscribe?e=${e}&t=${t}`
}
