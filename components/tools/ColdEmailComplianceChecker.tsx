"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Info,
  RotateCcw,
  ShieldCheck,
} from "lucide-react"
import {
  analyzeColdEmailCompliance,
  type ColdEmailComplianceFinding,
  type ColdEmailComplianceFindingStatus,
} from "@/lib/tools/coldEmailComplianceChecker"

type Draft = {
  subject: string
  body: string
  footer: string
}

const EMPTY_DRAFT: Draft = {
  subject: "",
  body: "",
  footer: "",
}

const FINDING_STYLE: Record<
  ColdEmailComplianceFindingStatus,
  { label: string; icon: typeof AlertTriangle; panel: string; iconPanel: string }
> = {
  needs_attention: {
    label: "Needs attention",
    icon: AlertTriangle,
    panel: "border-amber-200 bg-amber-50/70",
    iconPanel: "bg-amber-100 text-warning",
  },
  manual_review: {
    label: "Manual review",
    icon: FileText,
    panel: "border-accent-mid bg-accent-light/70",
    iconPanel: "bg-white text-accent",
  },
  detected: {
    label: "Text detected",
    icon: CheckCircle2,
    panel: "border-success/20 bg-success-bg",
    iconPanel: "bg-white text-success",
  },
  not_checked: {
    label: "Not checked",
    icon: Info,
    panel: "border-border bg-subtle/60",
    iconPanel: "bg-white text-tertiary",
  },
}

function Finding({ finding }: { finding: ColdEmailComplianceFinding }) {
  const style = FINDING_STYLE[finding.status]
  const Icon = style.icon

  return (
    <li className={`rounded-xl border p-4 ${style.panel}`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.iconPanel}`}>
          <Icon size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-[14px] font-semibold text-ink">{finding.title}</h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">{style.label}</span>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-tertiary">{finding.detail}</p>
        </div>
      </div>
    </li>
  )
}

export function ColdEmailComplianceChecker() {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [hasReviewed, setHasReviewed] = useState(false)
  const analysis = useMemo(() => analyzeColdEmailCompliance(draft), [draft])
  const hasContent = Boolean(draft.subject.trim() || draft.body.trim() || draft.footer.trim())

  function updateDraft(field: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
    setHasReviewed(false)
  }

  function resetDraft() {
    setDraft(EMPTY_DRAFT)
    setHasReviewed(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.82fr)] lg:items-start">
      <section className="card overflow-hidden" aria-labelledby="checker-form-heading">
        <div className="border-b border-border px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-mid bg-accent-light text-accent">
              <ClipboardCheck size={19} aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted">Text-level review</p>
              <h2 id="checker-form-heading" className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-ink">
                Paste the email you plan to send
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-tertiary">
                Review common FTC CAN-SPAM text requirements before you send. This tool does not send, upload, or store your copy.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-7">
          <div>
            <label htmlFor="compliance-subject" className="mb-1.5 block text-[13px] font-medium text-ink">
              Subject line
            </label>
            <input
              id="compliance-subject"
              type="text"
              value={draft.subject}
              maxLength={250}
              onChange={(event) => updateDraft("subject", event.target.value)}
              className="input h-11"
              placeholder="A short, accurate subject line"
            />
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">The checker cannot decide whether a subject is deceptive; it will prompt a manual accuracy review.</p>
          </div>

          <div>
            <label htmlFor="compliance-body" className="mb-1.5 block text-[13px] font-medium text-ink">
              Email body
            </label>
            <textarea
              id="compliance-body"
              rows={11}
              value={draft.body}
              maxLength={20000}
              onChange={(event) => updateDraft("body", event.target.value)}
              className="input min-h-56 resize-y leading-relaxed"
              placeholder="Paste the visible body copy here. Plain text or pasted HTML is fine."
            />
          </div>

          <div>
            <label htmlFor="compliance-footer" className="mb-1.5 block text-[13px] font-medium text-ink">
              Footer <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="compliance-footer"
              rows={5}
              value={draft.footer}
              maxLength={5000}
              onChange={(event) => updateDraft("footer", event.target.value)}
              className="input min-h-32 resize-y leading-relaxed"
              placeholder="Paste the actual footer, including address and opt-out copy if it appears there."
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-[12px] leading-relaxed text-muted">
              <ShieldCheck size={15} className="shrink-0 text-success" aria-hidden="true" />
              Analysis stays in this browser tab.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={resetDraft} className="btn-ghost" disabled={!hasContent}>
                <RotateCcw size={15} aria-hidden="true" />
                Clear
              </button>
              <button type="button" onClick={() => setHasReviewed(true)} className="btn-primary" disabled={!hasContent}>
                <ClipboardCheck size={16} aria-hidden="true" />
                Review common flags
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden" aria-labelledby="checker-results-heading" aria-live="polite">
        <div className="border-b border-border bg-subtle/50 px-5 py-5 sm:px-6">
          <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted">Review results</p>
          <h2 id="checker-results-heading" className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-ink">
            {hasReviewed ? "Common flags to review" : "Your review will appear here"}
          </h2>
        </div>

        {hasReviewed ? (
          <div className="p-5 sm:p-6">
            <div className="rounded-xl border border-accent-mid bg-accent-light p-4">
              <div className="flex items-start gap-3">
                <Info size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <p className="text-[14px] font-semibold text-ink">
                    {analysis.needsAttentionCount > 0
                      ? `${analysis.needsAttentionCount} item${analysis.needsAttentionCount === 1 ? "" : "s"} need attention`
                      : "No obvious text gaps were found"}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-tertiary">
                    This is not a compliance verdict. It checks pasted text only; review every result in the final rendered email and sending platform.
                  </p>
                </div>
              </div>
            </div>

            <ul className="mt-4 space-y-3" aria-label="Compliance review findings">
              {analysis.findings.map((finding) => (
                <Finding key={finding.id} finding={finding} />
              ))}
            </ul>

            <p className="mt-5 border-t border-border pt-4 text-[12px] leading-relaxed text-muted">
              {analysis.detectedCount > 0
                ? `${analysis.detectedCount} text pattern${analysis.detectedCount === 1 ? " was" : "s were"} detected, but text detection cannot confirm legal sufficiency or that a link works. `
                : "No requirement is certified by this checker. "}
              {analysis.manualReviewCount > 0
                ? `${analysis.manualReviewCount} item${analysis.manualReviewCount === 1 ? " still needs" : "s still need"} manual review.`
                : ""}
            </p>
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            <div className="rounded-xl border border-dashed border-border-strong bg-white p-6 text-center">
              <ClipboardCheck size={24} className="mx-auto text-muted" aria-hidden="true" />
              <p className="mt-3 text-[14px] font-medium text-ink">Nothing is sent from this page</p>
              <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-tertiary">
                Paste your subject, body, and footer, then review the visible text for common items such as an address and opt-out wording.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
