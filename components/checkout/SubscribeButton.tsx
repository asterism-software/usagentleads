"use client"

import { Loader2, ArrowRight } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { track } from "@/lib/utils/analytics"
import { getCheckoutAttribution } from "@/lib/utils/attribution"

export function SubscribeButton({
  className,
  purchaseType = "subscription",
  label = "Subscribe",
}: {
  className?: string
  purchaseType?: "subscription" | "subscription_api"
  label?: string
}) {
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    track("subscribe_button_clicked", { plan: purchaseType })
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        // Carry the chosen plan through login so checkout auto-resumes
        // straight to Stripe Checkout after the magic link — no re-clicking.
        const next = encodeURIComponent(`/checkout/resume?plan=${purchaseType}`)
        window.location.href = `/login?next=${next}`
        return
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseType,
          ...getCheckoutAttribution(),
        }),
      })
      const data = await res.json()
      if (data.url) {
        track("checkout_started", { product: purchaseType })
        window.location.href = data.url
        return
      }
      toast.error(data.error || "Unable to start checkout. Please try again.")
      setLoading(false)
    } catch {
      toast.error("Unable to start checkout. Please try again.")
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className={`btn-outline justify-center text-[15px] py-3.5 ${className ?? ""}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {label} <ArrowRight size={14} />
        </>
      )}
    </button>
  )
}
