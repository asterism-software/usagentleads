"use client"

import { createContext, useContext } from "react"
import type { SubscriptionAccess, SubscriptionRecord } from "@/lib/subscriptions"

export interface DashboardUser {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  createdAt: string
  provider: string
  emailVerified: boolean
}

export interface DashboardPreferences {
  defaultState: string | null
  defaultPageSize: 25 | 50 | 100
}

interface DashboardContextValue {
  user: DashboardUser
  subscription: SubscriptionRecord
  access: SubscriptionAccess
  preferences: DashboardPreferences
  totalCount: number
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({
  value,
  children,
}: {
  value: DashboardContextValue
  children: React.ReactNode
}) {
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboard() {
  const value = useContext(DashboardContext)
  if (!value) throw new Error("useDashboard must be used within DashboardProvider")
  return value
}
