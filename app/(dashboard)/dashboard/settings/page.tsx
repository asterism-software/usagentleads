"use client"

import { useState } from "react"
import { Check, Loader2, Settings } from "lucide-react"
import { useDashboard } from "@/components/dashboard/DashboardContext"
import { US_STATES } from "@/lib/utils/states"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const { preferences } = useDashboard()
  const router = useRouter()
  const [defaultState, setDefaultState] = useState(preferences.defaultState || "")
  const [pageSize, setPageSize] = useState<number>(preferences.defaultPageSize)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setSaved(false)
    setError("")
    try {
      const response = await fetch("/api/dashboard/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultState: defaultState || null, defaultPageSize: pageSize }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to save settings")
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2500)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <div className="mb-8"><h1 className="text-[24px] font-semibold text-ink">Settings</h1><p className="mt-1 text-[14px] text-body">Choose how the agent database opens for you.</p></div>
      <form onSubmit={save} className="card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border p-5"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-light text-accent"><Settings size={17}/></span><div><h2 className="text-[15px] font-semibold text-ink">Database defaults</h2><p className="text-[12px] text-tertiary">Applied when a URL does not already specify a state.</p></div></div>
        <div className="space-y-6 p-5 sm:p-6">
          <div><label htmlFor="default-state" className="mb-1.5 block text-[14px] font-medium text-ink">Default state</label><select id="default-state" value={defaultState} onChange={(event) => setDefaultState(event.target.value)} className="input w-full"><option value="">All States</option>{US_STATES.map((state) => <option key={state.code} value={state.code}>{state.name} ({state.code})</option>)}</select><p className="mt-1.5 text-[12px] text-muted">The sidebar and database will open to this state.</p></div>
          <div><label htmlFor="default-page-size" className="mb-1.5 block text-[14px] font-medium text-ink">Rows per page</label><select id="default-page-size" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="input w-full">{[25, 50, 100].map((size) => <option key={size} value={size}>{size} agents</option>)}</select><p className="mt-1.5 text-[12px] text-muted">Larger pages may take slightly longer to load.</p></div>
          {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
        </div>
        <div className="flex justify-end border-t border-border bg-subtle/30 p-5"><button type="submit" disabled={saving} className="btn-primary min-w-28 justify-center disabled:opacity-60">{saving ? <Loader2 size={14} className="animate-spin"/> : saved ? <><Check size={14}/> Saved</> : "Save settings"}</button></div>
      </form>
    </div>
  )
}
