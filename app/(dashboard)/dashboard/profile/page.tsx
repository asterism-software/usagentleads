"use client"

import { useState } from "react"
import { BadgeCheck, CalendarDays, Loader2, LogOut, Mail, Shield } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useDashboard } from "@/components/dashboard/DashboardContext"

export default function ProfilePage() {
  const { user } = useDashboard()
  const [signingOut, setSigningOut] = useState(false)
  const initials = user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase() || "U"
  const provider = user.provider === "email" ? "Email magic link" : user.provider === "google" ? "Google" : user.provider.charAt(0).toUpperCase() + user.provider.slice(1)
  const providerDescription = user.provider === "google" ? "OAuth authentication" : user.provider === "email" ? "Passwordless email authentication" : "Secure authentication provider"

  const signOut = async () => {
    setSigningOut(true)
    await createClient().auth.signOut()
    window.location.assign("/")
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-gradient-to-b from-white via-page to-white">
      <div className="pointer-events-none absolute inset-0 -z-10"><div className="absolute left-[5%] top-[10%] h-80 w-80 rounded-full bg-accent/[0.07] blur-[110px]" /><div className="absolute right-[5%] top-[35%] h-72 w-72 rounded-full bg-accent/[0.05] blur-[100px]" /></div>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-8"><h1 className="text-[28px] font-semibold tracking-tight text-ink sm:text-[30px]">Profile</h1><p className="mt-2 text-[15px] text-body">View your account information and authentication details.</p></header>

        <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-8 flex items-center gap-5 sm:gap-6">
            {user.avatarUrl ? (
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white shadow-md ring-1 ring-border sm:h-24 sm:w-24">
                {/* Provider avatars are dynamic trusted user metadata. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
              </div>
            ) : <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-accent text-[25px] font-semibold text-white shadow-md ring-1 ring-border sm:h-24 sm:w-24">{initials}</span>}
            <div className="min-w-0"><h2 className="truncate text-[22px] font-semibold text-ink sm:text-[24px]">{user.name || user.email.split("@")[0]}</h2><p className="mt-1 text-[13px] text-tertiary">USAgentLeads Member</p></div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-subtle/35 p-5"><div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary"><Mail size={15} /> Email Address</div><p className="break-all text-[14px] font-medium text-ink">{user.email}</p><p className={`mt-1 flex items-center gap-1 text-[11px] ${user.emailVerified ? "text-success" : "text-warning"}`}>{user.emailVerified && <BadgeCheck size={12} />}{user.emailVerified ? "Verified" : "Pending verification"}</p></div>
            <div className="rounded-2xl border border-border bg-subtle/35 p-5"><div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary"><Shield size={15} /> Sign-in Method</div><p className="text-[14px] font-medium text-ink">{provider}</p><p className="mt-1 text-[11px] text-muted">{providerDescription}</p></div>
            <div className="rounded-2xl border border-border bg-subtle/35 p-5"><div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary"><CalendarDays size={15} /> Member Since</div><p className="text-[14px] font-medium text-ink">{new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p><p className="mt-1 text-[11px] text-muted">Account creation date</p></div>
          </div>

          <div className="mt-8 rounded-xl border border-accent/20 bg-accent-light/50 p-4"><p className="text-[13px] leading-relaxed text-body"><strong className="font-semibold text-ink">Profile management:</strong> Your name and profile image come from your {provider} account. Contact support if your account identity needs correction.</p></div>

          <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-[14px] font-semibold text-ink">Account session</h3><p className="mt-1 text-[13px] text-tertiary">End your USAgentLeads session on this device.</p></div><button onClick={signOut} disabled={signingOut} className="btn-outline w-fit justify-center text-danger hover:text-danger disabled:opacity-60">{signingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}{signingOut ? "Signing out…" : "Sign out"}</button></div>
        </section>
      </div>
    </div>
  )
}
