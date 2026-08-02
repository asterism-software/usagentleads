"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  Key,
  Loader2,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { useDashboard } from "@/components/dashboard/DashboardContext"

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  expires_at: string | null
  revoked_at: string | null
  created_at: string
}

interface RecentActivity {
  id: string
  method: string
  endpoint: string
  status_code: number
  response_time_ms: number | null
  created_at: string
  key_name: string
  key_prefix: string | null
}

interface UsageStats {
  monthly_used: number
  monthly_limit: number
  resets_at: string
  daily_counts: { date: string; count: number }[]
  activity?: {
    window_days: number
    total_requests: number
    success_count: number
    error_count: number
    success_rate: number
    avg_latency_ms: number
    top_endpoints: { endpoint: string; count: number }[]
    recent: RecentActivity[]
  }
}

function formatDate(value: string | null, includeTime = false) {
  if (!value) return "Never"
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: includeTime ? undefined : "numeric",
    hour: includeTime ? "numeric" : undefined,
    minute: includeTime ? "2-digit" : undefined,
  })
}

export default function ApiKeysPage() {
  const { access } = useDashboard()
  const router = useRouter()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeError, setUpgradeError] = useState("")
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const [revoking, setRevoking] = useState(false)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameName, setRenameName] = useState("")
  const [renaming, setRenaming] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("upgraded") === "1" && !access.hasApi) {
      let attempts = 0
      const interval = window.setInterval(() => {
        attempts += 1
        router.refresh()
        if (attempts >= 8) window.clearInterval(interval)
      }, 2000)
      return () => window.clearInterval(interval)
    }
    if (params.get("welcome") === "1" || params.get("upgraded") === "1") {
      window.history.replaceState({}, "", "/dashboard/api-keys")
    }
  }, [access.hasApi, router])

  const fetchKeys = useCallback(async () => {
    try {
      const response = await fetch("/api/api-keys")
      const data = await response.json()
      setKeys(data.keys || [])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUsage = useCallback(async () => {
    try {
      const response = await fetch("/api/api-keys/usage")
      if (response.ok) setUsage(await response.json())
    } catch {
      // Usage analytics are supplementary to key management.
    }
  }, [])

  useEffect(() => {
    fetchKeys()
    fetchUsage()
  }, [fetchKeys, fetchUsage])

  const refreshUsage = async () => {
    setRefreshing(true)
    await Promise.all([fetchKeys(), fetchUsage()])
    setRefreshing(false)
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName || undefined }),
      })
      if (response.ok) {
        const data = await response.json()
        setCreatedKey(data.key)
        setNewKeyName("")
        setShowCreateForm(false)
        await fetchKeys()
      }
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id: string) => {
    setRevoking(true)
    try {
      const response = await fetch(`/api/api-keys/${id}`, { method: "DELETE" })
      if (response.ok) {
        setRevokeId(null)
        await fetchKeys()
      }
    } finally {
      setRevoking(false)
    }
  }

  const handleRename = async () => {
    if (!renameId || !renameName.trim()) return
    setRenaming(true)
    try {
      const response = await fetch(`/api/api-keys/${renameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameName.trim() }),
      })
      if (response.ok) {
        setRenameId(null)
        setRenameName("")
        await fetchKeys()
      }
    } finally {
      setRenaming(false)
    }
  }

  const handleUpgrade = async () => {
    setUpgrading(true)
    setUpgradeError("")
    try {
      const response = await fetch("/api/subscription/upgrade", { method: "POST" })
      const data = await response.json()
      if (response.ok && data.url) {
        window.location.assign(data.url)
        return
      }
      setUpgradeError(data.error || "Unable to start upgrade")
    } catch {
      setUpgradeError("Unable to start upgrade")
    } finally {
      setUpgrading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-tertiary" /></div>
  }

  const activeKeys = keys.filter((key) => !key.revoked_at)
  const revokedKeys = keys.filter((key) => key.revoked_at)
  const usagePercent = usage
    ? Math.min(100, Math.round((usage.monthly_used / usage.monthly_limit) * 100))
    : 0
  const activity = usage?.activity
  const dailyPeak = Math.max(1, ...(usage?.daily_counts.map((item) => item.count) || [1]))

  return (
    <div className="relative min-h-full overflow-hidden bg-gradient-to-b from-white via-page to-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[5%] top-[10%] h-80 w-80 rounded-full bg-accent/[0.07] blur-[110px]" />
        <div className="absolute right-[5%] top-[35%] h-72 w-72 rounded-full bg-accent/[0.05] blur-[100px]" />
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-ink sm:text-[30px]">API Access</h1>
            <p className="mt-2 text-[15px] text-body">Manage API keys and access verified real estate agent data programmatically.</p>
          </div>
          <Link href="/dashboard/api-docs" className="btn-outline w-fit justify-center">API Docs <ExternalLink size={14} /></Link>
        </header>

        {!access.hasApi && (
          <div className="mb-6 rounded-2xl border border-accent/25 bg-accent-light/60 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-accent"><Lock size={18} /></span>
                <div><p className="text-[15px] font-semibold text-ink">Unlock API access with Pro API</p><p className="mt-1 text-[13px] leading-relaxed text-body">Explore the complete API workspace below. Upgrade to create keys and make 10,000 requests each month.</p></div>
              </div>
              <button onClick={handleUpgrade} disabled={upgrading} className="btn-primary shrink-0 justify-center disabled:opacity-60">{upgrading ? <Loader2 size={14} className="animate-spin" /> : <>Upgrade — $79/mo <ArrowUpRight size={14} /></>}</button>
            </div>
            {upgradeError && <p role="alert" className="mt-3 text-[13px] text-danger">{upgradeError}</p>}
          </div>
        )}

        <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-light text-accent"><Key size={23} /></span>
              <div><h2 className="text-[20px] font-semibold text-ink">API Keys</h2><p className="mt-0.5 text-[13px] text-body">Create and manage keys for the REST API.</p></div>
            </div>
            <button onClick={() => setShowCreateForm((value) => !value)} disabled={!access.hasApi || activeKeys.length >= 3} className="btn-primary shrink-0 justify-center disabled:cursor-not-allowed disabled:opacity-50"><Plus size={14} /> New Key</button>
          </div>

          {createdKey && (
            <div className="mb-6 rounded-2xl border border-success/25 bg-success-bg p-4">
              <div className="flex items-start gap-3"><span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-success"><Check size={14} /></span><div className="min-w-0 flex-1"><p className="text-[14px] font-semibold text-ink">API key created — copy it now</p><p className="mt-1 text-[12px] text-body">For security, the full value will not be shown again.</p><div className="mt-3 flex items-center gap-2 rounded-xl border border-success/15 bg-white p-3"><code className="min-w-0 flex-1 break-all text-[12px] text-ink">{createdKey}</code><button onClick={() => copyToClipboard(createdKey)} className="rounded-lg p-2 text-tertiary hover:bg-subtle hover:text-ink" aria-label="Copy API key">{copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}</button></div></div><button onClick={() => setCreatedKey(null)} className="text-[12px] font-medium text-tertiary hover:text-ink">Dismiss</button></div>
            </div>
          )}

          {showCreateForm && access.hasApi && (
            <div className="mb-6 rounded-2xl border border-border bg-subtle/40 p-4 sm:p-5">
              <label htmlFor="new-api-key" className="mb-2 block text-[13px] font-medium text-ink">Key name</label>
              <div className="flex flex-col gap-3 sm:flex-row"><input id="new-api-key" autoFocus maxLength={50} value={newKeyName} onChange={(event) => setNewKeyName(event.target.value)} placeholder="e.g., Production CRM" className="input flex-1" /><button onClick={handleCreate} disabled={creating} className="btn-primary justify-center disabled:opacity-60">{creating ? <Loader2 size={14} className="animate-spin" /> : <><Key size={14} /> Create key</>}</button><button onClick={() => setShowCreateForm(false)} className="btn-ghost justify-center">Cancel</button></div>
            </div>
          )}

          {!access.hasApi ? (
            <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center"><Lock className="mx-auto mb-3 h-6 w-6 text-muted" /><p className="text-[14px] font-medium text-ink">Key management is locked</p><p className="mt-1 text-[13px] text-muted">Upgrade to Pro API to create up to three active keys.</p></div>
          ) : activeKeys.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center"><Key className="mx-auto mb-3 h-6 w-6 text-muted" /><p className="text-[14px] font-medium text-ink">No API keys yet</p><p className="mt-1 text-[13px] text-muted">Create a key to connect your first integration.</p></div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[680px] text-left text-[13px]"><thead className="bg-subtle/60 text-[11px] uppercase tracking-wider text-muted"><tr><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Key</th><th className="px-4 py-3 font-medium">Created</th><th className="px-4 py-3 font-medium">Last used</th><th className="px-4 py-3"><span className="sr-only">Actions</span></th></tr></thead><tbody className="divide-y divide-border">{activeKeys.map((key) => <tr key={key.id}><td className="px-4 py-4 font-medium text-ink">{key.name}</td><td className="px-4 py-4 font-mono text-[12px] text-tertiary">{key.key_prefix}{"•".repeat(12)}</td><td className="px-4 py-4 text-body">{formatDate(key.created_at)}</td><td className="px-4 py-4 text-body">{formatDate(key.last_used_at)}</td><td className="px-4 py-4"><div className="flex justify-end gap-1"><button onClick={() => { setRenameId(key.id); setRenameName(key.name) }} className="rounded-lg p-2 text-tertiary hover:bg-accent-light hover:text-accent" title="Rename key"><Pencil size={15} /></button><button onClick={() => setRevokeId(key.id)} className="rounded-lg p-2 text-tertiary hover:bg-danger/5 hover:text-danger" title="Revoke key"><Trash2 size={15} /></button></div></td></tr>)}</tbody></table>
            </div>
          )}

          {revokedKeys.length > 0 && <details className="mt-5 rounded-xl border border-border"><summary className="cursor-pointer px-4 py-3 text-[13px] font-medium text-tertiary">Revoked keys ({revokedKeys.length})</summary><div className="divide-y divide-border border-t border-border">{revokedKeys.map((key) => <div key={key.id} className="flex justify-between px-4 py-3 text-[13px] opacity-60"><span className="text-body line-through">{key.name}</span><span className="text-muted">Revoked {formatDate(key.revoked_at)}</span></div>)}</div></details>}
        </section>

        <section className="mt-6 rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-light text-accent"><Activity size={22} /></span><div><h2 className="text-[20px] font-semibold text-ink">Usage & Activity</h2><p className="mt-0.5 text-[13px] text-body">Monitor requests, performance, and recent API calls.</p></div></div><button onClick={refreshUsage} disabled={refreshing} className="btn-outline w-fit justify-center disabled:opacity-60"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh</button></div>

          <div className="mb-6 rounded-2xl border border-border bg-subtle/35 p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-[13px] font-medium text-ink">Monthly quota</p><p className="font-mono text-[12px] text-tertiary">{(usage?.monthly_used || 0).toLocaleString()} / {(usage?.monthly_limit || 10_000).toLocaleString()} requests</p></div><div className="h-2 overflow-hidden rounded-full bg-white"><div className={`h-full rounded-full ${usagePercent > 90 ? "bg-danger" : usagePercent > 70 ? "bg-warning" : "bg-accent"}`} style={{ width: `${usagePercent}%` }} /></div><p className="mt-2 text-[11px] text-muted">{access.hasApi && usage ? `Resets ${formatDate(usage.resets_at)}` : "10,000 requests per month with Pro API"}</p></div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border p-4"><div className="flex items-center justify-between"><p className="text-[12px] text-tertiary">Requests (30d)</p><BarChart3 size={15} className="text-accent" /></div><p className="mt-2 text-[22px] font-semibold text-ink">{activity?.total_requests.toLocaleString() || "0"}</p><div className="mt-3 flex h-8 items-end gap-1">{(usage?.daily_counts.slice(-14) || []).map((item) => <span key={item.date} className="min-w-1 flex-1 rounded-sm bg-accent/35" style={{ height: `${Math.max(10, (item.count / dailyPeak) * 100)}%` }} />)}</div></div>
            <div className="rounded-2xl border border-border p-4"><p className="text-[12px] text-tertiary">Success rate</p><p className="mt-2 text-[22px] font-semibold text-ink">{activity?.success_rate ?? 100}%</p><p className="mt-3 text-[11px] text-success">{activity?.success_count || 0} successful</p></div>
            <div className="rounded-2xl border border-border p-4"><p className="text-[12px] text-tertiary">Average latency</p><p className="mt-2 text-[22px] font-semibold text-ink">{activity?.avg_latency_ms || 0}<span className="ml-1 text-[12px] font-normal text-muted">ms</span></p><p className="mt-3 flex items-center gap-1 text-[11px] text-muted"><Clock3 size={12} /> Last 30 days</p></div>
            <div className="rounded-2xl border border-border p-4"><p className="text-[12px] text-tertiary">Top endpoint</p><p className="mt-2 truncate font-mono text-[13px] font-medium text-ink">{activity?.top_endpoints[0]?.endpoint || "/api/v1/agents"}</p><p className="mt-4 text-[11px] text-muted">{activity?.top_endpoints[0]?.count || 0} requests</p></div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-border"><div className="border-b border-border bg-subtle/45 px-4 py-3"><h3 className="text-[13px] font-semibold text-ink">Recent activity</h3></div>{activity?.recent.length ? <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-[12px]"><thead className="text-muted"><tr><th className="px-4 py-3 font-medium">Request</th><th className="px-4 py-3 font-medium">Key</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Latency</th><th className="px-4 py-3 font-medium">Time</th></tr></thead><tbody className="divide-y divide-border">{activity.recent.map((item) => <tr key={item.id}><td className="px-4 py-3"><span className="mr-2 font-mono font-semibold text-success">{item.method}</span><code className="text-ink">{item.endpoint}</code></td><td className="px-4 py-3 text-body">{item.key_name}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 font-medium ${item.status_code < 400 ? "bg-success-bg text-success" : "bg-danger/10 text-danger"}`}>{item.status_code}</span></td><td className="px-4 py-3 text-body">{item.response_time_ms ?? "—"} ms</td><td className="px-4 py-3 text-muted">{formatDate(item.created_at, true)}</td></tr>)}</tbody></table></div> : <div className="px-5 py-8 text-center text-[13px] text-muted">Your latest API calls will appear here.</div>}</div>
        </section>

        <section className="mt-6 rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8"><h2 className="mb-2 text-[18px] font-semibold text-ink">Quick Start</h2><p className="mb-4 text-[13px] text-body">Fetch verified agents in California with your API key.</p><pre className="overflow-x-auto rounded-xl bg-ink p-5 text-[12px] leading-relaxed text-code-text sm:text-[13px]"><code>{`curl -H "X-API-Key: YOUR_API_KEY" \\\n  "https://www.usagentleads.com/api/v1/agents?state=CA&page=1&pageSize=25"`}</code></pre><div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-body"><span><strong className="font-medium text-ink">Rate limit:</strong> 60/minute</span><span><strong className="font-medium text-ink">Monthly quota:</strong> 10,000</span><Link href="/dashboard/api-docs" className="font-medium text-accent hover:underline">Read the complete API reference →</Link></div></section>
      </div>

      {revokeId && <><div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setRevokeId(null)} /><div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"><div className="pointer-events-auto w-full max-w-sm rounded-xl border border-border bg-white p-6 shadow-xl"><span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger"><AlertTriangle size={19} /></span><h3 className="text-[16px] font-semibold text-ink">Revoke API key?</h3><p className="mt-2 text-[14px] leading-relaxed text-body">This key will stop working immediately. Any integration using it will fail.</p><div className="mt-6 flex gap-3"><button onClick={() => setRevokeId(null)} className="btn-outline flex-1 justify-center">Keep key</button><button onClick={() => handleRevoke(revokeId)} disabled={revoking} className="flex flex-1 items-center justify-center rounded-lg bg-danger px-4 py-2.5 text-[14px] font-medium text-white disabled:opacity-60">{revoking ? <Loader2 size={14} className="animate-spin" /> : "Revoke"}</button></div></div></div></>}
      {renameId && <><div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setRenameId(null)} /><div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"><div className="pointer-events-auto w-full max-w-sm rounded-xl border border-border bg-white p-6 shadow-xl"><h3 className="mb-4 text-[16px] font-semibold text-ink">Rename API key</h3><label htmlFor="rename-api-key" className="mb-1.5 block text-[14px] font-medium text-body">Key name</label><input id="rename-api-key" autoFocus maxLength={50} value={renameName} onChange={(event) => setRenameName(event.target.value)} className="input mb-6 w-full" /><div className="flex gap-3"><button onClick={() => setRenameId(null)} className="btn-outline flex-1 justify-center">Cancel</button><button onClick={handleRename} disabled={renaming || !renameName.trim()} className="btn-primary flex-1 justify-center disabled:opacity-60">{renaming ? <Loader2 size={14} className="animate-spin" /> : "Save"}</button></div></div></div></>}
    </div>
  )
}
