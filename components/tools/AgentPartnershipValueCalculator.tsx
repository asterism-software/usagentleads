"use client"

import Link from "next/link"
import { useMemo, useState, type ComponentType } from "react"
import {
  ArrowRight,
  BarChart3,
  CircleAlert,
  CircleDollarSign,
  Handshake,
  Target,
  Users,
} from "lucide-react"
import { calculateAgentPartnershipValue } from "@/lib/calculators/agentPartnershipValue"

type PartnershipFields = {
  prospectiveAgents: string
  introductionRate: string
  qualifiedOpportunityRate: string
  winRate: string
  grossProfitPerWin: string
  relationshipMarketingCost: string
}

const INITIAL_FIELDS: PartnershipFields = {
  prospectiveAgents: "",
  introductionRate: "",
  qualifiedOpportunityRate: "",
  winRate: "",
  grossProfitPerWin: "",
  relationshipMarketingCost: "",
}

const integerFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })
const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

function numberFromField(value: string): number {
  if (!value.trim()) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatPeople(value: number): string {
  if (value > 0 && value < 1) return decimalFormatter.format(value)
  return integerFormatter.format(value)
}

function formatPercent(value: number): string {
  return `${decimalFormatter.format(value)}%`
}

function Field({
  id,
  label,
  value,
  onChange,
  hint,
  prefix,
  suffix,
  min = 0,
  max,
  step = "any",
  inputMode = "decimal",
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  hint: string
  prefix?: string
  suffix?: string
  min?: number
  max?: number
  step?: string
  inputMode?: "decimal" | "numeric"
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[14px] text-muted">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="number"
          inputMode={inputMode}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`input h-11 py-2 text-[14px] ${prefix ? "pl-7" : ""} ${suffix ? "pr-9" : ""}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[13px] text-muted">
            {suffix}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{hint}</p>
    </div>
  )
}

function ResultCard({
  icon: Icon,
  label,
  value,
  note,
  tone = "default",
}: {
  icon: ComponentType<{ size?: number; className?: string }>
  label: string
  value: string
  note: string
  tone?: "default" | "accent" | "positive"
}) {
  const classes = {
    default: "border-border bg-white",
    accent: "border-accent-mid bg-accent-light",
    positive: "border-success/20 bg-success-bg",
  }[tone]

  const iconClasses = {
    default: "bg-subtle text-tertiary",
    accent: "bg-white text-accent",
    positive: "bg-white text-success",
  }[tone]

  return (
    <div className={`rounded-xl border p-4 ${classes}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted">{label}</p>
          <p className="mt-1.5 text-[22px] font-semibold tracking-[-0.03em] text-ink">{value}</p>
        </div>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClasses}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-tertiary">{note}</p>
    </div>
  )
}

export function AgentPartnershipValueCalculator() {
  const [fields, setFields] = useState<PartnershipFields>(INITIAL_FIELDS)

  const result = useMemo(
    () =>
      calculateAgentPartnershipValue({
        prospectiveAgents: numberFromField(fields.prospectiveAgents),
        introductionRate: numberFromField(fields.introductionRate),
        qualifiedOpportunityRate: numberFromField(fields.qualifiedOpportunityRate),
        winRate: numberFromField(fields.winRate),
        grossProfitPerWin: numberFromField(fields.grossProfitPerWin),
        relationshipMarketingCost: numberFromField(fields.relationshipMarketingCost),
      }),
    [fields]
  )

  const hasCoreFunnel =
    fields.prospectiveAgents.trim() !== "" &&
    fields.introductionRate.trim() !== "" &&
    fields.qualifiedOpportunityRate.trim() !== "" &&
    fields.winRate.trim() !== "" &&
    fields.grossProfitPerWin.trim() !== ""
  const hasCost = fields.relationshipMarketingCost.trim() !== ""
  const enteredRelationshipMarketingCost = Math.max(
    0,
    numberFromField(fields.relationshipMarketingCost)
  )

  function updateField(field: keyof PartnershipFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-start">
        <form className="card p-5 sm:p-6" onSubmit={(event) => event.preventDefault()}>
          <div className="flex items-start gap-3 border-b border-border pb-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-mid bg-accent-light text-accent">
              <Handshake size={20} />
            </span>
            <div>
              <h2 className="text-[18px] font-semibold text-ink">Model relationship value</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-tertiary">
                Use your own historical assumptions. Nothing you enter is sent or stored.
              </p>
            </div>
          </div>

          <fieldset className="pt-6">
            <legend className="text-[13px] font-mono font-medium uppercase tracking-[0.08em] text-muted">
              1. Relationship funnel
            </legend>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              This is a planning model for relationship-building activity—not a referral-fee or commission calculator.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                id="prospective-agents"
                label="Prospective agents"
                value={fields.prospectiveAgents}
                onChange={(value) => updateField("prospectiveAgents", value)}
                hint="Agents you expect to include in the relationship-building program."
                min={0}
                step="1"
                inputMode="numeric"
              />
              <Field
                id="introduction-rate"
                label="Introduction rate"
                value={fields.introductionRate}
                onChange={(value) => updateField("introductionRate", value)}
                hint="Introductions ÷ prospective agents, based on your own past results."
                suffix="%"
                min={0}
                max={100}
              />
              <Field
                id="qualified-opportunity-rate"
                label="Qualified opportunity rate"
                value={fields.qualifiedOpportunityRate}
                onChange={(value) => updateField("qualifiedOpportunityRate", value)}
                hint="Qualified opportunities ÷ introductions."
                suffix="%"
                min={0}
                max={100}
              />
              <Field
                id="win-rate"
                label="Win rate"
                value={fields.winRate}
                onChange={(value) => updateField("winRate", value)}
                hint="Wins ÷ qualified opportunities."
                suffix="%"
                min={0}
                max={100}
              />
            </div>
          </fieldset>

          <fieldset className="mt-7 border-t border-border pt-6">
            <legend className="text-[13px] font-mono font-medium uppercase tracking-[0.08em] text-muted">
              2. Economics
            </legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                id="gross-profit-per-win"
                label="Gross profit per win"
                value={fields.grossProfitPerWin}
                onChange={(value) => updateField("grossProfitPerWin", value)}
                hint="Your own estimated first-year contribution or gross profit."
                prefix="$"
                min={0}
              />
              <Field
                id="relationship-marketing-cost"
                label="Relationship-marketing cost"
                value={fields.relationshipMarketingCost}
                onChange={(value) => updateField("relationshipMarketingCost", value)}
                hint="Your program cost—not a referral payment, gift, rebate, or incentive."
                prefix="$"
                min={0}
              />
            </div>
          </fieldset>
        </form>

        <aside className="card overflow-hidden lg:sticky lg:top-24" aria-live="polite">
          <div className="border-b border-border bg-subtle/70 px-5 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="label-eyebrow">Modeled estimate</p>
                <h2 className="mt-1 text-[18px] font-semibold text-ink">Partnership outlook</h2>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent-mid bg-white text-accent">
                <BarChart3 size={18} />
              </span>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            {!hasCoreFunnel ? (
              <div className="rounded-xl border border-dashed border-border bg-subtle/60 p-5 text-center">
                <Users className="mx-auto text-muted" size={22} />
                <p className="mt-3 text-[14px] font-medium text-ink">Add your funnel assumptions</p>
                <p className="mt-1 text-[12px] leading-relaxed text-tertiary">
                  Enter prospective agents, all three rates, and gross profit per win to see the modeled relationship value.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold text-ink">Modeled funnel</p>
                    <span className="text-[11px] font-mono text-muted">your assumptions</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Prospective agents", value: formatPeople(result.prospectiveAgents) },
                      { label: "Introductions", value: formatPeople(result.introductions) },
                      { label: "Qualified opportunities", value: formatPeople(result.qualifiedOpportunities) },
                      { label: "Wins", value: formatPeople(result.wins) },
                    ].map((stage, index) => (
                      <div key={stage.label} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-mono font-semibold ${
                            index === 3 ? "bg-accent text-white" : "bg-subtle text-tertiary"
                          }`}>
                            {index + 1}
                          </span>
                          <span className="truncate text-[12px] text-body">{stage.label}</span>
                        </div>
                        <span className="shrink-0 text-[13px] font-semibold text-ink">{stage.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <ResultCard
                    icon={CircleDollarSign}
                    label="Contribution"
                    value={currencyFormatter.format(result.modeledContribution)}
                    note="Modeled gross profit from your entered wins and value per win."
                    tone="accent"
                  />
                  <ResultCard
                    icon={Target}
                    label="Cost per win"
                    value={hasCost && result.estimatedCostPerWin !== null ? currencyFormatter.format(result.estimatedCostPerWin) : "—"}
                    note={hasCost ? "Relationship-marketing cost ÷ modeled wins." : "Add a relationship-marketing cost to calculate this."}
                  />
                </div>

                {hasCost ? (
                  <div>
                    <p className="mb-3 text-[13px] font-semibold text-ink">Modeled economics</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      <ResultCard
                        icon={CircleDollarSign}
                        label="Net contribution"
                        value={currencyFormatter.format(result.estimatedNetContribution)}
                        note={`After ${currencyFormatter.format(enteredRelationshipMarketingCost)} in entered program cost.`}
                        tone={result.estimatedNetContribution >= 0 ? "positive" : "default"}
                      />
                      <ResultCard
                        icon={BarChart3}
                        label="Modeled ROI"
                        value={result.estimatedRoi === null ? "—" : formatPercent(result.estimatedRoi)}
                        note="Net contribution ÷ relationship-marketing cost."
                        tone="accent"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-accent-mid bg-accent-light/60 p-4">
                    <p className="text-[13px] font-semibold text-ink">Add program cost for ROI</p>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-tertiary">
                      Contribution is shown from the funnel alone. Add only your own relationship-marketing cost to see net contribution and ROI.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-[15px] font-semibold text-ink">Need agent coverage for your program?</p>
          <p className="mt-1 text-[13px] leading-relaxed text-tertiary">
            Browse available state-by-state agent data before you decide where to build relationships.
          </p>
        </div>
        <Link href="/states" className="btn-outline justify-center px-5 py-2.5 text-[14px] md:justify-self-end">
          Explore state data <ArrowRight size={14} />
        </Link>
      </div>

      <section className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5" aria-labelledby="respa-review-heading">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 shrink-0 text-amber-700" size={20} aria-hidden="true" />
          <div>
            <h2 id="respa-review-heading" className="text-[15px] font-semibold text-amber-950">
              Important: review RESPA before using this for mortgage or settlement-service relationships
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-amber-900">
              Do not use this tool to calculate, propose, or optimize referral payments, commissions, rebates, gifts, or other things of value for referrals. For businesses connected to federally related mortgage transactions, review the{" "}
              <a
                href="https://www.consumerfinance.gov/compliance/compliance-resources/mortgage-resources/real-estate-settlement-procedures-act/real-estate-settlement-procedures-act-faqs/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-2 hover:text-amber-950"
              >
                CFPB&apos;s RESPA Section 8 FAQs
              </a>{" "}
              and obtain qualified legal advice for your facts and jurisdiction.
            </p>
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-border bg-subtle/60 p-4 text-[12px] leading-relaxed text-tertiary">
        <strong className="font-semibold text-ink">Planning model only.</strong> Results reflect only the assumptions you enter and are not a prediction of introductions, sales, revenue, or legal compliance.
      </div>
    </div>
  )
}
