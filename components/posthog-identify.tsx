"use client"

import { useEffect } from "react"
import posthog from "posthog-js"

/** Keeps browser events and server-side billing events on the same PostHog person. */
export function PostHogIdentify() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

    let cancelled = false
    let subscription: { unsubscribe: () => void } | undefined

    import("@/lib/supabase/client").then(({ createClient }) => {
      if (cancelled) return
      const supabase = createClient()
      ;({ data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        const user = session?.user
        if (user && posthog.get_distinct_id() !== user.id) {
          posthog.identify(user.id, { email: user.email })
        } else if (event === "SIGNED_OUT") {
          posthog.reset()
        }
      }))
    })

    return () => {
      cancelled = true
      subscription?.unsubscribe()
    }
  }, [])

  return null
}
