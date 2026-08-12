"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { DownloadIcon, MailIcon, Loader2Icon } from "lucide-react"
import { getPostHogDistinctId, track } from "@/lib/utils/analytics"

const STORAGE_KEY = "exit-intent-shown"

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const triggered = useRef(false)

  const showPopup = useCallback(() => {
    if (triggered.current) return
    // Don't show if already shown in this session or previously submitted
    if (sessionStorage.getItem(STORAGE_KEY)) return
    if (localStorage.getItem(STORAGE_KEY)) return

    triggered.current = true
    sessionStorage.setItem(STORAGE_KEY, "1")
    setOpen(true)
    track("free_sample_opened", { source: "exit_intent" })
  }, [])

  useEffect(() => {
    // Desktop: detect mouse leaving the viewport (top of page)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        showPopup()
      }
    }

    // Mobile: detect back button / tab switch via visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        showPopup()
      }
    }

    document.addEventListener("mouseleave", handleMouseLeave)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [showPopup])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || loading) return

    setLoading(true)
    try {
      const res = await fetch("/api/free-sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          source: "exit_intent",
          posthogDistinctId: getPostHogDistinctId(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Something went wrong")
      }

      setSubmitted(true)
      track("free_sample_submitted", { source: "exit_intent" })
      localStorage.setItem(STORAGE_KEY, "1")
      toast.success("Check your email for the download link!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-success-bg">
              <MailIcon className="size-6 text-success" />
            </div>
            <DialogHeader className="items-center">
              <DialogTitle className="text-lg">Check Your Email!</DialogTitle>
              <DialogDescription>
                We&apos;ve sent a download link for your free sample of 500 real estate agent contacts to <strong className="text-foreground">{email}</strong>.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => setOpen(false)} className="mt-2">
              Got it
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-accent-light">
                  <DownloadIcon className="size-5 text-accent" />
                </div>
                <DialogTitle className="text-lg">Wait — Free Sample!</DialogTitle>
              </div>
              <DialogDescription className="pt-1">
                Before you go, grab a <strong className="text-foreground">free sample of 500 verified real estate agent contacts</strong> — name, email, phone, and state. No credit card required.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Input
                type="email"
                placeholder="Enter your email address"
                aria-label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
                autoFocus
              />
              <Button type="submit" disabled={loading} className="h-11 w-full gap-2">
                {loading ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <DownloadIcon className="size-4" />
                    Send Me the Free Sample
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                No spam. Just the CSV download link.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
