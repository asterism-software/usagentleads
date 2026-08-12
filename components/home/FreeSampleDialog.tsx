"use client"

import { useState } from "react"
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
import { DownloadIcon, CheckCircle2Icon, Loader2Icon, FileSpreadsheetIcon } from "lucide-react"
import { getPostHogDistinctId, track } from "@/lib/utils/analytics"

interface FreeSampleDialogProps {
  /** Capture-point label stored with the lead, e.g. "home_hero" or "state_fl". */
  source?: string
  /** Override the trigger button styling (defaults to the compact accent button). */
  triggerClassName?: string
  /** Override the trigger button label. */
  triggerLabel?: string
}

export function FreeSampleDialog({
  source = "home_hero",
  triggerClassName = "inline-flex items-center gap-1.5 rounded-lg bg-accent text-white text-[13px] font-medium px-4 py-2.5 min-h-[44px] hover:bg-accent-hover transition-colors",
  triggerLabel = "Download Free Sample",
}: FreeSampleDialogProps = {}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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
          source,
          posthogDistinctId: getPostHogDistinctId(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Something went wrong")
      }

      setSubmitted(true)
      track("free_sample_submitted", { source })
      toast.success("Check your email for the download link!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setSubmitted(false); setEmail(""); track("free_sample_opened", { source }) }}
        className={triggerClassName}
      >
        <DownloadIcon size={13} />
        {triggerLabel}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-110 p-0 overflow-hidden">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-success-bg">
                <CheckCircle2Icon className="size-7 text-success" />
              </div>
              <DialogHeader className="items-center gap-1">
                <DialogTitle className="text-[18px] text-ink">Check Your Email!</DialogTitle>
                <DialogDescription className="text-[14px] text-tertiary leading-relaxed">
                  We&apos;ve sent a download link to <strong className="text-ink font-medium">{email}</strong>. The link expires in 7 days.
                </DialogDescription>
              </DialogHeader>
              <button onClick={() => setOpen(false)} className="btn-primary text-[14px] px-6 py-2.5 mt-2">
                Got it
              </button>
            </div>
          ) : (
            <>
              {/* Header bar */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-subtle">
                <div className="flex size-10 items-center justify-center rounded-xl bg-accent-light border border-accent-mid">
                  <FileSpreadsheetIcon className="size-5 text-accent" />
                </div>
                <div>
                  <DialogTitle className="text-[16px] text-ink font-semibold">Free Sample — 500 Contacts</DialogTitle>
                  <p className="text-[13px] text-tertiary mt-0.5">CSV file &middot; No credit card required</p>
                </div>
              </div>

              <div className="px-5 py-5">
                {/* What's included */}
                <div className="rounded-xl border border-border bg-subtle px-4 py-3 mb-5">
                  <p className="text-[12px] font-mono font-medium text-tertiary uppercase tracking-wider mb-2.5">What&apos;s included</p>
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-[13px] text-body">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-accent" />
                      Full Name
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-accent" />
                      Email Address
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-accent" />
                      Phone Number
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-accent" />
                      State
                    </span>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <div>
                    <label htmlFor="free-sample-email" className="text-[13px] font-medium text-ink mb-1.5 block">
                      Email address
                    </label>
                    <Input
                      id="free-sample-email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 text-[14px]"
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="h-11 w-full gap-2 text-[14px]">
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
                  <p className="text-center text-[12px] text-muted">
                    No spam, ever. We&apos;ll send one email with the download link.
                  </p>
                </form>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
