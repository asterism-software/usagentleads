import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function sanitizeRedirect(path: string): string {
  // Only allow relative paths starting with / and no protocol tricks
  if (!path.startsWith("/") || path.startsWith("//") || path.includes(":\\")) {
    return "/dashboard"
  }
  // Strip any userinfo-style tricks like /\evil.com or /@evil.com
  try {
    const url = new URL(path, "http://localhost")
    if (url.hostname !== "localhost") return "/dashboard"
  } catch {
    return "/dashboard"
  }
  return path
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = sanitizeRedirect(searchParams.get("next") ?? "/dashboard")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/pricing?error=auth`)
}
