"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

const VALID_PLANS = ["subscription", "subscription_api"] as const
type Plan = (typeof VALID_PLANS)[number]

export default function CheckoutResumePage() {
  return (
    <Suspense>
      <ResumeContent />
    </Suspense>
  )
}

function ResumeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [failed, setFailed] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const plan = searchParams.get("plan")
    if (!plan || !VALID_PLANS.includes(plan as Plan)) {
      router.replace("/pricing")
      return
    }

    ;(async () => {
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ purchaseType: plan }),
        })
        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
        } else {
          setFailed(true)
        }
      } catch {
        setFailed(true)
      }
    })()
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      {failed ? (
        <>
          <p className="text-[16px] font-semibold text-ink">Couldn&apos;t start checkout</p>
          <p className="mt-1 text-[14px] text-tertiary">Please head back to pricing and try again.</p>
          <button
            onClick={() => router.replace("/pricing")}
            className="btn-primary mt-5 justify-center px-5 py-2.5 text-[14px] font-semibold"
          >
            Back to pricing
          </button>
        </>
      ) : (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <p className="mt-4 text-[15px] font-medium text-ink">Redirecting to secure checkout&hellip;</p>
          <p className="mt-1 text-[13px] text-tertiary">One moment while we set up your subscription.</p>
        </>
      )}
    </div>
  )
}
