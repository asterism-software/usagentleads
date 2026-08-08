"use client"

import Link from "next/link"
import { useState } from "react"
import { CheckCircle2, CircleAlert, CircleHelp, Copy, ExternalLink, LoaderCircle, MailCheck, ShieldCheck } from "lucide-react"
import { FreeSampleDialog } from "@/components/home/FreeSampleDialog"
import type { DomainAuthenticationAnalysis } from "@/lib/tools/domainAuthentication"
import { track } from "@/lib/utils/analytics"

type CheckResponse = DomainAuthenticationAnalysis | { error: string }

function hasError(response: CheckResponse): response is { error: string } {
  return "error" in response
}

function StatusIcon({ status }: { status: "present" | "missing" | "attention" | "not_checked" }) {
  if (status === "present") return <CheckCircle2 size={18} className="text-success" />
  if (status === "not_checked") return <CircleHelp size={18} className="text-accent" />
  return <CircleAlert size={18} className="text-warning" />
}

function DnsCheck({
  title,
  status,
  detail,
  records,
}: {
  title: string
  status: "present" | "missing" | "attention" | "not_checked"
  detail: string
  records?: string[]
}) {
  const tone = status === "present" ? "border-success/20 bg-success-bg" : status === "not_checked" ? "border-accent-mid bg-accent-light" : "border-warning/30 bg-warning-bg"
  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex items-start gap-3">
        <StatusIcon status={status} />
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-ink">{title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-tertiary">{detail}</p>
          {records && records.length > 0 && (
            <div className="mt-3 space-y-2">
              {records.map((record) => (
                <code key={record} className="block break-all rounded-lg border border-black/5 bg-white/70 px-3 py-2 text-[11px] leading-relaxed text-body">
                  {record}
                </code>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function EmailDomainAuthenticationChecker() {
  const [domain, setDomain] = useState("")
  const [result, setResult] = useState<DomainAuthenticationAnalysis | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function runCheck(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setResult(null)
    setLoading(true)
    track("tool_started", { tool: "email_domain_authentication_checker" })

    try {
      const response = await fetch(`/api/tools/domain-authentication?domain=${encodeURIComponent(domain)}`)
      const payload = (await response.json()) as CheckResponse
      if (!response.ok || hasError(payload)) {
        setError(hasError(payload) ? payload.error : "We could not check that domain.")
        return
      }
      setResult(payload)
      track("tool_completed", {
        tool: "email_domain_authentication_checker",
        spf: payload.spf.status,
        dmarc: payload.dmarc.status,
      })
    } catch {
      setError("We could not check that domain. Confirm your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const spfDetail = !result
    ? ""
    : result.spf.status === "present"
      ? "One public SPF TXT record was found. Confirm it includes every system that sends mail for this domain."
      : result.spf.status === "attention"
        ? "More than one SPF TXT record was found. SPF normally expects a single published record; review this with your DNS or email provider."
        : "No SPF TXT record was found at this domain. Check your DNS provider and all of your sending services."
  const dmarcDetail = !result
    ? ""
    : result.dmarc.status === "present"
      ? `A DMARC record was found with a ${result.dmarc.policy ?? "published"} policy. Public DNS alone cannot confirm alignment or message-level passing results.`
      : result.dmarc.records.length > 0
        ? "A DMARC-looking record was found, but its policy could not be read. Review the syntax with your DNS or email provider."
        : "No usable DMARC TXT record was found at _dmarc for this domain."

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] lg:items-start">
      <section className="card p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-mid bg-accent-light text-accent">
            <ShieldCheck size={19} />
          </span>
          <div>
            <h2 className="text-[18px] font-semibold text-ink">Check public authentication records</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-tertiary">
              Enter the domain in your From address. We query only its public DNS TXT records—never inbox credentials or mailboxes.
            </p>
          </div>
        </div>

        <form onSubmit={runCheck} className="mt-6">
          <label htmlFor="domain" className="mb-1.5 block text-[13px] font-medium text-ink">Sending domain</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="domain"
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={253}
              placeholder="example.com"
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              className="input h-11 flex-1 text-[15px]"
              aria-describedby="domain-hint"
            />
            <button type="submit" className="btn-primary h-11 shrink-0 px-5" disabled={loading}>
              {loading ? <><LoaderCircle size={16} className="animate-spin" /> Checking…</> : <><MailCheck size={16} /> Check DNS</>}
            </button>
          </div>
          <p id="domain-hint" className="mt-2 text-[12px] leading-relaxed text-muted">
            Use a plain domain only—no URL, email address, path, or port.
          </p>
          {error && <p role="alert" className="mt-3 rounded-lg border border-danger/20 bg-danger-bg px-3 py-2 text-[13px] text-danger">{error}</p>}
        </form>

        <div className="mt-7 border-t border-border pt-5">
          <p className="text-[12px] font-medium text-ink">This check can confirm</p>
          <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-tertiary">
            <li>• Whether public SPF and DMARC TXT records are present.</li>
            <li>• A published DMARC policy, when readable.</li>
            <li>• Why DKIM needs your sending provider or a known selector to verify.</li>
          </ul>
        </div>
      </section>

      <aside className="card overflow-hidden">
        <div className="border-b border-border bg-subtle px-5 py-4 sm:px-6">
          <p className="label-eyebrow">Public DNS snapshot</p>
          <h2 className="mt-1 text-[18px] font-semibold text-ink">Authentication status</h2>
        </div>
        <div className="space-y-3 p-5 sm:p-6" aria-live="polite">
          {!result ? (
            <div className="rounded-xl border border-dashed border-border bg-page px-5 py-10 text-center">
              <Copy size={20} className="mx-auto text-muted" />
              <p className="mt-3 text-[14px] font-medium text-ink">Ready to inspect your DNS</p>
              <p className="mx-auto mt-1.5 max-w-xs text-[12px] leading-relaxed text-tertiary">We will show the public SPF and DMARC records for the domain you enter.</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-border bg-page px-3 py-2 text-[12px] text-tertiary">
                Checked <span className="font-medium text-ink">{result.domain}</span>
              </div>
              <DnsCheck title="SPF" status={result.spf.status} detail={spfDetail} records={result.spf.records} />
              <DnsCheck title="DMARC" status={result.dmarc.status} detail={dmarcDetail} records={result.dmarc.records} />
              <DnsCheck title="DKIM" status={result.dkim.status} detail={result.dkim.message} />
              <p className="rounded-lg border border-accent-mid bg-accent-light px-3 py-2.5 text-[12px] leading-relaxed text-body">
                Record presence does not confirm deliverability, inbox placement, authentication alignment, or compliance. Verify live message results in your sending platform.
              </p>
            </>
          )}
        </div>
      </aside>

      <section className="lg:col-span-2 rounded-xl border border-border bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[14px] font-semibold text-ink">Before you start agent outreach</p>
            <p className="mt-1 text-[13px] leading-relaxed text-tertiary">Pair a healthy sending setup with a clear, recipient-respecting campaign plan.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/tools/cold-email-compliance-checker" className="btn-outline h-10 px-4" onClick={() => track("tool_cta_clicked", { tool: "email_domain_authentication_checker", destination: "compliance_checker" })}>
              Check email preflight
            </Link>
            <FreeSampleDialog source="email_domain_authentication_checker" triggerLabel="Get Free Sample" triggerClassName="h-10 px-4" />
          </div>
        </div>
        <p className="mt-5 text-[12px] leading-relaxed text-muted">
          Gmail&apos;s sender guidance is updated periodically. Review the current <a href="https://support.google.com/mail/answer/81126?hl=en" target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">Gmail sender guidelines <ExternalLink size={11} className="inline" /></a> and your provider&apos;s setup instructions before sending.
        </p>
      </section>
    </div>
  )
}
