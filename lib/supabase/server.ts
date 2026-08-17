import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getStateByCode } from "@/lib/utils/states"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    }
  )
}

/** Fetch total lead count from state_count table. Returns 0 if DB is unavailable. */
export async function getTotalCount(): Promise<number> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .schema("usagentleads")
    .from("state_count")
    .select("count")

  if (!data || data.length === 0) return 0
  return data.reduce((sum: number, row: { count: number }) => sum + row.count, 0)
}

/** Fetch total contacts, emails, and phones across all states. Returns zeros if DB is unavailable. */
export async function getDatabaseTotals(): Promise<{ count: number; emails: number; phones: number }> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .schema("usagentleads")
    .from("state_count")
    .select("count, total_emails, total_phones")

  if (!data || data.length === 0) return { count: 0, emails: 0, phones: 0 }
  return data.reduce(
    (acc, row: { count: number; total_emails: number; total_phones: number }) => ({
      count: acc.count + row.count,
      emails: acc.emails + row.total_emails,
      phones: acc.phones + row.total_phones,
    }),
    { count: 0, emails: 0, phones: 0 }
  )
}

/** Fetch per-state agent counts keyed by state name. Returns empty object if DB is unavailable. */
export async function getStateCountMap(): Promise<Record<string, number>> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .schema("usagentleads")
    .from("state_count")
    .select("state, count")

  const map: Record<string, number> = {}
  if (!data) return map
  for (const row of data as { state: string; count: number }[]) {
    map[row.state] = row.count
  }
  return map
}

// =====================
// RECENT PURCHASES (social proof)
// =====================

/** A completed purchase reduced to anonymous product and location context. */
export type RecentOrder = {
  product: string
  location: string | null
}

type PurchaseRow = {
  purchase_type: "state" | "full_database" | "subscription"
  state_code: string | null
}

/** Human label for the product purchased. */
function productLabel(type: PurchaseRow["purchase_type"], stateCode: string | null): string {
  if (type === "full_database") return "Full U.S. Database"
  if (type === "subscription") return "API Subscription"
  const state = stateCode ? getStateByCode(stateCode) : undefined
  return state ? `${state.name} Agent List` : "State Agent List"
}

/**
 * Fetch the most recent completed purchases, mapped to a privacy-safe shape.
 * Used for the landing-page social-proof section. Returns [] if DB is unavailable.
 */
export async function getRecentPurchases(limit = 6): Promise<RecentOrder[]> {
  const supabase = createServiceClient()
  // Do not surface purchases immediately. A delay makes individual transactions
  // harder to correlate with a specific customer or checkout event.
  const eligibleBefore = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .schema("usagentleads")
    .from("purchases")
    .select("purchase_type, state_code")
    .eq("status", "completed")
    .lte("created_at", eligibleBefore)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (!data) return []
  return (data as PurchaseRow[]).map((row) => ({
    product: productLabel(row.purchase_type, row.state_code),
    location: row.purchase_type === "state" && row.state_code
      ? getStateByCode(row.state_code)?.name ?? null
      : null,
  }))
}

/**
 * Aggregate social-proof stats computed from real completed purchases.
 * `contactsDelivered` reframes a small order count into volume: full-database orders
 * count the live total, state orders count that state's agents. Returns zeros if unavailable.
 */
export async function getPurchaseStats(): Promise<{
  orders: number
  statesCovered: number
  contactsDelivered: number
}> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .schema("usagentleads")
    .from("purchases")
    .select("purchase_type, state_code")
    .eq("status", "completed")

  if (!data || data.length === 0) {
    return { orders: 0, statesCovered: 0, contactsDelivered: 0 }
  }

  const totalCount = await getTotalCount()
  const stateMap = await getStateCountMap()

  const rows = data as Pick<PurchaseRow, "purchase_type" | "state_code">[]
  const states = new Set<string>()
  let contactsDelivered = 0

  for (const row of rows) {
    if (row.purchase_type === "full_database") {
      contactsDelivered += totalCount
    } else if (row.purchase_type === "state" && row.state_code) {
      states.add(row.state_code)
      const name = getStateByCode(row.state_code)?.name
      contactsDelivered += name ? stateMap[name] ?? 0 : 0
    }
  }

  return {
    orders: rows.length,
    statesCovered: states.size,
    contactsDelivered,
  }
}
