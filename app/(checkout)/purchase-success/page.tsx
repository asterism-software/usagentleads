"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowRight, CheckCircle, Download, Loader2, Mail, ShieldCheck } from "lucide-react"
import { BuyFullDBButton } from "@/components/checkout/BuyFullDBButton"

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

const PURCHASE_VALUES: Record<string, number> = {
  full_database: 199,
  state_data: 49,
}

export default function PurchaseSuccessPage() {
  return (
    <Suspense>
      <PurchaseSuccessContent />
    </Suspense>
  )
}

interface PurchaseInfo {
  status: string
  purchaseType: string
  stateCode: string | null
  downloadAvailable: boolean
  downloadUrl: string | null
}

function PurchaseSuccessContent() {
  const searchParams = useSearchParams()
  const pageToken = searchParams.get("pt")
  const [purchase, setPurchase] = useState<PurchaseInfo | null>(null)
  const [loading, setLoading] = useState(!!pageToken)
  const [retries, setRetries] = useState(0)
  const pixelFired = useRef(false)

  useEffect(() => {
    if (!pageToken) return

    let cancelled = false

    async function fetchPurchase() {
      try {
        const res = await fetch(`/api/purchase?pt=${pageToken}`)
        if (!res.ok) throw new Error("Not found")
        const data = await res.json()

        if (!cancelled) {
          setPurchase(data)
          setLoading(false)

          if (data.status === "completed" && !pixelFired.current) {
            pixelFired.current = true
            const value = PURCHASE_VALUES[data.purchaseType as string]
            if (value && typeof window.fbq === "function") {
              window.fbq("track", "Purchase", {
                value,
                currency: "USD",
                content_type: "product",
                content_ids: [data.stateCode ? `state_${data.stateCode}` : data.purchaseType],
              })
            }
          }

          // If purchase is still pending (webhook hasn't fired yet), retry
          if (data.status === "pending" && retries < 10) {
            setTimeout(() => setRetries((r) => r + 1), 3000)
          }
        }
      } catch {
        // Purchase not found yet — webhook may not have fired, retry
        if (!cancelled && retries < 10) {
          setTimeout(() => setRetries((r) => r + 1), 3000)
        } else if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchPurchase()
    return () => { cancelled = true }
  }, [pageToken, retries])

  const showStateUpsell = purchase?.status === "completed" && purchase.purchaseType === "state"

  return (
    <div className="bg-page min-h-screen flex items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-lg flex-col gap-5">
      <div className="card w-full p-10 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-success-bg border border-success/20">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h1 className="text-[24px] font-semibold text-ink">
          Purchase Confirmed!
        </h1>

        {/* Download button or loading state */}
        {loading ? (
          <div className="mt-6 flex items-center justify-center gap-2 text-[15px] text-tertiary">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing your download...
          </div>
        ) : purchase?.downloadAvailable && purchase.downloadUrl ? (
          <div className="mt-6">
            <a
              href={purchase.downloadUrl}
              className="btn-primary w-full justify-center text-[15px] py-3.5"
            >
              <Download size={16} />
              Download Your {purchase.purchaseType === "full_database" ? "Full Database" : "State Data"}
            </a>
            <p className="mt-3 text-[13px] text-tertiary">
              Single-use link. Expires in 48 hours.
            </p>
          </div>
        ) : null}

        {/* Email notice */}
        <div className="mt-6 flex items-center gap-3 rounded-lg bg-subtle border border-border p-4 text-left">
          <Mail className="h-5 w-5 text-accent shrink-0" />
          <div>
            <p className="text-[14px] font-medium text-ink">Check your email</p>
            <p className="text-[13px] text-tertiary mt-0.5">
              A download link has also been sent to your email.
            </p>
          </div>
        </div>

        <p className="mt-4 text-[13px] text-tertiary">
          The download link expires in 48 hours, so be sure to download your file soon.
        </p>

        <p className="mt-4 text-[13px] text-tertiary">
          Haven&apos;t received your download link within 15–30 minutes? Please{" "}
          <Link href="/contact" className="text-accent underline hover:no-underline">
            contact support
          </Link>{" "}
          and we&apos;ll get it sorted out.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/states" className={showStateUpsell ? "btn-outline" : "btn-primary"}>
            Browse More States <ArrowRight size={14} />
          </Link>
          <Link href="/" className="btn-outline">
            Back to Home
          </Link>
        </div>
      </div>

      {/* Post-purchase upsell: a state buyer is the hottest full-database prospect.
          Shown only after a confirmed state purchase; priced at the standard $199. */}
      {showStateUpsell && (
        <div className="card w-full border-2 border-accent/30 p-7 text-left shadow-lg">
          <p className="label-eyebrow mb-1">Complete your coverage</p>
          <h2 className="text-[19px] font-semibold text-ink">Get all 50 states for $199</h2>
          <p className="mt-2 text-[14px] text-body leading-relaxed">
            You just unlocked one state. The Full Database bundles all 50 states and 1.1M+ verified
            contacts into a single CSV — same instant delivery, no account needed.
          </p>
          <div className="mt-5">
            <BuyFullDBButton className="w-full" />
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[13px] text-tertiary">
            <ShieldCheck size={13} />
            One-time &middot; Instant delivery &middot; 30-day money-back guarantee
          </p>
        </div>
      )}
      </div>
    </div>
  )
}
