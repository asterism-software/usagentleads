"use client"

import { useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  Copy,
  Gauge,
  Key,
  Lock,
  Menu,
  Server,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react"
import { ApiUpgradeButton } from "@/components/dashboard/ApiUpgradeButton"
import { useDashboard } from "@/components/dashboard/DashboardContext"

const navigation = [
  ["overview", "Overview"],
  ["authentication", "Authentication"],
  ["rate-limits", "Rate limits"],
  ["responses", "Response format"],
  ["agents", "Agents endpoint"],
  ["errors", "Error codes"],
  ["examples", "Code examples"],
] as const

const examples = {
  curl: `curl -H "X-API-Key: sk_live_YOUR_KEY" \\\n+  "https://www.usagentleads.com/api/v1/agents?state=CA&page=1&pageSize=25"`,
  javascript: `const response = await fetch(
  "https://www.usagentleads.com/api/v1/agents?state=TX&pageSize=50",
  { headers: { "X-API-Key": process.env.US_AGENT_LEADS_API_KEY } }
);

if (!response.ok) throw new Error(await response.text());
const { data, count, page, totalPages, quota } = await response.json();`,
  python: `import os, requests

response = requests.get(
    "https://www.usagentleads.com/api/v1/agents",
    params={"state": "NY", "pageSize": 50},
    headers={"X-API-Key": os.environ["US_AGENT_LEADS_API_KEY"]},
    timeout=30,
)
response.raise_for_status()
result = response.json()`,
}

const successResponse = `{
  "data": [
    {
      "id": "a21f…",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+1 415 555 0198",
      "state": "California"
    }
  ],
  "count": 42318,
  "page": 1,
  "totalPages": 1693,
  "quota": {
    "used": 148,
    "limit": 10000,
    "resets_at": "2026-09-01T00:00:00.000Z"
  }
}`

const errorResponse = `{
  "error": "Invalid API key"
}`

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }
  return <button onClick={copy} className="rounded-md p-1.5 text-muted hover:bg-white/10 hover:text-white" aria-label="Copy code">{copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}</button>
}

function CodeBlock({ title, value }: { title: string; value: string }) {
  return <div className="overflow-hidden rounded-xl bg-ink"><div className="flex items-center justify-between border-b border-white/10 px-4 py-2"><span className="font-mono text-[11px] uppercase tracking-wider text-muted">{title}</span><CopyButton value={value} /></div><pre className="overflow-x-auto whitespace-pre p-4 text-[12px] leading-relaxed text-code-text sm:text-[13px]"><code>{value}</code></pre></div>
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow?: string; title: string; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-24 border-b border-border py-10 last:border-0 sm:py-12">{eyebrow && <p className="label-eyebrow mb-2">{eyebrow}</p>}<h2 className="text-[23px] font-semibold tracking-tight text-ink">{title}</h2><div className="mt-5">{children}</div></section>
}

export default function DashboardApiDocsPage() {
  const { access, totalCount } = useDashboard()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [language, setLanguage] = useState<keyof typeof examples>("curl")

  return (
    <div className="min-h-full bg-white">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-white/95 px-4 py-3 backdrop-blur lg:hidden"><div className="flex items-center gap-2 text-[14px] font-semibold text-ink"><BookOpen size={17} className="text-accent" /> API Reference</div><button onClick={() => setMobileNavOpen((value) => !value)} className="rounded-lg border border-border p-2 text-body" aria-expanded={mobileNavOpen} aria-label="Toggle documentation navigation">{mobileNavOpen ? <X size={17} /> : <Menu size={17} />}</button></div>
      {mobileNavOpen && <nav className="sticky top-[57px] z-20 grid border-b border-border bg-white px-4 py-3 shadow-sm lg:hidden">{navigation.map(([id, label]) => <a key={id} href={`#${id}`} onClick={() => setMobileNavOpen(false)} className="rounded-lg px-3 py-2 text-[13px] text-body hover:bg-subtle hover:text-ink">{label}</a>)}</nav>}

      <div className="mx-auto flex max-w-7xl gap-10 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <aside className="sticky top-8 hidden h-fit w-52 shrink-0 lg:block"><div className="mb-8 flex items-center gap-2 text-[15px] font-semibold text-ink"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-light text-accent"><BookOpen size={17} /></span>API Reference</div><p className="label-eyebrow mb-3">Documentation</p><nav className="space-y-1">{navigation.map(([id, label]) => <a key={id} href={`#${id}`} className="block rounded-lg px-3 py-2 text-[13px] text-tertiary transition-colors hover:bg-accent-light hover:text-accent">{label}</a>)}</nav><div className="mt-8 border-t border-border pt-5"><Link href="/dashboard/api-keys" className="flex items-center gap-2 text-[13px] font-medium text-accent hover:underline"><Key size={14} /> Manage API keys</Link></div></aside>

        <main className="min-w-0 flex-1">
          <section id="overview" className="scroll-mt-24 border-b border-border pb-10 sm:pb-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-light px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent"><Server size={12} /> REST API v1</span>
            <h1 className="mt-5 max-w-3xl text-[34px] font-semibold leading-tight tracking-tight text-ink sm:text-[42px]">Build with verified US real estate agent data</h1>
            <p className="mt-5 max-w-3xl text-[16px] leading-7 text-body">Search and paginate {totalCount ? totalCount.toLocaleString() : "1M+"} verified agent records through a secure, read-only JSON API designed for server-side integrations.</p>

            {!access.hasApi && <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-accent/25 bg-accent-light/50 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><Lock className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><div><p className="text-[14px] font-semibold text-ink">Complete documentation preview</p><p className="mt-1 text-[13px] text-body">Every guide and example is visible. A Pro API plan is required to create keys and call the endpoint.</p></div></div><ApiUpgradeButton className="shrink-0" /></div>}

            <div className="mt-8 rounded-2xl border border-border bg-subtle/40 p-4 sm:flex sm:items-center sm:justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Base URL</p><code className="mt-1 block break-all text-[13px] font-medium text-ink">https://www.usagentleads.com/api/v1</code></div><div className="mt-3 sm:mt-0"><CopyButton value="https://www.usagentleads.com/api/v1" /></div></div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3"><a href="#authentication" className="group rounded-2xl border border-border p-4 transition hover:border-accent/30 hover:shadow-sm"><Key size={18} className="text-accent" /><p className="mt-3 text-[14px] font-semibold text-ink">Authenticate</p><p className="mt-1 text-[12px] leading-relaxed text-body">Add an API key to every request.</p><ArrowRight size={14} className="mt-3 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" /></a><a href="#agents" className="group rounded-2xl border border-border p-4 transition hover:border-accent/30 hover:shadow-sm"><Code2 size={18} className="text-accent" /><p className="mt-3 text-[14px] font-semibold text-ink">Query agents</p><p className="mt-1 text-[12px] leading-relaxed text-body">Filter by state, name, or email.</p><ArrowRight size={14} className="mt-3 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" /></a><a href="#rate-limits" className="group rounded-2xl border border-border p-4 transition hover:border-accent/30 hover:shadow-sm"><Gauge size={18} className="text-accent" /><p className="mt-3 text-[14px] font-semibold text-ink">Understand limits</p><p className="mt-1 text-[12px] leading-relaxed text-body">Plan safely around quotas.</p><ArrowRight size={14} className="mt-3 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" /></a></div>
          </section>

          <Section id="authentication" eyebrow="Getting started" title="Authentication"><p className="max-w-3xl text-[14px] leading-7 text-body">Send your key through <code className="rounded bg-subtle px-1.5 py-0.5 font-mono text-[12px] text-ink">X-API-Key</code> (recommended), or as a Bearer token in the Authorization header. Keys are secrets: keep them in server-side environment variables and never commit them to source control.</p><div className="mt-5 flex gap-1 border-b border-border">{(Object.keys(examples) as (keyof typeof examples)[]).map((item) => <button key={item} onClick={() => setLanguage(item)} className={`border-b-2 px-3 py-2 text-[12px] font-medium capitalize ${language === item ? "border-accent text-accent" : "border-transparent text-tertiary hover:text-ink"}`}>{item}</button>)}</div><div className="mt-4"><CodeBlock title={language} value={examples[language]} /></div><div className="mt-5 flex gap-3 rounded-xl border border-warning/30 bg-warning-bg p-4"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" /><p className="text-[13px] leading-relaxed text-body"><strong className="font-semibold text-ink">Protect your credentials.</strong> API keys are shown in full only once. Revoke a key immediately if it may have been exposed.</p></div></Section>

          <Section id="rate-limits" eyebrow="Reliability" title="Rate limits & quota"><p className="max-w-3xl text-[14px] leading-7 text-body">Limits are enforced per key for short bursts and per account for monthly usage. Only successful responses count against the monthly quota.</p><div className="mt-6 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-border p-5"><Zap size={18} className="text-accent" /><p className="mt-4 text-[22px] font-semibold text-ink">60</p><p className="text-[12px] text-body">requests per minute, per key</p></div><div className="rounded-2xl border border-border p-5"><Gauge size={18} className="text-accent" /><p className="mt-4 text-[22px] font-semibold text-ink">10,000</p><p className="text-[12px] text-body">successful requests per UTC month</p></div><div className="rounded-2xl border border-border p-5"><ShieldCheck size={18} className="text-accent" /><p className="mt-4 text-[22px] font-semibold text-ink">3</p><p className="text-[12px] text-body">active API keys per account</p></div></div><div className="mt-6 overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[580px] text-left text-[12px]"><thead className="bg-subtle/50 text-muted"><tr><th className="px-4 py-3 font-medium">Response header</th><th className="px-4 py-3 font-medium">Meaning</th></tr></thead><tbody className="divide-y divide-border">{[["X-RateLimit-Remaining","Requests remaining in the current minute"],["X-Monthly-Quota-Limit","Monthly request allowance"],["X-Monthly-Quota-Remaining","Successful requests remaining this month"]].map(([name, meaning]) => <tr key={name}><td className="px-4 py-3 font-mono text-accent">{name}</td><td className="px-4 py-3 text-body">{meaning}</td></tr>)}</tbody></table></div></Section>

          <Section id="responses" eyebrow="JSON" title="Response format"><p className="max-w-3xl text-[14px] leading-7 text-body">Successful responses include records, pagination metadata, and current quota usage. Errors return a stable JSON error message with an appropriate HTTP status.</p><div className="mt-6 grid gap-4 xl:grid-cols-2"><div><div className="mb-2 flex items-center gap-2 text-[12px] font-medium text-success"><CheckCircle2 size={14} /> Success response</div><CodeBlock title="200 OK" value={successResponse} /></div><div><div className="mb-2 flex items-center gap-2 text-[12px] font-medium text-danger"><AlertTriangle size={14} /> Error response</div><CodeBlock title="401 Unauthorized" value={errorResponse} /></div></div></Section>

          <Section id="agents" eyebrow="Endpoint" title="Search agents"><div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-subtle/40 px-4 py-3"><span className="rounded-md bg-success-bg px-2 py-1 font-mono text-[11px] font-semibold text-success">GET</span><code className="text-[13px] font-medium text-ink">/api/v1/agents</code></div><p className="mt-5 max-w-3xl text-[14px] leading-7 text-body">Returns paginated agent records. Combine optional filters to narrow the result set; omit them to browse the full database.</p><div className="mt-6 overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[650px] text-left text-[12px]"><thead className="bg-subtle/50 text-muted"><tr><th className="px-4 py-3 font-medium">Parameter</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Required</th><th className="px-4 py-3 font-medium">Description</th></tr></thead><tbody className="divide-y divide-border">{[["state","string","No","Two-letter state code, such as CA or TX"],["search","string","No","Partial, case-insensitive name or email match"],["page","integer","No","Page number; defaults to 1"],["pageSize","integer","No","Records per page: 25, 50, or 100"]].map((row) => <tr key={row[0]}><td className="px-4 py-3 font-mono text-accent">{row[0]}</td><td className="px-4 py-3 text-tertiary">{row[1]}</td><td className="px-4 py-3 text-tertiary">{row[2]}</td><td className="px-4 py-3 text-body">{row[3]}</td></tr>)}</tbody></table></div><details className="mt-5 rounded-xl border border-border" open><summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[13px] font-semibold text-ink">Example request & response <ChevronDown size={15} /></summary><div className="space-y-4 border-t border-border p-4"><CodeBlock title="Request" value={examples.curl} /><CodeBlock title="200 response" value={successResponse} /></div></details></Section>

          <Section id="errors" eyebrow="Troubleshooting" title="Error codes"><div className="space-y-3">{[["400","Bad request","A query parameter is invalid."],["401","Unauthorized","The API key is missing, invalid, revoked, or expired."],["403","Forbidden","The subscription is inactive or Pro API access is required."],["429","Too many requests","The minute rate limit or monthly quota was exceeded."],["500","Internal server error","The agent query could not be completed."]].map(([code, title, description]) => <div key={code} className="grid gap-2 rounded-xl border border-border p-4 sm:grid-cols-[56px_150px_1fr] sm:items-center"><code className="font-mono text-[13px] font-semibold text-ink">{code}</code><p className="text-[13px] font-medium text-ink">{title}</p><p className="text-[13px] text-body">{description}</p></div>)}</div></Section>

          <Section id="examples" eyebrow="SDK-free" title="Code examples"><p className="max-w-3xl text-[14px] leading-7 text-body">USAgentLeads uses standard HTTP, so you can integrate with any language or automation platform that supports authenticated REST requests.</p><div className="mt-6 space-y-5"><CodeBlock title="JavaScript / TypeScript" value={examples.javascript} /><CodeBlock title="Python" value={examples.python} /></div></Section>

          <section className="my-10 overflow-hidden rounded-3xl bg-ink p-6 text-white sm:p-8"><div className="max-w-2xl"><p className="text-[11px] font-semibold uppercase tracking-wider text-blue-300">Ready to integrate?</p><h2 className="mt-3 text-[24px] font-semibold">Connect verified agent data to your workflow.</h2><p className="mt-3 text-[14px] leading-relaxed text-gray-300">Create a key, make your first request, and monitor usage from the API Access dashboard.</p><div className="mt-6 flex flex-wrap gap-3">{access.hasApi ? <Link href="/dashboard/api-keys" className="btn-primary justify-center"><Key size={14} /> Manage API keys</Link> : <ApiUpgradeButton />}<Link href="/dashboard/support" className="inline-flex items-center justify-center rounded-lg border border-white/20 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10">Get integration help</Link></div></div></section>
        </main>
      </div>
    </div>
  )
}
