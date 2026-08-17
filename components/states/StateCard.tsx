import Link from "next/link"
import type { USState } from "@/types"
import { formatAgentCount } from "@/lib/utils/states"
import { ArrowRight } from "lucide-react"

export function StateCard({
  state,
}: {
  state: USState
  index?: number
}) {
  return (
    <Link
      href={`/states/${state.slug}`}
      aria-label={`${state.name} Realtor Email List with ${state.agentCount.toLocaleString()} contacts`}
      className="group flex h-full min-h-[172px] flex-col rounded-xl border border-border bg-white p-5 shadow-sm outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:border-accent"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex h-7 min-w-9 items-center justify-center rounded-md border border-accent-mid bg-accent-light px-2 font-mono text-[12px] font-semibold text-accent">
              {state.code}
            </span>
            <span className="text-[12px] font-mono uppercase tracking-wider text-muted">$99 CSV</span>
          </div>
          <h3 className="text-[17px] font-semibold leading-tight text-ink">{state.name}</h3>
          <p className="mt-1 text-[13px] font-medium text-tertiary">Realtor Email List</p>
        </div>
        <p className="shrink-0 font-mono text-[20px] font-semibold leading-none text-ink">
          {formatAgentCount(state.agentCount)}
        </p>
      </div>

      <div className="my-5 rounded-lg border border-border bg-page px-3 py-2">
        <p className="text-[12px] font-mono uppercase tracking-wider text-muted">
          {state.agentCount.toLocaleString()} contacts
        </p>
        <p className="mt-1 text-[13px] text-body">
          Name, email, phone, state
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between text-[14px] font-medium text-accent">
        <span>View data</span>
        <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}
