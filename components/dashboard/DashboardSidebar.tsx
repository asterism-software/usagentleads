"use client"

import Link from "next/link"
import { US_STATES, formatAgentCount } from "@/lib/utils/states"
import { LogoIcon } from "@/components/ui/Logo"
import {
  Globe,
  LogOut,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Check,
  Key,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

interface Subscription {
  billing_provider: string
  status: string
  plan: string
  current_period_start: string | null
  current_period_end: string | null
  trial_ends_at: string | null
  cancel_at_period_end: boolean
  cancelled_at: string | null
  created_at: string | null
}

interface DashboardSidebarProps {
  activeState?: string
  onStateSelect: (stateCode: string) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function DashboardSidebar({
  activeState,
  onStateSelect,
  collapsed = false,
  onToggleCollapse,
}: DashboardSidebarProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [sub, setSub] = useState<Subscription | null>(null)
  const [userEmail, setUserEmail] = useState("")
  const [userName, setUserName] = useState("")
  const [cancelling, setCancelling] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [cancelledConfirm, setCancelledConfirm] = useState(false)
  const [showResumeConfirm, setShowResumeConfirm] = useState(false)
  const [showBilling, setShowBilling] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const isLegacyBilling = sub?.billing_provider !== "stripe"

  useEffect(() => {
    // On a fresh post-checkout load the subscription_created webhook may still
    // be in flight, so retry a few times until the plan card has data to show.
    const justSubscribed =
      new URLSearchParams(window.location.search).get("welcome") === "1"
    let attempts = 0
    const loadSub = () => {
      fetch("/api/subscription")
        .then((r) => r.json())
        .then((d) => {
          if (d.subscription) {
            setSub(d.subscription)
          } else if (justSubscribed && attempts < 8) {
            attempts += 1
            setTimeout(loadSub, 2000)
          }
        })
        .catch(() => {})
    }
    loadSub()

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email || "")
        setUserName(data.user.user_metadata?.full_name || "")
      }
    })

    supabase
      .schema("usagentleads")
      .from("state_count")
      .select("count")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTotalCount(data.reduce((sum: number, row: { count: number }) => sum + row.count, 0))
        }
      })
  }, [supabase.auth, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const res = await fetch("/api/subscription", { method: "DELETE" })
      if (res.ok) {
        setSub((prev) => (prev ? { ...prev, cancel_at_period_end: true } : prev))
        setCancelledConfirm(true)
      }
    } catch {
      // ignore
    } finally {
      setCancelling(false)
    }
  }

  const dismissCancelModal = () => {
    setShowConfirm(false)
    setCancelledConfirm(false)
  }

  const handleResume = async () => {
    setCancelling(true)
    try {
      const res = await fetch("/api/subscription", { method: "PATCH" })
      if (res.ok) {
        // Determine correct status based on trial
        const resumedStatus = sub?.trial_ends_at && new Date(sub.trial_ends_at) > new Date()
          ? "on_trial"
          : "active"
        setSub((prev) => (prev ? { ...prev, status: resumedStatus, cancel_at_period_end: false, cancelled_at: null } : prev))
        setShowResumeConfirm(true)
      }
    } catch {
      // ignore
    } finally {
      setCancelling(false)
    }
  }

  const statusLabel = isLegacyBilling
    ? "Migration needed"
    : sub?.cancel_at_period_end
    ? "Cancels Soon"
    : sub?.status === "on_trial"
      ? "Trial"
      : sub?.status === "active"
        ? "Active"
        : sub?.status || "—"

  const statusColor = isLegacyBilling
    ? "warning"
    : sub?.cancel_at_period_end
    ? "warning"
    : sub?.status === "on_trial"
      ? "accent"
      : "success"

  const fmtDate = (d: string | null | undefined, withYear = true) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          ...(withYear ? { year: "numeric" } : {}),
        })
      : null

  const periodEnd = fmtDate(sub?.current_period_end)
  const trialEnd = fmtDate(sub?.trial_ends_at, false)

  const initials =
    userName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || "U"

  return (
    <div className="flex h-full flex-col bg-white border-r border-border relative">
      {/* Header */}
      <div
        className={`flex items-center border-b border-border ${
          collapsed ? "justify-center px-2 py-4" : "justify-between px-5 py-4"
        }`}
      >
        <Link
          href="/"
          className={`flex items-center gap-2 text-[19px] font-semibold tracking-tight ${collapsed ? "hidden" : "flex"}`}
        >
          <LogoIcon className="h-6 w-6 text-accent" />
          <span>
            <span className="text-ink">USAgent</span>
            <span className="text-accent">Leads</span>
          </span>
        </Link>
        {collapsed && (
          <Link href="/" title="USAgentLeads">
            <LogoIcon className="h-6 w-6 text-accent" />
          </Link>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="flex h-7 w-7 items-center justify-center rounded-md text-tertiary hover:text-ink hover:bg-subtle transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* States */}
      <div className={`${collapsed ? "px-2" : "px-3"} py-3 flex-1 overflow-y-auto`}>
        {!collapsed && <p className="label-eyebrow px-3 mb-2">States</p>}

        <button
          onClick={() => onStateSelect("")}
          title={collapsed ? "All States" : undefined}
          className={`flex w-full items-center ${collapsed ? "justify-center" : "gap-2.5"} px-3 py-2.5 rounded-lg text-[15px] mb-0.5 transition-all duration-150 ${
            !activeState
              ? "bg-accent-light text-accent font-medium border-l-2 border-accent -ml-px pl-[11px]"
              : "text-tertiary hover:text-ink hover:bg-subtle"
          }`}
        >
          <Globe size={16} className="shrink-0" />
          {!collapsed && (
            <>
              All States
              <span className="ml-auto font-mono text-[14px] text-tertiary">{totalCount > 0 ? formatAgentCount(totalCount) : "500K+"}</span>
            </>
          )}
        </button>

        <div className="space-y-0.5 mt-1">
          {US_STATES.map((state) => (
            <button
              key={state.code}
              onClick={() => onStateSelect(state.code)}
              title={collapsed ? state.name : undefined}
              className={`flex w-full items-center ${collapsed ? "justify-center" : "justify-between"} px-3 py-2 rounded-lg text-[15px] transition-all duration-150 ${
                activeState === state.code
                  ? "bg-accent-light text-accent font-medium border-l-2 border-accent -ml-px pl-[11px]"
                  : "text-tertiary hover:text-ink hover:bg-subtle"
              }`}
            >
              {collapsed ? (
                <span className="font-mono text-[13px]">{state.code}</span>
              ) : (
                <>
                  <span>{state.name}</span>
                  <span className="font-mono text-[14px] text-tertiary">{state.code}</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* API Keys Link */}
      <div className={`${collapsed ? "px-2" : "px-3"} pb-1`}>
        <Link
          href="/dashboard/api-keys"
          title={collapsed ? "API Keys" : undefined}
          className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5"} w-full px-3 py-2.5 rounded-lg text-[15px] transition-all duration-150 text-tertiary hover:text-ink hover:bg-subtle`}
        >
          <Key size={16} className="shrink-0" />
          {!collapsed && "API Keys"}
        </Link>
      </div>

      {/* Footer — User & Account */}
      <div className={`${collapsed ? "px-2" : "px-3"} pb-3 mt-auto border-t border-border pt-3`}>
        {/* User trigger */}
        <button
          onClick={() => !collapsed && setShowBilling((v) => !v)}
          title={collapsed ? (userName || userEmail) : undefined}
          className={`flex items-center w-full rounded-lg p-2.5 transition-colors hover:bg-subtle ${collapsed ? "justify-center" : "gap-3"}`}
        >
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-mono font-medium text-white">
            {initials}
            {sub && (
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                  statusColor === "warning"
                    ? "bg-warning"
                    : statusColor === "accent"
                      ? "bg-accent"
                      : "bg-success"
                }`}
              />
            )}
          </span>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[14px] font-medium text-ink truncate leading-tight">
                  {userName || userEmail.split("@")[0]}
                </p>
                <p className="text-[12px] text-muted truncate leading-tight mt-0.5">
                  {userEmail}
                </p>
              </div>
              <ChevronRight
                size={15}
                className={`shrink-0 text-muted transition-transform duration-200 ${showBilling ? "rotate-90" : ""}`}
              />
            </>
          )}
        </button>

        {/* Account panel */}
        {showBilling && !collapsed && (
          <div className="mt-2 animate-slide-down">
            {/* Plan card */}
            {sub && (
              <div className="rounded-lg border border-border overflow-hidden mb-2">
                <div className="px-3.5 py-3 bg-subtle/60 flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-ink">
                      {sub.plan === "pro_api" ? "Pro API" : "Pro Monthly"}
                    </p>
                    <p className="text-[13px] text-tertiary mt-0.5 truncate">
                      {isLegacyBilling && periodEnd
                        ? `Access preserved until ${periodEnd}`
                        : sub.status === "on_trial" && trialEnd
                        ? `Trial ends ${trialEnd}`
                        : sub.cancel_at_period_end && periodEnd
                          ? `Access until ${periodEnd}`
                          : periodEnd
                            ? `Renews ${periodEnd}`
                            : null}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                      isLegacyBilling || sub.cancel_at_period_end
                        ? "bg-amber-50 text-amber-600 border border-amber-200"
                        : sub.status === "on_trial"
                          ? "bg-accent-light text-accent border border-accent/20"
                          : "bg-success-bg text-success border border-success/20"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isLegacyBilling || sub.cancel_at_period_end
                          ? "bg-warning"
                          : sub.status === "on_trial"
                            ? "bg-accent"
                            : "bg-success"
                      }`}
                    />
                    {statusLabel}
                  </span>
                </div>

                {/* Billing actions */}
                {isLegacyBilling ? (
                  <div className="px-3.5 py-3 border-t border-border">
                    <p className="mb-2 text-[12px] leading-relaxed text-tertiary">
                      Your existing access is preserved. Contact support to move billing to Stripe.
                    </p>
                    <Link
                      href="/contact?subject=Billing%20migration"
                      className="w-full inline-flex items-center justify-center rounded-lg border border-border text-[13px] font-medium text-tertiary py-2 px-3 hover:border-accent/30 hover:bg-accent-light hover:text-accent transition-all"
                    >
                      Contact support
                    </Link>
                  </div>
                ) : sub.cancel_at_period_end ? (
                  <div className="px-3.5 py-3 border-t border-border">
                    <button
                      onClick={handleResume}
                      disabled={cancelling}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent text-white text-[13px] font-medium py-2 px-3 hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-60"
                    >
                      {cancelling ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Resume subscription"
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="px-3.5 py-3 border-t border-border">
                    <button
                      onClick={() => setShowConfirm(true)}
                      className="w-full inline-flex items-center justify-center rounded-lg border border-border text-[13px] font-medium text-tertiary py-2 px-3 hover:border-danger/30 hover:bg-danger/5 hover:text-danger active:scale-[0.98] transition-all"
                    >
                      Cancel subscription
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2.5 text-[14px] text-tertiary hover:text-danger hover:bg-subtle transition-colors"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        )}

        {/* Collapsed: sign out */}
        {collapsed && (
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="flex items-center justify-center w-full mt-2 rounded-lg p-2.5 text-tertiary hover:text-danger hover:bg-subtle transition-colors"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>

      {/* Cancel subscription modal */}
      {showConfirm && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={dismissCancelModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="pointer-events-auto w-full max-w-sm rounded-xl bg-white border border-border shadow-xl p-6 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {cancelledConfirm ? (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 mb-4">
                    <Check className="h-5 w-5 text-success" />
                  </div>
                  <h3 className="text-[16px] font-semibold text-ink mb-1">
                    Subscription cancelled
                  </h3>
                  <p className="text-[14px] text-body leading-relaxed mb-6">
                    You&apos;ll keep full access until{" "}
                    <span className="font-medium text-ink">
                      {periodEnd || "the end of your billing period"}
                    </span>
                    . You can resume anytime before then.
                  </p>
                  <button
                    onClick={dismissCancelModal}
                    className="w-full inline-flex items-center justify-center rounded-lg bg-accent text-white text-[14px] font-medium py-2.5 px-4 hover:bg-accent/90 active:scale-[0.98] transition-all"
                  >
                    Got it
                  </button>
                </>
              ) : (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 mb-4">
                    <AlertTriangle className="h-5 w-5 text-danger" />
                  </div>
                  <h3 className="text-[16px] font-semibold text-ink mb-1">
                    Cancel subscription?
                  </h3>
                  <p className="text-[14px] text-body leading-relaxed mb-6">
                    You&apos;ll keep access until{" "}
                    <span className="font-medium text-ink">
                      {periodEnd || "the end of your billing period"}
                    </span>
                    , then your account will be downgraded.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={dismissCancelModal}
                      className="flex-1 inline-flex items-center justify-center rounded-lg border border-border bg-white text-[14px] font-medium text-body py-2.5 px-4 hover:bg-subtle active:scale-[0.98] transition-all"
                    >
                      Keep plan
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-danger text-white text-[14px] font-medium py-2.5 px-4 hover:bg-danger/90 active:scale-[0.98] transition-all disabled:opacity-60"
                    >
                      {cancelling ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Yes, cancel"
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Resume confirmation modal */}
      {showResumeConfirm && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowResumeConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="pointer-events-auto w-full max-w-sm rounded-xl bg-white border border-border shadow-xl p-6 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 mb-4">
                <Check className="h-5 w-5 text-success" />
              </div>
              <h3 className="text-[16px] font-semibold text-ink mb-1">
                Subscription resumed
              </h3>
              <p className="text-[14px] text-body leading-relaxed mb-6">
                Your Pro Dashboard subscription is active again.
                {periodEnd && (
                  <> Next renewal on <span className="font-medium text-ink">{periodEnd}</span>.</>
                )}
              </p>
              <button
                onClick={() => setShowResumeConfirm(false)}
                className="w-full inline-flex items-center justify-center rounded-lg bg-accent text-white text-[14px] font-medium py-2.5 px-4 hover:bg-accent/90 active:scale-[0.98] transition-all"
              >
                Got it
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
