"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowRight,
  Building2,
  CircleDollarSign,
  Clock3,
  Target,
  TrendingUp,
  Users,
} from "lucide-react"
import { calculateBrokerageRecruitingRoi } from "@/lib/calculators/brokerageRecruitingRoi"

type CalculatorFields = {
  recruitedAgents: string
  annualVolumePerAgent: string
  grossCommissionRate: string
  brokerageSplit: string
  retentionRate: string
  recruitingCost: string
}

const INITIAL_FIELDS: CalculatorFields = {
  recruitedAgents: "",
  annualVolumePerAgent: "",
  grossCommissionRate: "",
  brokerageSplit: "",
  retentionRate: "",
  recruitingCost: "",
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const decimalFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
})

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
})

function numberFromField(value: string): number {
  if (!value.trim()) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
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
  onChange: (nextValue: string) => void
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
          min={min}
          max={max}
          step={step}
          inputMode={inputMode}
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

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  tone = "default",
}: {
  icon: typeof Users
  label: string
  value: string
  note: string
  tone?: "default" | "accent" | "positive"
}) {
  const cardClasses = {
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
    <div className={`rounded-xl border p-4 ${cardClasses}`}>
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

export function BrokerageRecruitingRoiCalculator() {
  const [fields, setFields] = useState<CalculatorFields>(INITIAL_FIELDS)

  const result = useMemo(
    () =>
      calculateBrokerageRecruitingRoi({
        recruitedAgents: numberFromField(fields.recruitedAgents),
        annualVolumePerAgent: numberFromField(fields.annualVolumePerAgent),
        grossCommissionRate: numberFromField(fields.grossCommissionRate),
        brokerageSplit: numberFromField(fields.brokerageSplit),
        retentionRate: numberFromField(fields.retentionRate),
        recruitingCost: numberFromField(fields.recruitingCost),
      }),
    [fields]
  )

  const hasCompanyDollarInputs = [
    fields.recruitedAgents,
    fields.annualVolumePerAgent,
    fields.grossCommissionRate,
    fields.brokerageSplit,
    fields.retentionRate,
  ].every((value) => value.trim() !== "")
  const hasRecruitingCost = fields.recruitingCost.trim() !== ""
  const hasFullModel = hasCompanyDollarInputs && hasRecruitingCost

  function updateField(field: keyof CalculatorFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }))
  }

  const paybackLabel =
    result.paybackMonths === null
      ? "—"
      : `${decimalFormatter.format(result.paybackMonths)} mo`
  const roiLabel = result.roiPercent === null ? "—" : `${percentFormatter.format(result.roiPercent)}%`

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.06fr)_minmax(320px,0.94fr)] lg:items-start">
        <form className="card p-5 sm:p-6" onSubmit={(event) => event.preventDefault()}>
          <div className="flex items-start gap-3 border-b border-border pb-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-mid bg-accent-light text-accent">
              <Building2 size={20} />
            </span>
            <div>
              <h2 className="text-[18px] font-semibold text-ink">Model your recruiting cohort</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-tertiary">
                Use your own production, split, retention, and cost assumptions. Nothing is saved or sent.
              </p>
            </div>
          </div>

          <fieldset className="pt-6">
            <legend className="text-[13px] font-mono font-medium uppercase tracking-[0.08em] text-muted">
              1. Recruit and production assumptions
            </legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                id="recruited-agents"
                label="Agents recruited"
                value={fields.recruitedAgents}
                onChange={(value) => updateField("recruitedAgents", value)}
                hint="Number of agents expected to join from this recruiting effort."
                min={0}
                step="1"
                inputMode="numeric"
              />
              <Field
                id="annual-volume-per-agent"
                label="Annual sales volume per recruit"
                value={fields.annualVolumePerAgent}
                onChange={(value) => updateField("annualVolumePerAgent", value)}
                hint="Projected closed sales volume for one agent during the modeled year."
                prefix="$"
                min={0}
              />
              <Field
                id="gross-commission-rate"
                label="Gross commission rate"
                value={fields.grossCommissionRate}
                onChange={(value) => updateField("grossCommissionRate", value)}
                hint="Gross commission income ÷ annual sales volume."
                suffix="%"
                min={0}
                max={100}
              />
              <Field
                id="brokerage-split"
                label="Brokerage share of gross commission"
                value={fields.brokerageSplit}
                onChange={(value) => updateField("brokerageSplit", value)}
                hint="Your company-dollar share after the agent split."
                suffix="%"
                min={0}
                max={100}
              />
              <Field
                id="retention-rate"
                label="12-month retention rate"
                value={fields.retentionRate}
                onChange={(value) => updateField("retentionRate", value)}
                hint="Portion of new recruits expected to remain through the modeled year."
                suffix="%"
                min={0}
                max={100}
              />
              <Field
                id="recruiting-cost"
                label="Total recruiting cost"
                value={fields.recruitingCost}
                onChange={(value) => updateField("recruitingCost", value)}
                hint="Include ads, recruiter time, events, data, and onboarding incentives if relevant."
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
                <h2 className="mt-1 text-[18px] font-semibold text-ink">Recruiting outlook</h2>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent-mid bg-white text-accent">
                <TrendingUp size={18} />
              </span>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            {!hasCompanyDollarInputs ? (
              <div className="rounded-xl border border-dashed border-border bg-subtle/60 p-5 text-center">
                <Target className="mx-auto text-muted" size={22} />
                <p className="mt-3 text-[14px] font-medium text-ink">Add your recruiting assumptions</p>
                <p className="mt-1 text-[12px] leading-relaxed text-tertiary">
                  Enter the recruited cohort, production, split, and retention inputs to see annual company dollar.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <MetricCard
                    icon={Users}
                    label="Retained recruits"
                    value={decimalFormatter.format(result.retainedRecruits)}
                    note={`of ${decimalFormatter.format(result.recruitedAgents)} recruited agents at ${percentFormatter.format(result.retentionRate)}% retention`}
                    tone="accent"
                  />
                  <MetricCard
                    icon={CircleDollarSign}
                    label="Annual company dollar"
                    value={currencyFormatter.format(result.annualCompanyDollar)}
                    note="Modeled from retained recruits only."
                    tone="positive"
                  />
                </div>

                <div className="rounded-xl border border-border bg-subtle/60 p-4">
                  <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted">Company-dollar formula</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-body">
                    Retained recruits × annual volume per recruit × gross commission rate × brokerage share.
                  </p>
                  <div className="mt-3 grid gap-2 text-[12px] text-tertiary sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <span>GCI per recruit: <strong className="font-medium text-ink">{currencyFormatter.format(result.grossCommissionIncomePerAgent)}</strong></span>
                    <span>Company dollar per retained recruit: <strong className="font-medium text-ink">{currencyFormatter.format(result.companyDollarPerRetainedRecruit)}</strong></span>
                  </div>
                </div>

                {!hasRecruitingCost ? (
                  <div className="rounded-xl border border-accent-mid bg-accent-light/60 p-4">
                    <p className="text-[14px] font-semibold text-ink">Add total recruiting cost for ROI</p>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-tertiary">
                      Cost per retained recruit, net contribution, ROI, and payback appear once you enter the full recruiting cost.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <MetricCard
                      icon={Users}
                      label="Cost per retained recruit"
                      value={result.costPerRetainedRecruit === null ? "—" : currencyFormatter.format(result.costPerRetainedRecruit)}
                      note={result.costPerRetainedRecruit === null ? "Unavailable when retention is zero." : "Total recruiting cost ÷ retained recruits."}
                    />
                    <MetricCard
                      icon={CircleDollarSign}
                      label="Net contribution"
                      value={currencyFormatter.format(result.netContribution)}
                      note="Annual company dollar minus recruiting cost."
                      tone={result.netContribution >= 0 ? "positive" : "default"}
                    />
                    <MetricCard
                      icon={TrendingUp}
                      label="ROI"
                      value={roiLabel}
                      note={result.roiPercent === null ? "Unavailable when recruiting cost is zero." : "Net contribution ÷ recruiting cost."}
                      tone={result.roiPercent !== null && result.roiPercent >= 0 ? "positive" : "default"}
                    />
                    <MetricCard
                      icon={Clock3}
                      label="Payback"
                      value={paybackLabel}
                      note={result.paybackMonths === null ? "Requires positive cost and company dollar." : "At a steady monthly company-dollar run rate."}
                      tone="accent"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>

      {hasFullModel && (
        <div className="rounded-xl border border-border bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="text-[15px] font-semibold text-ink">Ready to turn the recruiting target into outreach?</p>
            <p className="mt-1 text-[13px] leading-relaxed text-tertiary">
              Use the campaign planner to model the audience, message workload, and recruiting funnel behind this estimate.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 sm:mt-0 sm:shrink-0">
            <Link href="/tools/agent-outreach-campaign-planner" className="btn-primary text-[14px]">
              Plan outreach <ArrowRight size={14} />
            </Link>
            <Link href="/states" className="btn-outline text-[14px]">
              Browse state data
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
