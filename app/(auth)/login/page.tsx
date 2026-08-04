"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { LogoIcon } from "@/components/ui/Logo"
import {
  buildAuthCallbackUrl,
  sanitizeAuthReturnPath,
} from "@/lib/auth-redirect"
import { createClient } from "@/lib/supabase/client"

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
  const [googleLoading, setGoogleLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const searchParams = useSearchParams()
  const next = sanitizeAuthReturnPath(searchParams.get("next"))
  const isBusy = loading || googleLoading

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: buildAuthCallbackUrl(window.location.origin, next),
        },
      })

      if (signInError) {
        setError(signInError.message)
        setGoogleLoading(false)
      }
    } catch {
      setError("Unable to start Google sign-in. Please try again.")
      setGoogleLoading(false)
    }
  }

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
          <LogoIcon className="mx-auto mb-4 h-10 w-10" />
          <h1 className="text-[22px] font-semibold text-ink">Sign in to USAgentLeads</h1>
          <p className="mt-1 text-[14px] text-tertiary">
            Choose Google or receive a magic link by email
          </p>
        </div>

        <div className="rounded-xl border border-border bg-white p-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isBusy}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-black px-4 py-3 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {googleLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <GoogleIcon />
                Continue with Google
              </>
            )}
          </button>

          <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[12px] font-medium text-tertiary">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {sent ? (
            <div className="rounded-lg border border-border bg-page p-5 text-center">
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
                type="button"
                onClick={() => { setSent(false); setEmail("") }}
                className="mt-4 text-[13px] font-medium text-accent hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-ink">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isBusy}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-page px-3 py-2.5 text-[14px] text-ink placeholder:text-tertiary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isBusy}
                className="btn-primary mt-4 w-full justify-center py-2.5 text-[14px] font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send Magic Link"
                )}
              </button>
            </form>
          )}

          {error && (
            <p className="mt-3 text-[13px] text-danger" role="alert">{error}</p>
          )}
        </div>

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

function GoogleIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3A12 12 0 1 1 32 15l5.7-5.7A20 20 0 1 0 44 24c0-1.3-.1-2.7-.4-3.9Z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8A12 12 0 0 1 32 15l5.7-5.7A20 20 0 0 0 6.3 14.7Z"
      />
      <path
        fill="#4CAF50"
        d="M24 44a20 20 0 0 0 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.5 5A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9Z"
      />
    </svg>
  )
}
