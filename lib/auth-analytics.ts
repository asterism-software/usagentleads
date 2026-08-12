const INITIAL_SIGN_IN_MAX_SKEW_MS = 10_000

/** Supabase timestamps the first successful session at account creation time. */
export function isInitialAuthSession(user: {
  created_at?: string
  last_sign_in_at?: string
}) {
  const createdAt = Date.parse(user.created_at ?? "")
  const lastSignInAt = Date.parse(user.last_sign_in_at ?? "")
  return Number.isFinite(createdAt) &&
    Number.isFinite(lastSignInAt) &&
    Math.abs(lastSignInAt - createdAt) <= INITIAL_SIGN_IN_MAX_SKEW_MS
}
