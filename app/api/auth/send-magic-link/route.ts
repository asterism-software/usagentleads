import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendMagicLink } from "@/lib/resend/emails"
import { rateLimit } from "@/lib/utils/rateLimit"
import { sanitizePostHogDistinctId } from "@/lib/utils/attribution"

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"

  // Dual-layer rate limiting: per IP and per email
  const { success: ipOk } = await rateLimit(`magic-link-ip:${ip}`, 5, 60000)
  if (!ipOk) {
    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true })
  }

  let body: { email?: string; next?: string; posthogDistinctId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: true })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true })
  }

  const { success: emailOk } = await rateLimit(`magic-link-email:${email}`, 3, 60000)
  if (!emailOk) {
    return NextResponse.json({ success: true })
  }

  const next = body.next ?? "/dashboard"
  const posthogDistinctId = sanitizePostHogDistinctId(body.posthogDistinctId)

  try {
    // Generate magic link token server-side using admin SDK
    const supabase = createServiceClient()
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
    })

    if (error || !data?.properties?.hashed_token) {
      // Still return success to prevent email enumeration
      console.error("Magic link generation error:", error?.message)
      return NextResponse.json({ success: true })
    }

    const tokenHash = data.properties.hashed_token

    // Build confirmation URL pointing to our own verify endpoint
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://usagentleads.com"
    const confirmationUrl = new URL("/auth/confirm", appUrl)
    confirmationUrl.searchParams.set("token_hash", tokenHash)
    confirmationUrl.searchParams.set("type", "magiclink")
    confirmationUrl.searchParams.set("next", next)
    if (posthogDistinctId) confirmationUrl.searchParams.set("ph", posthogDistinctId)

    // Send branded email via Resend
    await sendMagicLink({ to: email, confirmationUrl: confirmationUrl.toString() })
  } catch (error) {
    console.error("Magic link send error:", error)
  }

  // Always return success
  return NextResponse.json({ success: true })
}
