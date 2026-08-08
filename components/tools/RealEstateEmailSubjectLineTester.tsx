"use client"

import Link from "next/link"
import { useMemo, useRef, useState } from "react"
import { CheckCircle2, CircleAlert, CircleHelp, Copy, Mail, RotateCcw, Sparkles } from "lucide-react"
import { FreeSampleDialog } from "@/components/home/FreeSampleDialog"
import { analyzeSubjectLine, type SubjectLineSignalTone } from "@/lib/tools/subjectLineTester"
import { track } from "@/lib/utils/analytics"

type Objective = "sell" | "recruit" | "partner"

type Variant = {
  subject: string
  preview: string
}

const STARTERS: Record<Objective, [Variant, Variant]> = {
  sell: [
    { subject: "{{first_name}}, a simpler way to [benefit]", preview: "A quick idea for helping your agents with [outcome]." },
    { subject: "A resource for your [team or brokerage]", preview: "Here is the practical detail behind [benefit]." },
  ],
  recruit: [
    { subject: "{{first_name}}, a thought about your next move", preview: "A concise look at what joining [brokerage] could offer." },
    { subject: "Building your business in [market]", preview: "The support and opportunity our team is focused on this year." },
  ],
  partner: [
    { subject: "A resource your clients may find useful", preview: "A simple way to support clients around [need] without adding work for you." },
    { subject: "{{first_name}}, an idea for [agent benefit]", preview: "Could this be useful for the clients you are already helping?" },
  ],
}

function SignalIcon({ tone }: { tone: SubjectLineSignalTone }) {
  if (tone === "ready") return <CheckCircle2 size={16} className="text-success" />
  if (tone === "review") return <CircleAlert size={16} className="text-warning" />
  return <CircleHelp size={16} className="text-accent" />
}

function VariantEditor({
  name,
  value,
  onChange,
}: {
  name: string
  value: Variant
  onChange: (next: Variant) => void
}) {
  const analysis = useMemo(() => analyzeSubjectLine(value.subject, value.preview), [value.preview, value.subject])
  const previewSubject = analysis.compactSubjectPreview || "Your subject line"
  const previewText = analysis.compactPreviewText || "Your email preview text appears here."

  async function copyVariant() {
    try {
      await navigator.clipboard.writeText(`${value.subject}\n${value.preview}`.trim())
      track("tool_cta_clicked", { tool: "real_estate_email_subject_line_tester", destination: "copy_variant" })
    } catch {
      // Clipboard permission is browser-controlled; keep the editor useful if it is unavailable.
    }
  }

  return (
    <section className="rounded-xl border border-border bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label-eyebrow">{name}</p>
          <h2 className="mt-1 text-[17px] font-semibold text-ink">Subject line and preview</h2>
        </div>
        <button type="button" onClick={copyVariant} className="btn-ghost h-9 px-3 text-[12px]" aria-label={`Copy ${name}`}>
          <Copy size={14} /> Copy
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor={`${name}-subject`} className="mb-1.5 block text-[13px] font-medium text-ink">Subject line</label>
          <input
            id={`${name}-subject`}
            value={value.subject}
            onChange={(event) => onChange({ ...value, subject: event.target.value })}
            maxLength={250}
            placeholder="e.g. A resource for your clients"
            className="input h-11 text-[14px]"
          />
          <p className="mt-1.5 text-right text-[11px] text-muted">{analysis.subjectCharacters} characters</p>
        </div>
        <div>
          <label htmlFor={`${name}-preview`} className="mb-1.5 block text-[13px] font-medium text-ink">Preview text or opening sentence</label>
          <textarea
            id={`${name}-preview`}
            value={value.preview}
            onChange={(event) => onChange({ ...value, preview: event.target.value })}
            maxLength={500}
            placeholder="A concise, useful reason to open the message."
            rows={3}
            className="input min-h-20 resize-y py-2.5 text-[14px]"
          />
          <p className="mt-1.5 text-right text-[11px] text-muted">{analysis.previewCharacters} characters</p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-page p-3.5">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-light text-accent"><Mail size={14} /></span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-ink">Your name <span className="font-normal text-muted">&lt;you@yourdomain.com&gt;</span></p>
            <p className="mt-1 truncate text-[13px] font-medium text-ink">{previewSubject}</p>
            <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-tertiary">{previewText}</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted">Compact editing preview only; inbox displays vary by device and provider.</p>
      </div>

      <div className="mt-5 space-y-2.5">
        {analysis.signals.map((signal) => (
          <div key={`${signal.title}-${signal.detail}`} className="flex items-start gap-2.5 rounded-lg border border-border bg-page px-3 py-2.5">
            <span className="mt-0.5 shrink-0"><SignalIcon tone={signal.tone} /></span>
            <div>
              <p className="text-[12px] font-medium text-ink">{signal.title}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-tertiary">{signal.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function RealEstateEmailSubjectLineTester() {
  const [objective, setObjective] = useState<Objective>("sell")
  const [variantA, setVariantA] = useState<Variant>(STARTERS.sell[0])
  const [variantB, setVariantB] = useState<Variant>(STARTERS.sell[1])
  const startedTracked = useRef(false)

  function updateVariant(setter: (next: Variant) => void, next: Variant) {
    if (!startedTracked.current) {
      startedTracked.current = true
      track("tool_started", { tool: "real_estate_email_subject_line_tester" })
    }
    setter(next)
  }

  function loadStarters(nextObjective: Objective) {
    setObjective(nextObjective)
    setVariantA(STARTERS[nextObjective][0])
    setVariantB(STARTERS[nextObjective][1])
    track("tool_completed", { tool: "real_estate_email_subject_line_tester", action: "loaded_starters", objective: nextObjective })
  }

  return (
    <div>
      <section className="card p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="label-eyebrow">Browser-only editor</p>
            <h2 className="mt-2 text-[21px] font-semibold tracking-[-0.025em] text-ink">Compare two honest, useful openings</h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-tertiary">
              Review clarity, compact previews, and unresolved personalization tokens before you send. Your drafts stay in this browser.
            </p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Choose a starter objective">
            {([
              ["sell", "Sell to agents"],
              ["recruit", "Recruit agents"],
              ["partner", "Build partnerships"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => loadStarters(value)}
                className={`rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors ${objective === value ? "border-accent bg-accent-light text-accent" : "border-border bg-white text-tertiary hover:text-ink"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        <VariantEditor name="Variant A" value={variantA} onChange={(next) => updateVariant(setVariantA, next)} />
        <VariantEditor name="Variant B" value={variantB} onChange={(next) => updateVariant(setVariantB, next)} />
      </section>

      <section className="mt-6 rounded-xl border border-accent-mid bg-accent-light p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-accent"><Sparkles size={17} /></span>
            <div>
              <h2 className="text-[16px] font-semibold text-ink">A review tool—not a spam or open-rate score</h2>
              <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-tertiary">A clear subject line cannot guarantee delivery, opens, replies, or legal compliance. Make sure it accurately represents the message and your sender identity.</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link href="/tools/cold-email-compliance-checker" className="btn-outline h-10 px-4" onClick={() => track("tool_cta_clicked", { tool: "real_estate_email_subject_line_tester", destination: "compliance_checker" })}>Preflight email</Link>
            <FreeSampleDialog source="real_estate_email_subject_line_tester" triggerLabel="Get Free Sample" triggerClassName="h-10 px-4" />
          </div>
        </div>
        <button type="button" className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-accent hover:underline" onClick={() => loadStarters(objective)}>
          <RotateCcw size={13} /> Reset both variants to these starters
        </button>
      </section>
    </div>
  )
}
