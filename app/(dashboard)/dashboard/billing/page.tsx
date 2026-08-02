"use client"

import { useState } from "react"
import Link from "next/link"
import {
  CalendarDays,
  Check,
  CreditCard,
  DollarSign,
  ExternalLink,
  Loader2,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react"
import { toast } from "sonner"
import { ApiUpgradeButton } from "@/components/dashboard/ApiUpgradeButton"
import { useDashboard } from "@/components/dashboard/DashboardContext"
import { planLabel } from "@/lib/subscriptions"

function dateLabel(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Not available"
}

export default function BillingPage() {
  const { subscription: initial, access } = useDashboard()
  const [subscription, setSubscription] = useState(initial)
  const [working, setWorking] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const isLegacy = subscription.billing_provider !== "stripe"
  const isApiPlan = subscription.plan === "pro_api"
  const amount = isApiPlan ? "$79" : "$49"
  const accessEnd = subscription.trial_ends_at || subscription.current_period_end
  const activeLabel = isLegacy ? "Billing migration needed" : subscription.cancel_at_period_end ? "Cancellation scheduled" : subscription.status === "on_trial" ? "Trial active" : "Subscription active"
  const detailRows = [
    ["Current plan", planLabel(subscription.plan)],
    ["Status", subscription.cancel_at_period_end ? "Cancels at period end" : subscription.status === "on_trial" ? "Trial" : "Active"],
    ["Amount", `${amount} / month`],
    [subscription.cancel_at_period_end ? "Access ends" : subscription.status === "on_trial" ? "Trial ends" : "Next billing date", dateLabel(accessEnd)],
    ["Subscription started", dateLabel(subscription.current_period_start || subscription.created_at)],
  ]

  const mutateSubscription = async (method: "DELETE" | "PATCH") => {
    setWorking(true)
    try {
      const response = await fetch("/api/subscription", { method })
      const data = await response.json()
      if (!response.ok && response.status !== 202) throw new Error(data.error || "Unable to update subscription")
      const cancelled = method === "DELETE"
      setSubscription((current) => ({ ...current, cancel_at_period_end: cancelled }))
      setConfirmCancel(false)
      toast.success(cancelled ? "Cancellation scheduled" : "Subscription resumed")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update subscription")
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-gradient-to-b from-white via-page to-white">
      <div className="pointer-events-none absolute inset-0 -z-10"><div className="absolute left-[5%] top-[10%] h-80 w-80 rounded-full bg-accent/[0.07] blur-[110px]" /><div className="absolute right-[5%] top-[35%] h-72 w-72 rounded-full bg-accent/[0.05] blur-[100px]" /></div>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-8"><h1 className="text-[28px] font-semibold tracking-tight text-ink sm:text-[30px]">Billing & Subscription</h1><p className="mt-2 text-[15px] text-body">Manage your subscription plan and billing information.</p></header>

        <section className={`mb-6 rounded-3xl border p-5 sm:p-6 ${subscription.cancel_at_period_end || isLegacy ? "border-warning/30 bg-gradient-to-r from-warning-bg to-white" : "border-success/25 bg-gradient-to-r from-success-bg to-white"}`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${subscription.cancel_at_period_end || isLegacy ? "bg-warning" : "bg-success"}`} /><p className={`text-[12px] font-bold uppercase tracking-wider ${subscription.cancel_at_period_end || isLegacy ? "text-warning" : "text-success"}`}>{activeLabel}</p></div><h2 className="mt-3 text-[24px] font-semibold text-ink">{planLabel(subscription.plan)} Plan</h2><p className="mt-1 text-[14px] text-body">{subscription.cancel_at_period_end ? `Access remains available through ${dateLabel(accessEnd)}.` : subscription.status === "on_trial" ? `Your trial continues through ${dateLabel(accessEnd)}.` : "Your subscription is current and dashboard access is active."}</p></div><div className="sm:text-right"><p className="text-[30px] font-bold tracking-tight text-ink">{amount}</p><p className="text-[12px] text-tertiary">per month</p></div></div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-light text-accent"><CreditCard size={20} /></span><div><h2 className="text-[17px] font-semibold text-ink">Subscription Details</h2><p className="text-[12px] text-body">Your current plan and renewal information.</p></div></div><dl className="divide-y divide-border">{detailRows.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-5 py-3.5"><dt className="text-[13px] text-tertiary">{label}</dt><dd className="text-right text-[13px] font-medium text-ink">{value}</dd></div>)}</dl><div className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-subtle/40 p-4"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-accent" /><p className="text-[12px] leading-relaxed text-body">Payments and payment details are handled securely by Stripe. USAgentLeads does not store your card number.</p></div></section>

          <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-light text-accent"><DollarSign size={20} /></span><div><h2 className="text-[17px] font-semibold text-ink">Manage Subscription</h2><p className="text-[12px] text-body">Update billing or make changes to your plan.</p></div></div><div className="space-y-3">{isLegacy ? <Link href="/dashboard/support" className="btn-primary w-full justify-center">Contact support about billing</Link> : <button onClick={() => window.location.assign("/api/billing-portal")} className="btn-primary w-full justify-center">Open Stripe billing portal <ExternalLink size={14} /></button>}{!isLegacy && (subscription.cancel_at_period_end ? <button onClick={() => mutateSubscription("PATCH")} disabled={working} className="btn-outline w-full justify-center disabled:opacity-60">{working ? <Loader2 size={14} className="animate-spin" /> : "Resume subscription"}</button> : <button onClick={() => setConfirmCancel(true)} className="btn-outline w-full justify-center text-danger hover:text-danger">Cancel subscription</button>)}</div><div className="mt-6 rounded-xl bg-subtle/45 p-4"><div className="mb-2 flex items-center gap-2 text-[13px] font-medium text-ink"><CalendarDays size={15} className="text-accent" /> Billing assistance</div><p className="text-[12px] leading-relaxed text-body">Need an invoice, plan clarification, or help with a legacy subscription? Our support team can review your account.</p><Link href="/dashboard/support" className="mt-3 inline-flex text-[12px] font-medium text-accent hover:underline">Contact support →</Link></div></section>
        </div>

        {!access.hasApi && <section className="mt-6 rounded-3xl border border-accent/20 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[15px] font-semibold text-ink">Add programmatic access</p><p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-body">Pro API includes everything in Pro Dashboard, plus API keys, complete documentation, activity analytics, and 10,000 requests per month.</p></div><ApiUpgradeButton className="shrink-0" /></div></section>}
      </div>

      {confirmCancel && <><div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmCancel(false)} /><div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"><div className="pointer-events-auto w-full max-w-sm rounded-xl border border-border bg-white p-6 shadow-xl"><span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger"><TriangleAlert size={19} /></span><h2 className="text-[17px] font-semibold text-ink">Cancel subscription?</h2><p className="mt-2 text-[14px] leading-relaxed text-body">You will keep access until {dateLabel(subscription.current_period_end)} and can resume before then.</p><div className="mt-6 flex gap-3"><button onClick={() => setConfirmCancel(false)} className="btn-outline flex-1 justify-center">Keep plan</button><button onClick={() => mutateSubscription("DELETE")} disabled={working} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-danger px-4 py-2.5 text-[14px] font-medium text-white disabled:opacity-60">{working ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Confirm</>}</button></div></div></div></>}
    </div>
  )
}
