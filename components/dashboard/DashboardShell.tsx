"use client"

import { useEffect, useState } from "react"
import { Menu } from "lucide-react"
import { DashboardProvider, type DashboardPreferences, type DashboardUser } from "@/components/dashboard/DashboardContext"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import type { SubscriptionAccess, SubscriptionRecord } from "@/lib/subscriptions"

const COLLAPSED_KEY = "dashboard-sidebar-collapsed"

interface DashboardShellProps {
  user: DashboardUser
  subscription: SubscriptionRecord
  access: SubscriptionAccess
  preferences: DashboardPreferences
  totalCount: number
  children: React.ReactNode
}

export function DashboardShell(props: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "true"), [])

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current
      localStorage.setItem(COLLAPSED_KEY, String(next))
      return next
    })
  }

  return (
    <DashboardProvider value={{ user: props.user, subscription: props.subscription, access: props.access, preferences: props.preferences, totalCount: props.totalCount }}>
      <div className="flex h-dvh overflow-hidden bg-page">
        <aside className={`hidden shrink-0 transition-[width] duration-200 lg:block ${collapsed ? "w-[68px]" : "w-64"}`}>
          <DashboardSidebar user={props.user} totalCount={props.totalCount} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex h-[57px] shrink-0 items-center border-b border-border bg-white px-4 lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger render={<button type="button" className="btn-ghost p-2" aria-label="Open dashboard navigation" />}>
                <Menu size={20} />
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <DashboardSidebar user={props.user} totalCount={props.totalCount} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="ml-2 text-[16px] font-semibold text-ink">USAgent<span className="text-accent">Leads</span></span>
          </div>
          <main className="min-h-0 flex-1 overflow-y-auto">{props.children}</main>
        </div>
      </div>
    </DashboardProvider>
  )
}
