"use client"

import { useState } from "react"
import Link from "next/link"
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  HelpCircle,
  LifeBuoy,
  Loader2,
  Mail,
} from "lucide-react"
import { useDashboard } from "@/components/dashboard/DashboardContext"
import { CustomSelect } from "@/components/ui/CustomSelect"

const supportTopics = [
  { value: "account", label: "Account" },
  { value: "billing", label: "Billing" },
  { value: "api", label: "API integration" },
  { value: "data", label: "Data question" },
  { value: "other", label: "Other" },
]

export default function SupportPage() {
  const { user } = useDashboard()
  const [category, setCategory] = useState("account")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSending(true)
    setError("")
    try {
      const response = await fetch("/api/dashboard/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category, subject, message }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to send request")
      setSent(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to send request")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-gradient-to-b from-white via-page to-white">
      <div className="pointer-events-none absolute inset-0 -z-10"><div className="absolute left-[5%] top-[10%] h-80 w-80 rounded-full bg-accent/[0.07] blur-[110px]" /><div className="absolute right-[5%] top-[35%] h-72 w-72 rounded-full bg-accent/[0.05] blur-[100px]" /></div>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-8 text-center"><h1 className="text-[28px] font-semibold tracking-tight text-ink sm:text-[30px]">Support & Help Center</h1><p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-body">Get help with your account, billing, data, or API integration. Our team responds during US business hours.</p></header>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm"><span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light text-accent"><BookOpen size={19} /></span><h2 className="text-[15px] font-semibold text-ink">Documentation</h2><p className="mt-2 text-[13px] leading-relaxed text-body">Browse authentication, endpoint, quota, response, and integration guides.</p><Link href="/dashboard/api-docs" className="mt-3 inline-flex text-[12px] font-semibold text-accent hover:underline">Open API reference →</Link></div>
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm"><span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-success-bg text-success"><Clock3 size={19} /></span><h2 className="text-[15px] font-semibold text-ink">Response Time</h2><p className="mt-2 text-[13px] leading-relaxed text-body">We typically respond within 24 hours, Monday–Friday, 9am–6pm EST.</p><div className="mt-3 inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /><span className="text-[12px] font-semibold text-success">Support available</span></div></div>
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm"><span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light text-accent"><Mail size={19} /></span><h2 className="text-[15px] font-semibold text-ink">Direct Email</h2><p className="mt-2 text-[13px] leading-relaxed text-body">Prefer email? Reach our support team directly from your inbox.</p><a href="mailto:support@usagentleads.com" className="mt-3 block break-all text-[12px] font-semibold text-accent hover:underline">support@usagentleads.com</a></div>
        </div>

        <section className="mb-8 overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
          {sent ? <div className="p-8 text-center sm:p-12"><span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-bg text-success"><CheckCircle2 size={22} /></span><h2 className="text-[19px] font-semibold text-ink">Request sent</h2><p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-body">We received your request from {user.email}. Our support team will reply by email.</p><button onClick={() => { setSent(false); setSubject(""); setMessage("") }} className="btn-outline mt-6 justify-center">Send another request</button></div> : <form onSubmit={submit}><div className="border-b border-border p-5 sm:px-8 sm:py-6"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-light text-accent"><LifeBuoy size={20} /></span><div><h2 className="text-[17px] font-semibold text-ink">Contact Support</h2><p className="mt-0.5 text-[12px] text-tertiary">Replies will be sent to {user.email}</p></div></div></div><div className="space-y-5 p-5 sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><div><label className="mb-1.5 block text-[13px] font-medium text-ink">Topic</label><CustomSelect value={category} options={supportTopics} onChange={setCategory} aria-label="Support topic" minWidth={0} /></div><div><label htmlFor="support-subject" className="mb-1.5 block text-[13px] font-medium text-ink">Subject</label><input id="support-subject" required minLength={3} maxLength={120} value={subject} onChange={(event) => setSubject(event.target.value)} className="input w-full" placeholder="How can we help?" /></div></div><div><label htmlFor="support-message" className="mb-1.5 block text-[13px] font-medium text-ink">Message</label><textarea id="support-message" required minLength={10} maxLength={5000} rows={8} value={message} onChange={(event) => setMessage(event.target.value)} className="input w-full resize-y" placeholder="Include any error message and what you were trying to do." /><p className="mt-1.5 text-right text-[11px] text-muted">{message.length} / 5,000</p></div>{error && <p role="alert" className="text-[13px] text-danger">{error}</p>}</div><div className="flex justify-end border-t border-border bg-subtle/30 p-5 sm:px-8"><button type="submit" disabled={sending} className="btn-primary min-w-36 justify-center disabled:opacity-60">{sending ? <Loader2 size={14} className="animate-spin" /> : "Send request"}</button></div></form>}
        </section>

        <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6"><div className="mb-4 flex items-center gap-2"><HelpCircle size={19} className="text-accent" /><h2 className="text-[17px] font-semibold text-ink">Additional Resources</h2></div><div className="grid gap-3 md:grid-cols-2"><Link href="/terms" className="flex items-center justify-between rounded-xl border border-border bg-subtle/30 px-4 py-3 text-[13px] font-medium text-body hover:border-accent/40 hover:bg-accent-light hover:text-ink"><span>Terms of Service</span><span className="text-accent">→</span></Link><Link href="/privacy" className="flex items-center justify-between rounded-xl border border-border bg-subtle/30 px-4 py-3 text-[13px] font-medium text-body hover:border-accent/40 hover:bg-accent-light hover:text-ink"><span>Privacy Policy</span><span className="text-accent">→</span></Link></div><div className="mt-6 rounded-xl border border-accent/20 bg-accent-light/50 p-4"><p className="text-[13px] leading-relaxed text-body"><strong className="font-semibold text-ink">Account info:</strong> You are signed in as <span className="font-medium text-ink">{user.email}</span>. This lets our team match the request to your subscription and account history.</p></div></section>
      </div>
    </div>
  )
}
