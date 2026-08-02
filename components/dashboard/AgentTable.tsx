"use client"

import { SearchX } from "lucide-react"
import { CustomSelect } from "@/components/ui/CustomSelect"
import type { Agent } from "@/types"

/** Strip leading/trailing non-letter chars from a name */
function cleanName(name: string): string {
  return name.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "").trim() || name
}

const PAGE_SIZE_OPTIONS = [
  { value: "25", label: "25 per page" },
  { value: "50", label: "50 per page" },
  { value: "100", label: "100 per page" },
]

interface AgentTableProps {
  agents: Agent[]
  page: number
  totalPages: number
  loading: boolean
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function AgentTable({
  agents,
  page,
  totalPages,
  loading,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: AgentTableProps) {
  if (loading) {
    return (
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col" className="hidden sm:table-cell">Phone</th>
                <th scope="col">State</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td><div className="h-4 rounded-md bg-subtle animate-pulse" style={{ width: `${65 + (i * 7) % 25}%` }} /></td>
                  <td><div className="h-4 rounded-md bg-subtle animate-pulse" style={{ width: `${55 + (i * 11) % 25}%` }} /></td>
                  <td className="hidden sm:table-cell"><div className="h-4 rounded-md bg-subtle animate-pulse" style={{ width: `${45 + (i * 13) % 25}%` }} /></td>
                  <td><div className="h-4 rounded-md bg-subtle animate-pulse w-10" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="text-center py-16 sm:py-24 px-6 sm:px-8">
        <div className="w-14 h-14 rounded-2xl bg-subtle border border-border flex items-center justify-center mx-auto mb-5">
          <SearchX size={24} className="text-muted" />
        </div>
        <p className="text-[16px] font-medium text-ink mb-1">No agents found</p>
        <p className="text-[14px] text-muted">
          Try a different name, email, or state filter
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col" className="hidden sm:table-cell">Phone</th>
                <th scope="col">State</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id}>
                  <td className="cell-name whitespace-nowrap">{cleanName(agent.name)}</td>
                  <td className="cell-email">
                    <span className="block truncate max-w-45 sm:max-w-none">{agent.email ?? "—"}</span>
                  </td>
                  <td className="cell-phone hidden sm:table-cell">{agent.phone ?? "—"}</td>
                  <td>
                    {agent.state
                      ? <span className="badge-state">{agent.state}</span>
                      : <span className="text-muted font-mono text-[12px]">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3 order-2 sm:order-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="btn-ghost disabled:opacity-40 disabled:pointer-events-none"
            >
              &larr; Prev
            </button>
            <span className="font-mono text-[13px] sm:text-[14px] text-tertiary sm:hidden">
              {page} / {totalPages.toLocaleString()}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="btn-ghost disabled:opacity-40 disabled:pointer-events-none sm:hidden"
            >
              Next &rarr;
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto order-1 sm:order-2">
            <span className="font-mono text-[13px] sm:text-[14px] text-tertiary sm:hidden">
              Page {page}/{totalPages.toLocaleString()}
            </span>
            <span className="hidden sm:inline font-mono text-[14px] text-tertiary">
              Page <span className="text-ink">{page}</span> of <span className="text-ink">{totalPages.toLocaleString()}</span>
            </span>
            <CustomSelect
              value={String(pageSize)}
              options={PAGE_SIZE_OPTIONS}
              onChange={(v) => onPageSizeChange(Number(v))}
              aria-label="Rows per page"
              minWidth={120}
              menuPlacement="top"
            />
          </div>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="btn-ghost disabled:opacity-40 disabled:pointer-events-none hidden sm:inline-flex order-3"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  )
}
