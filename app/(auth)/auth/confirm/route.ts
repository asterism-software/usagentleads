import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  aliasServerUser,
  captureServerEvent,
  identifyServerUser,
} from "@/lib/posthog-server"
import { sanitizePostHogDistinctId } from "@/lib/utils/attribution"
import { isInitialAuthSession } from "@/lib/auth-analytics"

const ALLOWED_PREFIXES = ["/dashboard", "/pricing", "/checkout", "/"]

function sanitizeRedirect(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes(":\\")) {
    return "/dashboard"
  }
  try {
    const url = new URL(path, "http://localhost")
    if (url.hostname !== "localhost") return "/dashboard"
  } catch {
    return "/dashboard"
  }
  // Check against allowlist of prefixes
  if (!ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return "/dashboard"
  }
  return path
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as "magiclink" | "signup" | undefined
  const next = sanitizeRedirect(searchParams.get("next") ?? "/dashboard")
  const anonymousId = sanitizePostHogDistinctId(searchParams.get("ph"))

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type === "signup" ? "signup" : "magiclink",
  })

  if (error) {
    console.error("OTP verification error:", error.message)
    return NextResponse.redirect(`${origin}/login?error=expired_link`)
  }

  const user = data.user
  if (user) {
    aliasServerUser(anonymousId, user.id)
    identifyServerUser({
      distinctId: user.id,
      properties: { email: user.email },
    })
    if (isInitialAuthSession(user)) {
      captureServerEvent({
        distinctId: user.id,
        event: "registration_completed",
        properties: { provider: "email", method: "magic_link" },
      })
    }
    captureServerEvent({
      distinctId: user.id,
      event: "sign_in_completed",
      properties: { provider: "email", method: "magic_link" },
    })
  }

  return NextResponse.redirect(`${origin}${next}`)
}
