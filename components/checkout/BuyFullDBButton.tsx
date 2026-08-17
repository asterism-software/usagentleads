"use client"

import { Loader2, ArrowRight } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { getPostHogDistinctId, track } from "@/lib/utils/analytics"
import { getCheckoutAttribution } from "@/lib/utils/attribution"

export function BuyFullDBButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false)

  const handleBuy = async () => {
    setLoading(true)
    track("buy_button_clicked", { product: "full_database", price: 399 })
    track("checkout_initiated", {
      purchase_type: "full_database",
      price_cents: 39900,
    })
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseType: "full_database",
          ...getCheckoutAttribution(getPostHogDistinctId()),
        }),
      })
      const data = await res.json()
      if (data.url) {
        track("checkout_started", { product: "full_database", price: 399 })
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
      onClick={handleBuy}
      disabled={loading}
      className={`btn-primary justify-center text-[15px] py-3.5 ${className ?? ""}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          Buy Full Database <ArrowRight size={14} />
        </>
      )}
    </button>
  )
}
