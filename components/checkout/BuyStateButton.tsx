"use client"

import { Loader2, ArrowRight } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { track } from "@/lib/utils/analytics"
import { getCheckoutAttribution } from "@/lib/utils/attribution"

interface BuyStateButtonProps {
  stateCode: string
  stateName: string
  className?: string
}

export function BuyStateButton({ stateCode, stateName, className }: BuyStateButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleBuy = async () => {
    setLoading(true)
    track("buy_button_clicked", { product: "state", state_code: stateCode, state_name: stateName, price: 49 })
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseType: "state",
          stateCode,
          ...getCheckoutAttribution(),
        }),
      })
      const data = await res.json()
      if (data.url) {
        track("checkout_started", { product: "state", state_code: stateCode, price: 49 })
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
          Buy {stateName} Data <ArrowRight size={14} />
        </>
      )}
    </button>
  )
}
