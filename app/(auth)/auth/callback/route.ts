import { NextResponse } from "next/server"
import { sanitizeAuthReturnPath } from "@/lib/auth-redirect"
import { createClient } from "@/lib/supabase/server"
import {
  aliasServerUser,
  captureServerEvent,
  identifyServerUser,
} from "@/lib/posthog-server"
import { sanitizePostHogDistinctId } from "@/lib/utils/attribution"
import { isInitialAuthSession } from "@/lib/auth-analytics"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = sanitizeAuthReturnPath(searchParams.get("next"))
  const anonymousId = sanitizePostHogDistinctId(searchParams.get("ph"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const provider = user.app_metadata?.provider || "unknown"
        aliasServerUser(anonymousId, user.id)
        identifyServerUser({
          distinctId: user.id,
          properties: { email: user.email },
        })
        if (isInitialAuthSession(user)) {
          captureServerEvent({
            distinctId: user.id,
            event: "registration_completed",
            properties: { provider, method: provider },
          })
        }
        captureServerEvent({
          distinctId: user.id,
          event: "sign_in_completed",
          properties: { provider, method: provider },
        })
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/pricing?error=auth`)
}
