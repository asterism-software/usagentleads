"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AgentTable } from "@/components/dashboard/AgentTable"
import { SearchFilterBar } from "@/components/dashboard/SearchFilterBar"
import { Loader2 } from "lucide-react"
import type { Agent } from "@/types"
import { useDashboard } from "@/components/dashboard/DashboardContext"

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { preferences } = useDashboard()
  const [agents, setAgents] = useState<Agent[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const requestedState = searchParams.get("state")
  const [state, setState] = useState(requestedState === "all" ? "" : requestedState || preferences.defaultState || "")
  const [pageSize, setPageSize] = useState(preferences.defaultPageSize)
  const [accessError, setAccessError] = useState<"auth" | "subscription" | null>(null)

  // True right after a successful checkout (?welcome=1). The subscription_created
  // webhook may not have landed yet, so we briefly retry before showing the
  // "Subscription Required" screen to a user who just paid.
  const justSubscribed = useRef(false)
  const subRetries = useRef(0)
  const MAX_SUB_RETRIES = 8

  useEffect(() => {
    const requested = searchParams.get("state")
    setState(requested === "all" ? "" : requested || preferences.defaultState || "")
    setPage(1)
  }, [searchParams, preferences.defaultState])

  // Detect post-checkout landing and strip the flag from the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("welcome") === "1") {
      justSubscribed.current = true
      window.history.replaceState({}, "", "/dashboard")
    }
  }, [])

  const fetchAgents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (state && state !== "all") params.set("state", state)
      if (search) params.set("search", search)
      params.set("page", String(page))
      params.set("pageSize", String(pageSize))

      const res = await fetch(`/api/agents?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setAgents(data.data)
        setCount(data.count)
        setTotalPages(data.totalPages)
        setAccessError(null)
        subRetries.current = 0
      } else if (res.status === 401) {
        setAccessError("auth")
        return
      } else if (res.status === 403) {
        // Freshly subscribed: the webhook may still be in flight. Keep the
        // loading state held and retry rather than bouncing a paying user.
        if (justSubscribed.current && subRetries.current < MAX_SUB_RETRIES) {
          subRetries.current += 1
          setTimeout(fetchAgents, 2000)
          return // leave loading=true; the spinner stays until access resolves
        }
        setAccessError("subscription")
        return
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error)
    }
    setLoading(false)
  }, [state, search, page, pageSize])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleStateSelect = (stateCode: string) => {
    setState(stateCode)
    setPage(1)
    router.replace(stateCode ? `/dashboard?state=${encodeURIComponent(stateCode)}` : "/dashboard?state=all")
  }

  const handleClear = () => {
    setSearch("")
    setState("")
    setPage(1)
    router.replace("/dashboard?state=all")
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size as 25 | 50 | 100)
    setPage(1)
  }

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, count)

  // Redirect unauthenticated users to login
  if (accessError === "auth") {
    router.push("/login?next=/dashboard")
    return (
      <div className="flex h-screen items-center justify-center bg-page">
        <Loader2 className="h-6 w-6 animate-spin text-tertiary" />
      </div>
    )
  }

  // Show subscription required message
  if (accessError === "subscription") {
    return (
      <div className="flex h-screen items-center justify-center bg-page px-4">
        <div className="card max-w-md w-full p-8 text-center">
          <h2 className="text-[20px] font-semibold text-ink mb-2">Subscription Required</h2>
          <p className="text-[15px] text-tertiary mb-6">
            You need an active Pro Dashboard subscription to access the agent database.
          </p>
          <button
            onClick={() => router.push("/pricing")}
            className="btn-primary w-full justify-center"
          >
            View Pricing
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8">
          <div className="mb-8">
            <h1 className="text-[24px] font-semibold text-ink tracking-[-0.01em]">
              Agent Database
            </h1>
            <p className="text-[14px] text-tertiary mt-1">
              Browse and search all {count > 0 ? count.toLocaleString() : ""} verified US real estate agents
            </p>
          </div>

          {/* Search/filter bar */}
          <div className="mb-5 space-y-3">
            <SearchFilterBar
              search={search}
              state={state}
              onSearchChange={setSearch}
              onStateChange={handleStateSelect}
              onClear={handleClear}
            />
            <p className="font-mono text-[13px] sm:text-[14px] text-tertiary">
              <span className="text-ink font-medium">{start}–{end}</span> of{" "}
              <span className="text-ink font-medium">{count.toLocaleString()}</span> agents
            </p>
          </div>

          <AgentTable
            agents={agents}
            page={page}
            totalPages={totalPages}
            loading={loading}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
    </div>
  )
}
