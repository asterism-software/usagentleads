"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { LogoIcon } from "@/components/ui/Logo"

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const searchParams = useSearchParams()
  const next = searchParams.get("next") ?? "/dashboard"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next }),
      })

      if (!res.ok) {
        setError("Something went wrong. Please try again.")
      } else {
        setSent(true)
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <LogoIcon className="mx-auto mb-4 h-10 w-10 text-accent" />
          <h1 className="text-[22px] font-semibold text-ink">Sign in to USAgentLeads</h1>
          <p className="mt-1 text-[14px] text-tertiary">
            Enter your email to receive a magic link
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-border bg-white p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <Mail className="h-6 w-6 text-success" />
            </div>
            <h2 className="text-[16px] font-semibold text-ink">Check your email</h2>
            <p className="mt-1 text-[14px] text-tertiary">
              We sent a magic link to <span className="font-medium text-ink">{email}</span>
            </p>
            <p className="mt-3 text-[13px] text-tertiary">
              Click the link in your email to sign in. You can close this tab.
            </p>
            <button
              onClick={() => { setSent(false); setEmail("") }}
              className="mt-4 text-[13px] font-medium text-accent hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-white p-6">
            <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-ink">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border bg-page px-3 py-2.5 text-[14px] text-ink placeholder:text-tertiary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
            {error && (
              <p className="mt-2 text-[13px] text-danger">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-4 w-full justify-center py-2.5 text-[14px] font-semibold"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Send Magic Link"
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-tertiary transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
