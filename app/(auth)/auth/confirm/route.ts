import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type === "signup" ? "signup" : "magiclink",
  })

  if (error) {
    console.error("OTP verification error:", error.message)
    return NextResponse.redirect(`${origin}/login?error=expired_link`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
