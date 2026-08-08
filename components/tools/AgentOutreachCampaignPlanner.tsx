"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  CircleDollarSign,
  Send,
  Target,
  Users,
  X,
} from "lucide-react"
import { CustomSelect } from "@/components/ui/CustomSelect"
import { FreeSampleDialog } from "@/components/home/FreeSampleDialog"
import { calculateAgentOutreachCampaign } from "@/lib/calculators/agentOutreachCampaign"
import { track } from "@/lib/utils/analytics"

export interface CampaignPlannerMarket {
  code: string
  name: string
  slug: string
  /** null means live email availability could not be loaded for this state. */
  availableEmailRecords: number | null
}

interface AgentOutreachCampaignPlannerProps {
  markets: CampaignPlannerMarket[]
  availabilityAsOf: string | null
}

type Purpose = "sell" | "recruit" | "partner"

type PlannerFields = {
  plannedContacts: string
  touchesPerContact: string
  targetWins: string
  dailySendCapacity: string
  deliveryRate: string
  positiveReplyRate: string
  qualifiedConversationRate: string
  winRate: string
  valuePerWin: string
  campaignCost: string
}

const INITIAL_FIELDS: PlannerFields = {
  plannedContacts: "",
  touchesPerContact: "1",
  targetWins: "",
  dailySendCapacity: "",
  deliveryRate: "",
  positiveReplyRate: "",
  qualifiedConversationRate: "",
  winRate: "",
  valuePerWin: "",
  campaignCost: "",
}

const PURPOSES: Record<
  Purpose,
  {
    label: string
    description: string
    winLabel: string
    qualifiedStageLabel: string
    qualifiedStagePlural: string
  }
> = {
  sell: {
    label: "Sell a product or service",
    description: "Model demand generation for a product or service that helps agents.",
    winLabel: "customer",
    qualifiedStageLabel: "qualified conversation",
    qualifiedStagePlural: "qualified conversations",
  },
  recruit: {
    label: "Recruit agents",
    description: "Model a recruiting campaign for your brokerage or team.",
    winLabel: "recruit",
    qualifiedStageLabel: "qualified recruiting conversation",
    qualifiedStagePlural: "qualified recruiting conversations",
  },
  partner: {
    label: "Build partnerships",
    description: "Model a relationship-building campaign with local agents.",
    winLabel: "active partner",
    qualifiedStageLabel: "qualified partner conversation",
    qualifiedStagePlural: "qualified partner conversations",
  },
}

const integerFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })
const compactFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 })
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
  if (value > 0 && value < 1) return compactFormatter.format(value)
  return integerFormatter.format(value)
}

function formatPercent(value: number): string {
  return `${compactFormatter.format(value)}%`
}

function valueBucket(value: number): string {
  if (value < 1_000) return "under_1k"
  if (value < 5_000) return "1k_to_5k"
  if (value < 25_000) return "5k_to_25k"
  return "25k_plus"
}

function stateCountBucket(count: number): string {
  if (count <= 1) return "one"
  if (count <= 3) return "two_to_three"
  if (count <= 10) return "four_to_ten"
  return "eleven_plus"
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
  hint?: string
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
      {hint && <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{hint}</p>}
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
  icon: typeof Target
  label: string
  value: string
  note?: string
  tone?: "default" | "positive" | "accent"
}) {
  const toneClasses = {
    default: "border-border bg-white",
    positive: "border-success/20 bg-success-bg",
    accent: "border-accent-mid bg-accent-light",
  }[tone]

  const iconClasses = {
    default: "bg-subtle text-tertiary",
    positive: "bg-white text-success",
    accent: "bg-white text-accent",
  }[tone]

  return (
    <div className={`rounded-xl border p-4 ${toneClasses}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted">{label}</p>
          <p className="mt-1.5 text-[22px] font-semibold tracking-[-0.03em] text-ink">{value}</p>
        </div>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClasses}`}>
          <Icon size={16} />
        </span>
      </div>
      {note && <p className="mt-2 text-[12px] leading-relaxed text-tertiary">{note}</p>}
    </div>
  )
}

export function AgentOutreachCampaignPlanner({
  markets,
  availabilityAsOf,
}: AgentOutreachCampaignPlannerProps) {
  const [purpose, setPurpose] = useState<Purpose>("sell")
  const [selectedStateCodes, setSelectedStateCodes] = useState<string[]>(["TX"])
  const [fields, setFields] = useState<PlannerFields>(INITIAL_FIELDS)
  const startedTracked = useRef(false)
  const generatedTracked = useRef(false)

  const purposeCopy = PURPOSES[purpose]
  const selectedMarkets = useMemo(
    () => markets.filter((market) => selectedStateCodes.includes(market.code)),
    [markets, selectedStateCodes]
  )
  const marketAvailabilityLoaded =
    selectedMarkets.length > 0 && selectedMarkets.every((market) => market.availableEmailRecords !== null)
  const marketEmailRecords = marketAvailabilityLoaded
    ? selectedMarkets.reduce((sum, market) => sum + (market.availableEmailRecords ?? 0), 0)
    : 0

  const result = useMemo(
    () =>
      calculateAgentOutreachCampaign({
        marketEmailRecords,
        plannedContacts: numberFromField(fields.plannedContacts),
        touchesPerContact: numberFromField(fields.touchesPerContact),
        targetWins: numberFromField(fields.targetWins),
        dailySendCapacity: numberFromField(fields.dailySendCapacity),
        deliveryRate: numberFromField(fields.deliveryRate),
        positiveReplyRate: numberFromField(fields.positiveReplyRate),
        qualifiedConversationRate: numberFromField(fields.qualifiedConversationRate),
        winRate: numberFromField(fields.winRate),
        valuePerWin: numberFromField(fields.valuePerWin),
        campaignCost: numberFromField(fields.campaignCost),
      }),
    [fields, marketEmailRecords]
  )

  const hasFunnelInputs =
    marketAvailabilityLoaded &&
    fields.plannedContacts.trim() !== "" &&
    fields.deliveryRate.trim() !== "" &&
    fields.positiveReplyRate.trim() !== "" &&
    fields.qualifiedConversationRate.trim() !== "" &&
    fields.winRate.trim() !== ""
  const hasGoal = hasFunnelInputs && fields.targetWins.trim() !== ""
  const hasEconomics = hasFunnelInputs && fields.valuePerWin.trim() !== "" && fields.campaignCost.trim() !== ""
  const stateOptions = markets
    .filter((market) => !selectedStateCodes.includes(market.code))
    .map((market) => ({ value: market.code, label: `${market.name} (${market.code})` }))
  const selectedStateHref = selectedMarkets.length === 1 ? `/states/${selectedMarkets[0].slug}` : "/states"

  useEffect(() => {
    if (!hasFunnelInputs || generatedTracked.current) return
    generatedTracked.current = true
    track("agent_outreach_planner_generated", {
      purpose,
      selected_state_count: stateCountBucket(selectedMarkets.length),
      planned_contact_bucket: valueBucket(result.plannedContacts),
    })
  }, [hasFunnelInputs, purpose, result.plannedContacts, selectedMarkets.length])

  function markStarted() {
    if (startedTracked.current) return
    startedTracked.current = true
    track("agent_outreach_planner_started", { purpose })
  }

  function updateField(field: keyof PlannerFields, value: string) {
    markStarted()
    setFields((current) => ({ ...current, [field]: value }))
  }

  function addState(stateCode: string) {
    if (!stateCode || selectedStateCodes.includes(stateCode)) return
    markStarted()
    setSelectedStateCodes((current) => [...current, stateCode])
  }

  function removeState(stateCode: string) {
    markStarted()
    setSelectedStateCodes((current) => current.filter((code) => code !== stateCode))
  }

  function selectAllStates() {
    markStarted()
    setSelectedStateCodes(markets.map((market) => market.code))
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-start">
        <form className="card p-5 sm:p-6" onSubmit={(event) => event.preventDefault()}>
          <div className="flex items-start gap-3 border-b border-border pb-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-mid bg-accent-light text-accent">
              <Target size={20} />
            </span>
            <div>
              <h2 className="text-[18px] font-semibold text-ink">Build your campaign model</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-tertiary">
                Your funnel rates and financial assumptions stay in this browser.
              </p>
            </div>
          </div>

          <fieldset className="pt-6">
            <legend className="text-[13px] font-mono font-medium uppercase tracking-[0.08em] text-muted">
              1. Campaign context
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {(Object.keys(PURPOSES) as Purpose[]).map((option) => {
                const optionCopy = PURPOSES[option]
                const selected = purpose === option
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      markStarted()
                      setPurpose(option)
                    }}
                    className={`min-h-22 rounded-xl border p-3 text-left transition-all duration-150 ${
                      selected
                        ? "border-accent bg-accent-light shadow-sm"
                        : "border-border bg-white hover:border-border-strong hover:bg-subtle"
                    }`}
                  >
                    <span className={`block text-[13px] font-semibold ${selected ? "text-accent" : "text-ink"}`}>
                      {optionCopy.label}
                    </span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-tertiary">
                      {optionCopy.winLabel[0].toUpperCase() + optionCopy.winLabel.slice(1)} goal
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">{purposeCopy.description}</p>

            <div className="mt-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium text-ink">Target markets</p>
                  <p className="mt-1 text-[12px] text-muted">Choose states where you plan to reach agents.</p>
                </div>
                <button
                  type="button"
                  onClick={selectAllStates}
                  className="text-[12px] font-medium text-accent transition-colors hover:text-accent-hover"
                >
                  Select all 50 states
                </button>
              </div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start">
                <CustomSelect
                  value=""
                  options={stateOptions}
                  onChange={addState}
                  placeholder="Add a state"
                  aria-label="Add a target state"
                  className="w-full sm:w-60"
                  minWidth={0}
                />
                <div className="flex min-h-11 flex-1 flex-wrap content-center gap-2 rounded-lg border border-border bg-subtle/60 p-2">
                  {selectedMarkets.length > 0 ? (
                    selectedMarkets.map((market) => (
                      <span
                        key={market.code}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white py-1 pl-2.5 pr-1.5 text-[12px] text-body shadow-sm"
                      >
                        <span className="font-mono font-semibold text-accent">{market.code}</span>
                        <span>{market.name}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${market.name}`}
                          onClick={() => removeState(market.code)}
                          className="rounded p-0.5 text-muted transition-colors hover:bg-subtle hover:text-ink"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="px-1 text-[12px] text-muted">Add at least one state to see current availability.</span>
                  )}
                </div>
              </div>
              {marketAvailabilityLoaded ? (
                <p className="mt-2 text-[12px] text-tertiary">
                  <span className="font-medium text-ink">{integerFormatter.format(marketEmailRecords)}</span> available email records in the selected markets
                  {availabilityAsOf ? ` · updated ${availabilityAsOf}` : ""}.
                </p>
              ) : selectedMarkets.length > 0 ? (
                <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-relaxed text-warning">
                  <CircleAlert className="mt-0.5 shrink-0" size={13} />
                  Current email availability is temporarily unavailable. Try again later before using this model.
                </p>
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                id="planned-contacts"
                label="Planned unique contacts"
                value={fields.plannedContacts}
                onChange={(value) => updateField("plannedContacts", value)}
                hint="Exclude opt-outs, suppressions, and contacts you will not email."
                min={0}
                max={marketAvailabilityLoaded ? marketEmailRecords : undefined}
                step="1"
                inputMode="numeric"
              />
              <Field
                id="touches-per-contact"
                label="Planned touches per contact"
                value={fields.touchesPerContact}
                onChange={(value) => updateField("touchesPerContact", value)}
                hint="Used only for message workload, not conversion assumptions."
                min={1}
                max={6}
                step="1"
                inputMode="numeric"
              />
              <Field
                id="target-wins"
                label={`Target new ${purposeCopy.winLabel}s`}
                value={fields.targetWins}
                onChange={(value) => updateField("targetWins", value)}
                hint="Optional. It unlocks the goal-feasibility estimate."
                min={1}
                step="1"
                inputMode="numeric"
              />
              <Field
                id="daily-send-capacity"
                label="Daily message capacity"
                value={fields.dailySendCapacity}
                onChange={(value) => updateField("dailySendCapacity", value)}
                hint="Optional. Use your own approved capacity across all sending infrastructure."
                min={0}
                step="1"
                inputMode="numeric"
              />
            </div>
          </fieldset>

          <fieldset className="mt-7 border-t border-border pt-6">
            <legend className="text-[13px] font-mono font-medium uppercase tracking-[0.08em] text-muted">
              2. Funnel assumptions
            </legend>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              Enter results from a comparable campaign. USAgentLeads does not provide performance benchmarks.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                id="delivery-rate"
                label="Delivered-contact rate"
                value={fields.deliveryRate}
                onChange={(value) => updateField("deliveryRate", value)}
                hint="Delivered contacts ÷ planned unique contacts."
                suffix="%"
                min={0}
                max={100}
              />
              <Field
                id="positive-reply-rate"
                label="Positive-reply rate"
                value={fields.positiveReplyRate}
                onChange={(value) => updateField("positiveReplyRate", value)}
                hint="Positive replies ÷ delivered contacts."
                suffix="%"
                min={0}
                max={100}
              />
              <Field
                id="qualified-conversation-rate"
                label={`${purposeCopy.qualifiedStageLabel[0].toUpperCase() + purposeCopy.qualifiedStageLabel.slice(1)} rate`}
                value={fields.qualifiedConversationRate}
                onChange={(value) => updateField("qualifiedConversationRate", value)}
                hint={`${purposeCopy.qualifiedStagePlural[0].toUpperCase() + purposeCopy.qualifiedStagePlural.slice(1)} ÷ positive replies.`}
                suffix="%"
                min={0}
                max={100}
              />
              <Field
                id="win-rate"
                label={`${purposeCopy.winLabel[0].toUpperCase() + purposeCopy.winLabel.slice(1)} rate`}
                value={fields.winRate}
                onChange={(value) => updateField("winRate", value)}
                hint={`New ${purposeCopy.winLabel}s ÷ ${purposeCopy.qualifiedStagePlural}.`}
                suffix="%"
                min={0}
                max={100}
              />
            </div>
          </fieldset>

          <fieldset className="mt-7 border-t border-border pt-6">
            <legend className="text-[13px] font-mono font-medium uppercase tracking-[0.08em] text-muted">
              3. Economics
            </legend>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              Optional. Use contribution or gross profit per win—not top-line revenue—to make ROI meaningful.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                id="value-per-win"
                label={`First-year contribution per ${purposeCopy.winLabel}`}
                value={fields.valuePerWin}
                onChange={(value) => updateField("valuePerWin", value)}
                hint="Your estimated gross profit or contribution margin."
                prefix="$"
                min={0}
              />
              <Field
                id="campaign-cost"
                label="Total campaign cost"
                value={fields.campaignCost}
                onChange={(value) => updateField("campaignCost", value)}
                hint="Include data, tools, labor, creative, and other costs if relevant."
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
                <h2 className="mt-1 text-[18px] font-semibold text-ink">Campaign outlook</h2>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent-mid bg-white text-accent">
                <BarChart3 size={18} />
              </span>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            {marketAvailabilityLoaded ? (
              <div className="rounded-xl border border-border bg-white p-4">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                  <Users size={15} className="text-accent" />
                  Available audience
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[22px] font-semibold tracking-[-0.03em] text-ink">
                      {integerFormatter.format(marketEmailRecords)}
                    </p>
                    <p className="text-[12px] text-tertiary">email records in {selectedMarkets.length} selected {selectedMarkets.length === 1 ? "state" : "states"}</p>
                  </div>
                  {fields.plannedContacts.trim() !== "" && (
                    <span className="rounded-full border border-border bg-subtle px-2.5 py-1 text-[11px] font-mono text-tertiary">
                      {formatPercent(result.marketCoverage)} planned coverage
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-subtle/60 p-5 text-center">
                <Users className="mx-auto text-muted" size={22} />
                <p className="mt-3 text-[14px] font-medium text-ink">Choose a market to begin</p>
                <p className="mt-1 text-[12px] leading-relaxed text-tertiary">We use current email-record availability to keep the plan grounded in your selected states.</p>
              </div>
            )}

            {marketAvailabilityLoaded && !hasFunnelInputs && (
              <div className="rounded-xl border border-accent-mid bg-accent-light/60 p-4">
                <p className="text-[14px] font-semibold text-ink">Add your own campaign assumptions</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-tertiary">
                  Enter planned contacts plus all four funnel rates to see a modeled {purposeCopy.qualifiedStageLabel} and {purposeCopy.winLabel} outlook.
                </p>
              </div>
            )}

            {hasFunnelInputs && (
              <>
                {result.plannedContactsWereCapped && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] leading-relaxed text-warning">
                    <CircleAlert className="mt-0.5 shrink-0" size={14} />
                    Your planned contacts exceed the selected market&apos;s current email-record availability, so the model uses {integerFormatter.format(result.plannedContacts)} contacts.
                  </div>
                )}

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold text-ink">Modeled funnel</p>
                    <span className="text-[11px] font-mono text-muted">unique contacts</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Planned contacts", value: formatPeople(result.plannedContacts), rate: null },
                      { label: "Delivered contacts", value: formatPeople(result.deliveredMessages), rate: fields.deliveryRate },
                      { label: "Positive replies", value: formatPeople(result.positiveReplies), rate: fields.positiveReplyRate },
                      { label: purposeCopy.qualifiedStagePlural[0].toUpperCase() + purposeCopy.qualifiedStagePlural.slice(1), value: formatPeople(result.qualifiedConversations), rate: fields.qualifiedConversationRate },
                      { label: `Modeled ${purposeCopy.winLabel}s`, value: formatPeople(result.modeledWins), rate: fields.winRate },
                    ].map((stage, index) => (
                      <div key={stage.label} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-mono font-semibold ${
                            index === 4 ? "bg-accent text-white" : "bg-subtle text-tertiary"
                          }`}>
                            {index + 1}
                          </span>
                          <span className="truncate text-[12px] text-body">{stage.label}</span>
                        </div>
                        <span className="shrink-0 text-[13px] font-semibold text-ink">
                          {stage.value}{stage.rate ? <span className="ml-1 text-[11px] font-normal text-muted">({stage.rate}%)</span> : null}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <ResultCard
                    icon={Send}
                    label="Planned workload"
                    value={`${integerFormatter.format(result.totalPlannedMessages)} messages`}
                    note={result.campaignDays !== null ? `${result.campaignDays} sending ${result.campaignDays === 1 ? "day" : "days"} at your stated capacity.` : `${result.touchesPerContact} ${result.touchesPerContact === 1 ? "touch" : "touches"} per contact.`}
                  />
                  <ResultCard
                    icon={Target}
                    label={`Modeled ${purposeCopy.winLabel}s`}
                    value={formatPeople(result.modeledWins)}
                    note="An average based entirely on your entered funnel rates."
                    tone="accent"
                  />
                </div>

                {hasGoal && result.contactsNeededForGoal !== null && (
                  <div className={`rounded-xl border p-4 ${result.goalFitsSelectedMarkets ? "border-success/20 bg-success-bg" : "border-amber-200 bg-amber-50"}`}>
                    <div className="flex items-start gap-2.5">
                      {result.goalFitsSelectedMarkets ? (
                        <CheckCircle2 className="mt-0.5 shrink-0 text-success" size={17} />
                      ) : (
                        <CircleAlert className="mt-0.5 shrink-0 text-warning" size={17} />
                      )}
                      <div>
                        <p className="text-[13px] font-semibold text-ink">
                          {result.goalFitsSelectedMarkets ? "Goal fits the selected audience" : "Goal exceeds the selected audience"}
                        </p>
                        <p className="mt-1 text-[12px] leading-relaxed text-tertiary">
                          Reaching {integerFormatter.format(numberFromField(fields.targetWins))} new {purposeCopy.winLabel}{numberFromField(fields.targetWins) === 1 ? "" : "s"} requires {integerFormatter.format(result.contactsNeededForGoal)} contacts
                          {result.messagesNeededForGoal !== null ? ` and ${integerFormatter.format(result.messagesNeededForGoal)} planned messages` : ""}.
                          {result.daysNeededForGoal !== null ? ` At your stated capacity, that is about ${result.daysNeededForGoal} sending ${result.daysNeededForGoal === 1 ? "day" : "days"}.` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {hasEconomics && (
                  <div>
                    <p className="mb-3 text-[13px] font-semibold text-ink">Modeled economics</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      <ResultCard
                        icon={CircleDollarSign}
                        label="Net contribution"
                        value={currencyFormatter.format(result.estimatedNetContribution)}
                        note={`After ${currencyFormatter.format(numberFromField(fields.campaignCost))} in total campaign cost.`}
                        tone={result.estimatedNetContribution >= 0 ? "positive" : "default"}
                      />
                      <ResultCard
                        icon={BarChart3}
                        label="Modeled ROI"
                        value={result.estimatedRoi === null ? "—" : formatPercent(result.estimatedRoi)}
                        note={result.estimatedCostPerWin === null ? "Add a non-zero modeled win rate to see cost per win." : `${currencyFormatter.format(result.estimatedCostPerWin)} per modeled ${purposeCopy.winLabel}.`}
                        tone="accent"
                      />
                    </div>
                    {result.breakEvenWins !== null && result.breakEvenContacts !== null && (
                      <p className="mt-3 text-[12px] leading-relaxed text-tertiary">
                        Break-even: {integerFormatter.format(result.breakEvenWins)} {purposeCopy.winLabel}{result.breakEvenWins === 1 ? "" : "s"} or about {integerFormatter.format(result.breakEvenContacts)} contacts under these assumptions.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-[15px] font-semibold text-ink">Ready to activate your plan?</p>
          <p className="mt-1 text-[13px] leading-relaxed text-tertiary">
            Browse the underlying state coverage or inspect a 500-contact CSV sample before you commit.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 md:justify-end">
          <Link
            href={selectedStateHref}
            onClick={() =>
              track("agent_outreach_planner_cta_clicked", {
                purpose,
                cta: "state_data",
                selected_state_count: stateCountBucket(selectedMarkets.length),
              })
            }
            className="btn-outline px-5 py-2.5 text-[14px]"
          >
            See matching data <ArrowRight size={14} />
          </Link>
          <FreeSampleDialog
            source="agent_outreach_campaign_planner"
            triggerLabel="Get Free Sample"
            triggerClassName="btn-primary px-5 py-2.5 text-[14px]"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-subtle/60 p-4 text-[12px] leading-relaxed text-tertiary">
        <p>
          <strong className="font-semibold text-ink">Planning model only.</strong> This is not a prediction of delivery, replies, sales, hires, or revenue. Funnel rates are your assumptions; available email records do not guarantee a contact is active, deliverable, in-market, or a fit for your offer.
        </p>
        <p className="mt-2">
          Follow recipient opt-outs, your email platform&apos;s rules, and applicable law. This tool does not assess legal, referral, co-marketing, or RESPA compliance.
        </p>
      </div>
    </div>
  )
}
