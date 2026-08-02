"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Loader2 } from "lucide-react"

export function SupportWidget() {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Something went wrong.")
      } else {
        setSent(true)
        form.reset()
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={panelRef}>
      {/* Panel */}
      {open && (
        <div className="absolute bottom-16 right-0 w-80 bg-white border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-accent text-white">
            <span className="text-[15px] font-semibold">Contact Support</span>
            <button
              onClick={() => { setOpen(false); setSent(false); setError("") }}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Close support"
            >
              <X size={16} />
            </button>
          </div>

          {sent ? (
            <div className="px-5 py-10 text-center">
              <div className="w-10 h-10 rounded-full bg-success-bg border border-success/20 flex items-center justify-center mx-auto mb-3">
                <Send size={16} className="text-success" />
              </div>
              <p className="text-[15px] font-semibold text-ink">Message sent</p>
              <p className="text-[13px] text-tertiary mt-1">
                We&apos;ll get back to you within 24 hours.
              </p>
              <button
                onClick={() => { setSent(false); setOpen(false) }}
                className="btn-outline text-[13px] px-4 py-1.5 mt-5"
              >
                Close
              </button>
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="p-5 space-y-3">
              {/* Honeypot */}
              <input type="text" name="_honey" className="hidden" tabIndex={-1} autoComplete="off" />

              <div>
                <label htmlFor="sw-name" className="text-[12px] font-medium text-tertiary uppercase tracking-wide">
                  Name
                </label>
                <input
                  id="sw-name"
                  name="name"
                  type="text"
                  required
                  maxLength={100}
                  className="mt-1 w-full px-3 py-2 text-[14px] border border-border rounded-lg bg-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>

              <div>
                <label htmlFor="sw-email" className="text-[12px] font-medium text-tertiary uppercase tracking-wide">
                  Email
                </label>
                <input
                  id="sw-email"
                  name="email"
                  type="email"
                  required
                  maxLength={200}
                  className="mt-1 w-full px-3 py-2 text-[14px] border border-border rounded-lg bg-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>

              <div>
                <label htmlFor="sw-message" className="text-[12px] font-medium text-tertiary uppercase tracking-wide">
                  Message
                </label>
                <textarea
                  id="sw-message"
                  name="message"
                  required
                  rows={3}
                  maxLength={2000}
                  className="mt-1 w-full px-3 py-2 text-[14px] border border-border rounded-lg bg-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
                />
              </div>

              {error && (
                <p className="text-[13px] text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center text-[14px] py-2.5 disabled:opacity-60"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : "Send Message"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => { setOpen(!open); setSent(false); setError("") }}
        className="w-12 h-12 rounded-full bg-accent text-white shadow-lg hover:bg-accent/90 hover:shadow-xl hover:scale-105 transition-all duration-150 flex items-center justify-center"
        aria-label={open ? "Close support" : "Open support"}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </div>
  )
}
