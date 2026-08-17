import { getRecentPurchases } from "@/lib/supabase/server"
import { RecentOrdersToastClient } from "./RecentOrdersToastClient"

/**
 * Server wrapper: fetches anonymous recent-order context for the client toast.
 * Only product and state cross to the browser — never customer, price, or timing data.
 */
export async function RecentOrdersToast() {
  const orders = await getRecentPurchases(8)
  if (orders.length === 0) return null
  return <RecentOrdersToastClient orders={orders} />
}
