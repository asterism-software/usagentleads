"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Code2,
  CreditCard,
  Globe,
  UserRound,
} from "lucide-react"
import { LogoIcon } from "@/components/ui/Logo"
import { formatAgentCount } from "@/lib/utils/states"
import type { DashboardUser } from "@/components/dashboard/DashboardContext"

interface DashboardSidebarProps {
  user: DashboardUser
  totalCount: number
  collapsed?: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
}

const AUTOMATION_LINKS = [
  { href: "/dashboard/api-keys", label: "API Keys", icon: Code2 },
  { href: "/dashboard/api-docs", label: "API Docs", icon: BookOpen },
]

const ACCOUNT_LINKS = [
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
  { href: "/dashboard/support", label: "Support", icon: CircleHelp },
]

export function DashboardSidebar({
  user,
  totalCount,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeState = pathname === "/dashboard" ? searchParams.get("state") || "" : ""
  const initials = user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase() || "U"

  const navClass = (active: boolean) =>
    `flex w-full items-center rounded-lg transition-colors ${
      collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
    } ${active ? "bg-accent-light text-accent" : "text-tertiary hover:bg-subtle hover:text-ink"}`

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-border bg-white">
      <div className={`flex h-[65px] shrink-0 items-center border-b border-border ${collapsed ? "justify-center px-2" : "justify-between px-5"}`}>
        <Link href="/dashboard" onClick={onNavigate} className="flex min-w-0 items-center gap-2" aria-label="USAgentLeads dashboard">
          <LogoIcon className="h-6 w-6 shrink-0 text-accent" />
          {!collapsed && (
            <span className="truncate text-[19px] font-semibold tracking-tight">
              <span className="text-ink">USAgent</span><span className="text-accent">Leads</span>
            </span>
          )}
        </Link>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-tertiary transition-colors hover:bg-subtle hover:text-ink"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>
        )}
      </div>

      <nav className={`${collapsed ? "px-2" : "px-3"} min-h-0 flex-1 overflow-y-auto py-4`} aria-label="Dashboard navigation">
        {!collapsed && <p className="label-eyebrow mb-2 px-3">Data</p>}
        <Link href="/dashboard?state=all" onClick={onNavigate} title={collapsed ? "Agent Database" : undefined} className={navClass(pathname === "/dashboard" && (!activeState || activeState === "all"))}>
          <Globe size={17} className="shrink-0" />
          {!collapsed && (
            <><span className="font-medium">Agent Database</span><span className="ml-auto font-mono text-[13px] text-tertiary">{totalCount ? formatAgentCount(totalCount) : "1M+"}</span></>
          )}
        </Link>

        <div className="my-4 border-t border-border" />
        {!collapsed && <p className="label-eyebrow mb-2 px-3">Automation</p>}
        <div className="space-y-1">
          {AUTOMATION_LINKS.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} onClick={onNavigate} title={collapsed ? item.label : undefined} className={navClass(pathname === item.href)}>
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="text-[14px] font-medium">{item.label}</span>}
              </Link>
            )
          })}
        </div>

      </nav>

      <div className="shrink-0 border-t border-border">
        <div className={`${collapsed ? "px-2" : "px-3"} pt-4`}>
          {!collapsed && <p className="label-eyebrow mb-2 px-3">Account</p>}
          <div className="space-y-1">
            {ACCOUNT_LINKS.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} onClick={onNavigate} title={collapsed ? item.label : undefined} className={navClass(pathname === item.href)}>
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="text-[14px] font-medium">{item.label}</span>}
                </Link>
              )
            })}
          </div>
        </div>

        <div className={`${collapsed ? "px-2" : "px-3"} py-3`}>
          <Link
            href="/dashboard/profile"
            onClick={onNavigate}
            title={collapsed ? user.email : undefined}
            className={`flex items-center rounded-xl border border-border bg-white p-2.5 transition-colors hover:border-accent/30 hover:bg-accent-light/40 ${collapsed ? "justify-center" : "gap-3"}`}
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-white">{initials}</span>
            )}
            {!collapsed && (
              <span className="min-w-0"><span className="block truncate text-[14px] font-semibold text-ink">{user.name || user.email.split("@")[0]}</span><span className="block truncate text-[12px] text-muted">{user.email}</span></span>
            )}
          </Link>
        </div>
      </div>
    </div>
  )
}
