"use client"

import { useState } from "react"
import { ArrowUpRight, Loader2 } from "lucide-react"

export function ApiUpgradeButton({ className = "" }: { className?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const upgrade = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/subscription/upgrade", { method: "POST" })
      const data = await response.json()
      if (response.ok && data.url) {
        window.location.assign(data.url)
        return
      }
      setError(data.error || "Unable to start upgrade")
    } catch {
      setError("Unable to start upgrade")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={upgrade} disabled={loading} className={`btn-primary justify-center disabled:opacity-60 ${className}`}>
        {loading ? <Loader2 size={14} className="animate-spin" /> : <>Upgrade — $79/mo <ArrowUpRight size={14} /></>}
      </button>
      {error && <p role="alert" className="mt-2 max-w-xs text-[12px] text-danger">{error}</p>}
    </div>
  )
}
