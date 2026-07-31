"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Loader2,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react"
import Link from "next/link"

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  expires_at: string | null
  revoked_at: string | null
  created_at: string
}

interface UsageStats {
  monthly_used: number
  monthly_limit: number
  resets_at: string
  daily_counts: { date: string; count: number }[]
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsUpgrade, setNeedsUpgrade] = useState(false)

  // Create key state
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Revoke state
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const [revoking, setRevoking] = useState(false)

  // Code example toggle
  const [showExamples, setShowExamples] = useState(false)

  // True right after a Pro API checkout (?welcome=1). The subscription_created
  // webhook may still be in flight, so retry before showing the upgrade prompt.
  const justSubscribed = useRef(false)
  const upgradeRetries = useRef(0)
  const MAX_RETRIES = 8

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("welcome") === "1") {
      justSubscribed.current = true
      window.history.replaceState({}, "", "/dashboard/api-keys")
    }
  }, [])

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/api-keys")
      if (res.status === 403) {
        const data = await res.json()
        if (data.upgrade) {
          // Freshly subscribed: wait out webhook propagation before deciding
          // the plan doesn't include API access.
          if (justSubscribed.current && upgradeRetries.current < MAX_RETRIES) {
            upgradeRetries.current += 1
            setTimeout(fetchKeys, 2000)
            return
          }
          setNeedsUpgrade(true)
          setLoading(false)
          return
        }
      }
      const data = await res.json()
      setKeys(data.keys || [])
      setNeedsUpgrade(false)
      upgradeRetries.current = 0
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [])

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/api-keys/usage")
      if (res.ok) {
        setUsage(await res.json())
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    // fetchKeys owns the loading flag (it may retry while a webhook propagates).
    fetchKeys()
    fetchUsage()
  }, [fetchKeys, fetchUsage])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName || undefined }),
      })
      if (res.ok) {
        const data = await res.json()
        setCreatedKey(data.key)
        setNewKeyName("")
        fetchKeys()
      }
    } catch {
      // ignore
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id: string) => {
    setRevoking(true)
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" })
      if (res.ok) {
        setRevokeId(null)
        fetchKeys()
      }
    } catch {
      // ignore
    } finally {
      setRevoking(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fmtDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Never"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-tertiary" />
      </div>
    )
  }

  // Upgrade prompt for Pro Dashboard users
  if (needsUpgrade) {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center">
        <div className="card p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-light mx-auto mb-4">
            <Key className="h-6 w-6 text-accent" />
          </div>
          <h2 className="text-[18px] font-semibold text-ink mb-2">
            API Access Available on Pro API
          </h2>
          <p className="text-[15px] text-body mb-6">
            Upgrade to the Pro API plan ($79/month) to get programmatic access to agent data
            with API keys, 10,000 requests/month, and usage analytics.
          </p>
          <Link
            href="/pricing"
            className="btn-primary inline-flex items-center gap-2"
          >
            View Plans <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  const activeKeys = keys.filter((k) => !k.revoked_at)
  const revokedKeys = keys.filter((k) => k.revoked_at)
  const usagePercent = usage
    ? Math.min(100, Math.round((usage.monthly_used / usage.monthly_limit) * 100))
    : 0

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[22px] font-semibold text-ink">API Keys</h1>
          <p className="text-[15px] text-body mt-1">
            Manage your API keys for programmatic access
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true)
            setCreatedKey(null)
          }}
          disabled={activeKeys.length >= 3}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center sm:justify-start shrink-0"
        >
          <Plus size={14} />
          New Key
        </button>
      </div>

      {/* Usage Card */}
      {usage && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[14px] font-medium text-ink">Monthly Usage</p>
            <p className="text-[13px] font-mono text-tertiary">
              {usage.monthly_used.toLocaleString()} / {usage.monthly_limit.toLocaleString()} requests
            </p>
          </div>
          <div className="h-2 bg-subtle rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usagePercent > 90 ? "bg-danger" : usagePercent > 70 ? "bg-warning" : "bg-accent"
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <div className="mt-2">
            <p className="text-[12px] text-muted">
              Resets {new Date(usage.resets_at).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
      )}

      {/* Active Keys */}
      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-border bg-subtle/40">
          <p className="text-[14px] font-medium text-ink">
            Active Keys ({activeKeys.length}/3)
          </p>
        </div>
        {activeKeys.length === 0 ? (
          <div className="px-5 py-8 text-center text-[14px] text-muted">
            No API keys yet. Create one to get started.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activeKeys.map((key) => (
              <div key={key.id} className="px-5 py-4 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-ink">{key.name}</p>
                  <p className="text-[13px] font-mono text-tertiary mt-0.5">
                    {key.key_prefix}{"•".repeat(28)}
                  </p>
                  <p className="text-[12px] text-muted mt-1">
                    Created {fmtDate(key.created_at)} · Last used {fmtDate(key.last_used_at)}
                  </p>
                </div>
                <button
                  onClick={() => setRevokeId(key.id)}
                  className="shrink-0 ml-4 p-2 rounded-lg text-tertiary hover:text-danger hover:bg-danger/5 transition-colors"
                  title="Revoke key"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revoked Keys */}
      {revokedKeys.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-border bg-subtle/40">
            <p className="text-[14px] font-medium text-muted">
              Revoked Keys ({revokedKeys.length})
            </p>
          </div>
          <div className="divide-y divide-border">
            {revokedKeys.map((key) => (
              <div key={key.id} className="px-5 py-3 flex items-center justify-between opacity-60">
                <div className="min-w-0">
                  <p className="text-[14px] text-body line-through">{key.name}</p>
                  <p className="text-[12px] text-muted mt-0.5">
                    Revoked {fmtDate(key.revoked_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Start */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setShowExamples(!showExamples)}
          className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-subtle/40 transition-colors"
        >
          <p className="text-[14px] font-medium text-ink">Quick Start</p>
          <span className="text-[13px] text-tertiary">
            {showExamples ? "Hide" : "Show"} examples
          </span>
        </button>
        {showExamples && (
          <div className="px-5 pb-5 space-y-4">
            <div>
              <p className="text-[13px] font-medium text-body mb-2">cURL</p>
              <pre className="bg-ink text-white text-[12px] sm:text-[13px] p-4 rounded-lg overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap break-all sm:break-normal">
{`curl -H "X-API-Key: YOUR_API_KEY" \\
  "https://usagentleads.com/api/v1/agents?state=CA&page=1&pageSize=25"`}
              </pre>
            </div>
            <div>
              <p className="text-[13px] font-medium text-body mb-2">JavaScript</p>
              <pre className="bg-ink text-white text-[12px] sm:text-[13px] p-4 rounded-lg overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap break-all sm:break-normal">
{`const res = await fetch(
  "https://usagentleads.com/api/v1/agents?state=CA",
  { headers: { "X-API-Key": "YOUR_API_KEY" } }
);
const { data, count, quota } = await res.json();`}
              </pre>
            </div>
            <div className="text-[13px] text-body space-y-1.5">
              <p><span className="font-medium">Rate limit:</span> 60 requests/minute</p>
              <p><span className="font-medium">Monthly quota:</span> 10,000 requests/month</p>
              <p><span className="font-medium">Query params:</span> <code className="font-mono text-[12px] bg-subtle px-1.5 py-0.5 rounded">state</code>, <code className="font-mono text-[12px] bg-subtle px-1.5 py-0.5 rounded">search</code>, <code className="font-mono text-[12px] bg-subtle px-1.5 py-0.5 rounded">page</code>, <code className="font-mono text-[12px] bg-subtle px-1.5 py-0.5 rounded">pageSize</code> (25, 50, 100)</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              if (!createdKey) setShowCreateModal(false)
            }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="pointer-events-auto w-full max-w-md rounded-xl bg-white border border-border shadow-xl p-6 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {createdKey ? (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 mb-4">
                    <Check className="h-5 w-5 text-success" />
                  </div>
                  <h3 className="text-[16px] font-semibold text-ink mb-1">
                    API Key Created
                  </h3>
                  <p className="text-[14px] text-body mb-4">
                    Copy your key now. You won&apos;t be able to see it again.
                  </p>
                  <div className="flex items-center gap-2 bg-subtle rounded-lg p-3 mb-6">
                    <code className="flex-1 text-[13px] font-mono text-ink break-all">
                      {createdKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(createdKey)}
                      className="shrink-0 p-2 rounded-md hover:bg-white transition-colors"
                    >
                      {copied ? (
                        <Check size={14} className="text-success" />
                      ) : (
                        <Copy size={14} className="text-tertiary" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateModal(false)
                      setCreatedKey(null)
                    }}
                    className="w-full btn-primary"
                  >
                    Done
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-[16px] font-semibold text-ink mb-4">
                    Create API Key
                  </h3>
                  <label className="block text-[14px] font-medium text-body mb-1.5">
                    Key Name
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production, My CRM"
                    maxLength={50}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-[14px] text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent mb-6"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={creating}
                      className="flex-1 btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {creating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Key size={14} />
                          Create
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Revoke Confirmation Modal */}
      {revokeId && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setRevokeId(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="pointer-events-auto w-full max-w-sm rounded-xl bg-white border border-border shadow-xl p-6 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 mb-4">
                <AlertTriangle className="h-5 w-5 text-danger" />
              </div>
              <h3 className="text-[16px] font-semibold text-ink mb-1">
                Revoke API Key?
              </h3>
              <p className="text-[14px] text-body leading-relaxed mb-6">
                This key will immediately stop working. Any integrations using it will break.
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setRevokeId(null)}
                  className="flex-1 btn-outline"
                >
                  Keep Key
                </button>
                <button
                  onClick={() => handleRevoke(revokeId)}
                  disabled={revoking}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-danger text-white text-[14px] font-medium py-2.5 px-4 hover:bg-danger/90 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {revoking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Revoke"
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
